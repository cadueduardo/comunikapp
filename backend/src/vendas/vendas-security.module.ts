import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { VendasPermissionsService } from './permissions/vendas-permissions.service';
import { VendasPermissionsGuard } from './permissions/vendas-permissions.guard';
import { VendasAcessoController } from './vendas-acesso.controller';
import { AtividadesController } from './atividades/atividades.controller';
import { AtividadesService } from './atividades/atividades.service';
import { AtendimentoController } from './atendimento/atendimento.controller';
import { AtendimentoService } from './atendimento/atendimento.service';
import { VendasHomeController } from './home/vendas-home.controller';
import { VendasHomeService } from './home/vendas-home.service';
import { OutboxEmailVendasService } from './outbox/outbox-email-vendas.service';
import { OutboxEmailVendasJob } from './outbox/outbox-email-vendas.job';
import { VendasCarteiraEscopoService } from './carteira/vendas-carteira-escopo.service';

/**
 * Autorização comercial + Home / Atividades / Atendimento / Outbox (Fase 5).
 */
@Module({
  imports: [PrismaModule, MailModule, NotificacoesModule],
  controllers: [
    VendasAcessoController,
    AtividadesController,
    AtendimentoController,
    VendasHomeController,
  ],
  providers: [
    VendasPermissionsService,
    VendasPermissionsGuard,
    AtividadesService,
    AtendimentoService,
    VendasHomeService,
    OutboxEmailVendasService,
    OutboxEmailVendasJob,
    VendasCarteiraEscopoService,
  ],
  exports: [
    VendasPermissionsService,
    VendasPermissionsGuard,
    OutboxEmailVendasService,
    OutboxEmailVendasJob,
    VendasCarteiraEscopoService,
  ],
})
export class VendasSecurityModule {}
