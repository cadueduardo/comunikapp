import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, GetLoja } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { FecharFechamentoDto } from './dto/fechar-fechamento.dto';
import { ReabrirFechamentoDto } from './dto/reabrir-fechamento.dto';
import { FechamentoFinanceiroOsService } from './services/fechamento-financeiro-os.service';
import { PosCalculoService } from './services/pos-calculo.service';

@Controller('financeiro/os')
@UseGuards(JwtAuthGuard)
export class PosCalculoController {
  constructor(
    private readonly posCalculoService: PosCalculoService,
    private readonly fechamentoFinanceiroService: FechamentoFinanceiroOsService,
  ) {}

  /**
   * Pós-cálculo previsto × real da OS (read-only, Fase 5 MVP).
   */
  @Get(':osId/pos-calculo')
  obterPosCalculo(
    @Param('osId') osId: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.posCalculoService.obterPorOs(osId, lojaAtual, usuario.id);
  }

  /**
   * Fechamento financeiro da OS (soft warnings, não bloqueia pendências no MVP).
   */
  @Post(':osId/fechamento')
  fecharFechamento(
    @Param('osId') osId: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: FecharFechamentoDto,
  ) {
    return this.fechamentoFinanceiroService.fechar(
      osId,
      lojaAtual,
      usuario.id,
      dto,
    );
  }

  /**
   * Reabertura do fechamento financeiro (motivo obrigatório).
   */
  @Post(':osId/reabertura')
  reabrirFechamento(
    @Param('osId') osId: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: ReabrirFechamentoDto,
  ) {
    return this.fechamentoFinanceiroService.reabrir(
      osId,
      lojaAtual,
      usuario.id,
      dto,
    );
  }

  /**
   * Histórico de fechamento/reabertura + snapshot atual.
   */
  @Get(':osId/historico')
  obterHistoricoFechamento(
    @Param('osId') osId: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.fechamentoFinanceiroService.historico(
      osId,
      lojaAtual,
      usuario.id,
    );
  }
}
