import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, GetLoja } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { PosCalculoService } from './services/pos-calculo.service';

@Controller('financeiro/os')
@UseGuards(JwtAuthGuard)
export class PosCalculoController {
  constructor(private readonly posCalculoService: PosCalculoService) {}

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
}
