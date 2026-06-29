import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ArteOrcamentoInjecaoService } from '../services/arte-orcamento-injecao.service';
import { SyncProdutoArteDto } from '../dto/sync-produto-arte.dto';

@ApiTags('Arte & Aprovação — Orçamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/orcamento')
export class ArteOrcamentoController {
  constructor(
    private readonly arteOrcamentoInjecaoService: ArteOrcamentoInjecaoService,
  ) {}

  @Post('sync-produto')
  @ApiOperation({
    summary: 'Sincroniza linha automática de arte no produto (preview do orçamento)',
  })
  async syncProduto(@Request() req: any, @Body() dto: SyncProdutoArteDto) {
    const lojaId = req.user.loja_id;
    const produto: Record<string, unknown> = {
      responsabilidade_arte: dto.responsabilidade_arte,
      politica_cobranca_arte: dto.politica_cobranca_arte,
      finalidade_anexo: dto.finalidade_anexo,
      complexidade_arte: dto.complexidade_arte,
      servicos: dto.servicos,
      servicos_manuais: dto.servicos_manuais ?? dto.servicos,
    };

    const sync = await this.arteOrcamentoInjecaoService.syncProduto(
      produto,
      lojaId,
    );

    const servicos =
      (produto.servicos_manuais as unknown[]) ||
      (produto.servicos as unknown[]) ||
      [];

    return {
      success: true,
      data: {
        servicos,
        ...sync,
      },
    };
  }
}
