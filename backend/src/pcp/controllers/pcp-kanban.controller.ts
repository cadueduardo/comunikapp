import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PCPKanbanService } from '../services/pcp-kanban.service';
import { IniciarProducaoDto, ConcluirEtapaDto, PausarProducaoDto, KanbanQueryDto } from '../dto/kanban.dto';
import { LojaId } from '../../auth/loja-id.decorator';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('PCP - Kanban')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pcp/kanban')
export class PCPKanbanController {
  constructor(private pcpKanbanService: PCPKanbanService) {}

  @Get('geral')
  @ApiOperation({ summary: 'Obtém os dados do Kanban geral para a loja' })
  @ApiResponse({ status: 200, description: 'Dados do Kanban geral.' })
  async obterKanbanGeral(@LojaId() lojaId: string, @Query() filtros: KanbanQueryDto) {
    return this.pcpKanbanService.obterKanbanGeral(lojaId, filtros);
  }

  @Get('fila-setor/:setorId')
  @ApiOperation({ summary: 'Obtém a fila de produção para um setor específico' })
  @ApiResponse({ status: 200, description: 'Fila de produção do setor.' })
  @ApiResponse({ status: 404, description: 'Setor não encontrado.' })
  async obterFilaSetor(
    @Param('setorId') setorId: string,
    @LojaId() lojaId: string,
    @Query('operadorId') operadorId?: string
  ) {
    return this.pcpKanbanService.obterFilaSetor(setorId, operadorId);
  }

  @Post('iniciar/:itemOsId')
  @ApiOperation({ summary: 'Inicia produção de um item' })
  @ApiResponse({ status: 200, description: 'Produção iniciada com sucesso.' })
  async iniciarProducao(
    @Param('itemOsId') itemOsId: string,
    @Body() data: IniciarProducaoDto
  ) {
    await this.pcpKanbanService.iniciarProducao(itemOsId, data.operadorId, data.observacoes);
    return { message: 'Produção iniciada com sucesso' };
  }

  @Post('concluir/:itemOsId')
  @ApiOperation({ summary: 'Conclui etapa de produção' })
  @ApiResponse({ status: 200, description: 'Etapa concluída com sucesso.' })
  async concluirEtapa(
    @Param('itemOsId') itemOsId: string,
    @Body() data: ConcluirEtapaDto
  ) {
    await this.pcpKanbanService.concluirEtapa(itemOsId, data.operadorId, data.observacoes, data.quantidadeProduzida);
    return { message: 'Etapa concluída com sucesso' };
  }

  @Post('pausar/:itemOsId')
  @ApiOperation({ summary: 'Pausa produção de um item' })
  @ApiResponse({ status: 200, description: 'Produção pausada com sucesso.' })
  async pausarProducao(
    @Param('itemOsId') itemOsId: string,
    @Body() data: PausarProducaoDto
  ) {
    // TODO: Implementar pausa de produção
    return { message: 'Produção pausada com sucesso' };
  }

  @Put('status/:osId')
  @ApiOperation({ summary: 'Atualiza o status de uma OS no Kanban' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  async atualizarStatusOS(
    @Param('osId') osId: string,
    @Body() data: { status: string }
  ) {
    await this.pcpKanbanService.atualizarStatusOS(osId, data.status);
    return { message: 'Status atualizado com sucesso' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtém estatísticas do Kanban' })
  @ApiResponse({ status: 200, description: 'Estatísticas do Kanban.' })
  async obterEstatisticas(@LojaId() lojaId: string) {
    const kanbanData = await this.pcpKanbanService.obterKanbanGeral(lojaId, {});
    return kanbanData.stats;
  }
}
