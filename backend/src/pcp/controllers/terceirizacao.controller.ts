import { Controller, Get, Param, Patch, Query, Body, UseGuards } from '@nestjs/common';
import { StatusOrdemTerceirizacao, loja } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { AtualizarStatusTerceirizacaoDto } from '../dto/atualizar-status-terceirizacao.dto';
import { TerceirizacaoService } from '../services/terceirizacao.service';

@Controller('pcp/terceirizacao')
@UseGuards(JwtAuthGuard)
export class TerceirizacaoController {
  constructor(private readonly terceirizacaoService: TerceirizacaoService) {}

  @Get()
  listar(
    @GetLoja() lojaAtual: loja,
    @Query('status') status?: StatusOrdemTerceirizacao,
  ) {
    return this.terceirizacaoService.listar(lojaAtual.id, status);
  }

  @Patch(':id/status')
  atualizarStatus(
    @GetLoja() lojaAtual: loja,
    @Param('id') id: string,
    @Body() dto: AtualizarStatusTerceirizacaoDto,
  ) {
    return this.terceirizacaoService.atualizarStatus(lojaAtual.id, id, dto);
  }
}
