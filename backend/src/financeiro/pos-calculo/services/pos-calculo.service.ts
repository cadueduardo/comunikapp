import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DestinoApropriacaoCompra,
  Prisma,
  StatusAceiteServico,
  StatusContaPagar,
  StatusPedidoCompra,
  StatusRecebimentoCompra,
  loja,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  PosCalculoPendencia,
  PosCalculoResponse,
} from '../interfaces/pos-calculo.interface';
import {
  calcularIncorridoProporcional,
  montarTotaisPosCalculo,
  roundMoney2,
} from '../utils/pos-calculo-aggregation.util';
import { PosCalculoPermissionsService } from './pos-calculo-permissions.service';

const STATUS_PEDIDO_COMPROMETIDO: StatusPedidoCompra[] = [
  StatusPedidoCompra.APROVADO,
  StatusPedidoCompra.ENVIADO,
  StatusPedidoCompra.PARCIAL,
  StatusPedidoCompra.ATENDIDO,
  StatusPedidoCompra.CONCLUIDO,
];

const FILTRO_APROPRIACAO_OS = (
  osId: string,
): Prisma.PedidoCompraItemApropriacaoWhereInput => ({
  OR: [{ os_id: osId }, { item_os: { os_id: osId } }],
});

const FILTRO_PAGAMENTO_APROPRIACAO_OS = (
  osId: string,
): Prisma.PagamentoFornecedorApropriacaoWhereInput => ({
  OR: [
    { os_id: osId, destino_tipo: DestinoApropriacaoCompra.OS },
    {
      destino_tipo: DestinoApropriacaoCompra.ITEM_OS,
      item_os: { os_id: osId },
    },
  ],
});

