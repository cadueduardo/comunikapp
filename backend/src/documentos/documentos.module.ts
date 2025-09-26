import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DocumentCodeService } from './document-code.service';

@Module({
  imports: [PrismaModule],
  providers: [DocumentCodeService],
  exports: [DocumentCodeService],
})
export class DocumentosModule {}
