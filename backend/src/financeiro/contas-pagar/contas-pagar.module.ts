import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { ContasPagarController } from './controllers/contas-pagar.controller';
import { PagamentosFornecedorController } from './controllers/pagamentos-fornecedor.controller';
import { ContasPagarService } from './services/contas-pagar.service';
import { PagamentosFornecedorService } from './services/pagamentos-fornecedor.service';
import { ContasPagarPermissionsService } from './services/contas-pagar-permissions.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContasPagarController, PagamentosFornecedorController],
  providers: [
    ContasPagarService,
    PagamentosFornecedorService,
    ContasPagarPermissionsService,
  ],
  exports: [
    ContasPagarService,
    PagamentosFornecedorService,
    ContasPagarPermissionsService,
  ],
})
export class ContasPagarModule {}
