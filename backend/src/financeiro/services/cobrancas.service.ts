import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ParcelasBuilderService } from './parcelas-builder.service';
import { StatusRollupService } from './status-rollup.service';
import { CobrancaVencimentoService } from './cobranca-vencimento.service';
import {
  CobrancaStatus,
  CobrancaLogAcao,
  ParcelaStatus,
  ParcelaTipo,
  PARCELA_STATUS_ELEGIVEIS_RECEBIMENTO,
  RecebimentoMetodo,
} from '../enums/cobranca-status.enum';
import { PcpBloqueioSinalService } from '../../instalacao/services/pcp-bloqueio-sinal.service';
import { InstalacaoPosCalculoService } from '../../instalacao/services/instalacao-pos-calculo.service';
import { CondicaoPagamentoTipo } from '../enums/condicao-pagamento-tipo.enum';
import {
  CobrancaDetalhe,
  CobrancaResumo,
  DadosCondicaoPagamentoOrcamento,
  ListagemCobrancasResponse,
  ParcelaResumo,
  RecebimentoResumo,
} from '../interfaces/cobranca.interface';
import { RegistrarRecebimentoDto } from '../dto/registrar-recebimento.dto';

/**
 * Servico central do financeiro minimo (Fase 6).
 *
 * Responsabilidades:
 * - Criar cobranca quando o orcamento e aprovado (chamado pelo OrcamentosV2Service).
 * - Listar/detalhar cobrancas por loja com paginacao.
 * - Registrar recebimentos (parcial, liquidacao, forcado).
 * - Cancelar cobranca (com auditoria).
 * - Recalcular status sob demanda na leitura (alem do job @Cron diario da 6.E).
 *
 * Nao consome `HomeCacheService` diretamente; quem invalida cache e o controller
 * apos cada acao publica (mantemos a separacao em camadas).
 */
@Injectable()
export class CobrancasService {
  private readonly logger = new Logger(CobrancasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parcelasBuilder: ParcelasBuilderService,
    private readonly statusRollup: StatusRollupService,
    private readonly vencimentoService: CobrancaVencimentoService,
    private readonly pcpBloqueioSinalService: PcpBloqueioSinalService,
    private readonly instalacaoPosCalculoService: InstalacaoPosCalculoService,
  ) {}

  // --------------------------------------------------------------------------
  // CRIACAO AUTOMATICA NA APROVACAO DO ORCAMENTO
  // --------------------------------------------------------------------------

