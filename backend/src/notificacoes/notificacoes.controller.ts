import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';

@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  async buscarNotificacoes(
    @CurrentLojaId() lojaId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNumber = limit ? parseInt(limit) : 50;
    const offsetNumber = offset ? parseInt(offset) : 0;
    return this.notificacoesService.buscarNotificacoes(lojaId, limitNumber, offsetNumber);
  }

  @Get('nao-visualizadas')
  async buscarNaoVisualizadas(@CurrentLojaId() lojaId: string) {
    return this.notificacoesService.buscarNaoVisualizadas(lojaId);
  }

  @Get('nao-visualizadas/count')
  async contarNaoVisualizadas(@CurrentLojaId() lojaId: string) {
    const count = await this.notificacoesService.contarNaoVisualizadas(lojaId);
    return { count };
  }

  @Post(':id/visualizar')
  async marcarComoVisualizada(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string,
  ) {
    await this.notificacoesService.marcarComoVisualizada(id, lojaId);
    return { message: 'Notificação marcada como visualizada' };
  }

  @Post('visualizar-todas')
  async marcarTodasComoVisualizadas(@CurrentLojaId() lojaId: string) {
    await this.notificacoesService.marcarTodasComoVisualizadas(lojaId);
    return {
      message: 'Todas as notificações foram marcadas como visualizadas',
    };
  }

  @Post(':id/deletar')
  async deletarNotificacao(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string,
  ) {
    await this.notificacoesService.deletarNotificacao(id, lojaId);
    return { message: 'Notificação deletada com sucesso' };
  }
}
