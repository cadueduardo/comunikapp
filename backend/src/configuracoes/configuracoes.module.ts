/**
 * Módulo de Configurações
 * Inclui: Parâmetros, Validações Automáticas, Usuários, Lojas, Integrações
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Controllers
import { ParametrosController } from './controllers/parametros.controller';
import { ValidacoesAutomaticasController } from './controllers/validacoes-automaticas.controller';
import { RegrasValidacaoController } from './controllers/regras-validacao.controller';
import { CamposValidacaoController } from './controllers/campos-validacao.controller';
import { TestValidacoesController } from './controllers/test-validacoes.controller';
import { TestCamposValidacaoController } from './controllers/test-campos-validacao.controller';

// Services
import { ParametrosService } from './services/parametros.service';
import { ValidacoesAutomaticasService } from './services/validacoes-automaticas.service';
import { RegrasValidacaoService } from './services/regras-validacao.service';
import { ExecucaoRegraService } from './services/execucao-regra.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    ParametrosController,
    ValidacoesAutomaticasController,
    RegrasValidacaoController,
    CamposValidacaoController,
    TestValidacoesController,
    TestCamposValidacaoController,
  ],
  providers: [
    ParametrosService,
    ValidacoesAutomaticasService,
    RegrasValidacaoService,
    ExecucaoRegraService,
  ],
  exports: [
    ValidacoesAutomaticasService, // Para uso no módulo OS
    RegrasValidacaoService,
  ],
})
export class ConfiguracoesModule {}
