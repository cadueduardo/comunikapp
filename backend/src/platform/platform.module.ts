import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformController } from './platform.controller';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuthModule, MailModule, PrismaModule],
  controllers: [PlatformController],
  providers: [PlatformAdminGuard, PlatformService],
})
export class PlatformModule {}
