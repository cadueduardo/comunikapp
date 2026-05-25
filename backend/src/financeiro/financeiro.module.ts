import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceiroController } from './financeiro.controller';
import { CobrancasService } from './services/cobrancas.service';
import { ParcelasBuilderService } from './services/parcelas-builder.service';
import { StatusRollupService } from './services/status-rollup.service';
import { CobrancaVencimentoService } from './services/cobranca-vencimento.service';

/**
 * Modulo do financeiro minimo (Fase 6).
 *
 * Exporta `CobrancasService` para que o modulo de Orcamentos V2 possa criar
 * a cobranca automaticamente apos aprovar um orcamento, e
 * `CobrancaVencimentoService` para que o orcamento ja parseie o prazo_entrega
 * antes de salvar.
 *
 * As 5 sub-fases (6.A a 6.E) compartilham este modulo.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FinanceiroController],
  providers: [
    CobrancasService,
    ParcelasBuilderService,
    StatusRollupService,
    CobrancaVencimentoService,
  ],
  exports: [CobrancasService, CobrancaVencimentoService, ParcelasBuilderService],
})
export class FinanceiroModule {}
