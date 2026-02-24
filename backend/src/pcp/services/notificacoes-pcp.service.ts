import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificacaoPCP {
  id: string;
  tipo:
    | 'ETAPA_ATRASADA'
    | 'ETAPA_CONCLUIDA'
    | 'WORKFLOW_PAUSADO'
    | 'APONTAMENTO_REFUGO'
    | 'SLA_CRITICO';
  os_id: string;
  etapa_instancia_id?: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  lida: boolean;
  data_criacao: Date;
  data_leitura?: Date;
  metadata?: Record<string, any>;
}

export interface TemplateNotificacao {
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  template_vars: string[];
}

@Injectable()
export class NotificacoesPCPService {
  private readonly logger = new Logger(NotificacoesPCPService.name);

  constructor(private prisma: PrismaService) {}

  // Templates de notificação multi-tenant
  private getTemplates(): Record<string, TemplateNotificacao> {
    return {
      ETAPA_ATRASADA: {
        tipo: 'ETAPA_ATRASADA',
        titulo: 'Etapa Atrasada - OS {numero}',
        mensagem:
          'A etapa "{etapa_nome}" da OS {numero} está atrasada há {dias_atraso} dias. Responsável: {responsavel_nome}',
        prioridade: 'ALTA',
        template_vars: [
          'numero',
          'etapa_nome',
          'dias_atraso',
          'responsavel_nome',
        ],
      },
      ETAPA_CONCLUIDA: {
        tipo: 'ETAPA_CONCLUIDA',
        titulo: 'Etapa Concluída - OS {numero}',
        mensagem:
          'A etapa "{etapa_nome}" da OS {numero} foi concluída por {responsavel_nome}',
        prioridade: 'MEDIA',
        template_vars: ['numero', 'etapa_nome', 'responsavel_nome'],
      },
      WORKFLOW_PAUSADO: {
        tipo: 'WORKFLOW_PAUSADO',
        titulo: 'Workflow Pausado - OS {numero}',
        mensagem: 'O workflow da OS {numero} foi pausado. Motivo: {motivo}',
        prioridade: 'ALTA',
        template_vars: ['numero', 'motivo'],
      },
      APONTAMENTO_REFUGO: {
        tipo: 'APONTAMENTO_REFUGO',
        titulo: 'Refugo Registrado - OS {numero}',
        mensagem:
          'Foi registrado refugo na OS {numero}: {quantidade_refugo} unidades. Observações: {observacoes}',
        prioridade: 'ALTA',
        template_vars: ['numero', 'quantidade_refugo', 'observacoes'],
      },
      SLA_CRITICO: {
        tipo: 'SLA_CRITICO',
        titulo: 'SLA Crítico - OS {numero}',
        mensagem:
          'A OS {numero} está com SLA crítico. Prazo: {data_prazo}, Dias restantes: {dias_restantes}',
        prioridade: 'CRITICA',
        template_vars: ['numero', 'data_prazo', 'dias_restantes'],
      },
    };
  }

