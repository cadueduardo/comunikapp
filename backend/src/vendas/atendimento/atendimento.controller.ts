import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { AtendimentoService } from './atendimento.service';
import { CriarAtendimentoDto } from './dto/criar-atendimento.dto';

@ApiTags('Vendas — Atendimento')
@ApiBearerAuth()
@Controller('vendas/atendimento')
@UseGuards(JwtAuthGuard)
export class AtendimentoController {
  constructor(private readonly atendimento: AtendimentoService) {}

  @Post()
  @ApiOperation({
    summary: 'Novo atendimento idempotente (prospect + demanda + deep-link)',
  })
  criar(@Request() req: unknown, @Body() dto: CriarAtendimentoDto) {
    return this.atendimento.criar(extrairIdentidadeAutenticada(req), dto);
  }
}
