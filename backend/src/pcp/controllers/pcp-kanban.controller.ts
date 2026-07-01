import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PCPKanbanService } from '../services/pcp-kanban.service';
import {
  IniciarProducaoDto,
  ConcluirEtapaDto,
  PausarProducaoDto,
  KanbanQueryDto,
  AtualizarStatusOSDto,
  KanbanPorSetoresQueryDto,
  MoverItemSetorDto,
} from '../dto/kanban.dto';
import { LojaId } from '../../auth/loja-id.decorator';
import { CurrentUser } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('PCP - Kanban')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pcp/kanban')
export class PCPKanbanController {
  constructor(private pcpKanbanService: PCPKanbanService) {}

  @Get('geral')
  @ApiOperation({ summary: 'Obtém os dados do Kanban geral para a loja' })
  @ApiResponse({ status: 200, description: 'Dados do Kanban geral.' })
  async obterKanbanGeral(
    @LojaId() lojaId: string,
    @Query() filtros: KanbanQueryDto,
  ) {
    return this.pcpKanbanService.obterKanbanGeral(lojaId, filtros);
  }

  @Get('fila-setor/:setorId')
  @ApiOperation({
    summary: 'Obtém a fila de produção para um setor específico',
  })
  @ApiResponse({ status: 200, description: 'Fila de produção do setor.' })
  @ApiResponse({ status: 404, description: 'Setor não encontrado.' })
  async obterFilaSetor(
    @Param('setorId') setorId: string,
    @LojaId() lojaId: string,
    @Query('operadorId') operadorId?: string,
  ) {
    return this.pcpKanbanService.obterFilaSetor(lojaId, setorId, operadorId);
  }

  @Get('por-setores')
  @ApiOperation({
    summary: 'Obtém a visão do Kanban agrupada por setores produtivos',
  })
  @ApiResponse({ status: 200, description: 'Kanban por setores produtivos.' })
  async obterKanbanPorSetores(
    @LojaId() lojaId: string,
    @Query() filtros: KanbanPorSetoresQueryDto,
  ) {
    return this.pcpKanbanService.obterKanbanPorSetores(lojaId, filtros);
  }

  @Post('iniciar/:itemOsId')
  @ApiOperation({ summary: 'Inicia produção de um item' })
  @ApiResponse({ status: 200, description: 'Produção iniciada com sucesso.' })
  async iniciarProducao(
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('itemOsId') itemOsId: string,
    @Body() data: IniciarProducaoDto,
  ) {
    await this.pcpKanbanService.iniciarProducao(
      lojaId,
      itemOsId,
      data.operadorId,
      data.observacoes,
      usuario,
      data.maquinaId,
    );
    return { message: 'Produção iniciada com sucesso' };
  }

  @Post('concluir/:itemOsId')
  @ApiOperation({ summary: 'Conclui etapa de produção' })
  @ApiResponse({ status: 200, description: 'Etapa concluída com sucesso.' })
  async concluirEtapa(
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('itemOsId') itemOsId: string,
    @Body() data: ConcluirEtapaDto,
  ) {
    const resultado = await this.pcpKanbanService.concluirEtapa(
      lojaId,
      itemOsId,
      data.operadorId,
      data.observacoes,
      data.quantidadeProduzida,
      usuario,
    );
    return {
      message: 'Etapa concluída com sucesso',
      instalacao: resultado.instalacao,
    };
  }

  @Post('pausar/:itemOsId')
  @ApiOperation({ summary: 'Pausa produção de um item' })
  @ApiResponse({ status: 200, description: 'Produção pausada com sucesso.' })
  async pausarProducao(
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('itemOsId') itemOsId: string,
    @Body() data: PausarProducaoDto,
  ) {
    await this.pcpKanbanService.pausarProducao(
      lojaId,
      itemOsId,
      data.operadorId,
      data.motivo,
      data.observacoes,
      usuario,
    );
    return { message: 'Produção pausada com sucesso' };
  }

  @Post('mover-setor/:itemOsId')
  @ApiOperation({
    summary: 'Move item entre setores seguindo regras de workflow',
  })
  @ApiResponse({ status: 200, description: 'Item movido com sucesso.' })
  async moverItemSetor(
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('itemOsId') itemOsId: string,
    @Body() data: MoverItemSetorDto,
  ) {
    await this.pcpKanbanService.moverItemEntreSetores(
      lojaId,
      itemOsId,
      data,
      usuario,
    );
    return { message: 'Item movido com sucesso' };
  }

  @Put('status/:osId')
  @ApiOperation({ summary: 'Atualiza o status de uma OS no Kanban' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  async atualizarStatusOS(
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('osId') osId: string,
    @Body() data: AtualizarStatusOSDto,
  ) {
    const resultado = await this.pcpKanbanService.atualizarStatusOS(
      lojaId,
      osId,
      data.status,
      usuario,
    );
    return {
      message: 'Status atualizado com sucesso',
      expedicao_criada: resultado.expedicao_criada,
      expedicao_cancelada: resultado.expedicao_cancelada,
      instalacao: resultado.instalacao,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtém estatísticas do Kanban' })
  @ApiResponse({ status: 200, description: 'Estatísticas do Kanban.' })
  async obterEstatisticas(@LojaId() lojaId: string) {
    const kanbanData = await this.pcpKanbanService.obterKanbanGeral(lojaId, {});
    return kanbanData.stats;
  }
}