@Injectable()
export class PosCalculoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PosCalculoPermissionsService,
  ) {}

  async obterPorOs(
    osId: string,
    lojaAtual: loja,
    usuarioId: string,
  ): Promise<PosCalculoResponse> {
    await this.permissions.assertPodeVisualizar(usuarioId, lojaAtual.id);

    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaAtual.id },
      select: {
        id: true,
        numero: true,
        valor_orcado: true,
        orcamento: {
          select: {
            preco_final: true,
            custo_total: true,
            cobranca: {
              select: {
                valor_total: true,
                valor_recebido: true,
                status: true,
              },
            },
            produtos: {
              select: {
                insumos: {
                  select: {
                    preco_total: true,
                    material_do_cliente: true,
                  },
                },
                maquinas: { select: { custo_total: true } },
                funcoes: { select: { custo_total: true } },
                servicos_manuais: { select: { custo_total: true } },
                custos_indiretos: { select: { custo_total: true } },
                terceirizacao_custo_total: true,
              },
            },
          },
        },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    const limitacoes: string[] = [];
    const receita = this.calcularReceita(os);
    const { previsto, fonte } = this.calcularCustoPrevisto(os);
    if (fonte) {
      limitacoes.push(fonte);
    }

    const [comprometido, incorrido, faturado, pago] = await Promise.all([
      this.calcularComprometido(osId, lojaAtual.id),
      this.calcularIncorrido(osId, lojaAtual.id),
      this.calcularFaturado(osId, lojaAtual.id),
      this.calcularPago(osId, lojaAtual.id),
    ]);

    if (comprometido === 0) {
      limitacoes.push(
        'Comprometido = 0: nenhum pedido aprovado/enviado com apropriação rastreável à OS.',
      );
    }
    if (incorrido === 0) {
      limitacoes.push(
        'Incorrido = 0: sem recebimentos/aceites confirmados proporcionais à OS nesta fatia.',
      );
    }

    const totais = montarTotaisPosCalculo({
      receitaPrevista: receita.prevista,
      receitaFaturada: receita.faturada,
      receitaRecebida: receita.recebida,
      custoPrevisto: previsto,
      custoComprometido: comprometido,
      custoIncorrido: incorrido,
      custoFaturado: faturado,
      custoPago: pago,
    });

    const pendencias = this.montarPendencias(totais, limitacoes);

    return {
      os_id: os.id,
      os_numero: os.numero,
      status_fechamento: 'PENDENTE',
      ...totais,
      meta: {
        moeda: 'BRL',
        visao_margem: 'caixa',
        status_fechamento: 'PENDENTE',
        custo_previsto_fonte: fonte,
        limitacoes: limitacoes.length > 0 ? limitacoes : undefined,
      },
      categorias: [],
      trocas_fornecedor: [],
      pendencias,
    };
  }

  private calcularReceita(os: {
    valor_orcado: Prisma.Decimal | null;
    orcamento: {
      preco_final: Prisma.Decimal;
      cobranca: {
        valor_total: Prisma.Decimal;
        valor_recebido: Prisma.Decimal;
      } | null;
    } | null;
  }) {
    const prevista = Number(
      os.valor_orcado ?? os.orcamento?.preco_final ?? 0,
    );
    const cobranca = os.orcamento?.cobranca;
    const faturada = cobranca ? Number(cobranca.valor_total) : prevista;
    const recebida = cobranca ? Number(cobranca.valor_recebido) : 0;

    return {
      prevista: roundMoney2(prevista),
      faturada: roundMoney2(faturada),
      recebida: roundMoney2(recebida),
    };
  }

  private calcularCustoPrevisto(os: {
    orcamento: {
      custo_total: Prisma.Decimal;
      produtos: Array<{
        insumos: Array<{
          preco_total: Prisma.Decimal;
          material_do_cliente: boolean;
        }>;
        maquinas: Array<{ custo_total: Prisma.Decimal }>;
        funcoes: Array<{ custo_total: Prisma.Decimal }>;
        servicos_manuais: Array<{ custo_total: Prisma.Decimal }>;
        custos_indiretos: Array<{ custo_total: Prisma.Decimal }>;
        terceirizacao_custo_total: Prisma.Decimal | null;
      }>;
    } | null;
  }): { previsto: number; fonte?: string } {
    const orcamento = os.orcamento;
    if (!orcamento) {
      return {
        previsto: 0,
        fonte:
          'Custo previsto = 0: OS sem orçamento vinculado (baseline indisponível).',
      };
    }

    const custoOrcamento = Number(orcamento.custo_total);
    if (custoOrcamento > 0) {
      return {
        previsto: roundMoney2(custoOrcamento),
        fonte: 'Custo previsto: snapshot orcamento.custo_total.',
      };
    }

    let soma = 0;
    for (const produto of orcamento.produtos) {
      for (const insumo of produto.insumos) {
        if (!insumo.material_do_cliente) {
          soma += Number(insumo.preco_total);
        }
      }
      for (const maquina of produto.maquinas) {
        soma += Number(maquina.custo_total);
      }
      for (const funcao of produto.funcoes) {
        soma += Number(funcao.custo_total);
      }
      for (const servico of produto.servicos_manuais) {
        soma += Number(servico.custo_total);
      }
      for (const indireto of produto.custos_indiretos) {
        soma += Number(indireto.custo_total);
      }
      if (produto.terceirizacao_custo_total) {
        soma += Number(produto.terceirizacao_custo_total);
      }
    }

    if (soma > 0) {
      return {
        previsto: roundMoney2(soma),
        fonte:
          'Custo previsto: soma de itens congelados do orçamento (insumos, MO, máquinas, terceirização).',
      };
    }

    return {
      previsto: 0,
      fonte:
        'Custo previsto = 0: orçamento sem custo_total nem linhas de custo utilizáveis.',
    };
  }

  private async calcularComprometido(
    osId: string,
    lojaId: string,
  ): Promise<number> {
    const resultado = await this.prisma.pedidoCompraItemApropriacao.aggregate({
      where: {
        loja_id: lojaId,
        ...FILTRO_APROPRIACAO_OS(osId),
        pedido_item: {
          pedido: {
            status: { in: STATUS_PEDIDO_COMPROMETIDO },
          },
        },
      },
      _sum: { valor_previsto: true },
    });

    return roundMoney2(Number(resultado._sum.valor_previsto ?? 0));
  }

  private async calcularIncorrido(
    osId: string,
    lojaId: string,
  ): Promise<number> {
    const itens = await this.prisma.pedidoCompraItem.findMany({
      where: {
        loja_id: lojaId,
        apropriacoes: { some: FILTRO_APROPRIACAO_OS(osId) },
      },
      select: {
        quantidade: true,
        total: true,
        apropriacoes: {
          select: {
            os_id: true,
            item_os_id: true,
            valor_previsto: true,
            item_os: { select: { os_id: true } },
          },
        },
        recebimento_itens: {
          where: {
            recebimento: { status: StatusRecebimentoCompra.CONFIRMADO },
          },
          select: {
            quantidade_aceita: true,
          },
        },
        aceite_itens: {
          where: {
            aceite: { status: StatusAceiteServico.CONFIRMADO },
          },
          select: {
            valor_aceito: true,
            quantidade_aceita: true,
          },
        },
      },
    });

    let total = 0;

    for (const item of itens) {
      const valorTotalApropriado = item.apropriacoes.reduce(
        (acc, a) => acc + Number(a.valor_previsto),
        0,
      );
      const valorOsApropriado = item.apropriacoes
        .filter((a) => a.os_id === osId || a.item_os?.os_id === osId)
        .reduce((acc, a) => acc + Number(a.valor_previsto), 0);

      if (valorOsApropriado <= 0) {
        continue;
      }

      for (const ri of item.recebimento_itens) {
        total += calcularIncorridoProporcional({
          quantidadePedido: Number(item.quantidade),
          quantidadeAceita: Number(ri.quantidade_aceita),
          valorItem: Number(item.total),
          valorOsApropriado,
          valorTotalApropriado,
        });
      }

      for (const ai of item.aceite_itens) {
        const valorAceiteItem =
          ai.valor_aceito != null
            ? Number(ai.valor_aceito)
            : calcularIncorridoProporcional({
                quantidadePedido: Number(item.quantidade),
                quantidadeAceita: Number(ai.quantidade_aceita ?? 0),
                valorItem: Number(item.total),
                valorOsApropriado: valorTotalApropriado,
                valorTotalApropriado,
              });

        const proporcao =
          valorTotalApropriado > 0
            ? valorOsApropriado / valorTotalApropriado
            : 1;
        total += roundMoney2(valorAceiteItem * proporcao);
      }
    }

    return roundMoney2(total);
  }

  private async calcularFaturado(
    osId: string,
    lojaId: string,
  ): Promise<number> {
    const resultado = await this.prisma.pedidoCompraItemApropriacao.aggregate({
      where: {
        loja_id: lojaId,
        ...FILTRO_APROPRIACAO_OS(osId),
        pedido_item: {
          pedido: {
            contas_pagar: {
              some: {
                status: { not: StatusContaPagar.CANCELADA },
              },
            },
          },
        },
      },
      _sum: { valor_previsto: true },
    });

    return roundMoney2(Number(resultado._sum.valor_previsto ?? 0));
  }

  private async calcularPago(osId: string, lojaId: string): Promise<number> {
    const resultado =
      await this.prisma.pagamentoFornecedorApropriacao.aggregate({
        where: {
          loja_id: lojaId,
          ...FILTRO_PAGAMENTO_APROPRIACAO_OS(osId),
          pagamento: { estornado: false },
        },
        _sum: { valor: true },
      });

    return roundMoney2(Number(resultado._sum.valor ?? 0));
  }

  private montarPendencias(
    totais: ReturnType<typeof montarTotaisPosCalculo>,
    limitacoes: string[],
  ): PosCalculoPendencia[] {
    const pendencias: PosCalculoPendencia[] = [];

    if (totais.custos.a_pagar > 0) {
      pendencias.push({
        tipo: 'CONTA_A_PAGAR',
        descricao: `Saldo a pagar apropriado à OS: R$ ${totais.custos.a_pagar.toFixed(2)}.`,
        severidade: 'alerta',
      });
    }

    if (totais.desvio_pago > 0) {
      pendencias.push({
        tipo: 'DESVIO_CUSTO',
        descricao: `Custo pago acima do previsto em R$ ${totais.desvio_pago.toFixed(2)}.`,
        severidade: 'alerta',
      });
    }

    if (limitacoes.some((l) => l.includes('baseline indisponível'))) {
      pendencias.push({
        tipo: 'BASELINE_AUSENTE',
        descricao: 'OS sem baseline de custo previsto confiável.',
        severidade: 'info',
      });
    }

    return pendencias;
  }
}
