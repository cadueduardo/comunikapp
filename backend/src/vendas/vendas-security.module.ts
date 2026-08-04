import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VendasPermissionsService } from './permissions/vendas-permissions.service';
import { VendasPermissionsGuard } from './permissions/vendas-permissions.guard';
import { VendasAcessoController } from './vendas-acesso.controller';

/**
 * Autorização do domínio comercial + endpoint de contexto de acesso (Fase 3).
 * Navegação/UI não substitui autorização nos services.
 */
@Module({
  imports: [PrismaModule],
  controllers: [VendasAcessoController],
  providers: [VendasPermissionsService, VendasPermissionsGuard],
  exports: [VendasPermissionsService, VendasPermissionsGuard],
})
export class VendasSecurityModule {}
