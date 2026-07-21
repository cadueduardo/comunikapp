import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { ContasPagarModule } from '../contas-pagar/contas-pagar.module';
import { PosCalculoController } from './pos-calculo.controller';
import { PosCalculoService } from './services/pos-calculo.service';
import { PosCalculoPermissionsService } from './services/pos-calculo-permissions.service';

@Module({
  imports: [PrismaModule, AuthModule, ContasPagarModule],
  controllers: [PosCalculoController],
  providers: [PosCalculoService, PosCalculoPermissionsService],
  exports: [PosCalculoService],
})
export class PosCalculoModule {}
