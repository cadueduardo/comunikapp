import {
  Controller,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VendasPermissionsGuard } from '../../vendas/permissions/vendas-permissions.guard';
import { RequerPermissaoVendas } from '../../vendas/permissions/requer-permissao-vendas.decorator';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { VendasRolloutService } from '../services/vendas-rollout.service';

@ApiTags('Vendas - Preflight & Rollout')
@Controller('vendas/rollout')
@ApiBearerAuth()
@UseGuards(VendasPermissionsGuard)
export class VendasRolloutController {
  constructor(
    private readonly vendasRolloutService: VendasRolloutService,
  ) {}

  /**
   * Executa a verificação de preflight e prontidão de rollout para a loja.
   */
  @Get('prontidao')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.PROPOSTA_VER)
  @ApiOperation({ summary: 'Verificar prontidão de rollout da loja' })
  @ApiResponse({ status: 200, description: 'Resultado de preflight retornado com sucesso' })
  async verificarProntidao(@Request() req: any) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.vendasRolloutService.verificarProntidaoLoja(
      lojaId,
      usuarioId,
    );
  }

  /**
   * Obtém os sinais e métricas de observabilidade por loja.
   */
  @Get('observabilidade')
  @RequerPermissaoVendas(VENDAS_PERMISSOES.ALCADA_APROVAR)
  @ApiOperation({ summary: 'Obter métricas e sinais de observabilidade do módulo' })
  @ApiResponse({ status: 200, description: 'Métricas de observabilidade retornadas' })
  async obterObservabilidade(@Request() req: any) {
    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(req);
    return await this.vendasRolloutService.obterSinaisObservabilidade(
      lojaId,
      usuarioId,
    );
  }
}
