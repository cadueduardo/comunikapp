import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoriaOcorrencia,
  MotivoSemAssinaturaLote,
  OrigemConclusaoLote,
  Prisma,
  StatusFinanceiroOcorrencia,
  StatusInstalacao,
  StatusInstalacaoOs,
  TipoOcorrencia,
  TurnoPrevisaoInstalacao,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { StatusRollupService } from '../../financeiro/services/status-rollup.service';
import { InstalacaoFechamentoService } from './instalacao-fechamento.service';
import { InstalacaoAgendaSyncService } from './instalacao-agenda-sync.service';
import { InstalacaoExecucaoSyncService } from './instalacao-execucao-sync.service';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';
import { ConsultarAgendaQueryDto } from '../dto/consultar-agenda-query.dto';
import { ListarOsInstalacaoQueryDto } from '../dto/listar-os-instalacao-query.dto';
import { sanitizarTextoCampo } from '../utils/sanitizar-texto.util';
import { parseDataPrevisaoCampo, chaveDiaPrevisaoAgenda } from '../utils/data-previsao.util';
import {
  calcularAtencaoInstalacaoOs,
  compararPrioridadeAtencaoInstalacao,
} from '../utils/instalacao-atencao.util';

export interface RegistrarOcorrenciaObraInput {
  lojaId: string;
  osId: string;
  itemInstalacaoId?: string;
  tipo: TipoOcorrencia;
  categoria?: CategoriaOcorrencia;
  quantidade?: number;
  descricao: string;
  fotosEvidencia?: string[];
  dataRetornoPrevisao?: string;
  turnoRetornoPrevisao?: TurnoPrevisaoInstalacao;
}

export interface OcorrenciaObraRespostaInstalador {
  id: string;
  tipo: TipoOcorrencia;
  categoria: CategoriaOcorrencia;
  quantidade: number;
  descricao: string;
  criado_em: Date;
}

export interface AgendaInstalacaoEvento {
  lote_id: string;
  os_id: string;
  os_numero: string;
  cliente_nome: string | null;
  nome_servico: string;
  status_instalacao_os: StatusInstalacaoOs | null;
  data_previsao: string;
  turno_previsao: TurnoPrevisaoInstalacao | null;
  equipe_instalacao: string | null;
  status_instalacao: StatusInstalacao;
  endereco: {
    cep: string | null;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  };
  endereco_resumido: string;
}

export interface ConsultarAgendaResposta {
  data_inicio: string;
  data_fim: string;
  total: number;
  eventos: AgendaInstalacaoEvento[];
}

export interface ConflitoAgendaLoteResumo {
  lote_id: string;
  os_numero: string;
  cliente_nome: string | null;
}

export interface ConflitoAgendaItem {
  data: string;
  equipe_instalacao: string;
  total_lotes_sobrepostos: number;
  lotes: ConflitoAgendaLoteResumo[];
}

export interface ConsultarConflitosAgendaResposta {
  data_inicio: string;
  data_fim: string;
  total_conflitos: number;
  conflitos: ConflitoAgendaItem[];
}

export interface OsInstalacaoGridProgresso {
  concluidos: number;
  total: number;
  alocados: number;
  saldo: number;
}

export interface OsInstalacaoGridItem {
  os_id: string;
  numero: string;
  cliente_nome: string | null;
  nome_servico: string;
  status_instalacao_os: StatusInstalacaoOs | null;
  data_instalacao_agendada: string | null;
  proxima_visita: string | null;
  progresso: OsInstalacaoGridProgresso;
  /** Mesma trava financeira da expedição (parcela vencida ou SALDO em aberto). */
  bloqueio_financeiro: boolean;
  link_financeiro: string | null;
  /** Relatório técnico final emitido (após aprovação financeira). */
  relatorio_tecnico?: {
    pdf_url: string;
    pdf_token: string;
    gerado_em: string;
  } | null;
  /** Campo concluído (todos os lotes encerrados), pendente aprovação financeira. */
  pendente_aprovacao_financeira: boolean;
  requer_atencao_instalacao: boolean;
  ultima_atividade_instalacao: string | null;
  motivos_atencao_instalacao: string[];
}

export interface ListarOsInstalacaoResposta {
  total: number;
  itens: OsInstalacaoGridItem[];
}

const STATUS_LOTE_ATIVO_AGENDA: StatusInstalacao[] = [
  StatusInstalacao.AGUARDANDO,
  StatusInstalacao.EM_ANDAMENTO,
];

const CATEGORIA_POR_TIPO: Record<TipoOcorrencia, CategoriaOcorrencia> = {
  VISITA_IMPRODUTIVA: CategoriaOcorrencia.INSTALACAO,
  MATERIAL_EXTRA: CategoriaOcorrencia.PRODUCAO,
  SERVICO_ADICIONAL: CategoriaOcorrencia.INSTALACAO,
  RETRABALHO: CategoriaOcorrencia.PRODUCAO,
};

/**
 * Mesma regra da trava financeira da expedição
 * (`ExpedicaoFinanceiroService`): parcela SALDO nestes status bloqueia.
 */
const STATUS_SALDO_BLOQUEANTES = new Set<string>([
  ParcelaStatus.PREVISTO,
  ParcelaStatus.VENCIDO,
  ParcelaStatus.PARCIAL_PAGO,
]);

@Injectable()
export class InstalacaoService {
  private readonly logger = new Logger(InstalacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly instalacaoFechamentoService: InstalacaoFechamentoService,
    private readonly instalacaoAgendaSyncService: InstalacaoAgendaSyncService,
    private readonly configuracaoInstalacaoService: ConfiguracaoInstalacaoService,
    private readonly statusRollup: StatusRollupService,
    private readonly instalacaoExecucaoSyncService: InstalacaoExecucaoSyncService,
  ) {}

