import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ModuloAcessoGuard } from './autorizacao/modulo-acesso.guard';
import { RbacCoreModule } from './rbac-core.module';

@Global()
@Module({
  imports: [RbacCoreModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ModuloAcessoGuard,
    },
  ],
  exports: [RbacCoreModule],
})
export class RbacModule {}
