import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { NotificacoesService } from './notificacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private notificacoesService: NotificacoesService) {}

  @Get()
  async buscarNotificacoes(@Request() req) {
    const loja_id = req.user.loja_id;
    return this.notificacoesService.buscarNotificacoes(loja_id);
  }

  @Post(':id/marcar-lida')
  async marcarComoLida(@Param('id') id: string, @Request() req) {
    const loja_id = req.user.loja_id;
    return this.notificacoesService.marcarComoLida(id, loja_id);
  }

  @Post('marcar-todas-lidas')
  async marcarTodasComoLidas(@Request() req) {
    const loja_id = req.user.loja_id;
    return this.notificacoesService.marcarTodasComoLidas(loja_id);
  }

  @Get('contar-nao-lidas')
  async contarNaoLidas(@Request() req) {
    const loja_id = req.user.loja_id;
    const count = await this.notificacoesService.contarNaoLidas(loja_id);
    return { count };
  }
} 