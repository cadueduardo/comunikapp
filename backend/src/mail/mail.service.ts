import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter;

  async onModuleInit() {
    const testAccount = await nodemailer.createTestAccount();

    console.log('--- Ethereal Test Account ---');
    console.log('User:', testAccount.user);
    console.log('Pass:', testAccount.pass);
    console.log('-----------------------------');

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
    console.log('-------------------');

    return info;
  }
} 