import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogoService } from './catalogo/catalogo.service';
import { PermissaoEfetivaService } from './autorizacao/permissao-efetiva.service';
import { PermissionsGuard } from './autorizacao/permissions.guard';
import { LojaAuditService } from './auditoria/loja-audit.service';
import { SincronizarPerfisSistemaService } from './sync/sincronizar-perfis-sistema.service';

/**
 * Núcleo RBAC importável por módulos de domínio (ex.: Compras)
 * sem registrar o APP_GUARD de porta de módulo.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    CatalogoService,
    PermissaoEfetivaService,
    PermissionsGuard,
    LojaAuditService,
    SincronizarPerfisSistemaService,
  ],
  exports: [
    CatalogoService,
    PermissaoEfetivaService,
    PermissionsGuard,
    LojaAuditService,
    SincronizarPerfisSistemaService,
  ],
})
export class RbacCoreModule {}
