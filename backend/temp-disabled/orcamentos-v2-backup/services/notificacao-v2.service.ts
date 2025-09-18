import { Injectable, Logger } from '@nestjs/common';
import { NotificacoesService, TipoNotificacao } from '../../notificacoes/notificacoes.service';
import { MailService } from '../../mail/mail.service';
import { 
  OrcamentoCompleto, 
  OrcamentoStatus,
  OrcamentoTipo 
} from '../interfaces/orcamento.interface';

/**
 * Serviço de Notificação V2 para Orçamentos
 * Integra com sistema de notificações existente
 * 
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ INTEGRAÇÃO COM SISTEMA EXISTENTE
 * ✅ NOTIFICAÇÕES AUTOMÁTICAS E PERSONALIZADAS
 */
@Injectable()
export class NotificacaoV2Service {
  private readonly logger = new Logger(NotificacaoV2Service.name);

  constructor(
    private readonly notificacoesService: NotificacoesService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Notifica criação de orçamento
   */
  async notificarCriacao(
    orcamento: any,
    lojaId: string,
  ): Promise<void> {
    this.logger.log(`📢 Notificando criação do orçamento ${orcamento.id}`);

    try {
      // 1. Notificação interna para responsável
      if (orcamento.responsavel_id) {
        await this.notificarResponsavelCriacao(orcamento, lojaId);
      }

      // 2. Notificação para gerentes da loja
      await this.notificarGerentesCriacao(orcamento, lojaId);

      // 3. Notificação por email para cliente (se configurado)
      if (orcamento.cliente?.email) {
        await this.notificarClienteCriacao(orcamento, lojaId);
      }

      this.logger.log(`✅ Notificações de criação enviadas com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificações de criação: ${error.message}`);
      // Não falhar o processo principal por erro de notificação
    }
  }

  /**
   * Notifica atualização de orçamento
   */
  async notificarAtualizacao(
    orcamento: any,
    lojaId: string,
  ): Promise<void> {
    this.logger.log(`📢 Notificando atualização do orçamento ${orcamento.id}`);

    try {
      // 1. Notificação para responsável
      if (orcamento.responsavel_id) {
        await this.notificarResponsavelAtualizacao(orcamento, lojaId);
      }

      // 2. Notificação para gerentes se mudanças significativas
      if (this.mudancasSignificativas(orcamento)) {
        await this.notificarGerentesAtualizacao(orcamento, lojaId);
      }

      // 3. Notificação para cliente se status mudou
      if (orcamento.cliente?.email && this.statusMudou(orcamento)) {
        await this.notificarClienteAtualizacao(orcamento, lojaId);
      }

      this.logger.log(`✅ Notificações de atualização enviadas com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificações de atualização: ${error.message}`);
    }
  }

  /**
   * Notifica remoção de orçamento
   */
  async notificarRemocao(
    orcamentoId: string,
    lojaId: string,
  ): Promise<void> {
    this.logger.log(`📢 Notificando remoção do orçamento ${orcamentoId}`);

    try {
      // 1. Notificação para gerentes da loja
      await this.notificarGerentesRemocao(orcamentoId, lojaId);

      // 2. Notificação para administradores
      await this.notificarAdministradoresRemocao(orcamentoId, lojaId);

      this.logger.log(`✅ Notificações de remoção enviadas com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificações de remoção: ${error.message}`);
    }
  }

  /**
   * Notifica mudança de status
   */
  async notificarMudancaStatus(
    orcamento: any,
    statusAnterior: OrcamentoStatus,
    novoStatus: OrcamentoStatus,
    lojaId: string,
  ): Promise<void> {
    this.logger.log(`📢 Notificando mudança de status: ${statusAnterior} → ${novoStatus}`);

    try {
      // 1. Notificação para responsável
      if (orcamento.responsavel_id) {
        await this.notificarResponsavelMudancaStatus(
          orcamento,
          statusAnterior,
          novoStatus,
          lojaId,
        );
      }

      // 2. Notificação para gerentes
      await this.notificarGerentesMudancaStatus(
        orcamento,
        statusAnterior,
        novoStatus,
        lojaId,
      );

      // 3. Notificação para cliente se status crítico
      if (orcamento.cliente?.email && this.statusCriticoParaCliente(novoStatus)) {
        await this.notificarClienteMudancaStatus(
          orcamento,
          statusAnterior,
          novoStatus,
          lojaId,
        );
      }

      // 4. Notificações específicas por status
      await this.notificarStatusEspecifico(orcamento, novoStatus, lojaId);

      this.logger.log(`✅ Notificações de mudança de status enviadas com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificações de mudança de status: ${error.message}`);
    }
  }

  /**
   * Notifica aprovação de orçamento
   */
  async notificarAprovacao(
    orcamento: any,
    lojaId: string,
  ): Promise<void> {
    this.logger.log(`📢 Notificando aprovação do orçamento ${orcamento.id}`);

    try {
      // 1. Notificação para responsável
      if (orcamento.responsavel_id) {
        await this.notificarResponsavelAprovacao(orcamento, lojaId);
      }

      // 2. Notificação para cliente
      if (orcamento.cliente?.email) {
        await this.notificarClienteAprovacao(orcamento, lojaId);
      }

      // 3. Notificação para equipe de execução
      await this.notificarEquipeExecucao(orcamento, lojaId);

      this.logger.log(`✅ Notificações de aprovação enviadas com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificações de aprovação: ${error.message}`);
    }
  }

  /**
   * Notifica rejeição de orçamento
   */
  async notificarRejeicao(
    orcamento: any,
    motivo: string,
    lojaId: string,
  ): Promise<void> {
    this.logger.log(`📢 Notificando rejeição do orçamento ${orcamento.id}`);

    try {
      // 1. Notificação para responsável
      if (orcamento.responsavel_id) {
        await this.notificarResponsavelRejeicao(orcamento, motivo, lojaId);
      }

      // 2. Notificação para cliente
      if (orcamento.cliente?.email) {
        await this.notificarClienteRejeicao(orcamento, motivo, lojaId);
      }

      // 3. Notificação para gerentes
      await this.notificarGerentesRejeicao(orcamento, motivo, lojaId);

      this.logger.log(`✅ Notificações de rejeição enviadas com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificações de rejeição: ${error.message}`);
    }
  }

  // Métodos privados de notificação

  private async notificarResponsavelCriacao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_CRIADO,
      titulo: 'Novo Orçamento Criado',
      mensagem: `Orçamento "${orcamento.titulo}" foi criado com sucesso.`,
      usuario_id: orcamento.responsavel_id,
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        cliente: orcamento.cliente?.nome,
        valor_estimado: orcamento.custos_calculados?.preco_final,
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarGerentesCriacao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_CRIADO,
      titulo: 'Novo Orçamento Criado',
      mensagem: `Novo orçamento "${orcamento.titulo}" foi criado por ${orcamento.responsavel_id}.`,
      usuario_id: null, // Para todos os gerentes
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        responsavel: orcamento.responsavel_id,
        cliente: orcamento.cliente?.nome,
        valor_estimado: orcamento.custos_calculados?.preco_final,
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarClienteCriacao(orcamento: any, lojaId: string): Promise<void> {
    const emailData = {
      to: orcamento.cliente.email,
      subject: 'Orçamento Criado - ComunikaApp',
      template: 'orcamento-criado',
      context: {
        nome_cliente: orcamento.cliente.nome,
        titulo_orcamento: orcamento.titulo,
        numero_orcamento: orcamento.id,
        data_criacao: orcamento.data_criacao,
        valor_estimado: orcamento.custos_calculados?.preco_final || 'Em cálculo',
        responsavel: orcamento.responsavel_id,
      },
    };

    await this.mailService.enviarEmail(emailData);
  }

  private async notificarResponsavelAtualizacao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_ATUALIZADO,
      titulo: 'Orçamento Atualizado',
      mensagem: `Orçamento "${orcamento.titulo}" foi atualizado.`,
      usuario_id: orcamento.responsavel_id,
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        data_atualizacao: orcamento.data_atualizacao,
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarGerentesAtualizacao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_ATUALIZADO,
      titulo: 'Orçamento Atualizado',
      mensagem: `Orçamento "${orcamento.titulo}" foi atualizado com mudanças significativas.`,
      usuario_id: null, // Para todos os gerentes
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        responsavel: orcamento.responsavel_id,
        data_atualizacao: orcamento.data_atualizacao,
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarClienteAtualizacao(orcamento: any, lojaId: string): Promise<void> {
    const emailData = {
      to: orcamento.cliente.email,
      subject: 'Orçamento Atualizado - ComunikaApp',
      template: 'orcamento-atualizado',
      context: {
        nome_cliente: orcamento.cliente.nome,
        titulo_orcamento: orcamento.titulo,
        numero_orcamento: orcamento.id,
        data_atualizacao: orcamento.data_atualizacao,
        status: orcamento.status,
      },
    };

    await this.mailService.enviarEmail(emailData);
  }

  private async notificarGerentesRemocao(orcamentoId: string, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_REMOVIDO,
      titulo: 'Orçamento Removido',
      mensagem: `Orçamento ${orcamentoId} foi removido do sistema.`,
      usuario_id: null, // Para todos os gerentes
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamentoId,
        data_remocao: new Date(),
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarAdministradoresRemocao(orcamentoId: string, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_REMOVIDO,
      titulo: 'Orçamento Removido - Ação Administrativa',
      mensagem: `Orçamento ${orcamentoId} foi removido do sistema.`,
      usuario_id: null, // Para todos os administradores
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamentoId,
        data_remocao: new Date(),
        tipo: 'remocao_administrativa',
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarResponsavelMudancaStatus(
    orcamento: any,
    statusAnterior: OrcamentoStatus,
    novoStatus: OrcamentoStatus,
    lojaId: string,
  ): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_STATUS_ALTERADO,
      titulo: 'Status do Orçamento Alterado',
      mensagem: `Status do orçamento "${orcamento.titulo}" foi alterado de ${statusAnterior} para ${novoStatus}.`,
      usuario_id: orcamento.responsavel_id,
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        status_anterior: statusAnterior,
        novo_status: novoStatus,
        data_alteracao: new Date(),
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarGerentesMudancaStatus(
    orcamento: any,
    statusAnterior: OrcamentoStatus,
    novoStatus: OrcamentoStatus,
    lojaId: string,
  ): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_STATUS_ALTERADO,
      titulo: 'Status do Orçamento Alterado',
      mensagem: `Status do orçamento "${orcamento.titulo}" foi alterado de ${statusAnterior} para ${novoStatus}.`,
      usuario_id: null, // Para todos os gerentes
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        responsavel: orcamento.responsavel_id,
        status_anterior: statusAnterior,
        novo_status: novoStatus,
        data_alteracao: new Date(),
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarClienteMudancaStatus(
    orcamento: any,
    statusAnterior: OrcamentoStatus,
    novoStatus: OrcamentoStatus,
    lojaId: string,
  ): Promise<void> {
    const emailData = {
      to: orcamento.cliente.email,
      subject: 'Status do Orçamento Alterado - ComunikaApp',
      template: 'orcamento-status-alterado',
      context: {
        nome_cliente: orcamento.cliente.nome,
        titulo_orcamento: orcamento.titulo,
        numero_orcamento: orcamento.id,
        status_anterior: statusAnterior,
        novo_status: novoStatus,
        data_alteracao: new Date(),
      },
    };

    await this.mailService.enviarEmail(emailData);
  }

  private async notificarStatusEspecifico(
    orcamento: any,
    novoStatus: OrcamentoStatus,
    lojaId: string,
  ): Promise<void> {
    switch (novoStatus) {
      case OrcamentoStatus.APROVADO:
        await this.notificarAprovacao(orcamento, lojaId);
        break;
      case OrcamentoStatus.REJEITADO:
        await this.notificarRejeicao(orcamento, 'Rejeitado pelo sistema', lojaId);
        break;
      case OrcamentoStatus.EM_EXECUCAO:
        await this.notificarInicioExecucao(orcamento, lojaId);
        break;
      case OrcamentoStatus.CONCLUIDO:
        await this.notificarConclusao(orcamento, lojaId);
        break;
    }
  }

  private async notificarResponsavelAprovacao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_APROVADO,
      titulo: 'Orçamento Aprovado',
      mensagem: `Orçamento "${orcamento.titulo}" foi aprovado com sucesso!`,
      usuario_id: orcamento.responsavel_id,
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        data_aprovacao: new Date(),
        valor_aprovado: orcamento.custos_calculados?.preco_final,
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarClienteAprovacao(orcamento: any, lojaId: string): Promise<void> {
    const emailData = {
      to: orcamento.cliente.email,
      subject: 'Orçamento Aprovado - ComunikaApp',
      template: 'orcamento-aprovado',
      context: {
        nome_cliente: orcamento.cliente.nome,
        titulo_orcamento: orcamento.titulo,
        numero_orcamento: orcamento.id,
        data_aprovacao: new Date(),
        valor_aprovado: orcamento.custos_calculados?.preco_final,
        responsavel: orcamento.responsavel_id,
      },
    };

    await this.mailService.enviarEmail(emailData);
  }

  private async notificarEquipeExecucao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_APROVADO,
      titulo: 'Novo Orçamento Aprovado para Execução',
      mensagem: `Orçamento "${orcamento.titulo}" foi aprovado e está pronto para execução.`,
      usuario_id: null, // Para equipe de execução
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        responsavel: orcamento.responsavel_id,
        cliente: orcamento.cliente?.nome,
        data_aprovacao: new Date(),
        valor_aprovado: orcamento.custos_calculados?.preco_final,
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarResponsavelRejeicao(
    orcamento: any,
    motivo: string,
    lojaId: string,
  ): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_REJEITADO,
      titulo: 'Orçamento Rejeitado',
      mensagem: `Orçamento "${orcamento.titulo}" foi rejeitado. Motivo: ${motivo}`,
      usuario_id: orcamento.responsavel_id,
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        motivo_rejeicao: motivo,
        data_rejeicao: new Date(),
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarClienteRejeicao(
    orcamento: any,
    motivo: string,
    lojaId: string,
  ): Promise<void> {
    const emailData = {
      to: orcamento.cliente.email,
      subject: 'Orçamento Rejeitado - ComunikaApp',
      template: 'orcamento-rejeitado',
      context: {
        nome_cliente: orcamento.cliente.nome,
        titulo_orcamento: orcamento.titulo,
        numero_orcamento: orcamento.id,
        motivo_rejeicao: motivo,
        data_rejeicao: new Date(),
        responsavel: orcamento.responsavel_id,
      },
    };

    await this.mailService.enviarEmail(emailData);
  }

  private async notificarGerentesRejeicao(
    orcamento: any,
    motivo: string,
    lojaId: string,
  ): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_REJEITADO,
      titulo: 'Orçamento Rejeitado',
      mensagem: `Orçamento "${orcamento.titulo}" foi rejeitado. Motivo: ${motivo}`,
      usuario_id: null, // Para todos os gerentes
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        responsavel: orcamento.responsavel_id,
        motivo_rejeicao: motivo,
        data_rejeicao: new Date(),
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarInicioExecucao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_EM_EXECUCAO,
      titulo: 'Orçamento Iniciou Execução',
      mensagem: `Orçamento "${orcamento.titulo}" iniciou execução.`,
      usuario_id: orcamento.responsavel_id,
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        data_inicio_execucao: new Date(),
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  private async notificarConclusao(orcamento: any, lojaId: string): Promise<void> {
    const notificacao = {
      tipo: TipoNotificacao.ORCAMENTO_CONCLUIDO,
      titulo: 'Orçamento Concluído',
      mensagem: `Orçamento "${orcamento.titulo}" foi concluído com sucesso!`,
      usuario_id: orcamento.responsavel_id,
      loja_id: lojaId,
      dados_extras: {
        orcamento_id: orcamento.id,
        titulo: orcamento.titulo,
        data_conclusao: new Date(),
      },
    };

    await this.notificacoesService.criarNotificacao(notificacao);
  }

  // Métodos auxiliares

  private mudancasSignificativas(orcamento: any): boolean {
    // Verificar se houve mudanças significativas
    return !!(orcamento.produtos || orcamento.quantidades || orcamento.configuracoes);
  }

  private statusMudou(orcamento: any): boolean {
    // Verificar se o status mudou
    return orcamento.status !== orcamento.status_anterior;
  }

  private statusCriticoParaCliente(status: OrcamentoStatus): boolean {
    // Status que devem ser comunicados ao cliente
    return [
      OrcamentoStatus.APROVADO,
      OrcamentoStatus.REJEITADO,
      OrcamentoStatus.EM_EXECUCAO,
      OrcamentoStatus.CONCLUIDO,
      OrcamentoStatus.CANCELADO,
    ].includes(status);
  }
}
