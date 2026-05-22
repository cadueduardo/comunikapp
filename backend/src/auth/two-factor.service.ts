import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFactorService {
  private readonly issuer = 'Comunikapp';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getEncryptionKey(): Buffer {
    const keyMaterial =
      this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET');

    if (!keyMaterial || keyMaterial.trim().length < 32) {
      throw new Error(
        'TWO_FACTOR_ENCRYPTION_KEY ou JWT_SECRET forte e obrigatorio para 2FA.',
      );
    }

    return crypto.createHash('sha256').update(keyMaterial).digest();
  }

  private encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  private decryptSecret(value: string): string {
    const [version, ivB64, tagB64, encryptedB64] = value.split(':');
    if (version !== 'v1' || !ivB64 || !tagB64 || !encryptedB64) {
      throw new UnauthorizedException('Configuracao 2FA invalida.');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.getEncryptionKey(),
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  async getStatus(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        two_factor_enabled: true,
        two_factor_confirmed_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado.');
    }

    return {
      enabled: user.two_factor_enabled,
      confirmedAt: user.two_factor_confirmed_at,
    };
  }

  async createSetup(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, email: true, two_factor_enabled: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado.');
    }

    if (user.two_factor_enabled) {
      throw new BadRequestException('2FA ja esta ativo para este usuario.');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: this.issuer,
      label: user.email,
      secret,
      strategy: 'totp',
    });

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        two_factor_secret: this.encryptSecret(secret),
        two_factor_enabled: false,
        two_factor_confirmed_at: null,
      },
    });

    return {
      otpauthUrl,
      qrCodeDataUrl: await qrcode.toDataURL(otpauthUrl),
      manualKey: secret,
    };
  }

  async confirmSetup(userId: string, code: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, two_factor_secret: true },
    });

    if (!user?.two_factor_secret) {
      throw new BadRequestException('Inicie a configuracao 2FA antes de confirmar.');
    }

    if (!this.verifyCode(user.two_factor_secret, code)) {
      throw new UnauthorizedException('Codigo 2FA invalido.');
    }

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        two_factor_enabled: true,
        two_factor_confirmed_at: new Date(),
      },
    });

    return { enabled: true };
  }

  async disable(userId: string, password: string, code: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        senha: true,
        two_factor_enabled: true,
        two_factor_secret: true,
      },
    });

    if (!user?.senha) {
      throw new UnauthorizedException('Usuario nao encontrado.');
    }

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      throw new BadRequestException('2FA nao esta ativo para este usuario.');
    }

    const validPassword = await bcrypt.compare(password, user.senha);
    if (!validPassword || !this.verifyCode(user.two_factor_secret, code)) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_confirmed_at: null,
      },
    });

    return { enabled: false };
  }

  verifyCode(encryptedSecret: string, code: string): boolean {
    if (!/^\d{6}$/.test(code)) {
      return false;
    }

    return verifySync({
      token: code,
      secret: this.decryptSecret(encryptedSecret),
      strategy: 'totp',
    }).valid;
  }
}
