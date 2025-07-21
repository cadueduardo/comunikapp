import { Module } from '@nestjs/common';
import { TiposMaterialService } from './tipos-material.service';
import { TiposMaterialController } from './tipos-material.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiposMaterialController],
  providers: [TiposMaterialService],
  exports: [TiposMaterialService],
})
export class TiposMaterialModule {}
