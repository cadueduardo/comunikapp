import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { CurrentUser } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { WebsocketsService } from '../../websockets/websockets.service';
import { WS_EXPEDICAO_DEVOLVIDA } from '../constants/expedicao-events.constants';
import {
  ArquivarExpedicaoDto,
  AtualizarExpedicaoDto,
  AtualizarStatusExpedicaoDto,
  ConcluirEntregaDto,
  DevolverProducaoDto,
  ListarExpedicaoQueryDto,
  TransformarTemplateDto,
} from '../dto/expedicao.dto';
import { ExpedicaoPermissionsGuard } from '../guards/expedicao-permissions.guard';
import { ExpedicaoDevolucaoService } from '../services/expedicao-devolucao.service';
import { ExpedicaoKanbanService } from '../services/expedicao-kanban.service';
import { ExpedicaoService } from '../services/expedicao.service';
import { ExpedicaoTemplateService } from '../services/expedicao-template.service';

@ApiTags('Expedição')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ExpedicaoPermissionsGuard)
@Controller('expedicao')
export class ExpedicaoController {
  private readonly logger = new Logger(ExpedicaoController.name);

  constructor(
    private readonly kanbanService: ExpedicaoKanbanService,
    private readonly expedicaoService: ExpedicaoService,
    private readonly devolucaoService: ExpedicaoDevolucaoService,
    private readonly templateService: ExpedicaoTemplateService,
    private readonly websocketsService: WebsocketsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Kanban logístico agrupado por status' })
  async listarKanban(
    @LojaId() lojaId: string,
    @Query() filtros: ListarExpedicaoQueryDto,
  ) {
    return this.kanbanService.listarKanbanAtivo(lojaId, filtros);
  }

  @Get('arquivo')
  @ApiOperation({
    summary: 'Arquivo morto: expedições ARQUIVADO e histórico DEVOLVIDA',
  })
  async listarArquivo(
    @LojaId() lojaId: string,
    @Query() filtros: ListarExpedicaoQueryDto,
  ) {
    return this.kanbanService.listarArquivo(lojaId, filtros);
  }

  @Get('os/:osId')
  @ApiOperation({ summary: 'Detalhe da expedição ativa por OS (deep link)' })
  async obterPorOs(@Param('osId') osId: string, @LojaId() lojaId: string) {
    return this.expedicaoService.obterDetalhePorOs(osId, lojaId);
  }

  @Post('os/:osId/transformar-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clona produtos do orçamento da OS para templates reutilizáveis',
  })
  async transformarTemplate(
    @Param('osId') osId: string,
    @LojaId() lojaId: string,
    @Body() dto: TransformarTemplateDto,
  ) {
    return this.templateService.transformarDeOs(osId, lojaId, dto.nome);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe da expedição por id' })
  async obterDetalhe(@Param('id') id: string, @LojaId() lojaId: string) {
    return this.expedicaoService.obterDetalhe(id, lojaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza modalidade, rastreio e observações' })
  async atualizarExpedicao(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @Body() dto: AtualizarExpedicaoDto,
  ) {
    return this.expedicaoService.atualizarExpedicao(id, lojaId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Move card no kanban logístico' })
  async atualizarStatus(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @Body() dto: AtualizarStatusExpedicaoDto,
  ) {
    return this.expedicaoService.atualizarStatus(id, lojaId, dto.status);
  }

  @Post(':id/concluir-entrega')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conclui entrega com assinatura e trava financeira' })
  async concluirEntrega(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @Body() dto: ConcluirEntregaDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.expedicaoService.concluirEntrega(id, lojaId, dto, usuario);
  }

  @Post(':id/arquivar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arquiva expedição já entregue' })
  async arquivar(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @Body() dto: ArquivarExpedicaoDto,
  ) {
    return this.expedicaoService.arquivar(id, lojaId, dto);
  }

  @Post(':id/devolver-producao')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Devolve OS da expedição para retrabalho no PCP' })
  async devolverProducao(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: DevolverProducaoDto,
  ) {
    const resultado = await this.devolucaoService.devolverParaProducao({
      expedicaoId: id,
      lojaId,
      usuarioId: usuario.id,
      motivo: dto.motivo,
    });

    this.notificarDevolucaoFailSafe(lojaId, resultado);

    return resultado;
  }

  private notificarDevolucaoFailSafe(
    lojaId: string,
    resultado: {
      expedicao_id: string;
      os_id: string;
      workflow_reativado: boolean;
    },
  ): void {
    try {
      void this.websocketsService.emitToLoja(lojaId, WS_EXPEDICAO_DEVOLVIDA, {
        tipo: 'EXPEDICAO_DEVOLVIDA',
        expedicao_id: resultado.expedicao_id,
        os_id: resultado.os_id,
        workflow_reativado: resultado.workflow_reativado,
        loja_id: lojaId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao emitir WebSocket ${WS_EXPEDICAO_DEVOLVIDA}:`,
        error,
      );
    }
  }
}
