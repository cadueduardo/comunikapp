import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentosModule } from '../documentos/documentos.module';
import { SolicitacoesController } from './controllers/solicitacoes.controller';
import { PedidosController } from './controllers/pedidos.controller';
import {
  PedidoRecebimentosController,
  RecebimentosController,
} from './controllers/recebimentos.controller';
import {
  AceitesServicoController,
  PedidoAceitesServicoController,
} from './controllers/aceites-servico.controller';
import { SolicitacoesService } from './services/solicitacoes.service';
import { PedidosService } from './services/pedidos.service';
import { PedidosWorkflowService } from './services/pedidos-workflow.service';
import { PedidosSubstituicaoService } from './services/pedidos-substituicao.service';
import { RecebimentosService } from './services/recebimentos.service';
import { AceitesServicoService } from './services/aceites-servico.service';
import { ComprasHistoricoService } from './services/compras-historico.service';
import { ComprasPermissionsService } from './services/compras-permissions.service';

@Module({
  imports: [PrismaModule, AuthModule, DocumentosModule],
  controllers: [
    SolicitacoesController,
    PedidosController,
    PedidoRecebimentosController,
    RecebimentosController,
    PedidoAceitesServicoController,
    AceitesServicoController,
  ],
  providers: [
    SolicitacoesService,
    PedidosService,
    PedidosWorkflowService,
    PedidosSubstituicaoService,
    RecebimentosService,
    AceitesServicoService,
    ComprasHistoricoService,
    ComprasPermissionsService,
  ],
  exports: [
    SolicitacoesService,
    PedidosService,
    PedidosWorkflowService,
    PedidosSubstituicaoService,
    RecebimentosService,
    AceitesServicoService,
    ComprasHistoricoService,
    ComprasPermissionsService,
  ],
})
export class ComprasModule {}
