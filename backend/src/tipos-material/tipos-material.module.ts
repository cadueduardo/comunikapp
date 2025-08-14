import { Module } from '@nestjs/common';
import { TiposMaterialService } from './tipos-material.service';
import { TiposMaterialController } from './tipos-material.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TiposMaterialController],
  providers: [TiposMaterialService],
  exports: [TiposMaterialService],
})
export class TiposMaterialModule {}
