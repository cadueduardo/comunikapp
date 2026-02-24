import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PerfisAcessoController } from './perfis-acesso.controller';
import { PerfisAcessoService } from './perfis-acesso.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [UsuariosController, PerfisAcessoController],
  providers: [UsuariosService, PerfisAcessoService],
  exports: [UsuariosService, PerfisAcessoService],
})
export class UsuariosModule {}
