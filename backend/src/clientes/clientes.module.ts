import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { VendasSecurityModule } from '../vendas/vendas-security.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VendasSecurityModule, // Fase 4 — VendasPermissionsService/Guard (autorização comercial)
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
