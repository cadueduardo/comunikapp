import { Module } from '@nestjs/common';
import { ServicosManuaisService } from './servicos-manuais.service';
import { ServicosManuaisController } from './servicos-manuais.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServicosManuaisController],
  providers: [ServicosManuaisService],
})
export class ServicosManuaisModule {}













