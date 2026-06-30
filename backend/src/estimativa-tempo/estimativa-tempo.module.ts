import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EstimativaTempoController } from './estimativa-tempo.controller';
import { EstimativaTempoService } from './services/estimativa-tempo.service';
import { CompatibilidadeMaterialMaquinaService } from './services/compatibilidade-material-maquina.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EstimativaTempoController],
  providers: [EstimativaTempoService, CompatibilidadeMaterialMaquinaService],
  exports: [EstimativaTempoService, CompatibilidadeMaterialMaquinaService],
})
export class EstimativaTempoModule {}
