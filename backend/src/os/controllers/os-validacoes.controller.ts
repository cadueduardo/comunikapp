/**
 * Controller para validações automáticas de OS
 * Expõe endpoints para executar e consultar validações
 */

import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OSValidacoesService } from '../services/os-validacoes.service';

@ApiTags('OS - Validações Automáticas')
@ApiBearerAuth()
@Controller('os/validacoes')
@UseGuards(JwtAuthGuard)
export class OSValidacoesController {
  constructor(private readonly osValidacoesService: OSValidacoesService) {}

  @Post(':id/executar')
  @ApiOperation({ summary: 'Executar validações automáticas para uma OS' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  async executarValidacoes(@Param('id') osId: string, @Request() req: any) {
    const lojaId = req.user.loja_id;
    return await this.osValidacoesService.validarOS(osId, lojaId);
  }

  @Post(':id/executar/:categoria')
  @ApiOperation({ summary: 'Executar validações de uma categoria específica' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  @ApiParam({ name: 'categoria', description: 'Categoria das validações (ESTOQUE, ARTE, DADOS, etc.)' })
  async executarValidacoesPorCategoria(
    @Param('id') osId: string,
    @Param('categoria') categoria: string,
    @Request() req: any
  ) {
    const lojaId = req.user.loja_id;
    return await this.osValidacoesService.validarOSPorCategoria(osId, lojaId, categoria);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Obter histórico de validações de uma OS' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  async obterHistorico(@Param('id') osId: string) {
    return await this.osValidacoesService.obterHistoricoValidacoes(osId);
  }

  @Get(':id/pode-aprovar')
  @ApiOperation({ summary: 'Verificar se uma OS pode ser aprovada' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  async podeAprovar(@Param('id') osId: string, @Request() req: any) {
    const lojaId = req.user.loja_id;
    const podeAprovar = await this.osValidacoesService.podeAprovarOS(osId, lojaId);
    return { pode_aprovar: podeAprovar };
  }
}






