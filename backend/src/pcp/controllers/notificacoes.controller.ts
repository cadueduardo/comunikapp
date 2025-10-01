import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { NotificacoesPCPService, NotificacaoPCP } from '../services/notificacoes-pcp.service';

@Controller('pcp/notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private notificacoesService: NotificacoesPCPService) {}

  @Get()
  async buscarNotificacoesPendentes(@Request() req: any): Promise<NotificacaoPCP[]> {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    return this.notificacoesService.buscarNotificacoesPendentes(usuarioId);
  }

  @Put(':id/marcar-lida')
  async marcarComoLida(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<{ success: boolean }> {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    await this.notificacoesService.marcarComoLida(id, usuarioId);
    return { success: true };
  }

  @Post('verificar-atrasos')
  async verificarAtrasos(): Promise<{ message: string; verificadas: number }> {
    await this.notificacoesService.verificarAtrasos();
    return { 
      message: 'Verificação de atrasos concluída',
      verificadas: 0 // TODO: Retornar número real de verificações
    };
  }

  @Post('verificar-sla-critico')
  async verificarSLACritico(): Promise<{ message: string; verificadas: number }> {
    await this.notificacoesService.verificarSLACritico();
    return { 
      message: 'Verificação de SLA crítico concluída',
      verificadas: 0 // TODO: Retornar número real de verificações
    };
  }
}
