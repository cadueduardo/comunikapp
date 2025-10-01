import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DocumentCodeService } from './document-code.service';
import { DocumentCodeController } from './document-code.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentCodeController],
  providers: [DocumentCodeService],
  exports: [DocumentCodeService],
})
export class DocumentosModule {}
