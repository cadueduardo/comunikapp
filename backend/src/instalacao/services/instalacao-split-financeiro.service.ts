import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatusFinanceiroOcorrencia,
  TipoOcorrencia,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CobrancaLogAcao,
  CobrancaStatus,
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { CondicaoPagamentoTipo } from '../../financeiro/enums/condicao-pagamento-tipo.enum';
import { StatusOS } from '../../os/interfaces/os.interfaces';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ORIGEM_OS_ADITIVA_INSTALACAO,
  TIPO_VINCULO_OS_ADITIVA,
} from '../constants/status-financeiro-ocorrencia.enum';
import { FilaPrecificacaoQueryDto } from '../dto/fila-precificacao-query.dto';
import { tipoFaturamentoOcorrencia } from '../utils/split-fiscal.util';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';
import { INSTALACAO_OS_ADITIVA } from '../constants/instalacao-feature-flags.constants';

export interface GerarOsAditivaResultado {
  os_aditiva_id: string;
  os_aditiva_numero: string;
  os_pai_id: string;
  orcamento_id: string;
  cobranca_id: string;
  valor_total: number;
  ocorrencias_faturadas: number;
}

const ROTULO_TIPO_OCORRENCIA: Record<TipoOcorrencia, string> = {
  VISITA_IMPRODUTIVA: 'Visita improdutiva',
  MATERIAL_EXTRA: 'Material extra',
  SERVICO_ADICIONAL: 'Serviço adicional',
  RETRABALHO: 'Retrabalho',
};

@Injectable()
export class InstalacaoSplitFinanceiroService {
  private readonly logger = new Logger(InstalacaoSplitFinanceiroService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracaoInstalacaoService: ConfiguracaoInstalacaoService,
  ) {}

  private async assertOsAditivaHabilitada(lojaId: string): Promise<void> {
    const habilitada =
      await this.configuracaoInstalacaoService.osAditivaHabilitada(lojaId);
    if (!habilitada) {
      throw new BadRequestException(
        `Recurso indisponível: habilite ${INSTALACAO_OS_ADITIVA} na configuração de instalação da loja.`,
      );
    }
  }

  async precificarOcorrencia(
    ocorrenciaId: string,
    lojaId: string,
    usuarioId: string | null,
    input: {
      custo_interno: number;
      preco_cliente: number;
      versao: number;
      observacao_gestor?: string;
    },
  ) {
    await this.assertOsAditivaHabilitada(lojaId);

    if (input.preco_cliente < input.custo_interno) {
      throw new BadRequestException(
        'O valor de repasse ao cliente não pode ser inferior ao custo interno.',
      );
    }

    const atualizada = await this.prisma.ocorrenciaInstalacao.updateMany({
      where: {
        id: ocorrenciaId,
        loja_id: lojaId,
        versao: input.versao,
        status_financeiro: StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO,
      },
      data: {
        status_financeiro: StatusFinanceiroOcorrencia.PRECIFICADO,
        custo_interno: new Prisma.Decimal(input.custo_interno),
        preco_cliente: new Prisma.Decimal(input.preco_cliente),
        precificado_por: usuarioId,
        precificado_em: new Date(),
        observacao_gestor: input.observacao_gestor ?? null,
        versao: { increment: 1 },
      },
    });

    if (atualizada.count === 0) {
      await this.assertOcorrenciaPrecificavel(ocorrenciaId, lojaId, input.versao);
    }

    return this.obterOcorrenciaGestao(ocorrenciaId, lojaId);
  }

  async abonarOcorrencia(
    ocorrenciaId: string,
    lojaId: string,
    usuarioId: string | null,
    input: { versao: number; observacao_gestor: string },
  ) {
    await this.assertOsAditivaHabilitada(lojaId);

    const atualizada = await this.prisma.ocorrenciaInstalacao.updateMany({
      where: {
        id: ocorrenciaId,
        loja_id: lojaId,
        versao: input.versao,
        status_financeiro: {
          in: [
            StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO,
            StatusFinanceiroOcorrencia.PRECIFICADO,
          ],
        },
      },
      data: {
        status_financeiro: StatusFinanceiroOcorrencia.ABONADO,
        custo_interno: null,
        preco_cliente: null,
        precificado_por: usuarioId,
        precificado_em: new Date(),
        observacao_gestor: input.observacao_gestor,
        versao: { increment: 1 },
      },
    });

    if (atualizada.count === 0) {
      await this.assertOcorrenciaPrecificavel(ocorrenciaId, lojaId, input.versao);
    }

    return this.obterOcorrenciaGestao(ocorrenciaId, lojaId);
  }

