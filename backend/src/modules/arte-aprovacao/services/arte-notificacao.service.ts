import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export interface NotificacaoEmailDto {
  destinatarios: string[];
  assunto: string;
  template: string;
  dados: Record<string, any>;
}

export interface NotificacaoArteDto {
  tipo:
    | 'NOVA_VERSAO'
    | 'APROVACAO_SOLICITADA'
    | 'ARTE_APROVADA'
    | 'ARTE_REJEITADA'
    | 'COMENTARIO_ADICIONADO'
    | 'NOVA_MENSAGEM_CLIENTE'
    | 'NOVA_MENSAGEM_EQUIPE';
  os_id: string;
  versao_id?: string;
  destinatarios: string[];
  dados: Record<string, any>;
}

@Injectable()
export class ArteNotificacaoService implements OnModuleInit {
  private readonly logger = new Logger(ArteNotificacaoService.name);
  private transporter: nodemailer.Transporter;
  private modoEthereal = false;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.MAIL_USER;
    const useEthereal =
      process.env.ARTE_USE_ETHEREAL === 'true' ||
      !host ||
      host.includes('ethereal.email') ||
      (process.env.NODE_ENV !== 'production' && !smtpUser);

    if (!useEthereal && host) {
      const port = parseInt(
        process.env.SMTP_PORT || process.env.MAIL_PORT || '587',
        10,
      );
      const secure =
        port === 465 ||
        (process.env.SMTP_SECURE || process.env.MAIL_SECURE) === 'true';

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER || process.env.MAIL_USER,
          pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
        },
        greetingTimeout: 10000,
        connectionTimeout: 10000,
      });
      this.logger.log(`SMTP arte configurado: ${host}:${port}`);
      return;
    }

    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    this.modoEthereal = true;
    this.logger.warn(
      `E-mail arte em modo Ethereal (preview no console). Conta: ${testAccount.user}`,
    );
  }

  /**
   * Envia notificação de nova versão criada
   */
  async notificarNovaVersao(dto: NotificacaoArteDto) {
    const { versao_id, destinatarios, dados } = dto;

    // Buscar dados da versão
    const versao = await this.prisma.arteVersao.findUnique({
      where: { id: versao_id },
      include: {
        os: {
          include: {
            cliente: true,
          },
        },
        autor: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada');
    }

    const assunto = `Nova versão de arte - OS #${versao.os.numero}`;
    const template = 'nova-versao';

    await this.enviarEmail({
      destinatarios,
      assunto,
      template,
      dados: {
        ...dados,
        versao: versao.versao,
        os_numero: versao.os.numero,
        cliente_nome: versao.os.cliente.nome,
        autor_nome: versao.autor.nome,
        data_criacao: versao.data_criacao,
        descricao: versao.descricao,
      },
    });
  }

  /**
   * Envia notificação de solicitação de aprovação
   */
  async notificarAprovacaoSolicitada(
    dto: NotificacaoArteDto,
  ): Promise<{ previewUrl?: string }> {
    const { versao_id, destinatarios, dados } = dto;

    if (!versao_id) {
      throw new Error('versao_id é obrigatório');
    }

    const versao = await this.prisma.arteVersao.findUnique({
      where: { id: versao_id },
      include: {
        os: {
          include: {
            cliente: true,
          },
        },
        autor: {
          select: {
            nome: true,
            nome_completo: true,
            email: true,
          },
        },
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada');
    }

    const link = await this.resolverLinkAprovacaoParaEmail(versao_id, dados?.link_id);
    if (!link) {
      throw new Error(
        'Link de aprovação não encontrado. Envie a arte ao cliente antes de reenviar o e-mail.',
      );
    }

    const destinatariosFinais =
      destinatarios?.filter((email) => Boolean(email?.trim())).length > 0
        ? destinatarios
        : versao.os.cliente?.email
          ? [versao.os.cliente.email]
          : [];

    if (destinatariosFinais.length === 0) {
      throw new Error('E-mail do cliente não encontrado na OS');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const assunto = `Aprovação de arte solicitada - OS #${versao.os.numero}`;
    const template = 'aprovacao-solicitada';
    const autorNome =
      versao.autor?.nome_completo || versao.autor?.nome || 'Equipe';

    return this.enviarEmail({
      destinatarios: destinatariosFinais,
      assunto,
      template,
      dados: {
        ...dados,
        versao: versao.versao,
        os_numero: versao.os.numero,
        cliente_nome: versao.os.cliente?.nome || 'Cliente',
        autor_nome: autorNome,
        link_aprovacao: `${frontendUrl}/arte/aprovacao/${link.token_publico}`,
        expira_em: link.expira_em,
      },
    });
  }

  private async resolverLinkAprovacaoParaEmail(
    versaoId: string,
    linkId?: string,
  ) {
    if (linkId) {
      const linkPorId = await this.prisma.arteLinkAprovacao.findFirst({
        where: {
          id: linkId,
          versao_id: versaoId,
        },
      });
      if (linkPorId) return linkPorId;
    }

    const linkAtivo = await this.prisma.arteLinkAprovacao.findFirst({
      where: {
        versao_id: versaoId,
        ativo: true,
        expira_em: { gt: new Date() },
      },
      orderBy: { expira_em: 'desc' },
    });
    if (linkAtivo) return linkAtivo;

    return this.prisma.arteLinkAprovacao.findFirst({
      where: { versao_id: versaoId },
      orderBy: { expira_em: 'desc' },
    });
  }

  /**
   * Envia notificação de arte aprovada
   */
  async notificarArteAprovada(dto: NotificacaoArteDto) {
    const { versao_id, destinatarios, dados } = dto;

    // Buscar dados da versão
    const versao = await this.prisma.arteVersao.findUnique({
      where: { id: versao_id },
      include: {
        os: {
          include: {
            cliente: true,
          },
        },
        autor: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada');
    }

    const assunto = `Arte aprovada - OS #${versao.os.numero}`;
    const template = 'arte-aprovada';

    await this.enviarEmail({
      destinatarios,
      assunto,
      template,
      dados: {
        ...dados,
        versao: versao.versao,
        os_numero: versao.os.numero,
        cliente_nome: versao.os.cliente.nome,
        autor_nome: versao.autor.nome,
        data_aprovacao: versao.data_aprovacao,
      },
    });
  }

  /**
   * Envia notificação de arte rejeitada
   */
  async notificarArteRejeitada(dto: NotificacaoArteDto) {
    const { versao_id, destinatarios, dados } = dto;

    // Buscar dados da versão
    const versao = await this.prisma.arteVersao.findUnique({
      where: { id: versao_id },
      include: {
        os: {
          include: {
            cliente: true,
          },
        },
        autor: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada');
    }

    const assunto = `Alterações solicitadas - OS #${versao.os.numero}`;
    const template = 'arte-rejeitada';

    await this.enviarEmail({
      destinatarios,
      assunto,
      template,
      dados: {
        ...dados,
        versao: versao.versao,
        os_numero: versao.os.numero,
        cliente_nome: versao.os.cliente.nome,
        autor_nome: versao.autor.nome,
        comentario_cliente: dados.comentario_cliente,
      },
    });
  }

  /**
   * Envia notificação de novo comentário
   */
  async notificarComentarioAdicionado(dto: NotificacaoArteDto) {
    const { versao_id, destinatarios, dados } = dto;

    // Buscar dados da versão
    const versao = await this.prisma.arteVersao.findUnique({
      where: { id: versao_id },
      include: {
        os: {
          include: {
            cliente: true,
          },
        },
        autor: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada');
    }

    const assunto = `Novo comentário - OS #${versao.os.numero}`;
    const template = 'comentario-adicionado';

    await this.enviarEmail({
      destinatarios,
      assunto,
      template,
      dados: {
        ...dados,
        versao: versao.versao,
        os_numero: versao.os.numero,
        cliente_nome: versao.os.cliente.nome,
        autor_nome: versao.autor.nome,
        comentario: dados.comentario,
        comentario_autor: dados.comentario_autor,
      },
    });
  }

  /**
   * Envia email usando template
   */
  private async enviarEmail(
    dto: NotificacaoEmailDto,
  ): Promise<{ previewUrl?: string }> {
    const { destinatarios, assunto, template, dados } = dto;

    if (!this.transporter) {
      throw new Error('Serviço de e-mail não inicializado');
    }

    const html = this.gerarTemplateHTML(template, dados);

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.MAIL_FROM || 'noreply@comunikapp.com',
        to: destinatarios.join(', '),
        subject: assunto,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      if (this.modoEthereal && previewUrl) {
        this.logger.log(`📧 Preview Ethereal (arte): ${previewUrl}`);
      } else {
        this.logger.log(`📧 Email arte enviado: ${info.messageId}`);
      }
      return { previewUrl };
    } catch (error) {
      this.logger.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }

  /**
   * Gera HTML do template de email
   */
  private stripHtmlParaEmail(html: string): string {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private gerarTemplateHTML(
    template: string,
    dados: Record<string, any>,
  ): string {
    const baseStyles = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb; }
      </style>
    `;

    switch (template) {
      case 'nova-versao':
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎨 Nova Versão de Arte</h1>
              </div>
              <div class="content">
                <h2>Olá ${dados.cliente_nome}!</h2>
                <p>Uma nova versão de arte foi criada para sua Ordem de Serviço:</p>
                
                <div class="info-box">
                  <h3>📋 Detalhes da Versão</h3>
                  <p><strong>OS:</strong> #${dados.os_numero}</p>
                  <p><strong>Versão:</strong> ${dados.versao}</p>
                  <p><strong>Criado por:</strong> ${dados.autor_nome}</p>
                  <p><strong>Data:</strong> ${new Date(dados.data_criacao).toLocaleDateString('pt-BR')}</p>
                  ${dados.descricao ? `<p><strong>Descrição:</strong> ${dados.descricao}</p>` : ''}
                </div>

                <p>A versão está aguardando revisão. Em breve você receberá um link para aprovação.</p>
                
                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

      case 'aprovacao-solicitada':
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Aprovação de Arte Solicitada</h1>
              </div>
              <div class="content">
                <h2>Olá ${dados.cliente_nome}!</h2>
                <p>Uma arte está aguardando sua aprovação:</p>
                
                <div class="info-box">
                  <h3>📋 Detalhes da Arte</h3>
                  <p><strong>OS:</strong> #${dados.os_numero}</p>
                  <p><strong>Versão:</strong> ${dados.versao}</p>
                  <p><strong>Designer:</strong> ${dados.autor_nome}</p>
                  <p><strong>Expira em:</strong> ${new Date(dados.expira_em).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style="text-align: center;">
                  <a href="${dados.link_aprovacao}" class="button">🎨 Aprovar Arte</a>
                </div>

                <p><strong>⚠️ Importante:</strong> Este link expira em ${new Date(dados.expira_em).toLocaleDateString('pt-BR')}. Aprove para não atrasar seu projeto!</p>
                
                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

      case 'arte-aprovada':
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: #059669;">
                <h1>🎉 Arte Aprovada!</h1>
              </div>
              <div class="content">
                <h2>Parabéns ${dados.autor_nome}!</h2>
                <p>Sua arte foi aprovada pelo cliente:</p>
                
                <div class="info-box">
                  <h3>📋 Detalhes da Aprovação</h3>
                  <p><strong>OS:</strong> #${dados.os_numero}</p>
                  <p><strong>Versão:</strong> ${dados.versao}</p>
                  <p><strong>Cliente:</strong> ${dados.cliente_nome}</p>
                  <p><strong>Data da Aprovação:</strong> ${new Date(dados.data_aprovacao).toLocaleDateString('pt-BR')}</p>
                </div>

                <p>✅ A arte pode prosseguir para a próxima etapa do processo!</p>
                
                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

      case 'arte-rejeitada':
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: #dc2626;">
                <h1>📝 Alterações Solicitadas</h1>
              </div>
              <div class="content">
                <h2>Olá ${dados.autor_nome}!</h2>
                <p>O cliente solicitou alterações na arte:</p>
                
                <div class="info-box">
                  <h3>📋 Detalhes da Solicitação</h3>
                  <p><strong>OS:</strong> #${dados.os_numero}</p>
                  <p><strong>Versão:</strong> ${dados.versao}</p>
                  <p><strong>Cliente:</strong> ${dados.cliente_nome}</p>
                  <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                ${
                  dados.comentario_cliente
                    ? `
                  <div class="info-box" style="border-left-color: #dc2626;">
                    <h3>💬 Comentário do Cliente</h3>
                    <p>"${dados.comentario_cliente}"</p>
                  </div>
                `
                    : ''
                }

                <p>🔄 Por favor, revise os comentários e crie uma nova versão da arte.</p>
                
                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

      case 'comentario-adicionado':
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: #7c3aed;">
                <h1>💬 Novo Comentário</h1>
              </div>
              <div class="content">
                <h2>Olá!</h2>
                <p>Um novo comentário foi adicionado à arte:</p>
                
                <div class="info-box">
                  <h3>📋 Detalhes</h3>
                  <p><strong>OS:</strong> #${dados.os_numero}</p>
                  <p><strong>Versão:</strong> ${dados.versao}</p>
                  <p><strong>Autor do Comentário:</strong> ${dados.comentario_autor}</p>
                  <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div class="info-box" style="border-left-color: #7c3aed;">
                  <h3>💬 Comentário</h3>
                  <p>"${dados.comentario}"</p>
                </div>

                <p>📱 Acesse o sistema para ver todos os comentários e responder.</p>
                
                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

      case 'nova-mensagem-cliente':
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💬 Nova mensagem da equipe</h1>
              </div>
              <div class="content">
                <h2>Olá ${dados.cliente_nome}!</h2>
                <p>A equipe enviou uma nova mensagem sobre sua arte:</p>

                <div class="info-box">
                  <h3>📋 Detalhes</h3>
                  <p><strong>OS:</strong> #${dados.os_numero}</p>
                  <p><strong>Enviado por:</strong> ${dados.autor_nome || 'Equipe'}</p>
                  <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div class="info-box" style="border-left-color: #2563eb;">
                  <h3>💬 Mensagem</h3>
                  <p style="white-space: pre-wrap;">${dados.mensagem_texto || ''}</p>
                </div>

                ${
                  dados.link_aprovacao
                    ? `
                <div style="text-align: center;">
                  <a href="${dados.link_aprovacao}" class="button">Ver conversa e responder</a>
                </div>
                `
                    : ''
                }

                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

      case 'nova-mensagem-equipe':
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: #7c3aed;">
                <h1>💬 Nova mensagem do cliente</h1>
              </div>
              <div class="content">
                <h2>Olá!</h2>
                <p>O cliente enviou uma nova mensagem no chat de arte:</p>

                <div class="info-box">
                  <h3>📋 Detalhes</h3>
                  <p><strong>OS:</strong> #${dados.os_numero}</p>
                  <p><strong>Cliente:</strong> ${dados.cliente_nome}</p>
                  <p><strong>Enviado por:</strong> ${dados.autor_nome || dados.cliente_nome}</p>
                  <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div class="info-box" style="border-left-color: #7c3aed;">
                  <h3>💬 Mensagem</h3>
                  <p style="white-space: pre-wrap;">${dados.mensagem_texto || ''}</p>
                </div>

                ${
                  dados.link_os
                    ? `
                <div style="text-align: center;">
                  <a href="${dados.link_os}" class="button">Abrir chat no sistema</a>
                </div>
                `
                    : ''
                }

                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

      default:
        return `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📧 Notificação</h1>
              </div>
              <div class="content">
                <p>Você recebeu uma notificação do sistema Comunikapp.</p>
                <div class="footer">
                  <p>Este é um email automático do sistema Comunikapp.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
    }
  }

  /**
   * Testa a conexão SMTP
   */
  async testarConexaoSMTP(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Conexão SMTP verificada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão SMTP:', error);
      return false;
    }
  }

  /**
   * Envia email de teste
   */
  async enviarEmailTeste(destinatario: string): Promise<boolean> {
    try {
      await this.enviarEmail({
        destinatarios: [destinatario],
        assunto: 'Teste - Sistema de Notificações Comunikapp',
        template: 'teste',
        dados: {
          data_teste: new Date().toLocaleDateString('pt-BR'),
        },
      });
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de teste:', error);
      return false;
    }
  }

  /**
   * Envia notificação de nova mensagem para cliente
   */
  async notificarNovaMensagemCliente(dto: NotificacaoArteDto) {
    const { os_id, versao_id, destinatarios, dados } = dto;

    // Buscar dados da OS
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: os_id },
      include: {
        cliente: true,
      },
    });

    if (!os) {
      throw new Error('OS não encontrada');
    }

    const link = await this.prisma.arteLinkAprovacao.findFirst({
      where: {
        versao: { os_id },
      },
      orderBy: { expira_em: 'desc' },
    });

    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const linkAprovacao = link
      ? `${frontendUrl}/arte/aprovacao/${link.token_publico}`
      : `${frontendUrl}/arte/aprovacao`;

    const mensagemTexto = this.stripHtmlParaEmail(String(dados.mensagem || ''));

    const assunto = `Nova mensagem - OS #${os.numero}`;
    const template = 'nova-mensagem-cliente';

    await this.enviarEmail({
      destinatarios,
      assunto,
      template,
      dados: {
        ...dados,
        os_numero: os.numero,
        cliente_nome: os.cliente.nome,
        mensagem_texto: this.escapeHtml(mensagemTexto),
        link_aprovacao: linkAprovacao,
      },
    });
  }

  /**
   * Envia notificação de nova mensagem para equipe
   */
  async notificarNovaMensagemEquipe(dto: NotificacaoArteDto) {
    const { os_id, destinatarios, dados } = dto;

    // Buscar dados da OS
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: os_id },
      include: {
        cliente: true,
      },
    });

    if (!os) {
      throw new Error('OS não encontrada');
    }

    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const mensagemTexto = this.stripHtmlParaEmail(String(dados.mensagem || ''));

    const assunto = `Nova mensagem do cliente - OS #${os.numero}`;
    const template = 'nova-mensagem-equipe';

    await this.enviarEmail({
      destinatarios,
      assunto,
      template,
      dados: {
        ...dados,
        os_numero: os.numero,
        cliente_nome: os.cliente.nome,
        mensagem_texto: this.escapeHtml(mensagemTexto),
        link_os: `${frontendUrl}/arte`,
      },
    });
  }
}
