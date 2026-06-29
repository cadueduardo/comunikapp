import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { getPlatformAdminEmails } from '../platform/platform-admin.guard';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
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
      this.logger.log(
        `SMTP configurado: ${host}:${port} (secure=${secure})`,
      );
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
      this.logger.warn(
        `E-mail em modo teste (Ethereal); entrega real desativada. Conta: ${testAccount.user}`,
      );
    }
  }

  private getFromAddress(): string {
    // Preferência: SMTP_FROM ou MAIL_FROM explicitamente definidos no .env.
    // Fallback: usar o próprio MAIL_USER autenticado, porque muitos provedores
    // (Hostinger, Gmail, SES, etc.) rejeitam o envio quando o From não pertence
    // à conta autenticada.
    const explicit = process.env.SMTP_FROM || process.env.MAIL_FROM;
    if (explicit) return explicit;
    const authUser = process.env.SMTP_USER || process.env.MAIL_USER;
    if (authUser) return `"ComunikApp" <${authUser}>`;
    return '"ComunikApp" <naoresponder@comunikapp.com.br>';
  }

  /** Verifica se está usando SMTP real (não Etheral) */
  private isSmtpConfigurado(): boolean {
    return !!(process.env.SMTP_HOST || process.env.MAIL_HOST);
  }

  async sendVerificationEmail(
    to: string,
    code: string,
    options?: {
      mode?: 'cadastro' | 'convite';
      activationLink?: string;
      lojaNome?: string;
    },
  ) {
    const mode = options?.mode || 'cadastro';
    const activationLink =
      options?.activationLink ||
      `${process.env.FRONTEND_URL || 'https://comunikapp.com.br'}/primeiro-acesso?email=${encodeURIComponent(to)}`;

    const subject =
      mode === 'convite'
        ? 'Você foi convidado para acessar o Comunikapp'
        : 'Seu Código de Verificação Comunikapp';

    const titulo =
      mode === 'convite' ? 'Você recebeu um convite para o Comunikapp' : 'Bem-vindo ao Comunikapp!';

    const textoAbertura =
      mode === 'convite'
        ? `A empresa ${
            options?.lojaNome || 'da sua equipe'
          } criou um acesso para você no Comunikapp.`
        : 'Obrigado por se cadastrar. Use o código abaixo para verificar seu e-mail:';

    const instrucoes =
      mode === 'convite'
        ? `
          <ol style="padding-left: 20px;">
            <li>Clique em <strong>Definir minha senha</strong>.</li>
            <li>Informe este código de verificação.</li>
            <li>Defina sua senha e faça login.</li>
          </ol>
        `
        : '<p>Use o código abaixo para verificar seu e-mail:</p>';

    const mailOptions = {
      from: this.getFromAddress(),
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>${titulo}</h1>
          <p>${textoAbertura}</p>
          ${instrucoes}
          <div style="margin: 24px 0;">
            <a href="${activationLink}"
              style="background-color: #0f172a; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Definir minha senha
            </a>
          </div>
          <p style="margin-bottom: 6px;">Código de verificação:</p>
          <h2 style="margin-top: 0;"><strong>${code}</strong></h2>
          <p>Este código expira em 15 minutos.</p>
          <p style="color: #666; font-size: 12px;">
            Se você não esperava este convite, pode ignorar este e-mail.
          </p>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    this.logger.log(
      `E-mail de verificação enviado messageId=${info.messageId} destino=${MailService.maskEmail(to)}`,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`Preview Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    const mailOptions = {
      from: this.getFromAddress(),
      to,
      subject: 'Redefinicao de senha do Comunikapp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Redefina sua senha</h1>
          <p>Recebemos uma solicitacao para redefinir a senha da sua conta no Comunikapp.</p>
          <p>Clique no botao abaixo para criar uma nova senha. O link expira em 30 minutos.</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}"
              style="background-color: #0f172a; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Redefinir senha
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Se voce nao solicitou esta redefinicao, ignore este e-mail. Sua senha atual continuara valida.
          </p>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    this.logger.log(
      `E-mail de redefinicao de senha enviado messageId=${info.messageId} destino=${MailService.maskEmail(to)}`,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`Preview Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  }

  async sendSignupInviteEmail(
    to: string,
    inviteLink: string,
    options?: { nome?: string; expiresAt?: Date; mode?: 'default' | 'beta' },
  ) {
    const expiresText = options?.expiresAt
      ? options.expiresAt.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null;
    const nome = options?.nome?.trim() || 'convidado(a)';
    const isBeta = options?.mode === 'beta';

    const mailOptions = {
      from: this.getFromAddress(),
      to,
      subject: isBeta
        ? 'Seu convite para conhecer o Comunikapp (beta)'
        : 'Convite para criar sua conta no Comunikapp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>${isBeta ? 'Obrigado pelo interesse no Comunikapp' : 'Voce foi convidado para acessar o Comunikapp'}</h1>
          <p>Ola, ${nome}! ${
            isBeta
              ? 'Recebemos seu pedido para conhecer a plataforma. Use o link abaixo para continuar seu cadastro e iniciar o teste.'
              : 'Use o link abaixo para criar sua conta e iniciar o cadastro da sua loja.'
          }</p>
          <div style="margin: 24px 0;">
            <a href="${inviteLink}"
              style="background-color: #0f172a; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${isBeta ? 'Continuar meu cadastro' : 'Criar minha conta'}
            </a>
          </div>
          ${expiresText ? `<p>Este convite expira em ${expiresText}.</p>` : ''}
          <p style="color: #666; font-size: 12px;">
            Se voce nao solicitou este acesso, pode ignorar este e-mail.
          </p>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    this.logger.log(
      `Convite de cadastro enviado messageId=${info.messageId} destino=${MailService.maskEmail(to)}`,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`Preview Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  }

  async sendBetaLeadNotificationEmail(data: {
    nome: string;
    email: string;
    telefone?: string;
    nome_loja?: string;
    origem?: string;
  }) {
    const recipients = getPlatformAdminEmails();
    if (!recipients.length) {
      this.logger.warn(
        'Nenhum PLATFORM_ADMIN_EMAILS configurado; notificacao de lead beta nao enviada.',
      );
      return null;
    }

    const now = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());

    const origemLabel =
      data.origem === 'landing_interesse'
        ? 'Landing - Quero conhecer'
        : data.origem || 'Nao informada';

    const rows = [
      ['Nome', data.nome],
      ['E-mail', data.email],
      ['Telefone', data.telefone || '-'],
      ['Empresa / Loja', data.nome_loja || '-'],
      ['Origem', origemLabel],
      ['Recebido em', now],
    ]
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${label}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${value}</td></tr>`,
      )
      .join('');

    const mailOptions = {
      from: this.getFromAddress(),
      to: recipients.join(', '),
      subject: `[Comunikapp] Novo interesse no beta - ${data.nome}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <h1>Novo lead no beta</h1>
          <p>Alguem solicitou acesso para conhecer o Comunikapp pela landing.</p>
          <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">${rows}</table>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">
            O convite foi enviado automaticamente para o e-mail informado.
          </p>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);
    this.logger.log(
      `Notificacao de lead beta enviada messageId=${info.messageId} destinos=${recipients.length}`,
    );
    return info;
  }

  private static maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return '[invalid]';
    const u =
      user.length <= 2 ? `${user[0]}*` : `${user.slice(0, 2)}…${user.slice(-1)}`;
    return `${u}@${domain}`;
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

    this.logger.log(
      `Orçamento enviado messageId=${info.messageId} destino=${MailService.maskEmail(emailCliente)}`,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`Preview Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
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
              <p><strong>Valor Total:</strong> R$ ${(Number(precoFinal) || 0).toFixed(2).replace('.', ',')}</p>
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

    this.logger.log(
      `Orçamento atualizado enviado messageId=${info.messageId} destino=${MailService.maskEmail(emailCliente)}`,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`Preview Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
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

    this.logger.log(
      `Aprovação notificada messageId=${info.messageId} destino=${MailService.maskEmail(emailLoja)}`,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`Preview Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  }

  async sendBetaFeedbackEmail(payload: {
    to: string;
    replyTo: string;
    usuarioNome: string;
    usuarioEmail: string;
    lojaNome: string;
    lojaId: string;
    funcao: string;
    descricao: string;
    expectativa?: string;
    paginaUrl: string;
    paginaPath: string;
    paginaTitulo?: string;
    versaoPlataforma?: string;
    userAgent?: string;
  }) {
    const escape = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const expectativaBlock = payload.expectativa?.trim()
      ? `<p><strong>O que esperava:</strong><br>${escape(payload.expectativa).replace(/\n/g, '<br>')}</p>`
      : '';

    const mailOptions = {
      from: this.getFromAddress(),
      to: payload.to,
      replyTo: payload.replyTo,
      subject: `[Beta Comunikapp] Feedback — ${payload.paginaPath}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background-color: #eef2ff; padding: 20px; border-bottom: 1px solid #c7d2fe;">
            <h1 style="color: #312e81; margin: 0; font-size: 20px;">Beta · Feedback recebido</h1>
            <p style="color: #4338ca; margin: 8px 0 0 0; font-size: 14px;">Pagina acessada no momento do reporte</p>
          </div>

          <div style="padding: 24px 20px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;"><strong>Pagina (URL):</strong><br><a href="${escape(payload.paginaUrl)}">${escape(payload.paginaUrl)}</a></p>
              <p style="margin: 0 0 8px 0;"><strong>Rota:</strong> ${escape(payload.paginaPath)}</p>
              ${payload.paginaTitulo ? `<p style="margin: 0;"><strong>Titulo da aba:</strong> ${escape(payload.paginaTitulo)}</p>` : ''}
            </div>

            <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 12px 0; color: #9a3412; font-size: 16px;">Relato do usuario</h2>
              <p style="margin: 0;"><strong>Problema:</strong><br>${escape(payload.descricao).replace(/\n/g, '<br>')}</p>
              ${expectativaBlock}
            </div>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <h3 style="margin: 0 0 12px 0; color: #334155; font-size: 15px;">Contexto</h3>
              <p style="margin: 0 0 8px 0;"><strong>Usuario:</strong> ${escape(payload.usuarioNome)} (${escape(payload.usuarioEmail)})</p>
              <p style="margin: 0 0 8px 0;"><strong>Loja:</strong> ${escape(payload.lojaNome)} (${escape(payload.lojaId)})</p>
              <p style="margin: 0 0 8px 0;"><strong>Funcao:</strong> ${escape(payload.funcao)}</p>
              ${payload.versaoPlataforma ? `<p style="margin: 0 0 8px 0;"><strong>Versao da plataforma:</strong> ${escape(payload.versaoPlataforma)}</p>` : ''}
              ${payload.userAgent ? `<p style="margin: 0;"><strong>Navegador:</strong> ${escape(payload.userAgent)}</p>` : ''}
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 16px 20px; text-align: center; color: #64748b; font-size: 12px;">
            <p style="margin: 0;">Responda este e-mail para falar diretamente com o usuario.</p>
          </div>
        </div>
      `,
    };

    const info = await this.transporter.sendMail(mailOptions);

    this.logger.log(
      `Feedback beta enviado messageId=${info.messageId} pagina=${payload.paginaPath} destino=${MailService.maskEmail(payload.to)}`,
    );
    if (!this.isSmtpConfigurado() && nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`Preview Ethereal: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  }
}
