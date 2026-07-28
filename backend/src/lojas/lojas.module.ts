import { Module } from '@nestjs/common';
import { LojasService } from './lojas.service';
import { LojasController } from './lojas.controller';
import { PendingSignupService } from './pending-signup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { CloudflareSaaSService } from './cloudflare-saas.service';

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  controllers: [LojasController],
  providers: [LojasService, PendingSignupService, CloudflareSaaSService],
  exports: [PendingSignupService],
})
export class LojasModule {}
