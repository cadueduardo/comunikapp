import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Identidade, IdentidadeAutenticada } from '../auth/decorators';

@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  async buscarNotificacoes(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNumber = limit ? parseInt(limit) : 50;
    const offsetNumber = offset ? parseInt(offset) : 0;
    return this.notificacoesService.buscarNotificacoes(
      identidade?.lojaId,
      identidade?.usuarioId,
      limitNumber,
      offsetNumber,
    );
  }

  @Get('nao-visualizadas')
  async buscarNaoVisualizadas(@Identidade() identidade: IdentidadeAutenticada) {
    return this.notificacoesService.buscarNaoVisualizadas(
      identidade?.lojaId,
      identidade?.usuarioId,
    );
  }

  @Get('nao-visualizadas/count')
  async contarNaoVisualizadas(@Identidade() identidade: IdentidadeAutenticada) {
    const count = await this.notificacoesService.contarNaoVisualizadas(
      identidade?.lojaId,
      identidade?.usuarioId,
    );
    return { count };
  }

  @Post(':id/visualizar')
  async marcarComoVisualizada(
    @Param('id') id: string,
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    await this.notificacoesService.marcarComoVisualizada(
      id,
      identidade.lojaId,
      identidade.usuarioId,
    );
    return { message: 'Notificação marcada como visualizada' };
  }

  @Post('visualizar-todas')
  async marcarTodasComoVisualizadas(@Identidade() identidade: IdentidadeAutenticada) {
    await this.notificacoesService.marcarTodasComoVisualizadas(
      identidade.lojaId,
      identidade.usuarioId,
    );
    return {
      message: 'Todas as notificações foram marcadas como visualizadas',
    };
  }

  @Post(':id/deletar')
  async deletarNotificacao(
    @Param('id') id: string,
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    await this.notificacoesService.deletarNotificacao(
      id,
      identidade.lojaId,
      identidade.usuarioId,
    );
    return { message: 'Notificação deletada com sucesso' };
  }
}
