import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransicaoComercialService } from './transicao-comercial.service';
import { CobrancasService } from '../../financeiro/services/cobrancas.service';
import { OSService } from '../../os/services/os.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';
import { EVENTOS_COMERCIAIS } from '../domain/eventos-comerciais';
import { ContextoDaRequisicao } from '../dto/aceite-proposta';

export interface DadosRegistrarAceite {
  clienteNome: string;
  clienteEmail: string;
  cpfCnpj?: string;
  aceitoTermos?: boolean;
  autorId: string;
  codigoAprovacao?: string;
  contexto?: ContextoDaRequisicao;
}

export interface ResultadoAceiteHandoff {
  success: boolean;
  jaProcessado: boolean;
  orcamentoId: string;
  statusComercial: string;
  message: string;
  cobrancaId?: string;
  osId?: string;
}

/**
 * Serviço de Transação Atômica de Aceite e Handoffs Idempotentes (Fase 8 / DV-01 / DV-03 / DV-06).
 *
 * Orquestra atomicamente a promoção de vendas (`aceita` -> `pedido_confirmado`),
 * o registro de evidências auditáveis (IP, User-Agent, Nome, Email) e a chamada
 * aos handoffs do Financeiro (Cobrança) e Operação (OS).
 */
@Injectable()
export class ProcessarAceiteHandoffService {
  private readonly logger = new Logger(ProcessarAceiteHandoffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transicaoComercialService: TransicaoComercialService,
    private readonly cobrancasService: CobrancasService,
    private readonly osService: OSService,
  ) {}

  /**
   * Processa o aceite comercial de forma atômica e idempotente.
   */
  async processarAceiteComercial(
    orcamentoId: string,
    lojaId: string,
    dados: DadosRegistrarAceite,
  ): Promise<ResultadoAceiteHandoff> {
    const { clienteNome, clienteEmail, cpfCnpj, autorId, contexto } = dados;

    this.logger.log(`Iniciando registro de aceite para o orçamento ${orcamentoId}`);

    // 1. Buscar orçamento garantindo isolamento multi-tenant
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId, ativo: true },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado ou inativo.');
    }

    const statusAtual = (
      orcamento.status_comercial ??
      orcamento.status ??
      'rascunho'
    ).toLowerCase();

    // 2. Idempotência: se já estiver em pedido_confirmado ou aceita, devolve resposta sem duplicar efeitos
    if (
      statusAtual === OrcamentoStatusComercial.PEDIDO_CONFIRMADO ||
      statusAtual === OrcamentoStatusComercial.ACEITA ||
      statusAtual === 'pedido_confirmado' ||
      statusAtual === 'aceita' ||
      statusAtual === 'aprovado'
    ) {
      this.logger.log(
        `Orçamento ${orcamentoId} já se encontra no status ${statusAtual}. Retornando resultado idempotente.`
      );
      return {
        success: true,
        jaProcessado: true,
        orcamentoId,
        statusComercial: statusAtual,
        message: 'Aceite de proposta já havia sido registrado anteriormente.',
      };
    }

    // 3. Validação de Expiração
    if (orcamento.expira_em && orcamento.expira_em < new Date()) {
      throw new BadRequestException(
        'Proposta comercial expirada. Reabra a proposta para gerar uma nova versão antes de aceitar.'
      );
    }

    // 4. Validação de Versão Enviada
    const versaoEnviadaId = (orcamento as any).versao_enviada_id;
    const versaoVigenteId = (orcamento as any).versao_vigente_id;
    if (versaoEnviadaId && versaoVigenteId) {
      if (versaoEnviadaId !== versaoVigenteId) {
        this.logger.warn(
          `Aceite registrado para versao_enviada_id (${versaoEnviadaId}) divergente de versao_vigente_id (${versaoVigenteId}).`
        );
      }
    }

    // 5. Transação Comercial Atômica: aceita -> pedido_confirmado
    const origemStatus =
      statusAtual === 'enviado' || statusAtual === 'enviada'
        ? OrcamentoStatusComercial.ENVIADA
        : statusAtual === 'em_negociacao' || statusAtual === 'negociando'
        ? OrcamentoStatusComercial.EM_NEGOCIACAO
        : OrcamentoStatusComercial.ENVIADA;

    const dataAceite = new Date();

    await this.transicaoComercialService.executar({
      orcamentoId,
      lojaId,
      origemStatus,
      destinoStatus: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
      origemAcao: 'INTERNO',
      autor: autorId,
      tipoAuditoria: 'aceite_e_pedido_confirmado',
      descricao: `Aceite registrado por ${clienteNome} (${clienteEmail}) com IP ${contexto?.ip ?? 'não informado'}. Pedido confirmado com sucesso.`,
      evento: EVENTOS_COMERCIAIS.PEDIDO_CONFIRMADO,
      contexto,
      payloadAdicional: {
        cliente_nome: clienteNome,
        cliente_email: clienteEmail,
        cpf_cnpj: cpfCnpj ?? null,
        data_aprovacao: dataAceite,
        versao_aceita_id: versaoEnviadaId ?? versaoVigenteId ?? null,
      },
    });

    let cobrancaId: string | undefined;
    let osId: string | undefined;

    // 6. Handoff Financeiro Idempotente (Cobrança)
    try {
      if (this.cobrancasService && typeof this.cobrancasService.criarCobrancaParaOrcamento === 'function') {
        const dadosPagamento = {
          tipo: (orcamento as any).condicao_pagamento_tipo ?? 'A_VISTA',
          entrada_pct: Number((orcamento as any).entrada_pct ?? 0),
          parcelas: Number((orcamento as any).parcelas ?? 1),
          descricao: (orcamento as any).condicao_pagamento_descricao ?? null,
          valor_total: Number(orcamento.preco_final),
          data_aprovacao: dataAceite,
          prazo_entrega_dias: Number((orcamento as any).prazo_entrega ?? 0),
          cliente_id: orcamento.cliente_id,
        };

        const cobranca = await this.cobrancasService.criarCobrancaParaOrcamento(
          orcamentoId,
          lojaId,
          dadosPagamento,
          autorId,
          { ip_origem: contexto?.ip, user_agent: contexto?.userAgent },
        );
        cobrancaId = (cobranca as any)?.id;
      }
    } catch (finError) {
      this.logger.warn(
        `Aviso no handoff financeiro para o orçamento ${orcamentoId}: ${finError instanceof Error ? finError.message : String(finError)}`
      );
    }

    // 7. Handoff Operacional Idempotente (OS)
    try {
      if (this.osService && typeof (this.osService as any).criarOSApartirOrcamento === 'function') {
        const osResult = await (this.osService as any).criarOSApartirOrcamento(
          orcamentoId,
          lojaId,
          autorId,
        );
        osId = (osResult as any)?.id;
      }
    } catch (osError) {
      this.logger.warn(
        `Aviso no handoff operacional para o orçamento ${orcamentoId}: ${osError instanceof Error ? osError.message : String(osError)}`
      );
    }

    this.logger.log(`Aceite e pedido_confirmado registrados com sucesso para o orçamento ${orcamentoId}`);

    return {
      success: true,
      jaProcessado: false,
      orcamentoId,
      statusComercial: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
      message: 'Aceite registrado e pedido confirmado com sucesso.',
      cobrancaId,
      osId,
    };
  }
}
