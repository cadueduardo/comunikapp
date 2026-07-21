import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DestinoApropriacaoCompra,
  Prisma,
  StatusAceiteServico,
  StatusContaPagar,
  StatusFechamentoFinanceiroOS,
  StatusPedidoCompra,
  StatusRecebimentoCompra,
  TipoItemCompra,
  loja,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { PosCalculoResponse } from '../interfaces/pos-calculo.interface';
import {
  acumularBucketCategoria,
  calcularIncorridoProporcional,
  calcularPrevistoPorTipoItem,
  criarBucketsCategoria,
  montarLinhasCategorias,
  montarPendenciasPosCalculo,
  montarTotaisPosCalculo,
  roundMoney2,
  type TipoCategoriaPosCalculo,
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

    const { categorias, limitacoesCategorias } = await this.calcularCategorias(
      osId,
      lojaAtual.id,
      os,
    );
    limitacoes.push(...limitacoesCategorias);

    const pendencias = montarPendenciasPosCalculo({
      totais,
      categorias,
      limitacoes,
    });

    const statusFechamento = await this.obterStatusFechamento(osId, lojaAtual.id);

    return {
      os_id: os.id,
      os_numero: os.numero,
      status_fechamento: statusFechamento,
      ...totais,
      meta: {
        moeda: 'BRL',
        visao_margem: 'caixa',
        status_fechamento: statusFechamento,
        custo_previsto_fonte: fonte,
        limitacoes: limitacoes.length > 0 ? limitacoes : undefined,
      },
      categorias,
      trocas_fornecedor: [],
      pendencias,
    };
  }

  private async obterStatusFechamento(
    osId: string,
    lojaId: string,
  ): Promise<StatusFechamentoFinanceiroOS> {
    const fechamento = await this.prisma.fechamentoFinanceiroOS.findUnique({
      where: {
        loja_id_os_id: {
          loja_id: lojaId,
          os_id: osId,
        },
      },
      select: { status: true },
    });

    return (
      fechamento?.status ?? StatusFechamentoFinanceiroOS.PENDENTE
    );
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

  private async calcularCategorias(
    osId: string,
    lojaId: string,
    os: {
      orcamento: {
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
    },
  ): Promise<{
    categorias: ReturnType<typeof montarLinhasCategorias>;
    limitacoesCategorias: string[];
  }> {
    const limitacoesCategorias: string[] = [];
    const previstoPorTipo = os.orcamento
      ? calcularPrevistoPorTipoItem(
          os.orcamento.produtos.map((produto) => ({
            insumos: produto.insumos.map((i) => ({
              preco_total: Number(i.preco_total),
              material_do_cliente: i.material_do_cliente,
            })),
            maquinas: produto.maquinas.map((m) => ({
              custo_total: Number(m.custo_total),
            })),
            funcoes: produto.funcoes.map((f) => ({
              custo_total: Number(f.custo_total),
            })),
            servicos_manuais: produto.servicos_manuais.map((s) => ({
              custo_total: Number(s.custo_total),
            })),
            custos_indiretos: produto.custos_indiretos.map((c) => ({
              custo_total: Number(c.custo_total),
            })),
            terceirizacao_custo_total: produto.terceirizacao_custo_total
              ? Number(produto.terceirizacao_custo_total)
              : null,
          })),
        )
      : { MATERIAL: 0, SERVICO: 0, DESPESA: 0 };

    const previstoTotalPorTipo =
      previstoPorTipo.MATERIAL +
      previstoPorTipo.SERVICO +
      previstoPorTipo.DESPESA;

    if (!os.orcamento) {
      limitacoesCategorias.push(
        'Previsto por categoria indisponível (OS sem orçamento); categorias preenchidas apenas com fatos de compra.',
      );
    } else if (previstoTotalPorTipo <= 0) {
      limitacoesCategorias.push(
        'Previsto por categoria = 0: orçamento sem linhas de custo mapeáveis; categorias preenchidas a partir de comprometido/incorrido/pago.',
      );
    } else {
      limitacoesCategorias.push(
        'Previsto por categoria: estimativa do orçamento (MO/máquina/indiretos agrupados em DESPESA; pode divergir do tipo do pedido de compra).',
      );
    }

    const buckets = criarBucketsCategoria(previstoPorTipo);

    const itens = await this.prisma.pedidoCompraItem.findMany({
      where: {
        loja_id: lojaId,
        apropriacoes: { some: FILTRO_APROPRIACAO_OS(osId) },
      },
      select: {
        tipo: true,
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
        pedido: {
          select: {
            status: true,
            contas_pagar: { select: { status: true } },
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

    for (const item of itens) {
      const categoria = this.normalizarTipoCategoria(item.tipo);
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

      if (STATUS_PEDIDO_COMPROMETIDO.includes(item.pedido.status)) {
        acumularBucketCategoria(
          buckets,
          categoria,
          'comprometido',
          valorOsApropriado,
        );
      }

      const temContaAtiva = item.pedido.contas_pagar.some(
        (conta) => conta.status !== StatusContaPagar.CANCELADA,
      );
      if (temContaAtiva) {
        acumularBucketCategoria(
          buckets,
          categoria,
          'faturado',
          valorOsApropriado,
        );
      }

      for (const ri of item.recebimento_itens) {
        acumularBucketCategoria(
          buckets,
          categoria,
          'incorrido',
          calcularIncorridoProporcional({
            quantidadePedido: Number(item.quantidade),
            quantidadeAceita: Number(ri.quantidade_aceita),
            valorItem: Number(item.total),
            valorOsApropriado,
            valorTotalApropriado,
          }),
        );
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
        acumularBucketCategoria(
          buckets,
          categoria,
          'incorrido',
          roundMoney2(valorAceiteItem * proporcao),
        );
      }
    }

    const pagamentos = await this.prisma.pagamentoFornecedorApropriacao.findMany(
      {
        where: {
          loja_id: lojaId,
          ...FILTRO_PAGAMENTO_APROPRIACAO_OS(osId),
          pagamento: { estornado: false },
        },
        select: {
          valor: true,
          pedido_item_apropriacao: {
            select: {
              pedido_item: { select: { tipo: true } },
            },
          },
        },
      },
    );

    let pagamentosSemTipo = 0;
    for (const pagamento of pagamentos) {
      const valor = Number(pagamento.valor);
      const tipoItem = pagamento.pedido_item_apropriacao?.pedido_item?.tipo;
      if (!tipoItem) {
        pagamentosSemTipo += valor;
        continue;
      }
      acumularBucketCategoria(
        buckets,
        this.normalizarTipoCategoria(tipoItem),
        'pago',
        valor,
      );
    }

    if (pagamentosSemTipo > 0) {
      limitacoesCategorias.push(
        `Pagamentos sem tipo de item rastreável (R$ ${roundMoney2(pagamentosSemTipo).toFixed(2)}) não entram no breakdown por categoria.`,
      );
    }

    return {
      categorias: montarLinhasCategorias(buckets),
      limitacoesCategorias,
    };
  }

  private normalizarTipoCategoria(
    tipo: TipoItemCompra,
  ): TipoCategoriaPosCalculo {
    if (tipo === TipoItemCompra.MATERIAL) {
      return 'MATERIAL';
    }
    if (tipo === TipoItemCompra.SERVICO) {
      return 'SERVICO';
    }
    return 'DESPESA';
  }
}
