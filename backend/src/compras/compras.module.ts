import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentosModule } from '../documentos/documentos.module';
import { SolicitacoesController } from './controllers/solicitacoes.controller';
import { PedidosController } from './controllers/pedidos.controller';
import { SolicitacoesService } from './services/solicitacoes.service';
import { PedidosService } from './services/pedidos.service';
import { ComprasHistoricoService } from './services/compras-historico.service';
import { ComprasPermissionsService } from './services/compras-permissions.service';

@Module({
  imports: [PrismaModule, AuthModule, DocumentosModule],
  controllers: [SolicitacoesController, PedidosController],
  providers: [
    SolicitacoesService,
    PedidosService,
    ComprasHistoricoService,
    ComprasPermissionsService,
  ],
  exports: [
    SolicitacoesService,
    PedidosService,
    ComprasHistoricoService,
    ComprasPermissionsService,
  ],
})
export class ComprasModule {}
