import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class AdminTwoFactorService {
  private readonly issuer = 'ComunikApp Gestão';

  constructor(private readonly configService: ConfigService) {}

  private getEncryptionKey(): Buffer {
    const configured = this.configService
      .get<string>('ADMIN_TWO_FACTOR_ENCRYPTION_KEY')
      ?.trim();
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (configured && configured.length >= 32) {
      return createHash('sha256').update(configured).digest();
    }

    if (isProduction) {
      throw new Error(
        'ADMIN_TWO_FACTOR_ENCRYPTION_KEY é obrigatória em produção.',
      );
    }

    const fallback =
      this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET');
    if (!fallback || fallback.trim().length < 32) {
      throw new Error(
        'Chave forte de criptografia 2FA administrativa é obrigatória.',
      );
    }
    return createHash('sha256')
      .update(`comunikapp-admin-2fa-v1:${fallback}`)
      .digest();
  }

  private encrypt(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decrypt(value: string): string {
    const [version, iv, tag, encrypted] = value.split(':');
    if (version !== 'v1' || !iv || !tag || !encrypted) {
      throw new BadRequestException('Configuração 2FA inválida.');
    }
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getEncryptionKey(),
      Buffer.from(iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  async createEnrollment(email: string) {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: this.issuer,
      label: email,
      secret,
      strategy: 'totp',
    });

    return {
      encryptedSecret: this.encrypt(secret),
      otpauthUrl,
      qrCodeDataUrl: await qrcode.toDataURL(otpauthUrl),
      manualKey: secret,
    };
  }

  verify(encryptedSecret: string, code: string): boolean {
    if (!/^\d{6}$/.test(code)) return false;
    return verifySync({
      token: code,
      secret: this.decrypt(encryptedSecret),
      strategy: 'totp',
    }).valid;
  }
}

