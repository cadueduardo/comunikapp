import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Criptografia reversível AES-256-GCM para segredos em repouso (tokens OAuth, etc.).
 * Mesmo formato v1 usado no 2FA: v1:{iv}:{tag}:{ciphertext}
 */
@Injectable()
export class FieldEncryptionService {
  constructor(private readonly configService: ConfigService) {}

  encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(value: string): string {
    const [version, ivB64, tagB64, encryptedB64] = value.split(':');
    if (version !== 'v1' || !ivB64 || !tagB64 || !encryptedB64) {
      throw new InternalServerErrorException(
        'Formato de segredo criptografado inválido',
      );
    }
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private getEncryptionKey(): Buffer {
    const keyMaterial =
      this.configService.get<string>('SECRETS_ENCRYPTION_KEY') ||
      this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET');

    if (!keyMaterial) {
      throw new InternalServerErrorException(
        'Chave de criptografia não configurada no servidor',
      );
    }

    return crypto.createHash('sha256').update(keyMaterial).digest();
  }
}
