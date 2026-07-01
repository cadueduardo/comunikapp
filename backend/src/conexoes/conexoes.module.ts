import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { getRequiredJwtSecret } from '../auth/jwt-secret';
import { FieldEncryptionService } from '../common/services/field-encryption.service';
import { ConexoesController } from './conexoes.controller';
import { LojaConexaoService } from './services/loja-conexao.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { GoogleDriveStorageService } from './services/google-drive-storage.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: getRequiredJwtSecret(configService),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [ConexoesController],
  providers: [
    FieldEncryptionService,
    LojaConexaoService,
    GoogleOAuthService,
    GoogleDriveStorageService,
  ],
  exports: [
    FieldEncryptionService,
    LojaConexaoService,
    GoogleDriveStorageService,
  ],
})
export class ConexoesModule {}
