import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PerfisAcessoController } from './perfis-acesso.controller';
import { PerfisAcessoService } from './perfis-acesso.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  controllers: [UsuariosController, PerfisAcessoController],
  providers: [UsuariosService, PerfisAcessoService],
  exports: [UsuariosService, PerfisAcessoService],
})
export class UsuariosModule {}