  async gerarOsAditiva(
    osPaiId: string,
    lojaId: string,
    usuarioId: string | null,
    ocorrenciaIds?: string[],
  ): Promise<GerarOsAditivaResultado> {
    await this.assertOsAditivaHabilitada(lojaId);

    const osPai = await this.prisma.ordemServico.findFirst({
      where: {
        id: osPaiId,
        loja_id: lojaId,
        ativo: true,
        tipo_vinculo_os: { not: TIPO_VINCULO_OS_ADITIVA },
      },
      select: {
        id: true,
        numero: true,
        cliente_id: true,
        nome_servico: true,
      },
    });

    if (!osPai) {
      throw new NotFoundException(
        'Ordem de serviço principal não encontrada para esta loja.',
      );
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      const ocorrencias = await tx.ocorrenciaInstalacao.findMany({
        where: {
          loja_id: lojaId,
          os_id: osPaiId,
          status_financeiro: StatusFinanceiroOcorrencia.PRECIFICADO,
          os_aditiva_id: null,
          ...(ocorrenciaIds?.length ? { id: { in: ocorrenciaIds } } : {}),
        },
        orderBy: { criado_em: 'asc' },
      });

      if (!ocorrencias.length) {
        throw new BadRequestException(
          'Não há ocorrências precificadas elegíveis para gerar OS Aditiva.',
        );
      }

      if (ocorrenciaIds?.length && ocorrencias.length !== ocorrenciaIds.length) {
        throw new BadRequestException(
          'Uma ou mais ocorrências não estão precificadas ou já foram faturadas.',
        );
      }

      const valorCusto = ocorrencias.reduce(
        (acc, item) => acc + Number(item.custo_interno ?? 0),
        0,
      );
      const valorTotal = ocorrencias.reduce(
        (acc, item) => acc + Number(item.preco_cliente ?? 0),
        0,
      );

      if (valorTotal <= 0.01) {
        throw new BadRequestException(
          'O valor total da OS Aditiva deve ser maior que zero.',
        );
      }

      const sequenciaAditiva =
        (await tx.ordemServico.count({
          where: {
            loja_id: lojaId,
            os_pai_id: osPaiId,
            tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA,
          },
        })) + 1;

      const numeroAditiva = `${osPai.numero}-A${sequenciaAditiva}`;
      const numeroOrcamento = `ORC-AD-${osPai.numero}-A${sequenciaAditiva}`;
      const agora = new Date();

      const orcamento = await tx.orcamento.create({
        data: {
          id: randomUUID(),
          loja_id: lojaId,
          cliente_id: osPai.cliente_id,
          numero: numeroOrcamento,
          nome_servico: `Aditivo instalação — ${osPai.numero}`,
          descricao: `Cobrança de intercorrências de campo vinculadas à OS ${osPai.numero}.`,
          horas_producao: new Prisma.Decimal(0),
          custo_material: new Prisma.Decimal(valorCusto),
          custo_mao_obra: new Prisma.Decimal(0),
          custo_indireto: new Prisma.Decimal(0),
          custo_total: new Prisma.Decimal(valorCusto),
          margem_lucro: new Prisma.Decimal(
            valorTotal > 0 ? ((valorTotal - valorCusto) / valorTotal) * 100 : 0,
          ),
          impostos: new Prisma.Decimal(0),
          preco_final: new Prisma.Decimal(valorTotal),
          valor_total: new Prisma.Decimal(valorTotal),
          status: 'aprovado',
          status_aprovacao: 'APROVADO',
          data_aprovacao: agora,
          aprovado_por: usuarioId,
          condicao_pagamento_tipo: CondicaoPagamentoTipo.A_VISTA,
          condicao_pagamento_descricao: 'À vista — aditivo de instalação',
          atualizado_em: agora,
        },
      });

      const osAditiva = await tx.ordemServico.create({
        data: {
          numero: numeroAditiva,
          loja_id: lojaId,
          cliente_id: osPai.cliente_id,
          orcamento_id: orcamento.id,
          os_pai_id: osPaiId,
          tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA,
          origem_os: ORIGEM_OS_ADITIVA_INSTALACAO,
          nome_servico: `Aditivo instalação — OS ${osPai.numero}`,
          descricao: `OS Aditiva gerada a partir de ${ocorrencias.length} ocorrência(s) de campo.`,
          quantidade: new Prisma.Decimal(1),
          status: StatusOS.FINALIZADA,
          tipo_os: 'COMERCIAL',
          valor_orcado: new Prisma.Decimal(valorTotal),
          aprovacao_tecnica_status: 'APROVADA',
          aprovacao_tecnica_em: agora,
          aprovacao_tecnica_por: usuarioId,
          pular_pcp: true,
          pular_expedicao: true,
          pular_validacao_estoque: true,
          criado_por: usuarioId,
        },
      });

      for (const ocorrencia of ocorrencias) {
        const rotulo = ROTULO_TIPO_OCORRENCIA[ocorrencia.tipo] ?? ocorrencia.tipo;
        await tx.itemOS.create({
          data: {
            os_id: osAditiva.id,
            produto_servico: `${rotulo} — ${ocorrencia.descricao.slice(0, 200)}`,
            quantidade: ocorrencia.quantidade,
            observacoes: `Ocorrência ${ocorrencia.id} · OS pai ${osPai.numero}`,
            status_liberacao_pcp: 'CONCLUIDO',
          },
        });
      }

      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 15);

      const cobranca = await tx.cobranca.create({
        data: {
          loja_id: lojaId,
          orcamento_id: orcamento.id,
          cliente_id: osPai.cliente_id,
          tipo: CondicaoPagamentoTipo.A_VISTA,
          descricao: `Aditivo instalação OS ${osPai.numero}`,
          status: CobrancaStatus.PREVISTA,
          valor_total: new Prisma.Decimal(valorTotal),
          valor_recebido: new Prisma.Decimal(0),
          valor_saldo: new Prisma.Decimal(valorTotal),
          data_aprovacao: agora,
          criado_por: usuarioId,
          parcelas: {
            create: [
              {
                ordem: 1,
                tipo: ParcelaTipo.PARCELA,
                valor_previsto: new Prisma.Decimal(valorTotal),
                valor_recebido: new Prisma.Decimal(0),
                data_vencimento: vencimento,
                status: ParcelaStatus.A_FATURAR,
              },
            ],
          },
          logs: {
            create: [
              {
                tipo_acao: CobrancaLogAcao.COBRANCA_CRIADA,
                descricao: `Cobrança da OS Aditiva ${numeroAditiva} (intercorrências de instalação).`,
                status_novo: CobrancaStatus.PREVISTA,
                valor_movimentado: new Prisma.Decimal(valorTotal),
                usuario_id: usuarioId,
              },
            ],
          },
        },
      });

      const snapshot = ocorrencias.map((item) => ({
        id: item.id,
        tipo: item.tipo,
        descricao: item.descricao,
        quantidade: Number(item.quantidade),
        custo_interno: Number(item.custo_interno ?? 0),
        preco_cliente: Number(item.preco_cliente ?? 0),
        tipo_faturamento: tipoFaturamentoOcorrencia(item.tipo),
      }));

      await tx.orcamentoAditivoInstalacao.create({
        data: {
          loja_id: lojaId,
          os_pai_id: osPaiId,
          os_aditiva_id: osAditiva.id,
          orcamento_id: orcamento.id,
          ocorrencias_snapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
      });

      const ids = ocorrencias.map((item) => item.id);
      const versoes = ocorrencias.map((item) => item.versao);

      const faturadas = await tx.ocorrenciaInstalacao.updateMany({
        where: {
          id: { in: ids },
          loja_id: lojaId,
          status_financeiro: StatusFinanceiroOcorrencia.PRECIFICADO,
          os_aditiva_id: null,
          versao: { in: versoes },
        },
        data: {
          status_financeiro: StatusFinanceiroOcorrencia.FATURADO,
          os_aditiva_id: osAditiva.id,
          versao: { increment: 1 },
        },
      });

      if (faturadas.count !== ocorrencias.length) {
        throw new ConflictException(
          'Conflito de concorrência ao faturar ocorrências. Atualize a tela e tente novamente.',
        );
      }

      await tx.ordemServicoLog.create({
        data: {
          os_id: osPaiId,
          tipo_acao: 'OS_ADITIVA_GERADA',
          descricao: `OS Aditiva ${numeroAditiva} gerada com ${ocorrencias.length} ocorrência(s).`,
          usuario_id: usuarioId,
          dados_extras: JSON.stringify({
            os_aditiva_id: osAditiva.id,
            cobranca_id: cobranca.id,
            valor_total: valorTotal,
            ocorrencia_ids: ids,
          }),
        },
      });

      return {
        os_aditiva_id: osAditiva.id,
        os_aditiva_numero: numeroAditiva,
        os_pai_id: osPaiId,
        orcamento_id: orcamento.id,
        cobranca_id: cobranca.id,
        valor_total: this.arredondar(valorTotal),
        ocorrencias_faturadas: ocorrencias.length,
      };
    });