  /**
   * Cria a cobranca associada a um orcamento recem-aprovado.
   * Chamado pelo OrcamentosV2Service.fecharPedidoInterno (Fase 6.B).
   *
   * Se o orcamento ja tem cobranca, retorna a existente (idempotente).
   * Se o tipo de pagamento for invalido, lanca BadRequestException.
   *
   * Wrapa em transacao para garantir consistencia entre cobranca + parcelas + log.
   */
  async criarCobrancaParaOrcamento(
    orcamentoId: string,
    lojaId: string,
    dados: DadosCondicaoPagamentoOrcamento,
    usuarioId: string | null,
    contextoAuditoria: { ip_origem?: string; user_agent?: string } = {},
  ): Promise<CobrancaResumo> {
    const existente = await this.prisma.cobranca.findUnique({
      where: { orcamento_id: orcamentoId },
    });
    if (existente) {
      this.logger.log(
        `[Cobranca] Orcamento ${orcamentoId} ja tem cobranca ${existente.id}, retornando existente`,
      );
      return this.obterDetalhe(existente.id, lojaId);
    }

    if (!dados.tipo) {
      throw new BadRequestException(
        'Orçamento sem condição de pagamento estruturada (condicao_pagamento_tipo)',
      );
    }

    const parcelas = this.parcelasBuilder.construir({
      tipo: dados.tipo as CondicaoPagamentoTipo,
      entradaPct: dados.entrada_pct,
      parcelas: dados.parcelas,
      valorTotal: dados.valor_total,
      dataAprovacao: dados.data_aprovacao,
      prazoEntregaDias: dados.prazo_entrega_dias,
    });

    const descricao =
      dados.descricao ??
      this.parcelasBuilder.gerarDescricao({
        tipo: dados.tipo as CondicaoPagamentoTipo,
        entradaPct: dados.entrada_pct,
        parcelas: dados.parcelas,
      });

    const valorSaldo = dados.valor_total;

    const cobrancaCriada = await this.prisma.$transaction(async (tx) => {
      const cobranca = await tx.cobranca.create({
        data: {
          loja_id: lojaId,
          orcamento_id: orcamentoId,
          cliente_id: dados.cliente_id,
          tipo: dados.tipo,
          descricao,
          status: CobrancaStatus.PREVISTA,
          valor_total: new Prisma.Decimal(dados.valor_total),
          valor_recebido: new Prisma.Decimal(0),
          valor_saldo: new Prisma.Decimal(valorSaldo),
          data_aprovacao: dados.data_aprovacao,
          criado_por: usuarioId,
          parcelas: {
            create: parcelas.map((p) => ({
              ordem: p.ordem,
              tipo: p.tipo,
              valor_previsto: new Prisma.Decimal(p.valor_previsto),
              valor_recebido: new Prisma.Decimal(0),
              data_vencimento: p.data_vencimento,
              status: p.status,
            })),
          },
          logs: {
            create: [
              {
                tipo_acao: CobrancaLogAcao.COBRANCA_CRIADA,
                descricao: `Cobrança criada automaticamente após aprovação do orçamento. Tipo: ${dados.tipo}. ${parcelas.length} parcela(s).`,
                status_novo: CobrancaStatus.PREVISTA,
                valor_movimentado: new Prisma.Decimal(dados.valor_total),
                usuario_id: usuarioId,
                ip_origem: contextoAuditoria.ip_origem ?? null,
                user_agent: contextoAuditoria.user_agent ?? null,
                dados_extras: JSON.stringify({
                  parcelas: parcelas.map((p) => ({
                    ordem: p.ordem,
                    tipo: p.tipo,
                    valor: p.valor_previsto,
                    vencimento: p.data_vencimento.toISOString(),
                  })),
                }),
              },
            ],
          },
        },
      });
      return cobranca;
    });

    this.logger.log(
      `[Cobranca] Criada ${cobrancaCriada.id} para orcamento ${orcamentoId} (${parcelas.length} parcela(s), R$ ${dados.valor_total.toFixed(2)})`,
    );

    try {
      await this.instalacaoPosCalculoService.aplicarTravaSaldoAposAprovacao(
        cobrancaCriada.id,
        orcamentoId,
        lojaId,
      );
    } catch (error) {
      this.logger.error(
        `Falha ao aplicar trava de saldo pós-instalação na cobrança ${cobrancaCriada.id}:`,
        error,
      );
    }

    return this.obterDetalhe(cobrancaCriada.id, lojaId);
  }

  // --------------------------------------------------------------------------
  // LISTAGEM E DETALHE
  // --------------------------------------------------------------------------

  async listar(
    lojaId: string,
    filtros: {
      status?: string;
      cliente_id?: string;
      data_inicio?: Date;
      data_fim?: Date;
      pagina?: number;
      por_pagina?: number;
    },
  ): Promise<ListagemCobrancasResponse> {
    const pagina = Math.max(1, filtros.pagina ?? 1);
    const porPagina = Math.min(100, Math.max(5, filtros.por_pagina ?? 25));

    const where: Prisma.CobrancaWhereInput = { loja_id: lojaId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.cliente_id) where.cliente_id = filtros.cliente_id;
    if (filtros.data_inicio || filtros.data_fim) {
      where.data_aprovacao = {};
      if (filtros.data_inicio) where.data_aprovacao.gte = filtros.data_inicio;
      if (filtros.data_fim) where.data_aprovacao.lte = filtros.data_fim;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.cobranca.count({ where }),
      this.prisma.cobranca.findMany({
        where,
        orderBy: { data_aprovacao: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          orcamento: {
            select: {
              numero: true,
              titulo: true,
              ordens_servico: {
                select: { id: true, numero: true },
                orderBy: { criado_em: 'desc' },
              },
            },
          },
          cliente: { select: { nome: true } },
          parcelas: {
            where: {
              status: {
                notIn: [
                  ParcelaStatus.LIQUIDADO,
                  ParcelaStatus.CANCELADA,
                ],
              },
            },
            orderBy: { ordem: 'asc' },
          },
          _count: { select: { parcelas: true } },
        },
      }),
    ]);

