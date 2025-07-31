import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter;

  async onModuleInit() {
    const testAccount = await nodemailer.createTestAccount();

    console.log('📧 ==========================================');
    console.log('📧 ETHEREAL EMAIL TEST ACCOUNT CRIADA!');
    console.log('📧 ==========================================');
    console.log('📧 User:', testAccount.user);
    console.log('📧 Pass:', testAccount.pass);
    console.log('📧 SMTP: smtp.ethereal.email:587');
    console.log('📧 ==========================================');

    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  async sendVerificationEmail(to: string, code: string) {
    const mailOptions = {
      from: '"Comunikapp" <noreply@comunikapp.com>',
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
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
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
    linkPublico: string
  ) {
    const mailOptions = {
      from: '"Comunikapp" <noreply@comunikapp.com>',
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

    console.log('📧 ==========================================');
    console.log('📧 E-MAIL DE ORÇAMENTO ENVIADO COM SUCESSO!');
    console.log('📧 ==========================================');
    console.log('📧 Message ID: %s', info.messageId);
    console.log('📧 Destinatário:', emailCliente);
    console.log('📧 ETHEREAL PREVIEW (CLIQUE AQUI): %s', nodemailer.getTestMessageUrl(info));
    console.log('📧 ==========================================');

    return info;
  }

  async enviarNotificacaoAprovacao(
    emailLoja: string,
    numeroOrcamento: string,
    nomeCliente: string,
    precoFinal: number
  ) {
    const mailOptions = {
      from: '"Comunikapp" <noreply@comunikapp.com>',
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

    console.log('--- E-mail de Aprovação Enviado ---');
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    console.log('Notificação enviada para:', emailLoja);
    console.log('-----------------------------------');

    return info;
  }
} 