  async listarLotesPendentesInstalador(lojaId: string) {
    return this.prisma.itemOSInstalacao.findMany({
      where: {
        loja_id: lojaId,
        informar_equipe: true,
        status_instalacao: {
          in: [StatusInstalacao.AGUARDANDO, StatusInstalacao.EM_ANDAMENTO],
        },
      },
      orderBy: [{ data_previsao: 'asc' }, { criado_em: 'asc' }],
      select: {
        id: true,
        item_os_id: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
        quantidade_alocada: true,
        status_instalacao: true,
        data_previsao: true,
        turno_previsao: true,
        equipe_instalacao: true,
        responsavel_local: true,
        aguardando_reagendamento: true,
        data_execucao: true,
        fotos_evidencia: true,
        assinatura_url: true,
        origem_conclusao_lote: true,
        motivo_sem_assinatura: true,
        observacao_conclusao_gestao: true,
        conclusao_gestao_em: true,
        criado_em: true,
        item_os: {
          select: {
            produto_servico: true,
            os: {
              select: {
                id: true,
                numero: true,
                nome_servico: true,
              },
            },
          },
        },
      },
    });
  }

  async obterLoteInstalador(lojaId: string, loteId: string) {
    const lote = await this.prisma.itemOSInstalacao.findFirst({
      where: { id: loteId, loja_id: lojaId },
      select: {
        id: true,
        item_os_id: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
        quantidade_alocada: true,
        status_instalacao: true,
        data_previsao: true,
        turno_previsao: true,
        equipe_instalacao: true,
        responsavel_local: true,
        informar_equipe: true,
        aguardando_reagendamento: true,
        data_execucao: true,
        fotos_evidencia: true,
        assinatura_url: true,
        origem_conclusao_lote: true,
        motivo_sem_assinatura: true,
        observacao_conclusao_gestao: true,
        conclusao_gestao_em: true,
        criado_em: true,
        item_os: {
          select: {
            produto_servico: true,
            os: {
              select: {
                id: true,
                numero: true,
                nome_servico: true,
              },
            },
          },
        },
        ocorrencias: {
          orderBy: { criado_em: 'desc' },
          select: {
            id: true,
            tipo: true,
            categoria: true,
            quantidade: true,
            descricao: true,
            criado_em: true,
          },
        },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote de instalação não encontrado.');
    }

    return lote;
  }

  async iniciarLote(lojaId: string, loteId: string) {
    const lote = await this.obterLoteInstalador(lojaId, loteId);

    if (lote.status_instalacao !== StatusInstalacao.AGUARDANDO) {
      throw new BadRequestException(
        'Somente lotes aguardando podem ser iniciados.',
      );
    }

    const atualizado = await this.prisma.itemOSInstalacao.update({
      where: { id: loteId },
      data: {
        status_instalacao: StatusInstalacao.EM_ANDAMENTO,
        data_execucao: new Date(),
      },
      select: {
        id: true,
        status_instalacao: true,
        data_execucao: true,
      },
    });

    await this.instalacaoExecucaoSyncService.rollupStatusOsEmAndamento(
      lojaId,
      lote.item_os.os.id,
    );

    return atualizado;
  }

  async concluirLote(
    lojaId: string,
    loteId: string,
    dados: {
      fotos_evidencia?: string[];
      assinatura_url?: string;
    },
  ) {
    const lote = await this.obterLoteInstalador(lojaId, loteId);

    if (lote.status_instalacao !== StatusInstalacao.EM_ANDAMENTO) {
      throw new BadRequestException(
        'O lote precisa estar em andamento para ser concluído.',
      );
    }

    const osId = lote.item_os.os.id;

    return this.prisma.$transaction(async (tx) => {
      const loteAtual = await tx.itemOSInstalacao.findFirst({
        where: { id: loteId, loja_id: lojaId },
        select: { status_instalacao: true },
      });

      if (!loteAtual) {
        throw new NotFoundException('Lote de instalação não encontrado.');
      }

      if (loteAtual.status_instalacao !== StatusInstalacao.EM_ANDAMENTO) {
        throw new BadRequestException(
          'O lote precisa estar em andamento para ser concluído.',
        );
      }

      const loteAtualizado = await tx.itemOSInstalacao.update({
        where: { id: loteId },
        data: {
          status_instalacao: StatusInstalacao.CONCLUIDO,
          origem_conclusao_lote: OrigemConclusaoLote.CAMPO,
          fotos_evidencia: dados.fotos_evidencia ?? undefined,
          assinatura_url: dados.assinatura_url ?? null,
          data_execucao: new Date(),
        },
        select: {
          id: true,
          status_instalacao: true,
          fotos_evidencia: true,
          assinatura_url: true,
          data_execucao: true,
        },
      });

      await this.instalacaoFechamentoService.reterAposInstalacaoCompleta(
        tx,
        lojaId,
        osId,
      );

      return {
        id: loteAtualizado.id,
        status_instalacao: loteAtualizado.status_instalacao,
        fotos_evidencia: loteAtualizado.fotos_evidencia,
        assinatura_url: loteAtualizado.assinatura_url,
        data_execucao: loteAtualizado.data_execucao,
      };
    });
  }

  /**
   * Conclusão por alçada da gestão: operador confere evidências/ocorrências e
   * encerra o lote. Sem assinatura exige motivo catalogado (+ descrição se OUTROS).
   */
  async aprovarConclusaoLoteGestao(
    lojaId: string,
    loteId: string,
    usuarioId: string | null,
    dados: {
      fotos_evidencia?: string[];
      assinatura_url?: string;
      motivo_sem_assinatura?: MotivoSemAssinaturaLote;
      observacao_conclusao_gestao?: string;
    },
  ) {
    const lote = await this.prisma.itemOSInstalacao.findFirst({
      where: { id: loteId, loja_id: lojaId },
      select: {
        id: true,
        status_instalacao: true,
        assinatura_url: true,
        fotos_evidencia: true,
        item_os: { select: { os_id: true } },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote de instalação não encontrado.');
    }

    if (
      lote.status_instalacao !== StatusInstalacao.AGUARDANDO &&
      lote.status_instalacao !== StatusInstalacao.EM_ANDAMENTO
    ) {
      throw new BadRequestException(
        'Somente lotes aguardando ou em andamento podem ser aprovados pela gestão.',
      );
    }

    const assinaturaFinal = dados.assinatura_url ?? lote.assinatura_url ?? null;
    const temAssinatura = Boolean(assinaturaFinal);

    if (!temAssinatura) {
      if (!dados.motivo_sem_assinatura) {
        throw new BadRequestException(
          'Informe o motivo da conclusão sem assinatura do recebedor.',
        );
      }

      const observacao = sanitizarTextoCampo(
        dados.observacao_conclusao_gestao ?? '',
        2000,
      );

      if (
        dados.motivo_sem_assinatura === MotivoSemAssinaturaLote.OUTROS &&
        observacao.length < 10
      ) {
        throw new BadRequestException(
          'Para o motivo "Outros", descreva a justificativa (mínimo 10 caracteres).',
        );
      }
    }

    const observacaoGestao = sanitizarTextoCampo(
      dados.observacao_conclusao_gestao ?? '',
      2000,
    );

    const fotosExistentes = this.normalizarFotos(lote.fotos_evidencia);
    const fotosNovas = dados.fotos_evidencia ?? [];
    const fotosMescladas = [...new Set([...fotosExistentes, ...fotosNovas])];
    const osId = lote.item_os.os_id;
    const agora = new Date();

    return this.prisma.$transaction(async (tx) => {
      const loteAtualizado = await tx.itemOSInstalacao.update({
        where: { id: loteId },
        data: {
          status_instalacao: StatusInstalacao.CONCLUIDO,
          origem_conclusao_lote: OrigemConclusaoLote.GESTAO,
          assinatura_url: assinaturaFinal,
          fotos_evidencia:
            fotosMescladas.length > 0 ? fotosMescladas : undefined,
          data_execucao: agora,
          motivo_sem_assinatura: temAssinatura
            ? null
            : dados.motivo_sem_assinatura,
          observacao_conclusao_gestao:
            observacaoGestao.length > 0 ? observacaoGestao : null,
          conclusao_gestao_por: usuarioId,
          conclusao_gestao_em: agora,
        },
        select: {
          id: true,
          status_instalacao: true,
          origem_conclusao_lote: true,
          motivo_sem_assinatura: true,
          observacao_conclusao_gestao: true,
          assinatura_url: true,
          fotos_evidencia: true,
          data_execucao: true,
          conclusao_gestao_em: true,
        },
      });

      await this.instalacaoFechamentoService.reterAposInstalacaoCompleta(
        tx,
        lojaId,
        osId,
      );

      this.logger.log(
        `Lote ${loteId} concluído por alçada da gestão (OS ${osId})`,
      );

      return {
        ...loteAtualizado,
        fotos_evidencia: this.normalizarFotos(loteAtualizado.fotos_evidencia),
      };
    });
  }

  /**
   * Registra ocorrência de obra com custos financeiros calculados no backend.
   *
   * DEC-17 (Dúvida 3): imprevistos de campo NÃO alteram ItemOS.quantidade nem
   * criam lotes — apenas persistem OcorrenciaInstalacao para PDF e pós-cálculo.
   * A quantidade da ocorrência é unidade de cobrança do evento, não saldo da grade.
   */
  async registrarOcorrenciaObra(
    input: RegistrarOcorrenciaObraInput,
  ): Promise<OcorrenciaObraRespostaInstalador> {
    const descricao = sanitizarTextoCampo(input.descricao);
    if (!descricao) {
      throw new BadRequestException('Descrição da ocorrência é obrigatória.');
    }

    const os = await this.prisma.ordemServico.findFirst({
      where: { id: input.osId, loja_id: input.lojaId },
      select: { id: true },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    if (input.itemInstalacaoId) {
      const lote = await this.prisma.itemOSInstalacao.findFirst({
        where: {
          id: input.itemInstalacaoId,
          loja_id: input.lojaId,
          item_os: { os_id: input.osId },
        },
        select: { id: true },
      });

      if (!lote) {
        throw new NotFoundException(
          'Lote de instalação não encontrado para esta OS.',
        );
      }
    }

    const taxa = await this.prisma.taxaOcorrenciaLoja.findUnique({
      where: {
        loja_id_tipo: {
          loja_id: input.lojaId,
          tipo: input.tipo,
        },
      },
    });

    const quantidade = input.quantidade ?? 1;
    const custoUnitario = Number(taxa?.custo_padrao ?? 0);
    const precoUnitario = Number(taxa?.preco_padrao ?? 0);
    const categoria =
      input.categoria ??
      CATEGORIA_POR_TIPO[input.tipo] ??
      CategoriaOcorrencia.INSTALACAO;

    const osAditivaHabilitada =
      await this.configuracaoInstalacaoService.osAditivaHabilitada(
        input.lojaId,
      );

    const dataRetornoPrevisao =
      input.dataRetornoPrevisao !== undefined
        ? this.resolverDataPrevisao(input.dataRetornoPrevisao)
        : undefined;

    const ocorrencia = await this.prisma.ocorrenciaInstalacao.create({
      data: {
        loja_id: input.lojaId,
        os_id: input.osId,
        item_instalacao_id: input.itemInstalacaoId ?? null,
        tipo: input.tipo,
        categoria,
        quantidade: new Prisma.Decimal(quantidade),
        status_financeiro: osAditivaHabilitada
          ? StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO
          : StatusFinanceiroOcorrencia.PRECIFICADO,
        custo_interno: osAditivaHabilitada
          ? null
          : new Prisma.Decimal(custoUnitario * quantidade),
        preco_cliente: osAditivaHabilitada
          ? null
          : new Prisma.Decimal(precoUnitario * quantidade),
        custo_sugerido: osAditivaHabilitada
          ? new Prisma.Decimal(custoUnitario * quantidade)
          : null,
        preco_sugerido: osAditivaHabilitada
          ? new Prisma.Decimal(precoUnitario * quantidade)
          : null,
        descricao,
        fotos_evidencia:
          input.fotosEvidencia && input.fotosEvidencia.length > 0
            ? input.fotosEvidencia
            : undefined,
        ...(dataRetornoPrevisao !== undefined
          ? {
              data_retorno_previsao: dataRetornoPrevisao,
              turno_retorno_previsao: input.turnoRetornoPrevisao ?? null,
            }
          : {}),
      },
      select: {
        id: true,
        tipo: true,
        categoria: true,
        quantidade: true,
        descricao: true,
        criado_em: true,
      },
    });

    this.logger.log(
      `Ocorrência ${ocorrencia.id} registrada (${input.tipo}) — OS ${input.osId}`,
    );

    if (input.itemInstalacaoId) {
      if (input.tipo === TipoOcorrencia.VISITA_IMPRODUTIVA) {
        await this.tratarVisitaImprodutiva(input, dataRetornoPrevisao);
      } else {
        await this.instalacaoExecucaoSyncService.promoverLoteComAtividadeCampo(
          input.lojaId,
          input.itemInstalacaoId,
          input.osId,
        );
      }
    }

    return {
      ...ocorrencia,
      quantidade: Number(ocorrencia.quantidade),
    };
  }

  async listarOsInstalacaoGestao(
    lojaId: string,
    filtros?: ListarOsInstalacaoQueryDto,
  ): Promise<ListarOsInstalacaoResposta> {
    const busca = filtros?.busca?.trim();

    const ordens = await this.prisma.ordemServico.findMany({
      where: {
        loja_id: lojaId,
        ativo: true,
        ...(filtros?.status
          ? { status_instalacao_os: filtros.status }
          : {}),
        AND: [
          {
            // Entrada no módulo de instalação (modulo.md § 2.1): somente após
            // baixa de produção — lote já criado pelo PCP/gestor — ou OS com
            // produção encerrada (FINALIZADA) aguardando alocação manual.
            // OS recém-criada a partir de orçamento aprovado NÃO aparece aqui.
            OR: [
              {
                itens: {
                  some: {
                    lotes_instalacao: { some: { loja_id: lojaId } },
                  },
                },
              },
              {
                status: 'FINALIZADA',
                orcamento_id: { not: null },
                orcamento: {
                  loja_id: lojaId,
                  produtos: { some: { instalacao_necessaria: true } },
                },
              },
            ],
          },
          ...(busca
            ? [
                {
                  OR: [
                    { numero: { contains: busca } },
                    { nome_servico: { contains: busca } },
                    { cliente: { nome: { contains: busca } } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [
        { data_instalacao_agendada: 'asc' },
        { data_abertura: 'desc' },
      ],
      select: {
        id: true,
        numero: true,
        nome_servico: true,
        status_instalacao_os: true,
        data_instalacao_agendada: true,
        orcamento_id: true,
        cliente: { select: { nome: true } },
        itens: {
          select: {
            quantidade: true,
            lotes_instalacao: {
              where: { loja_id: lojaId },
              select: {
                status_instalacao: true,
                quantidade_alocada: true,
                data_previsao: true,
                assinatura_url: true,
                atualizado_em: true,
              },
            },
          },
        },
      },
    });

    const osIds = ordens.map((os) => os.id);

    await this.instalacaoFechamentoService.reconciliarStatusComRelatorioEmitido(
      lojaId,
      osIds,
    );

    const relatoriosPorOs = new Map(
      (
        await this.prisma.relatorioTecnicoInstalacao.findMany({
          where: { loja_id: lojaId, os_id: { in: osIds } },
          select: {
            os_id: true,
            pdf_url: true,
            pdf_token: true,
            gerado_em: true,
          },
        })
      ).map((rel) => [rel.os_id, rel]),
    );

    const statusCorrigidos = await this.prisma.ordemServico.findMany({
      where: { loja_id: lojaId, id: { in: osIds } },
      select: { id: true, status_instalacao_os: true },
    });
    const statusPorOs = new Map(
      statusCorrigidos.map((os) => [os.id, os.status_instalacao_os]),
    );

    const ocorrenciasPorOs = new Map<
      string,
      Array<{
        status_financeiro: StatusFinanceiroOcorrencia;
        criado_em: Date;
      }>
    >();
    if (osIds.length > 0) {
      const ocorrenciasLista = await this.prisma.ocorrenciaInstalacao.findMany({
        where: { loja_id: lojaId, os_id: { in: osIds } },
        select: {
          os_id: true,
          status_financeiro: true,
          criado_em: true,
        },
      });
      for (const occ of ocorrenciasLista) {
        const lista = ocorrenciasPorOs.get(occ.os_id) ?? [];
        lista.push({
          status_financeiro: occ.status_financeiro,
          criado_em: occ.criado_em,
        });
        ocorrenciasPorOs.set(occ.os_id, lista);
      }
    }

    const bloqueiosPorOrcamento = await this.calcularBloqueiosFinanceiros(
      lojaId,
      ordens
        .map((os) => os.orcamento_id)
        .filter((id): id is string => id !== null),
    );

    const inicioDia = this.inicioDiaOperacionalAgenda();

    const itens: OsInstalacaoGridItem[] = ordens.map((os) => {
      const lotes = os.itens.flatMap((item) => item.lotes_instalacao);
      const total = lotes.length;
      const concluidos = lotes.filter(
        (lote) =>
          lote.status_instalacao === StatusInstalacao.CONCLUIDO ||
          lote.status_instalacao === StatusInstalacao.LOGISTICA_NEGATIVA,
      ).length;
      const alocados = lotes.reduce(
        (acc, lote) => acc + lote.quantidade_alocada,
        0,
      );
      const quantidadeOs = os.itens.reduce(
        (acc, item) => acc + Math.floor(Number(item.quantidade)),
        0,
      );

      const proximaVisitaLote = lotes
        .filter(
          (lote) =>
            lote.data_previsao &&
            lote.data_previsao >= inicioDia &&
            lote.status_instalacao !== StatusInstalacao.CONCLUIDO &&
            lote.status_instalacao !== StatusInstalacao.LOGISTICA_NEGATIVA,
        )
        .sort(
          (a, b) =>
            (a.data_previsao?.getTime() ?? 0) - (b.data_previsao?.getTime() ?? 0),
        )[0]?.data_previsao;

      const proximaVisita =
        proximaVisitaLote ?? os.data_instalacao_agendada ?? null;

      const cobrancaBloqueante = os.orcamento_id
        ? (bloqueiosPorOrcamento.get(os.orcamento_id) ?? null)
        : null;

      const relatorio = relatoriosPorOs.get(os.id) ?? null;
      const statusInstalacao =
        statusPorOs.get(os.id) ?? os.status_instalacao_os;
      const campoConcluido =
        total > 0 && concluidos >= total;
      const ocorrenciasOs = ocorrenciasPorOs.get(os.id) ?? [];
      const atencao = calcularAtencaoInstalacaoOs({
        statusInstalacaoOs: statusInstalacao,
        relatorioEmitido: relatorio != null,
        lotes,
        ocorrencias: ocorrenciasOs,
      });

      return {
        os_id: os.id,
        numero: os.numero,
        cliente_nome: os.cliente?.nome ?? null,
        nome_servico: os.nome_servico,
        status_instalacao_os: statusInstalacao,
        data_instalacao_agendada:
          os.data_instalacao_agendada?.toISOString() ?? null,
        proxima_visita: proximaVisita?.toISOString() ?? null,
        progresso: {
          concluidos,
          total,
          alocados,
          saldo: Math.max(0, quantidadeOs - alocados),
        },
        bloqueio_financeiro: cobrancaBloqueante !== null,
        link_financeiro: cobrancaBloqueante
          ? `/financeiro/recebimentos?cobranca=${cobrancaBloqueante}&os=${os.id}&ref=${encodeURIComponent(os.numero)}`
          : null,
        relatorio_tecnico: relatorio
          ? {
              pdf_url: relatorio.pdf_url,
              pdf_token: relatorio.pdf_token,
              gerado_em: relatorio.gerado_em.toISOString(),
            }
          : null,
        pendente_aprovacao_financeira:
          campoConcluido &&
          statusInstalacao === StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO &&
          relatorio === null,
        requer_atencao_instalacao: atencao.requer_atencao,
        ultima_atividade_instalacao: atencao.ultima_atividade_em,
        motivos_atencao_instalacao: atencao.motivos,
      };
    });

    itens.sort((a, b) =>
      compararPrioridadeAtencaoInstalacao(
        {
          requer_atencao: a.requer_atencao_instalacao ?? false,
          ultima_atividade_em: a.ultima_atividade_instalacao ?? null,
        },
        {
          requer_atencao: b.requer_atencao_instalacao ?? false,
          ultima_atividade_em: b.ultima_atividade_instalacao ?? null,
        },
      ),
    );

    return { total: itens.length, itens };
  }

  /**
   * Trava financeira do grid de instalação — mesma regra da expedição
   * (`ExpedicaoFinanceiroService.verificarBloqueioEntrega`):
   * - sem cobrança vinculada → liberada;
   * - bloqueia se houver parcela SALDO em PREVISTO/VENCIDO/PARCIAL_PAGO;
   * - bloqueia se houver qualquer parcela vencida (após recategorização).
   *
   * Retorna mapa `orcamento_id → cobranca_id` apenas dos orçamentos bloqueados.
   */
  private async calcularBloqueiosFinanceiros(
    lojaId: string,
    orcamentoIds: string[],
  ): Promise<Map<string, string>> {
    const bloqueados = new Map<string, string>();
    const idsUnicos = [...new Set(orcamentoIds)];
    if (idsUnicos.length === 0) {
      return bloqueados;
    }

    const cobrancas = await this.prisma.cobranca.findMany({
      where: { loja_id: lojaId, orcamento_id: { in: idsUnicos } },
      select: {
        id: true,
        orcamento_id: true,
        parcelas: {
          orderBy: { ordem: 'asc' },
          select: {
            tipo: true,
            status: true,
            valor_previsto: true,
            valor_recebido: true,
            data_vencimento: true,
          },
        },
      },
    });

    for (const cobranca of cobrancas) {
      const parcelasAtualizadas = this.statusRollup.recategorizarVencidas(
        cobranca.parcelas.map((p) => ({
          status: p.status,
          valor_previsto: Number(p.valor_previsto),
          valor_recebido: Number(p.valor_recebido),
          data_vencimento: p.data_vencimento,
        })),
      );

      const temBloqueio = cobranca.parcelas.some((parcela, indice) => {
        const statusEfetivo =
          parcelasAtualizadas[indice]?.status ?? parcela.status;
        return (
          statusEfetivo === ParcelaStatus.VENCIDO ||
          (parcela.tipo === ParcelaTipo.SALDO &&
            STATUS_SALDO_BLOQUEANTES.has(statusEfetivo))
        );
      });

      if (temBloqueio) {
        bloqueados.set(cobranca.orcamento_id, cobranca.id);
      }
    }

    return bloqueados;
  }

  async listarLotesGestao(lojaId: string) {
    return this.prisma.itemOSInstalacao.findMany({
      where: { loja_id: lojaId },
      orderBy: [{ data_previsao: 'asc' }, { criado_em: 'desc' }],
      select: {
        id: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
        quantidade_alocada: true,
        status_instalacao: true,
        data_previsao: true,
        data_execucao: true,
        fotos_evidencia: true,
        assinatura_url: true,
        origem_conclusao_lote: true,
        motivo_sem_assinatura: true,
        observacao_conclusao_gestao: true,
        conclusao_gestao_em: true,
        criado_em: true,
        atualizado_em: true,
        item_os: {
          select: {
            produto_servico: true,
            os: {
              select: {
                id: true,
                numero: true,
                nome_servico: true,
                cliente: { select: { nome: true } },
              },
            },
          },
        },
      },
    });
  }

  async consultarAgenda(
    lojaId: string,
    query: ConsultarAgendaQueryDto,
  ): Promise<ConsultarAgendaResposta> {
    const { inicio, fim } = this.resolverIntervaloAgenda(
      query.data_inicio,
      query.data_fim,
    );

    const lotes = await this.prisma.itemOSInstalacao.findMany({
      where: {
        loja_id: lojaId,
        data_previsao: {
          not: null,
          gte: inicio,
          lte: fim,
        },
        item_os: {
          os: { loja_id: lojaId },
        },
      },
      orderBy: [{ data_previsao: 'asc' }, { criado_em: 'asc' }],
      select: {
        id: true,
        data_previsao: true,
        turno_previsao: true,
        equipe_instalacao: true,
        status_instalacao: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
        item_os: {
          select: {
            os: {
              select: {
                id: true,
                numero: true,
                nome_servico: true,
                status_instalacao_os: true,
                cliente: { select: { nome: true } },
              },
            },
          },
        },
      },
    });

    const eventos: AgendaInstalacaoEvento[] = lotes
      .filter((lote) => lote.data_previsao != null)
      .map((lote) => {
        const os = lote.item_os.os;
        return {
          lote_id: lote.id,
          os_id: os.id,
          os_numero: os.numero,
          cliente_nome: os.cliente?.nome ?? null,
          nome_servico: os.nome_servico,
          status_instalacao_os: os.status_instalacao_os,
          data_previsao: lote.data_previsao!.toISOString(),
          turno_previsao: lote.turno_previsao,
          equipe_instalacao: lote.equipe_instalacao,
          status_instalacao: lote.status_instalacao,
          endereco: {
            cep: lote.cep,
            logradouro: lote.logradouro,
            numero: lote.numero,
            complemento: lote.complemento,
            bairro: lote.bairro,
            cidade: lote.cidade,
            uf: lote.uf,
          },
          endereco_resumido: this.montarEnderecoResumido(lote),
        };
      });

    return {
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      total: eventos.length,
      eventos,
    };
  }

  /**
   * UX-04: detecta sobreposição de equipe no mesmo dia (alerta soft no frontend).
   */
  async consultarConflitosAgenda(
    lojaId: string,
    query: ConsultarAgendaQueryDto,
  ): Promise<ConsultarConflitosAgendaResposta> {
    const { inicio, fim } = this.resolverIntervaloAgenda(
      query.data_inicio,
      query.data_fim,
    );

    const lotes = await this.prisma.itemOSInstalacao.findMany({
      where: {
        loja_id: lojaId,
        data_previsao: {
          not: null,
          gte: inicio,
          lte: fim,
        },
        equipe_instalacao: { not: null },
        status_instalacao: { in: STATUS_LOTE_ATIVO_AGENDA },
        item_os: {
          os: { loja_id: lojaId },
        },
      },
      orderBy: [{ data_previsao: 'asc' }, { criado_em: 'asc' }],
      select: {
        id: true,
        data_previsao: true,
        equipe_instalacao: true,
        item_os: {
          select: {
            os: {
              select: {
                numero: true,
                cliente: { select: { nome: true } },
              },
            },
          },
        },
      },
    });

    const grupos = new Map<
      string,
      {
        data: string;
        equipe_instalacao: string;
        lotes: ConflitoAgendaLoteResumo[];
      }
    >();

    for (const lote of lotes) {
      if (!lote.data_previsao) {
        continue;
      }

      const equipe = lote.equipe_instalacao?.trim();
      if (!equipe) {
        continue;
      }

      const dia = chaveDiaPrevisaoAgenda(lote.data_previsao);
      const chave = `${dia}|${equipe.toLowerCase()}`;

      const existente = grupos.get(chave) ?? {
        data: dia,
        equipe_instalacao: equipe,
        lotes: [],
      };

      existente.lotes.push({
        lote_id: lote.id,
        os_numero: lote.item_os.os.numero,
        cliente_nome: lote.item_os.os.cliente?.nome ?? null,
      });

      grupos.set(chave, existente);
    }

    const conflitos: ConflitoAgendaItem[] = Array.from(grupos.values())
      .filter((grupo) => grupo.lotes.length >= 2)
      .map((grupo) => ({
        data: grupo.data,
        equipe_instalacao: grupo.equipe_instalacao,
        total_lotes_sobrepostos: grupo.lotes.length,
        lotes: grupo.lotes,
      }))
      .sort((a, b) => {
        const cmpData = a.data.localeCompare(b.data);
        if (cmpData !== 0) {
          return cmpData;
        }
        return a.equipe_instalacao.localeCompare(b.equipe_instalacao, 'pt-BR');
      });

    return {
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      total_conflitos: conflitos.length,
      conflitos,
    };
  }

  async obterPainelOs(lojaId: string, osId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        numero: true,
        nome_servico: true,
        orcamento_id: true,
        status_instalacao_os: true,
        cliente: { select: { nome: true } },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    await this.instalacaoExecucaoSyncService.reconciliarStatusCampo(
      lojaId,
      osId,
    );

    await this.instalacaoFechamentoService.reconciliarStatusComRelatorioEmitido(
      lojaId,
      [osId],
    );

    const osAtualizada = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: { status_instalacao_os: true },
    });

    const lotes = await this.prisma.itemOSInstalacao.findMany({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
      },
      orderBy: { criado_em: 'asc' },
      select: {
        id: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
        quantidade_alocada: true,
        status_instalacao: true,
        data_previsao: true,
        turno_previsao: true,
        equipe_instalacao: true,
        responsavel_local: true,
        informar_equipe: true,
        aguardando_reagendamento: true,
        data_execucao: true,
        fotos_evidencia: true,
        assinatura_url: true,
        origem_conclusao_lote: true,
        motivo_sem_assinatura: true,
        observacao_conclusao_gestao: true,
        conclusao_gestao_em: true,
        criado_em: true,
        atualizado_em: true,
        item_os_id: true,
        item_os: { select: { produto_servico: true } },
      },
    });

    const ocorrencias = await this.prisma.ocorrenciaInstalacao.findMany({
      where: { loja_id: lojaId, os_id: osId },
      orderBy: { criado_em: 'desc' },
      select: {
        id: true,
        tipo: true,
        categoria: true,
        quantidade: true,
        custo_interno: true,
        preco_cliente: true,
        custo_sugerido: true,
        preco_sugerido: true,
        status_financeiro: true,
        versao: true,
        os_aditiva_id: true,
        descricao: true,
        fotos_evidencia: true,
        criado_em: true,
        item_instalacao: {
          select: { id: true, logradouro: true, numero: true },
        },
      },
    });

    const itensSaldo = await this.listarItensSaldoInstalacaoOs(
      lojaId,
      osId,
      os.orcamento_id,
    );

    return {
      os: {
        id: os.id,
        numero: os.numero,
        nome_servico: os.nome_servico,
        cliente_nome: os.cliente?.nome ?? null,
        status_instalacao_os:
          osAtualizada?.status_instalacao_os ?? os.status_instalacao_os,
      },
      itens_saldo: itensSaldo,
      lotes: lotes.map((lote) => ({
        ...lote,
        fotos_evidencia: this.normalizarFotos(lote.fotos_evidencia),
      })),
      ocorrencias: ocorrencias.map((occ) => ({
        ...occ,
        quantidade: Number(occ.quantidade),
        custo_interno: occ.custo_interno ? Number(occ.custo_interno) : null,
        preco_cliente: occ.preco_cliente ? Number(occ.preco_cliente) : null,
        custo_sugerido: occ.custo_sugerido ? Number(occ.custo_sugerido) : null,
        preco_sugerido: occ.preco_sugerido ? Number(occ.preco_sugerido) : null,
        fotos_evidencia: this.normalizarFotos(occ.fotos_evidencia),
      })),
    };
  }

  private async listarItensSaldoInstalacaoOs(
    lojaId: string,
    osId: string,
    orcamentoId: string | null,
  ) {
    if (!orcamentoId) {
      return [];
    }

    const itens = await this.prisma.itemOS.findMany({
      where: { os_id: osId },
      select: {
        id: true,
        produto_servico: true,
        quantidade: true,
      },
    });

    const itensSaldo: Array<{
      item_os_id: string;
      produto_servico: string | null;
      quantidade_total: number;
      quantidade_alocada: number;
      saldo_disponivel: number;
    }> = [];

    for (const item of itens) {
      const produto = await this.prisma.produtoOrcamento.findFirst({
        where: {
          id: item.id,
          orcamento_id: orcamentoId,
          orcamento: { loja_id: lojaId },
          instalacao_necessaria: true,
        },
        select: { id: true },
      });

      if (!produto) {
        continue;
      }

      const quantidadeTotal = Math.floor(Number(item.quantidade));
      const saldoDisponivel = await this.calcularSaldoInstalacaoItem(
        item.id,
        lojaId,
        quantidadeTotal,
      );

      itensSaldo.push({
        item_os_id: item.id,
        produto_servico: item.produto_servico,
        quantidade_total: quantidadeTotal,
        quantidade_alocada: quantidadeTotal - saldoDisponivel,
        saldo_disponivel: saldoDisponivel,
      });
    }

    return itensSaldo;
  }

  private async calcularSaldoInstalacaoItem(
    itemOsId: string,
    lojaId: string,
    quantidadeTotal: number,
  ): Promise<number> {
    const agregado = await this.prisma.itemOSInstalacao.aggregate({
      where: { item_os_id: itemOsId, loja_id: lojaId },
      _sum: { quantidade_alocada: true },
    });

    const alocado = agregado._sum.quantidade_alocada ?? 0;
    return Math.max(0, quantidadeTotal - alocado);
  }

  async atualizarStatusLoteGestao(
    lojaId: string,
    loteId: string,
    novoStatus: StatusInstalacao,
  ) {
    if (novoStatus === StatusInstalacao.CONCLUIDO) {
      throw new BadRequestException(
        'A conclusão do lote deve ser feita pelo aplicativo de campo, com evidências e assinatura.',
      );
    }

    const lote = await this.prisma.itemOSInstalacao.findFirst({
      where: { id: loteId, loja_id: lojaId },
      select: {
        id: true,
        status_instalacao: true,
        item_os: { select: { os_id: true } },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote de instalação não encontrado.');
    }

    if (!this.transicaoStatusGestaoPermitida(lote.status_instalacao, novoStatus)) {
      throw new BadRequestException(
        `Não é possível mover o lote de ${lote.status_instalacao} para ${novoStatus}.`,
      );
    }

    if (lote.status_instalacao === novoStatus) {
      return {
        id: lote.id,
        status_instalacao: novoStatus,
      };
    }

    const atualizado = await this.prisma.itemOSInstalacao.update({
      where: { id: loteId },
      data: {
        status_instalacao: novoStatus,
        ...(novoStatus === StatusInstalacao.EM_ANDAMENTO
          ? { data_execucao: new Date() }
          : {}),
      },
      select: {
        id: true,
        status_instalacao: true,
      },
    });

    this.logger.log(
      `Lote ${loteId} — status atualizado para ${novoStatus} (gestão)`,
    );

    if (novoStatus === StatusInstalacao.EM_ANDAMENTO) {
      await this.instalacaoExecucaoSyncService.rollupStatusOsEmAndamento(
        lojaId,
        lote.item_os.os_id,
      );
    }

    return atualizado;
  }

  private transicaoStatusGestaoPermitida(
    atual: StatusInstalacao,
    destino: StatusInstalacao,
  ): boolean {
    if (atual === destino) {
      return true;
    }

    const permitidos: Record<StatusInstalacao, StatusInstalacao[]> = {
      [StatusInstalacao.AGUARDANDO]: [
        StatusInstalacao.EM_ANDAMENTO,
        StatusInstalacao.LOGISTICA_NEGATIVA,
      ],
      [StatusInstalacao.EM_ANDAMENTO]: [
        StatusInstalacao.AGUARDANDO,
        StatusInstalacao.LOGISTICA_NEGATIVA,
      ],
      [StatusInstalacao.CONCLUIDO]: [],
      [StatusInstalacao.LOGISTICA_NEGATIVA]: [],
    };

    return permitidos[atual]?.includes(destino) ?? false;
  }

  async atualizarEnderecoLote(
    lojaId: string,
    loteId: string,
    dados: {
      cep?: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      quantidade_alocada?: number;
      data_previsao?: string | null;
      turno_previsao?: TurnoPrevisaoInstalacao | null;
      equipe_instalacao?: string | null;
      responsavel_local?: string | null;
      informar_equipe?: boolean;
    },
  ) {
    const lote = await this.prisma.itemOSInstalacao.findFirst({
      where: { id: loteId, loja_id: lojaId },
      select: {
        id: true,
        status_instalacao: true,
        quantidade_alocada: true,
        item_os_id: true,
        item_os: { select: { os_id: true, quantidade: true } },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote de instalação não encontrado.');
    }

    if (lote.status_instalacao === StatusInstalacao.CONCLUIDO) {
      throw new BadRequestException(
        'Lotes concluídos não podem ter o endereço alterado.',
      );
    }

    let quantidadeAlocadaAtualizada: number | undefined;

    if (dados.quantidade_alocada != null) {
      const quantidadeTotal = Math.floor(Number(lote.item_os.quantidade));
      const saldoDisponivel = await this.calcularSaldoInstalacaoItem(
        lote.item_os_id,
        lojaId,
        quantidadeTotal,
      );
      const tetoParaLote =
        saldoDisponivel + Math.floor(Number(lote.quantidade_alocada));
      const novaQuantidade = Math.floor(dados.quantidade_alocada);

      if (novaQuantidade < 1) {
        throw new BadRequestException(
          'Quantidade alocada deve ser no mínimo 1 unidade.',
        );
      }

      if (novaQuantidade > tetoParaLote) {
        throw new BadRequestException(
          'Quantidade excede o saldo disponível para alocação nesta OS.',
        );
      }

      quantidadeAlocadaAtualizada = novaQuantidade;
    }

    const dataPrevisao = this.resolverDataPrevisao(dados.data_previsao);
    const osId = lote.item_os.os_id;

    const loteAtualizado = await this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.itemOSInstalacao.update({
        where: { id: loteId },
        data: {
          cep: dados.cep?.replace(/\D/g, '') || null,
          logradouro: dados.logradouro.trim(),
          numero: dados.numero.trim(),
          complemento: dados.complemento?.trim() || null,
          bairro: dados.bairro.trim(),
          cidade: dados.cidade.trim(),
          uf: dados.uf.trim().toUpperCase().slice(0, 2),
          ...(quantidadeAlocadaAtualizada != null
            ? { quantidade_alocada: quantidadeAlocadaAtualizada }
            : {}),
          ...(dataPrevisao !== undefined
            ? { data_previsao: dataPrevisao }
            : {}),
          ...(dados.turno_previsao !== undefined
            ? { turno_previsao: dados.turno_previsao }
            : {}),
          ...(dados.equipe_instalacao !== undefined
            ? {
                equipe_instalacao: dados.equipe_instalacao?.trim() || null,
              }
            : {}),
          ...(dados.responsavel_local !== undefined
            ? {
                responsavel_local: dados.responsavel_local?.trim() || null,
              }
            : {}),
          ...(dados.informar_equipe !== undefined
            ? { informar_equipe: dados.informar_equipe }
            : {}),
        },
        select: {
          id: true,
          cep: true,
          logradouro: true,
          numero: true,
          complemento: true,
          bairro: true,
          cidade: true,
          uf: true,
          quantidade_alocada: true,
          status_instalacao: true,
          data_previsao: true,
          turno_previsao: true,
          equipe_instalacao: true,
          responsavel_local: true,
          informar_equipe: true,
          aguardando_reagendamento: true,
          atualizado_em: true,
        },
      });

      await this.instalacaoAgendaSyncService.sincronizarDataOs(
        tx,
        lojaId,
        osId,
      );

      return atualizado;
    });

    await this.instalacaoExecucaoSyncService.sincronizarAposMudancaLotes(
      lojaId,
      osId,
    );

    await this.instalacaoExecucaoSyncService.promoverLoteSeAgendado(
      lojaId,
      loteId,
      osId,
    );

    return loteAtualizado;
  }

  private async tratarVisitaImprodutiva(
    input: RegistrarOcorrenciaObraInput,
    dataRetornoPrevisao: Date | null | undefined,
  ): Promise<void> {
    if (!input.itemInstalacaoId) {
      return;
    }

    const loteId = input.itemInstalacaoId;
    const osId = input.osId;

    if (dataRetornoPrevisao) {
      await this.prisma.$transaction(async (tx) => {
        await tx.itemOSInstalacao.update({
          where: { id: loteId, loja_id: input.lojaId },
          data: {
            data_previsao: dataRetornoPrevisao,
            ...(input.turnoRetornoPrevisao
              ? { turno_previsao: input.turnoRetornoPrevisao }
              : {}),
            aguardando_reagendamento: false,
          },
        });

        await this.instalacaoAgendaSyncService.sincronizarDataOs(
          tx,
          input.lojaId,
          osId,
        );
      });

      await this.instalacaoExecucaoSyncService.promoverLoteSeAgendado(
        input.lojaId,
        loteId,
        osId,
      );
      return;
    }

    await this.prisma.itemOSInstalacao.updateMany({
      where: { id: loteId, loja_id: input.lojaId },
      data: { aguardando_reagendamento: true },
    });

    await this.instalacaoExecucaoSyncService.promoverLoteComAtividadeCampo(
      input.lojaId,
      loteId,
      osId,
    );
  }

  private resolverDataPrevisao(
    valor?: string | null,
  ): Date | null | undefined {
    if (valor === undefined) {
      return undefined;
    }
    if (valor === null || valor === '') {
      return null;
    }
    try {
      return parseDataPrevisaoCampo(valor);
    } catch {
      throw new BadRequestException('Data de previsão inválida.');
    }
  }

  private resolverIntervaloAgenda(
    dataInicio: string,
    dataFim: string,
  ): { inicio: Date; fim: Date } {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Intervalo de datas inválido.');
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dataInicio.trim())) {
      inicio.setUTCHours(0, 0, 0, 0);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dataFim.trim())) {
      fim.setUTCHours(23, 59, 59, 999);
    }

    if (fim.getTime() < inicio.getTime()) {
      throw new BadRequestException(
        'data_fim deve ser igual ou posterior a data_inicio.',
      );
    }

    return { inicio, fim };
  }

  private inicioDiaOperacionalAgenda(referencia: Date = new Date()): Date {
    const hojeLocal = referencia.toLocaleDateString('en-CA', {
      timeZone: 'America/Sao_Paulo',
    });
    return new Date(hojeLocal);
  }

  private montarEnderecoResumido(lote: {
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  }): string {
    const complemento = lote.complemento ? ` ${lote.complemento}` : '';
    return `${lote.logradouro}, ${lote.numero}${complemento} — ${lote.bairro}, ${lote.cidade}/${lote.uf}`;
  }

  private normalizarFotos(valor: unknown): string[] {
    if (!Array.isArray(valor)) return [];
    return valor.filter((item): item is string => typeof item === 'string');
  }
}
