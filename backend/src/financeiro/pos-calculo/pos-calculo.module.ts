import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { ComprasModule } from '../../compras/compras.module';
import { ContasPagarModule } from '../contas-pagar/contas-pagar.module';
import { PosCalculoController } from './pos-calculo.controller';
import { FechamentoFinanceiroOsService } from './services/fechamento-financeiro-os.service';
import { PosCalculoService } from './services/pos-calculo.service';
import { PosCalculoPermissionsService } from './services/pos-calculo-permissions.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ComprasModule,
    ContasPagarModule,
  ],
  controllers: [PosCalculoController],
  providers: [
    PosCalculoService,
    PosCalculoPermissionsService,
    FechamentoFinanceiroOsService,
  ],
  exports: [PosCalculoService, FechamentoFinanceiroOsService],
})
export class PosCalculoModule {}
