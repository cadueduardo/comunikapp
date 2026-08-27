import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PerfisAcessoController } from './perfis-acesso.controller';
import { PerfisAcessoService } from './perfis-acesso.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { RbacCoreModule } from '../rbac/rbac-core.module';
import { LojaAdministradorGuard } from './guards/loja-administrador.guard';
import { ModuleActivationGuard } from '../common/guards/module-activation.guard';

@Module({
  imports: [PrismaModule, MailModule, AuthModule, RbacCoreModule],
  controllers: [UsuariosController, PerfisAcessoController],
  providers: [
    UsuariosService,
    PerfisAcessoService,
    LojaAdministradorGuard,
    ModuleActivationGuard,
  ],
  exports: [UsuariosService, PerfisAcessoService],
})
export class UsuariosModule {}
