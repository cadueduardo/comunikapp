import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter;

  async onModuleInit() {
    // Usar SMTP configurado quando SMTP_HOST ou MAIL_HOST estiver definido (produção)
    // Aceita SMTP_* ou MAIL_* (fallback para .env legado)
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
    if (host) {
      const port = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587');
      // Porta 465 = SSL direto (secure: true). Portas 587/25 = STARTTLS (secure: false)
      const secure = port === 465 || (process.env.SMTP_SECURE || process.env.MAIL_SECURE) === 'true';

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER || process.env.MAIL_USER,
          pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
        },
        // Evita "Greeting never received" em servidores lentos ou com conexão instável
        greetingTimeout: 10000,
        connectionTimeout: 10000,
        ...(process.env.MAIL_TLS_REJECT_UNAUTHORIZED === 'false' && {
          tls: { rejectUnauthorized: false },
        }),
      });
      console.log('📧 [MailService] Configurado SMTP:', host, 'porta', port, 'secure:', secure);
    } else {
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
      console.log('📧 [MailService] ETHEREAL EMAIL (desenvolvimento) - User:', testAccount.user);
    }
  }

  private getFromAddress(): string {
    return process.env.SMTP_FROM || process.env.MAIL_FROM || '"Comunikapp" <noreply@comunikapp.com>';
  }

  /** Verifica se está usando SMTP real (não Etheral) */
  private isSmtpConfigurado(): boolean {
    return !!(process.env.SMTP_HOST || process.env.MAIL_HOST);
  }

  async sendVerificationEmail(to: string, code: string) {
    const mailOptions = {
      from: this.getFromAddress(),
      to,
      subject: 'Seu Código de Verificação Comunikapp',
      html: `
        <h1>Bem-vindo ao Comunikapp!</h1>
        <p>Obrigado por se cadastrar. Use o código abaixo para verificar seu e-mail:</p>
        <h2><strong>${code}</strong></h2>
        <p>Este código expira em 15 minutos.</p>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    console.log('--- E-mail Sent ---');
    console.log('Message sent: %s', info.messageId);
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('Código de verificação para', to, ':', code);
    console.log('-------------------');

    return info;
  }

  async enviarOrcamentoCliente(
    emailCliente: string,
    nomeCliente: string,
    numeroOrcamento: string,
    nomeServico: string,
    precoFinal: number,
    codigoAprovacao: string,
    linkPublico: string,
  ) {
    const mailOptions = {
      from: this.getFromAddress(),
      to: emailCliente,
      subject: `Orçamento #${numeroOrcamento} - ${nomeServico}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Orçamento #${numeroOrcamento}</h1>
            <p style="color: #666; margin: 10px 0 0 0;">${nomeServico}</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333;">Olá, ${nomeCliente}!</h2>
            
            <p>Você recebeu um novo orçamento para avaliação:</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Detalhes do Orçamento</h3>
              <p><strong>Número:</strong> #${numeroOrcamento}</p>
              <p><strong>Serviço:</strong> ${nomeServico}</p>
              <p><strong>Valor Total:</strong> R$ ${precoFinal.toFixed(2).replace('.', ',')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkPublico}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visualizar Orçamento
              </a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">Código de Aprovação</h4>
              <p style="margin: 0; color: #856404;">
                Para aprovar este orçamento, use o código: <strong>${codigoAprovacao}</strong>
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Este link é válido por 30 dias. Após esse período, entre em contato conosco para uma nova avaliação.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
          </div>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    console.log('📧 E-MAIL DE ORÇAMENTO ENVIADO - Message ID:', info.messageId, '| Destinatário:', emailCliente);
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      console.log('📧 Preview (Etheral):', nodemailer.getTestMessageUrl(info));
    }

    return info;
  }

  /**
   * Notifica o cliente que o orçamento foi atualizado (alterações em itens, valores, etc.)
   */
  async enviarNotificacaoOrcamentoAtualizado(
    emailCliente: string,
    nomeCliente: string,
    numeroOrcamento: string,
    nomeServico: string,
    precoFinal: number,
    codigoAprovacao: string,
    linkPublico: string,
  ) {
    const mailOptions = {
      from: this.getFromAddress(),
      to: emailCliente,
      subject: `Orçamento #${numeroOrcamento} atualizado - ${nomeServico}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #e7f3ff; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">Orçamento #${numeroOrcamento} Atualizado</h1>
            <p style="color: #666; margin: 10px 0 0 0;">${nomeServico}</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333;">Olá, ${nomeCliente}!</h2>
            
            <p>O orçamento que você recebeu foi <strong>atualizado</strong>. Houve alterações que podem incluir itens, quantidades ou valores.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Resumo Atualizado</h3>
              <p><strong>Número:</strong> #${numeroOrcamento}</p>
              <p><strong>Serviço:</strong> ${nomeServico}</p>
              <p><strong>Valor Total:</strong> R$ ${precoFinal.toFixed(2).replace('.', ',')}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${linkPublico}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visualizar Orçamento Atualizado
              </a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #856404;">Código de Aprovação</h4>
              <p style="margin: 0; color: #856404;">
                Para aprovar este orçamento, use o código: <strong>${codigoAprovacao}</strong>
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Entre em contato conosco se tiver dúvidas sobre as alterações.
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
          </div>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    console.log(
      '📧 E-MAIL DE ORÇAMENTO ATUALIZADO ENVIADO - Message ID:',
      info.messageId,
      '| Destinatário:',
      emailCliente,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      console.log('📧 Preview (Etheral):', nodemailer.getTestMessageUrl(info));
    }

    return info;
  }

  async enviarNotificacaoAprovacao(
    emailLoja: string,
    numeroOrcamento: string,
    nomeCliente: string,
    precoFinal: number,
  ) {
    const mailOptions = {
      from: this.getFromAddress(),
      to: emailLoja,
      subject: `Orçamento #${numeroOrcamento} Aprovado!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #d4edda; padding: 20px; text-align: center;">
            <h1 style="color: #155724; margin: 0;">🎉 Orçamento Aprovado!</h1>
            <p style="color: #155724; margin: 10px 0 0 0;">#${numeroOrcamento}</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333;">Parabéns!</h2>
            
            <p>O cliente <strong>${nomeCliente}</strong> aprovou o orçamento #${numeroOrcamento}.</p>
            
            <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">Resumo da Aprovação</h3>
              <p><strong>Cliente:</strong> ${nomeCliente}</p>
              <p><strong>Orçamento:</strong> #${numeroOrcamento}</p>
              <p><strong>Valor Aprovado:</strong> R$ ${precoFinal.toFixed(2).replace('.', ',')}</p>
              <p><strong>Data da Aprovação:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            <p>Entre em contato com o cliente para definir os próximos passos do projeto.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #333;">Próximos Passos Sugeridos</h4>
              <ul style="margin: 0; color: #666;">
                <li>Entrar em contato com o cliente</li>
                <li>Definir cronograma de execução</li>
                <li>Estabelecer forma de pagamento</li>
                <li>Iniciar o projeto</li>
              </ul>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
          </div>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    console.log('📧 E-mail de Aprovação enviado - Message ID:', info.messageId, '| Destinatário:', emailLoja);
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      console.log('📧 Preview (Etheral):', nodemailer.getTestMessageUrl(info));
    }

    return info;
  }
}
