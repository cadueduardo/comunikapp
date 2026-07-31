import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VendasPermissionsService } from './permissions/vendas-permissions.service';
import { VendasPermissionsGuard } from './permissions/vendas-permissions.guard';

/**
 * Autorização do domínio comercial (Gate 0S). Não expõe rotas, telas ou
 * navegação: o módulo funcional de Vendas pertence às fases seguintes.
 */
@Module({
  imports: [PrismaModule],
  providers: [VendasPermissionsService, VendasPermissionsGuard],
  exports: [VendasPermissionsService, VendasPermissionsGuard],
})
export class VendasSecurityModule {}
