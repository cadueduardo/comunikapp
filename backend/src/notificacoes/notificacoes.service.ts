import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum TipoNotificacao {
  NOVA_MENSAGEM = 'NOVA_MENSAGEM',
  NOVA_MENSAGEM_ARTE = 'NOVA_MENSAGEM_ARTE',
  ORCAMENTO_APROVADO = 'ORCAMENTO_APROVADO',
  ORCAMENTO_REJEITADO = 'ORCAMENTO_REJEITADO',
  ORCAMENTO_NEGOCIANDO = 'ORCAMENTO_NEGOCIANDO',
  SISTEMA = 'SISTEMA',
}

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  orcamento_id?: string;
  loja_id: string;
  visualizada: boolean;
  criado_em: Date;
  dados_extras?: any;
}

@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async criarNotificacao(
    lojaId: string,
    tipo: TipoNotificacao,
    titulo: string,
    mensagem: string,
    orcamentoId?: string,
    dadosExtras?: any,
  ) {
    return this.prisma.notificacao.create({
      data: {
        tipo,
        titulo,
        mensagem,
        orcamento_id: orcamentoId,
        loja_id: lojaId,
        visualizada: false,
        dados_extras: dadosExtras ? JSON.stringify(dadosExtras) : null,
      },
    });
  }

  async notificarNovaMensagem(
    orcamentoId: string,
    lojaId: string,
    autorNome: string,
  ) {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      select: { numero: true, nome_servico: true },
    });

    if (!orcamento) return;

    return this.criarNotificacao(
      lojaId,
      TipoNotificacao.NOVA_MENSAGEM,
      'Nova mensagem no orçamento',
      `${autorNome} enviou uma mensagem no orçamento #${orcamento.numero}`,
      orcamentoId,
      { autor_nome: autorNome, numero_orcamento: orcamento.numero },
    );
  }

  async notificarAcaoCliente(
    orcamentoId: string,
    lojaId: string,
    acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR',
    observacoes?: string,
  ) {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      select: { numero: true, nome_servico: true },
    });

    if (!orcamento) return;

    let tipo: TipoNotificacao;
    let titulo: string;
    let mensagem: string;

    switch (acao) {
      case 'APROVAR':
        tipo = TipoNotificacao.ORCAMENTO_APROVADO;
        titulo = 'Orçamento Aprovado';
        mensagem = `O orçamento #${orcamento.numero} foi aprovado pelo cliente`;
        break;
      case 'REJEITAR':
        tipo = TipoNotificacao.ORCAMENTO_REJEITADO;
        titulo = 'Orçamento Rejeitado';
        mensagem = `O orçamento #${orcamento.numero} foi rejeitado pelo cliente`;
        break;
      case 'NEGOCIAR':
        tipo = TipoNotificacao.ORCAMENTO_NEGOCIANDO;
        titulo = 'Negociação Iniciada';
        mensagem = `O cliente iniciou uma negociação no orçamento #${orcamento.numero}`;
        break;
    }

    return this.criarNotificacao(lojaId, tipo, titulo, mensagem, orcamentoId, {
      acao,
      observacoes,
      numero_orcamento: orcamento.numero,
    });
  }

  async buscarNotificacoes(lojaId: string, limit = 50, offset = 0) {
    return this.prisma.notificacao.findMany({
      where: { loja_id: lojaId },
      orderBy: { criado_em: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async buscarNaoVisualizadas(lojaId: string) {
    return this.prisma.notificacao.findMany({
      where: {
        loja_id: lojaId,
        visualizada: false,
      },
      orderBy: { criado_em: 'desc' },
    });
  }

  async contarNaoVisualizadas(lojaId: string) {
    return this.prisma.notificacao.count({
      where: {
        loja_id: lojaId,
        visualizada: false,
      },
    });
  }

  async marcarComoVisualizada(notificacaoId: string, lojaId: string) {
    return this.prisma.notificacao.updateMany({
      where: {
        id: notificacaoId,
        loja_id: lojaId,
      },
      data: { visualizada: true },
    });
  }

  async marcarTodasComoVisualizadas(lojaId: string) {
    return this.prisma.notificacao.updateMany({
      where: {
        loja_id: lojaId,
        visualizada: false,
      },
      data: { visualizada: true },
    });
  }

  async deletarNotificacao(notificacaoId: string, lojaId: string) {
    return this.prisma.notificacao.deleteMany({
      where: {
        id: notificacaoId,
        loja_id: lojaId,
      },
    });
  }

  async notificarNovaMensagemArte(
    osId: string,
    lojaId: string,
    autorNome: string,
    produtoNome: string,
    versaoId?: string,
  ) {
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: osId },
      select: { numero: true, nome_servico: true },
    });

    if (!os) return;

    return this.criarNotificacao(
      lojaId,
      TipoNotificacao.NOVA_MENSAGEM_ARTE,
      'Nova mensagem na aprovação de arte',
      `${autorNome} enviou uma mensagem sobre ${produtoNome} na OS #${os.numero}`,
      null, // Não usar orcamento_id para arte
      {
        os_id: osId,
        produto_nome: produtoNome,
        versao_id: versaoId,
        autor_nome: autorNome,
        numero_os: os.numero,
      },
    );
  }
}
