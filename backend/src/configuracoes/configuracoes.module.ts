/**
 * Modulo de Configuracoes
 * Inclui: parametros, validacoes automaticas, usuarios, lojas e integracoes.
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRequiredJwtSecret } from '../auth/jwt-secret';

// Controllers
import { ParametrosController } from './controllers/parametros.controller';
import { ValidacoesAutomaticasController } from './controllers/validacoes-automaticas.controller';
import { RegrasValidacaoController } from './controllers/regras-validacao.controller';
import { CamposValidacaoController } from './controllers/campos-validacao.controller';
import { TestValidacoesController } from './controllers/test-validacoes.controller';
import { TestCamposValidacaoController } from './controllers/test-campos-validacao.controller';
import { SetoresProdutivosController } from './controllers/centros-de-trabalho/setores-produtivos.controller';
import { ModalidadesEntregaController } from './controllers/centros-de-trabalho/modalidades-entrega.controller';
import { TiposInstalacaoController } from './controllers/centros-de-trabalho/tipos-instalacao.controller';

// Services
import { ParametrosService } from './services/parametros.service';
import { ValidacoesAutomaticasService } from './services/validacoes-automaticas.service';
import { RegrasValidacaoService } from './services/regras-validacao.service';
import { ExecucaoRegraService } from './services/execucao-regra.service';
import { SetoresProdutivosService } from './services/centros-de-trabalho/setores-produtivos.service';
import { ModalidadesEntregaService } from './services/centros-de-trabalho/modalidades-entrega.service';
import { TiposInstalacaoService } from './services/centros-de-trabalho/tipos-instalacao.service';

const testControllers =
  process.env.NODE_ENV === 'production'
    ? []
    : [TestValidacoesController, TestCamposValidacaoController];

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: getRequiredJwtSecret(configService),
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
    ...testControllers,
    SetoresProdutivosController,
    ModalidadesEntregaController,
    TiposInstalacaoController,
  ],
  providers: [
    ParametrosService,
    ValidacoesAutomaticasService,
    RegrasValidacaoService,
    ExecucaoRegraService,
    SetoresProdutivosService,
    ModalidadesEntregaService,
    TiposInstalacaoService,
  ],
  exports: [
    ValidacoesAutomaticasService,
    RegrasValidacaoService,
    SetoresProdutivosService,
    ModalidadesEntregaService,
    TiposInstalacaoService,
  ],
})
export class ConfiguracoesModule {}