    this.logger.log(
      `OS Aditiva ${resultado.os_aditiva_numero} gerada — pai ${osPaiId} — R$ ${resultado.valor_total.toFixed(2)}`,
    );

    return resultado;
  }

  async listarFilaPrecificacao(lojaId: string, query: FilaPrecificacaoQueryDto) {
    const osAditivaHabilitada =
      await this.configuracaoInstalacaoService.osAditivaHabilitada(lojaId);
    const pagina = query.pagina ?? 1;
    const porPagina = query.por_pagina ?? 25;

    if (!osAditivaHabilitada) {
      return {
        total: 0,
        pagina,
        por_pagina: porPagina,
        itens: [],
        os_aditiva_habilitada: false,
      };
    }

    const skip = (pagina - 1) * porPagina;
    const busca = query.busca?.trim();

    const status =
      query.status ??
      StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO;

    const where: Prisma.OcorrenciaInstalacaoWhereInput = {
      loja_id: lojaId,
      status_financeiro: status,
      ...(busca
        ? {
            OR: [
              { descricao: { contains: busca } },
              { ordem_servico: { numero: { contains: busca } } },
              { ordem_servico: { cliente: { nome: { contains: busca } } } },
            ],
          }
        : {}),
    };

    const [total, itens] = await this.prisma.$transaction([
      this.prisma.ocorrenciaInstalacao.count({ where }),
      this.prisma.ocorrenciaInstalacao.findMany({
        where,
        orderBy: { criado_em: 'desc' },
        skip,
        take: porPagina,
        select: {
          id: true,
          tipo: true,
          descricao: true,
          quantidade: true,
          status_financeiro: true,
          custo_sugerido: true,
          preco_sugerido: true,
          custo_interno: true,
          preco_cliente: true,
          versao: true,
          criado_em: true,
          ordem_servico: {
            select: {
              id: true,
              numero: true,
              cliente: { select: { nome: true } },
            },
          },
          item_instalacao: {
            select: {
              id: true,
              logradouro: true,
              numero: true,
              cidade: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      pagina,
      por_pagina: porPagina,
      os_aditiva_habilitada: true,
      itens: itens.map((item) => ({
        ...item,
        quantidade: Number(item.quantidade),
        custo_sugerido: item.custo_sugerido ? Number(item.custo_sugerido) : null,
        preco_sugerido: item.preco_sugerido ? Number(item.preco_sugerido) : null,
        custo_interno: item.custo_interno ? Number(item.custo_interno) : null,
        preco_cliente: item.preco_cliente ? Number(item.preco_cliente) : null,
        os_id: item.ordem_servico.id,
        os_numero: item.ordem_servico.numero,
        cliente_nome: item.ordem_servico.cliente?.nome ?? null,
      })),
    };
  }

  async contadoresPendencias(lojaId: string) {
    const osAditivaHabilitada =
      await this.configuracaoInstalacaoService.osAditivaHabilitada(lojaId);

    if (!osAditivaHabilitada) {
      return {
        pendentes: 0,
        precificados: 0,
        os_aditiva_habilitada: false,
      };
    }

    const grupos = await this.prisma.ocorrenciaInstalacao.groupBy({
      by: ['status_financeiro'],
      where: {
        loja_id: lojaId,
        status_financeiro: {
          in: [
            StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO,
            StatusFinanceiroOcorrencia.PRECIFICADO,
          ],
        },
      },
      _count: { _all: true },
    });

    const mapa = new Map(
      grupos.map((item) => [item.status_financeiro, item._count._all]),
    );

    return {
      pendentes:
        mapa.get(StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO) ?? 0,
      precificados: mapa.get(StatusFinanceiroOcorrencia.PRECIFICADO) ?? 0,
      os_aditiva_habilitada: true,
    };
  }

  async listarOsAditivasPorOsPai(osPaiId: string, lojaId: string) {
    const osAditivaHabilitada =
      await this.configuracaoInstalacaoService.osAditivaHabilitada(lojaId);
    if (!osAditivaHabilitada) {
      return [];
    }

    await this.assertOsPai(lojaId, osPaiId);

    const filhas = await this.prisma.ordemServico.findMany({
      where: {
        loja_id: lojaId,
        os_pai_id: osPaiId,
        tipo_vinculo_os: TIPO_VINCULO_OS_ADITIVA,
      },
      orderBy: { criado_em: 'asc' },
      select: {
        id: true,
        numero: true,
        valor_orcado: true,
        criado_em: true,
        orcamento: {
          select: {
            id: true,
            cobranca: { select: { id: true, status: true } },
          },
        },
        orcamento_aditivo_meta: {
          select: { ocorrencias_snapshot: true },
        },
      },
    });

    return filhas.map((item) => ({
      id: item.id,
      numero: item.numero,
      valor_orcado: Number(item.valor_orcado ?? 0),
      criado_em: item.criado_em.toISOString(),
      cobranca_id: item.orcamento?.cobranca?.id ?? null,
      cobranca_status: item.orcamento?.cobranca?.status ?? null,
      ocorrencias_snapshot: item.orcamento_aditivo_meta?.ocorrencias_snapshot ?? [],
    }));
  }

  private async assertOsPai(lojaId: string, osPaiId: string): Promise<void> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osPaiId, loja_id: lojaId, ativo: true },
      select: { id: true },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }
  }

  private async assertOcorrenciaPrecificavel(
    ocorrenciaId: string,
    lojaId: string,
    versao: number,
  ): Promise<never> {
    const existente = await this.prisma.ocorrenciaInstalacao.findFirst({
      where: { id: ocorrenciaId, loja_id: lojaId },
      select: { id: true, versao: true, status_financeiro: true },
    });

    if (!existente) {
      throw new NotFoundException('Ocorrência não encontrada.');
    }

    if (existente.versao !== versao) {
      throw new ConflictException(
        'A ocorrência foi alterada por outro usuário. Recarregue e tente novamente.',
      );
    }

    throw new BadRequestException(
      `Ocorrência não pode ser alterada no status ${existente.status_financeiro}.`,
    );
  }

  private async obterOcorrenciaGestao(ocorrenciaId: string, lojaId: string) {
    const ocorrencia = await this.prisma.ocorrenciaInstalacao.findFirst({
      where: { id: ocorrenciaId, loja_id: lojaId },
      select: {
        id: true,
        os_id: true,
        tipo: true,
        descricao: true,
        quantidade: true,
        status_financeiro: true,
        custo_sugerido: true,
        preco_sugerido: true,
        custo_interno: true,
        preco_cliente: true,
        versao: true,
        os_aditiva_id: true,
        criado_em: true,
      },
    });

    if (!ocorrencia) {
      throw new NotFoundException('Ocorrência não encontrada.');
    }

    return {
      ...ocorrencia,
      quantidade: Number(ocorrencia.quantidade),
      custo_sugerido: ocorrencia.custo_sugerido
        ? Number(ocorrencia.custo_sugerido)
        : null,
      preco_sugerido: ocorrencia.preco_sugerido
        ? Number(ocorrencia.preco_sugerido)
        : null,
      custo_interno: ocorrencia.custo_interno
        ? Number(ocorrencia.custo_interno)
        : null,
      preco_cliente: ocorrencia.preco_cliente
        ? Number(ocorrencia.preco_cliente)
        : null,
    };
  }

  private arredondar(valor: number): number {
    return Math.round(valor * 100) / 100;
  }
}