    const data = rows.map((row) => this.mapearResumo(row));
    return {
      data,
      meta: { total, pagina, por_pagina: porPagina },
    };
  }

  async obterDetalhe(
    cobrancaId: string,
    lojaId: string,
  ): Promise<CobrancaDetalhe> {
    const row = await this.prisma.cobranca.findFirst({
      where: { id: cobrancaId, loja_id: lojaId },
      include: {
        orcamento: {
          select: {
            numero: true,
            titulo: true,
            ordens_servico: {
              select: { id: true, numero: true },
              orderBy: { criado_em: 'desc' },
            },
          },
        },
        cliente: { select: { nome: true } },
        parcelas: { orderBy: { ordem: 'asc' } },
        recebimentos: {
          orderBy: { data_recebimento: 'desc' },
          include: { usuario: { select: { nome_completo: true } } },
        },
        _count: { select: { parcelas: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Cobrança não encontrada');
    }

    // Recalcula status na leitura (recategoriza vencidas + rollup).
    const parcelasParaRollup = row.parcelas.map((p) => ({
      status: p.status,
      valor_previsto: Number(p.valor_previsto),
      valor_recebido: Number(p.valor_recebido),
      data_vencimento: p.data_vencimento,
    }));
    const parcelasAtualizadas =
      this.statusRollup.recategorizarVencidas(parcelasParaRollup);
    const statusCalculado =
      this.statusRollup.calcularStatusCobranca(parcelasAtualizadas);

    // Se houve mudanca de status (ex.: PREVISTA -> VENCIDO sob demanda),
    // grava no banco para nao "esquecer" a transicao no proximo @Cron.
    if (statusCalculado !== row.status) {
      await this.aplicarStatusRecalculado(
        row.id,
        statusCalculado,
        parcelasAtualizadas,
        row.parcelas,
      );
    }

    return {
      ...this.mapearResumo({
        ...row,
        status: statusCalculado,
      }),
      total_parcelas: row._count.parcelas,
      parcelas: row.parcelas.map((p, idx) =>
        this.mapearParcela(p, parcelasAtualizadas[idx].status),
      ),
      recebimentos: row.recebimentos.map((r) =>
        this.mapearRecebimento(
          r as Prisma.CobrancaRecebimentoGetPayload<{
            include: { usuario: { select: { nome_completo: true } } };
          }>,
        ),
      ),
    };
  }

  // --------------------------------------------------------------------------
  // RECEBIMENTOS
  // --------------------------------------------------------------------------

  async registrarRecebimento(
    cobrancaId: string,
    lojaId: string,
    dto: RegistrarRecebimentoDto,
    usuarioId: string | null,
    contextoAuditoria: { ip_origem?: string; user_agent?: string } = {},
  ): Promise<CobrancaDetalhe> {
    const cobranca = await this.prisma.cobranca.findFirst({
      where: { id: cobrancaId, loja_id: lojaId },
      include: { parcelas: { orderBy: { ordem: 'asc' } } },
    });
    if (!cobranca) throw new NotFoundException('Cobrança não encontrada');
    if (cobranca.status === CobrancaStatus.CANCELADA) {
      throw new BadRequestException(
        'Cobrança cancelada não aceita recebimentos',
      );
    }

    // Identifica a parcela alvo.
    let parcelaAlvo: (typeof cobranca.parcelas)[number] | undefined;
    if (dto.parcela_id) {
      parcelaAlvo = cobranca.parcelas.find((p) => p.id === dto.parcela_id);
      if (!parcelaAlvo)
        throw new NotFoundException('Parcela não encontrada na cobrança');
    } else {
      // Primeira parcela em aberto (PREVISTO, PARCIAL_PAGO ou VENCIDO).
      parcelaAlvo = cobranca.parcelas.find((p) =>
        PARCELA_STATUS_ELEGIVEIS_RECEBIMENTO.has(p.status),
      );
      if (!parcelaAlvo) {
        throw new BadRequestException('Não há parcela em aberto para receber');
      }
    }

    const saldoParcela =
      Number(parcelaAlvo.valor_previsto) - Number(parcelaAlvo.valor_recebido);
    if (dto.valor - saldoParcela > 0.01) {
      throw new BadRequestException(
        `Valor (R$ ${this.formatarMoeda(dto.valor)}) excede o saldo da parcela (R$ ${this.formatarMoeda(saldoParcela)})`,
      );
    }

    const novoValorRecebido = Number(parcelaAlvo.valor_recebido) + dto.valor;
    const liquidouParcela =
      Math.abs(novoValorRecebido - Number(parcelaAlvo.valor_previsto)) <= 0.01;
    const novoStatusParcela = liquidouParcela
      ? ParcelaStatus.LIQUIDADO
      : ParcelaStatus.PARCIAL_PAGO;

    await this.prisma.$transaction(async (tx) => {
      await tx.cobrancaRecebimento.create({
        data: {
          cobranca_id: cobrancaId,
          parcela_id: parcelaAlvo.id,
          valor: new Prisma.Decimal(dto.valor),
          data_recebimento: new Date(dto.data_recebimento),
          metodo: dto.metodo,
          observacoes: dto.observacoes ?? null,
          forcado: dto.forcado ?? false,
          usuario_id: usuarioId,
        },
      });

      await tx.cobrancaParcela.update({
        where: { id: parcelaAlvo.id },
        data: {
          valor_recebido: new Prisma.Decimal(novoValorRecebido),
          status: novoStatusParcela,
          liquidado_em: liquidouParcela ? new Date() : null,
        },
      });

      await tx.cobrancaLog.create({
        data: {
          cobranca_id: cobrancaId,
          tipo_acao: dto.forcado
            ? CobrancaLogAcao.FORCADA_LIQUIDACAO
            : CobrancaLogAcao.RECEBIMENTO_REGISTRADO,
          descricao: `Recebimento de R$ ${this.formatarMoeda(dto.valor)} via ${dto.metodo} na parcela ordem=${parcelaAlvo.ordem} (${parcelaAlvo.tipo}). ${dto.forcado ? '[FORÇADO]' : ''}`,
          status_anterior: parcelaAlvo.status,
          status_novo: novoStatusParcela,
          valor_movimentado: new Prisma.Decimal(dto.valor),
          usuario_id: usuarioId,
          ip_origem: contextoAuditoria.ip_origem ?? null,
          user_agent: contextoAuditoria.user_agent ?? null,
        },
      });
    });

    // Recalcula rollup da cobranca.
    await this.recalcularEPersistir(cobrancaId);

    if (
      liquidouParcela &&
      novoStatusParcela === ParcelaStatus.LIQUIDADO &&
      parcelaAlvo.tipo === ParcelaTipo.ENTRADA
    ) {
      try {
        const desbloqueio =
          await this.pcpBloqueioSinalService.processarEntradaLiquidadaCobranca(
            lojaId,
            cobrancaId,
          );
        if (desbloqueio.os_promovidas > 0) {
          this.logger.log(
            `${desbloqueio.os_promovidas} OS promovida(s) para aprovação técnica após liquidação da entrada — orçamento ${desbloqueio.orcamento_id}`,
          );
        }
        if (desbloqueio.itens_desbloqueados > 0) {
          this.logger.log(
            `PCP desbloqueado para ${desbloqueio.itens_desbloqueados} item(ns) após liquidação do sinal — orçamento ${desbloqueio.orcamento_id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Falha ao desbloquear PCP após liquidação do sinal da cobrança ${cobrancaId}:`,
          error,
        );
      }
    }

    return this.obterDetalhe(cobrancaId, lojaId);
  }

  // --------------------------------------------------------------------------
  // CANCELAMENTO
  // --------------------------------------------------------------------------

  async cancelar(
    cobrancaId: string,
    lojaId: string,
    motivo: string | null,
    usuarioId: string | null,
    contextoAuditoria: { ip_origem?: string; user_agent?: string } = {},
  ): Promise<CobrancaDetalhe> {
    const cobranca = await this.prisma.cobranca.findFirst({
      where: { id: cobrancaId, loja_id: lojaId },
      include: { parcelas: true },
    });
    if (!cobranca) throw new NotFoundException('Cobrança não encontrada');
    if (cobranca.status === CobrancaStatus.CANCELADA) {
      throw new BadRequestException('Cobrança já cancelada');
    }
    if (cobranca.status === CobrancaStatus.LIQUIDADO) {
      throw new BadRequestException(
        'Cobrança liquidada não pode ser cancelada. Estorne os recebimentos manualmente.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cobranca.update({
        where: { id: cobrancaId },
        data: {
          status: CobrancaStatus.CANCELADA,
          cancelado_em: new Date(),
          cancelado_por: usuarioId,
          motivo_cancelamento: motivo,
        },
      });
      // Marca todas as parcelas em aberto como CANCELADA.
      await tx.cobrancaParcela.updateMany({
        where: {
          cobranca_id: cobrancaId,
          status: {
            in: [
              ParcelaStatus.PREVISTO,
              ParcelaStatus.PARCIAL_PAGO,
              ParcelaStatus.VENCIDO,
            ],
          },
        },
        data: { status: ParcelaStatus.CANCELADA },
      });
      await tx.cobrancaLog.create({
        data: {
          cobranca_id: cobrancaId,
          tipo_acao: CobrancaLogAcao.CANCELADA,
          descricao: `Cobrança cancelada. Motivo: ${motivo ?? '(sem motivo informado)'}`,
          status_anterior: cobranca.status,
          status_novo: CobrancaStatus.CANCELADA,
          usuario_id: usuarioId,
          ip_origem: contextoAuditoria.ip_origem ?? null,
          user_agent: contextoAuditoria.user_agent ?? null,
        },
      });
    });

    return this.obterDetalhe(cobrancaId, lojaId);
  }

  // --------------------------------------------------------------------------
  // EXPORT CSV (Fase 6.D)
  // --------------------------------------------------------------------------

  /**
   * Gera CSV das cobrancas conforme os filtros aplicados na tela de auditoria.
   * Sem paginacao: o usuario que pediu o export quer "tudo o que ele esta vendo".
   * Limitado a 5000 linhas como guarda-corpo (evita estourar memoria).
   *
   * Colunas (ordem fixa, alinhada ao plano):
   * Cliente, Orcamento (numero), Titulo, Condicao de pagamento, Status,
   * Valor total, Valor recebido, Saldo, Aprovado em, Proxima parcela (data),
   * Proxima parcela (valor), Liquidado em, Cancelado em.
   */
  async exportarCsv(
    lojaId: string,
    filtros: {
      status?: string;
      cliente_id?: string;
      data_inicio?: Date;
      data_fim?: Date;
    },
  ): Promise<string> {
    const where: Prisma.CobrancaWhereInput = { loja_id: lojaId };
    if (filtros.status) where.status = filtros.status;
    if (filtros.cliente_id) where.cliente_id = filtros.cliente_id;
    if (filtros.data_inicio || filtros.data_fim) {
      where.data_aprovacao = {};
      if (filtros.data_inicio) where.data_aprovacao.gte = filtros.data_inicio;
      if (filtros.data_fim) where.data_aprovacao.lte = filtros.data_fim;
    }

    const rows = await this.prisma.cobranca.findMany({
      where,
      orderBy: { data_aprovacao: 'desc' },
      take: 5000,
      include: {
        orcamento: {
          select: {
            numero: true,
            titulo: true,
            ordens_servico: {
              select: { id: true, numero: true },
              orderBy: { criado_em: 'desc' },
            },
          },
        },
        cliente: { select: { nome: true } },
        parcelas: {
          where: {
            status: {
              in: [
                ParcelaStatus.PREVISTO,
                ParcelaStatus.PARCIAL_PAGO,
                ParcelaStatus.VENCIDO,
              ],
            },
          },
          orderBy: { ordem: 'asc' },
          take: 1,
        },
      },
    });

    const cabecalho = [
      'Cliente',
      'Orcamento',
      'Titulo',
      'Condicao de pagamento',
      'Status',
      'Valor total',
      'Valor recebido',
      'Saldo',
      'Aprovado em',
      'Proxima parcela (data)',
      'Proxima parcela (valor)',
      'Liquidado em',
      'Cancelado em',
    ];

    const linhas: string[][] = rows.map((row) => {
      const proxima = row.parcelas[0];
      return [
        row.cliente?.nome ?? '',
        row.orcamento.numero,
        row.orcamento.titulo ?? '',
        row.descricao,
        row.status,
        this.formatarMoeda(Number(row.valor_total)),
        this.formatarMoeda(Number(row.valor_recebido)),
        this.formatarMoeda(Number(row.valor_saldo)),
        this.formatarData(row.data_aprovacao),
        proxima ? this.formatarData(proxima.data_vencimento) : '',
        proxima ? this.formatarMoeda(Number(proxima.valor_previsto)) : '',
        row.liquidado_em ? this.formatarData(row.liquidado_em) : '',
        row.cancelado_em ? this.formatarData(row.cancelado_em) : '',
      ];
    });

    const bom = '\uFEFF'; // BOM para Excel reconhecer UTF-8.
    const csv =
      bom +
      [cabecalho, ...linhas]
        .map((linha) => linha.map((c) => this.escaparCampoCsv(c)).join(';'))
        .join('\r\n');
    return csv;
  }

  private escaparCampoCsv(valor: string): string {
    if (valor == null) return '';
    const precisaAspas = /[";\r\n]/.test(valor);
    const escapado = valor.replace(/"/g, '""');
    return precisaAspas ? `"${escapado}"` : escapado;
  }

  private formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatarData(data: Date): string {
    const d = data.getUTCDate().toString().padStart(2, '0');
    const m = (data.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = data.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }

  // --------------------------------------------------------------------------
  // RECALCULO PARA O JOB @Cron DA SUB-FASE 6.E
  // --------------------------------------------------------------------------

  /**
   * Varre todas as cobrancas em aberto da loja e recategoriza parcelas vencidas.
   * Usado pelo job diario que reaglutina status. Retorna a contagem afetada.
   */
  async recalcularVencimentosDaLoja(lojaId: string): Promise<{
    cobrancas_atualizadas: number;
    parcelas_vencidas: number;
  }> {
    const cobrancas = await this.prisma.cobranca.findMany({
      where: {
        loja_id: lojaId,
        status: {
          in: [
            CobrancaStatus.PREVISTA,
            CobrancaStatus.PARCIAL_PAGO,
            CobrancaStatus.VENCIDO,
          ],
        },
      },
      include: { parcelas: true },
    });

    let cobrancasAfetadas = 0;
    let parcelasVencidas = 0;
    const agora = new Date();

    for (const cobranca of cobrancas) {
      const parcelasParaRollup = cobranca.parcelas.map((p) => ({
        status: p.status,
        valor_previsto: Number(p.valor_previsto),
        valor_recebido: Number(p.valor_recebido),
        data_vencimento: p.data_vencimento,
      }));
      const parcelasAtualizadas = this.statusRollup.recategorizarVencidas(
        parcelasParaRollup,
        agora,
      );
      const novoStatus =
        this.statusRollup.calcularStatusCobranca(parcelasAtualizadas);

      const houveMudanca =
        novoStatus !== cobranca.status ||
        parcelasAtualizadas.some(
          (p, idx) => p.status !== cobranca.parcelas[idx].status,
        );

      if (houveMudanca) {
        await this.aplicarStatusRecalculado(
          cobranca.id,
          novoStatus,
          parcelasAtualizadas,
          cobranca.parcelas,
        );
        cobrancasAfetadas++;
        parcelasVencidas += parcelasAtualizadas.filter(
          (p, idx) =>
            p.status === ParcelaStatus.VENCIDO &&
            cobranca.parcelas[idx].status !== ParcelaStatus.VENCIDO,
        ).length;
      }
    }

    return {
      cobrancas_atualizadas: cobrancasAfetadas,
      parcelas_vencidas: parcelasVencidas,
    };
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private async aplicarStatusRecalculado(
    cobrancaId: string,
    novoStatusCobranca: string,
    parcelasAtualizadas: { status: string }[],
    parcelasOriginais: { id: string; status: string }[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < parcelasOriginais.length; i++) {
        const orig = parcelasOriginais[i];
        const novo = parcelasAtualizadas[i];
        if (orig.status !== novo.status) {
          await tx.cobrancaParcela.update({
            where: { id: orig.id },
            data: { status: novo.status },
          });
        }
      }
      const cobrancaAtual = await tx.cobranca.findUnique({
        where: { id: cobrancaId },
        select: { status: true },
      });
      if (cobrancaAtual && cobrancaAtual.status !== novoStatusCobranca) {
        await tx.cobranca.update({
          where: { id: cobrancaId },
          data: {
            status: novoStatusCobranca,
            liquidado_em:
              novoStatusCobranca === CobrancaStatus.LIQUIDADO
                ? new Date()
                : undefined,
          },
        });
        await tx.cobrancaLog.create({
          data: {
            cobranca_id: cobrancaId,
            tipo_acao:
              novoStatusCobranca === CobrancaStatus.VENCIDO
                ? CobrancaLogAcao.MARCADA_VENCIDA
                : novoStatusCobranca === CobrancaStatus.LIQUIDADO
                  ? CobrancaLogAcao.LIQUIDADA
                  : CobrancaLogAcao.EDITADA,
            descricao: `Status recalculado de ${cobrancaAtual.status} para ${novoStatusCobranca}`,
            status_anterior: cobrancaAtual.status,
            status_novo: novoStatusCobranca,
          },
        });
      }
    });
  }

  private async recalcularEPersistir(cobrancaId: string): Promise<void> {
    const cobranca = await this.prisma.cobranca.findUnique({
      where: { id: cobrancaId },
      include: { parcelas: true },
    });
    if (!cobranca) return;

    const parcelasParaRollup = cobranca.parcelas.map((p) => ({
      status: p.status,
      valor_previsto: Number(p.valor_previsto),
      valor_recebido: Number(p.valor_recebido),
      data_vencimento: p.data_vencimento,
    }));
    const parcelasAtualizadas =
      this.statusRollup.recategorizarVencidas(parcelasParaRollup);
    const novoStatus =
      this.statusRollup.calcularStatusCobranca(parcelasAtualizadas);
    const totais = this.statusRollup.calcularTotais(parcelasAtualizadas);

    await this.prisma.cobranca.update({
      where: { id: cobrancaId },
      data: {
        status: novoStatus,
        valor_total: new Prisma.Decimal(totais.valor_total),
        valor_recebido: new Prisma.Decimal(totais.valor_recebido),
        valor_saldo: new Prisma.Decimal(totais.valor_saldo),
        liquidado_em:
          novoStatus === CobrancaStatus.LIQUIDADO ? new Date() : undefined,
      },
    });
  }

  private resolverProximaParcelaAberta(
    parcelas: Prisma.CobrancaParcelaGetPayload<true>[],
  ): Prisma.CobrancaParcelaGetPayload<true> | undefined {
    const abertas = PARCELA_STATUS_ELEGIVEIS_RECEBIMENTO;
    return [...parcelas]
      .sort((a, b) => a.ordem - b.ordem)
      .find((parcela) => abertas.has(parcela.status));
  }

  private resolverProximaParcelaExibicao(
    parcelas: Prisma.CobrancaParcelaGetPayload<true>[],
  ): Prisma.CobrancaParcelaGetPayload<true> | undefined {
    return [...parcelas]
      .sort((a, b) => a.ordem - b.ordem)
      .find(
        (parcela) =>
          parcela.status !== ParcelaStatus.LIQUIDADO &&
          parcela.status !== ParcelaStatus.CANCELADA,
      );
  }

  private motivoBloqueioRecebimentoParcela(status: string): string {
    if (status === ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO) {
      return 'Saldo retido até aprovação do faturamento na aba Instalação da OS (relatório técnico).';
    }
    if (status === ParcelaStatus.A_FATURAR) {
      return 'Parcela liberada para faturamento, mas ainda não elegível para recebimento neste fluxo.';
    }
    return 'Não há parcela em aberto para receber neste momento.';
  }

  private mapearResumo(
    row: Prisma.CobrancaGetPayload<{
      include: {
        orcamento: {
          select: {
            numero: true;
            titulo: true;
            ordens_servico: { select: { id: true; numero: true } };
          };
        };
        cliente: { select: { nome: true } };
        parcelas: true;
        _count: { select: { parcelas: true } };
      };
    }>,
  ): CobrancaResumo {
    const proximaExibicao = this.resolverProximaParcelaExibicao(row.parcelas);
    const proximaRecebivel = this.resolverProximaParcelaAberta(row.parcelas);
    return {
      id: row.id,
      orcamento_id: row.orcamento_id,
      orcamento_numero: row.orcamento.numero,
      orcamento_titulo: row.orcamento.titulo ?? null,
      ordens_servico: row.orcamento.ordens_servico.map((os) => ({
        id: os.id,
        numero: os.numero,
      })),
      cliente_id: row.cliente_id,
      cliente_nome: row.cliente?.nome ?? null,
      tipo: row.tipo,
      descricao: row.descricao,
      status: row.status,
      valor_total: Number(row.valor_total),
      valor_recebido: Number(row.valor_recebido),
      valor_saldo: Number(row.valor_saldo),
      data_aprovacao: row.data_aprovacao.toISOString(),
      liquidado_em: row.liquidado_em?.toISOString() ?? null,
      cancelado_em: row.cancelado_em?.toISOString() ?? null,
      proxima_parcela: proximaExibicao
        ? this.mapearParcela(proximaExibicao)
        : null,
      proxima_parcela_recebivel: proximaRecebivel
        ? this.mapearParcela(proximaRecebivel)
        : null,
      pode_registrar_recebimento: Boolean(proximaRecebivel),
      motivo_bloqueio_recebimento:
        !proximaRecebivel && proximaExibicao
          ? this.motivoBloqueioRecebimentoParcela(proximaExibicao.status)
          : null,
      total_parcelas: row._count.parcelas,
      criado_em: row.criado_em.toISOString(),
    };
  }

  private mapearParcela(
    p: Prisma.CobrancaParcelaGetPayload<true>,
    statusOverride?: string,
  ): ParcelaResumo {
    return {
      id: p.id,
      ordem: p.ordem,
      tipo: p.tipo,
      valor_previsto: Number(p.valor_previsto),
      valor_recebido: Number(p.valor_recebido),
      data_vencimento: p.data_vencimento.toISOString(),
      status: statusOverride ?? p.status,
      liquidado_em: p.liquidado_em?.toISOString() ?? null,
    };
  }

  private mapearRecebimento(
    r: Prisma.CobrancaRecebimentoGetPayload<{
      include: { usuario: { select: { nome_completo: true } } };
    }>,
  ): RecebimentoResumo {
    return {
      id: r.id,
      parcela_id: r.parcela_id,
      valor: Number(r.valor),
      data_recebimento: r.data_recebimento.toISOString(),
      metodo: r.metodo,
      observacoes: r.observacoes,
      forcado: r.forcado,
      usuario_id: r.usuario_id,
      usuario_nome: r.usuario?.nome_completo ?? null,
      criado_em: r.criado_em.toISOString(),
    };
  }
}