  async criarNotificacao(
    tipo: string,
    osId: string,
    usuarioId: string,
    metadata: Record<string, any> = {},
    etapaInstanciaId?: string,
  ): Promise<NotificacaoPCP> {
    const template = this.getTemplates()[tipo];
    if (!template) {
      throw new Error(`Template de notificação não encontrado: ${tipo}`);
    }

    // Buscar dados da OS para preencher template
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      include: {
        cliente: true,
      },
    });

    if (!os) {
      throw new Error(`OS não encontrada: ${osId}`);
    }

    // Buscar dados da etapa se fornecida
    let etapa = null;
    if (etapaInstanciaId) {
      etapa = await this.prisma.etapaInstancia.findUnique({
        where: { id: etapaInstanciaId },
      });
    }

    // Preencher template com dados reais
    const titulo = this.preencherTemplate(template.titulo, {
      numero: os.numero,
      etapa_nome: etapa?.etapa_nome || 'N/A',
      ...metadata,
    });

    const mensagem = this.preencherTemplate(template.mensagem, {
      numero: os.numero,
      etapa_nome: etapa?.etapa_nome || 'N/A',
      responsavel_nome: metadata.responsavel_nome || 'Sistema',
      ...metadata,
    });

    // Criar notificação no banco (usando tabela existente)
    const notificacao = await this.prisma.notificacao.create({
      data: {
        tipo: template.tipo,
        titulo,
        mensagem,
        orcamento_id: null, // PCP não está vinculado a orçamento
        loja_id: 'default', // TODO: Pegar loja_id do contexto
        visualizada: false,
        dados_extras: JSON.stringify({
          os_id: osId,
          etapa_instancia_id: etapaInstanciaId,
          usuario_id: usuarioId,
          prioridade: template.prioridade,
          metadata: metadata,
        }),
      },
    });

    this.logger.log(`Notificação criada: ${tipo} para OS ${osId}`);

    const dadosExtras = notificacao.dados_extras
      ? JSON.parse(notificacao.dados_extras)
      : {};

    return {
      id: notificacao.id,
      tipo: notificacao.tipo as any,
      os_id: dadosExtras.os_id || '',
      etapa_instancia_id: dadosExtras.etapa_instancia_id,
      usuario_id: dadosExtras.usuario_id || '',
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      prioridade: dadosExtras.prioridade || 'MEDIA',
      lida: notificacao.visualizada,
      data_criacao: notificacao.criado_em,
      data_leitura: notificacao.visualizada ? notificacao.criado_em : undefined,
      metadata: dadosExtras.metadata,
    };
  }

  async marcarComoLida(
    notificacaoId: string,
    usuarioId: string,
  ): Promise<void> {
    await this.prisma.notificacao.update({
      where: {
        id: notificacaoId,
      },
      data: {
        visualizada: true,
      },
    });

    this.logger.log(
      `Notificação ${notificacaoId} marcada como lida pelo usuário ${usuarioId}`,
    );
  }

  async buscarNotificacoesPendentes(
    usuarioId: string,
  ): Promise<NotificacaoPCP[]> {
    const notificacoes = await this.prisma.notificacao.findMany({
      where: {
        visualizada: false,
        dados_extras: {
          contains: `"usuario_id":"${usuarioId}"`,
        },
      },
      orderBy: {
        criado_em: 'desc',
      },
      take: 50, // Limitar a 50 notificações
    });

    return notificacoes.map((notificacao) => {
      const dadosExtras = notificacao.dados_extras
        ? JSON.parse(notificacao.dados_extras)
        : {};

      return {
        id: notificacao.id,
        tipo: notificacao.tipo as any,
        os_id: dadosExtras.os_id || '',
        etapa_instancia_id: dadosExtras.etapa_instancia_id,
        usuario_id: dadosExtras.usuario_id || '',
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        prioridade: dadosExtras.prioridade || 'MEDIA',
        lida: notificacao.visualizada,
        data_criacao: notificacao.criado_em,
        data_leitura: notificacao.visualizada
          ? notificacao.criado_em
          : undefined,
        metadata: dadosExtras.metadata,
      };
    });
  }

  async verificarAtrasos(): Promise<void> {
    this.logger.log('Verificando etapas atrasadas...');

    // Buscar etapas que deveriam ter sido concluídas
    const etapasAtrasadas = await this.prisma.etapaInstancia.findMany({
      where: {
        status: 'EM_ANDAMENTO',
        data_fim: {
          lt: new Date(), // Data fim menor que hoje
        },
      },
      include: {
        workflow_instancia: {
          include: {
            os: true,
          },
        },
      },
    });

    for (const etapa of etapasAtrasadas) {
      const diasAtraso = Math.ceil(
        (Date.now() - etapa.data_fim.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.criarNotificacao(
        'ETAPA_ATRASADA',
        etapa.workflow_instancia.os_id,
        etapa.responsavel_id || 'sistema',
        {
          etapa_nome: etapa.etapa_nome,
          dias_atraso: diasAtraso,
          responsavel_nome: etapa.responsavel_id || 'Não definido',
        },
        etapa.id,
      );
    }

    this.logger.log(`${etapasAtrasadas.length} etapas atrasadas verificadas`);
  }

  async verificarSLACritico(): Promise<void> {
    this.logger.log('Verificando SLAs críticos...');

    // Buscar OS com prazo próximo (3 dias ou menos)
    const hoje = new Date();
    const prazoCritico = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000);

    const osCriticas = await this.prisma.ordemServico.findMany({
      where: {
        status: {
          in: ['FILA', 'PRODUCAO', 'ACABAMENTO'],
        },
        data_prazo: {
          lte: prazoCritico,
        },
      },
      include: {
        // TODO: Incluir relacionamento com responsável quando estiver disponível
      },
    });

    for (const os of osCriticas) {
      const diasRestantes = Math.ceil(
        (os.data_prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.criarNotificacao('SLA_CRITICO', os.id, os.responsavel_id, {
        data_prazo: os.data_prazo.toLocaleDateString('pt-BR'),
        dias_restantes: diasRestantes,
      });
    }

    this.logger.log(`${osCriticas.length} OS com SLA crítico verificadas`);
  }

  private preencherTemplate(
    template: string,
    dados: Record<string, any>,
  ): string {
    let resultado = template;

    for (const [chave, valor] of Object.entries(dados)) {
      const placeholder = `{${chave}}`;
      resultado = resultado.replace(
        new RegExp(placeholder, 'g'),
        String(valor || 'N/A'),
      );
    }

    return resultado;
  }

  // Webhook para notificar sistemas externos
  async enviarWebhook(tipo: string, dados: any): Promise<void> {
    // TODO: Implementar envio de webhook para sistemas externos
    // Ex: Slack, Teams, WhatsApp Business API, etc.

    this.logger.log(`Webhook enviado: ${tipo}`, dados);
  }
}
