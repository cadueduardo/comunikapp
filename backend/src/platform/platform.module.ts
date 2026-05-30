import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { LojasModule } from '../lojas/lojas.module';
import { PlatformController } from './platform.controller';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule, MailModule, PrismaModule, LojasModule],
  controllers: [PlatformController],
  providers: [PlatformAdminGuard, PlatformService],
})
export class PlatformModule {}
