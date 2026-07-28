import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { MotorCalculoV2Service } from './services/motor-calculo-v2.service';
import { BusinessRulesEngineService } from './services/business-rules-engine.service';
import { PipelineExecutorService } from './services/pipeline-executor.service';
import { EventProducerService } from './services/event-producer.service';
import { InputIntegrationService } from './services/input-integration.service';
import { RateioCustosIndiretosService } from './services/rateio-custos-indiretos.service';
import { MotorCalculoV2Controller } from './controllers/motor-calculo-v2.controller';
import { CalculoWebSocketGateway } from './gateways/calculo-websocket.gateway';
import { getRequiredJwtSecret } from '../auth/jwt-secret';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: getRequiredJwtSecret(configService),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MotorCalculoV2Controller],
  providers: [
    MotorCalculoV2Service,
    BusinessRulesEngineService,
    PipelineExecutorService,
    RateioCustosIndiretosService,
    EventProducerService,
    InputIntegrationService,
    CalculoWebSocketGateway,
  ],
  exports: [
    MotorCalculoV2Service,
    BusinessRulesEngineService,
    PipelineExecutorService,
    EventProducerService,
    InputIntegrationService,
    CalculoWebSocketGateway,
  ],
})
export class MotorCalculoV2Module {}
