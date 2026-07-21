import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { loja } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, GetLoja } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { SolicitacoesService } from '../services/solicitacoes.service';
import { CreateSolicitacaoDto } from '../dto/create-solicitacao.dto';
import { UpdateSolicitacaoDto } from '../dto/update-solicitacao.dto';
import { RejeitarSolicitacaoDto } from '../dto/rejeitar-solicitacao.dto';

@Controller('compras/solicitacoes')
@UseGuards(JwtAuthGuard)
export class SolicitacoesController {
  constructor(private readonly solicitacoesService: SolicitacoesService) {}

  @Post()
  create(
    @Body() dto: CreateSolicitacaoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitacoesService.create(dto, lojaAtual, usuario.id);
  }

  @Get()
  findAll(@GetLoja() lojaAtual: loja) {
    return this.solicitacoesService.findAll(lojaAtual);
  }

  @Get(':id/historico')
  historico(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.solicitacoesService.historico(id, lojaAtual);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetLoja() lojaAtual: loja) {
    return this.solicitacoesService.findOne(id, lojaAtual);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSolicitacaoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitacoesService.update(id, dto, lojaAtual, usuario.id);
  }

  @Post(':id/enviar')
  enviar(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitacoesService.enviar(id, lojaAtual, usuario.id);
  }

  @Post(':id/aprovar')
  aprovar(
    @Param('id') id: string,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitacoesService.aprovar(id, lojaAtual, usuario.id);
  }

  @Post(':id/rejeitar')
  rejeitar(
    @Param('id') id: string,
    @Body() dto: RejeitarSolicitacaoDto,
    @GetLoja() lojaAtual: loja,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitacoesService.rejeitar(
      id,
      lojaAtual,
      usuario.id,
      dto.motivo,
    );
  }
}
