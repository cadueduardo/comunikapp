import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogoService } from './catalogo/catalogo.service';
import { PermissaoEfetivaService } from './autorizacao/permissao-efetiva.service';
import { PermissionsGuard } from './autorizacao/permissions.guard';
import { ModuloAcessoGuard } from './autorizacao/modulo-acesso.guard';
import { LojaAuditService } from './auditoria/loja-audit.service';
import { SincronizarPerfisSistemaService } from './sync/sincronizar-perfis-sistema.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    CatalogoService,
    PermissaoEfetivaService,
    PermissionsGuard,
    LojaAuditService,
    SincronizarPerfisSistemaService,
    {
      provide: APP_GUARD,
      useClass: ModuloAcessoGuard,
    },
  ],
  exports: [
    CatalogoService,
    PermissaoEfetivaService,
    PermissionsGuard,
    LojaAuditService,
    SincronizarPerfisSistemaService,
  ],
})
export class RbacModule {}
