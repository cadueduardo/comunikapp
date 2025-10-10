import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export interface NotificacaoEmailDto {
  destinatarios: string[];
  assunto: string;
  template: string;
  dados: Record<string, any>;
}

export interface NotificacaoArteDto {
  tipo: 'NOVA_VERSAO' | 'APROVACAO_SOLICITADA' | 'ARTE_APROVADA' | 'ARTE_REJEITADA' | 'COMENTARIO_ADICIONADO';
  os_id: string;
  versao_id: string;
  destinatarios: string[];
  dados: Record<string, any>;
}

@Injectable()
export class ArteNotificacaoService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
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
  async notificarAprovacaoSolicitada(dto: NotificacaoArteDto) {
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
        links_aprovacao: {
          where: {
            ativo: true,
            expira_em: {
              gt: new Date(),
            },
          },
          orderBy: {
            data_aprovacao: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!versao) {
      throw new Error('Versão não encontrada');
    }

    const link = versao.links_aprovacao[0];
    if (!link) {
      throw new Error('Link de aprovação não encontrado');
    }

    const assunto = `Aprovação de arte solicitada - OS #${versao.os.numero}`;
    const template = 'aprovacao-solicitada';

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
        link_aprovacao: `${process.env.FRONTEND_URL}/arte/aprovacao/${link.token_publico}`,
        expira_em: link.expira_em,
      },
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
  private async enviarEmail(dto: NotificacaoEmailDto) {
    const { destinatarios, assunto, template, dados } = dto;

    const html = this.gerarTemplateHTML(template, dados);

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@comunikapp.com',
        to: destinatarios.join(', '),
        subject: assunto,
        html,
      });

      console.log('📧 Email enviado:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw error;
    }
  }

  /**
   * Gera HTML do template de email
   */
  private gerarTemplateHTML(template: string, dados: Record<string, any>): string {
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

                ${dados.comentario_cliente ? `
                  <div class="info-box" style="border-left-color: #dc2626;">
                    <h3>💬 Comentário do Cliente</h3>
                    <p>"${dados.comentario_cliente}"</p>
                  </div>
                ` : ''}

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
}
