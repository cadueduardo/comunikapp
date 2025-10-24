import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SetorProdutivoService } from '../services/setor-produtivo.service';
import { CreateSetorProdutivoDto, UpdateSetorProdutivoDto } from '../dto/setor-produtivo.dto';
import { LojaId } from '../../auth/loja-id.decorator';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('PCP - Setores Produtivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pcp/setores-produtivos')
export class SetorProdutivoController {
  constructor(private readonly setorProdutivoService: SetorProdutivoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo setor produtivo' })
  @ApiResponse({ status: 201, description: 'Setor produtivo criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async criar(@LojaId() lojaId: string, @Body() dto: CreateSetorProdutivoDto) {
    return this.setorProdutivoService.criar(lojaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os setores produtivos da loja' })
  @ApiResponse({ status: 200, description: 'Lista de setores produtivos.' })
  async listar(@LojaId() lojaId: string, @Query('ativo') ativo?: string) {
    const ativoBoolean = ativo ? (ativo === 'true') : undefined;
    return this.setorProdutivoService.listar(lojaId, ativoBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém um setor produtivo pelo ID' })
  @ApiResponse({ status: 200, description: 'Setor produtivo encontrado.' })
  @ApiResponse({ status: 404, description: 'Setor produtivo não encontrado.' })
  async obterPorId(@Param('id') id: string, @LojaId() lojaId: string) {
    return this.setorProdutivoService.obterPorId(id, lojaId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um setor produtivo existente' })
  @ApiResponse({ status: 200, description: 'Setor produtivo atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Setor produtivo não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async atualizar(@Param('id') id: string, @LojaId() lojaId: string, @Body() dto: UpdateSetorProdutivoDto) {
    return this.setorProdutivoService.atualizar(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deleta um setor produtivo' })
  @ApiResponse({ status: 204, description: 'Setor produtivo deletado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Setor produtivo não encontrado.' })
  async deletar(@Param('id') id: string, @LojaId() lojaId: string) {
    await this.setorProdutivoService.deletar(id, lojaId);
    return { message: 'Setor produtivo deletado com sucesso' };
  }

  @Get('operador/:operadorId')
  @ApiOperation({ summary: 'Obtém o setor produtivo associado a um operador' })
  @ApiResponse({ status: 200, description: 'Setor produtivo do operador.' })
  @ApiResponse({ status: 404, description: 'Operador não associado a um setor.' })
  async obterPorOperador(@Param('operadorId') operadorId: string) {
    return this.setorProdutivoService.obterPorOperador(operadorId);
  }

  @Get(':id/estatisticas')
  @ApiOperation({ summary: 'Obtém estatísticas de um setor produtivo' })
  @ApiResponse({ status: 200, description: 'Estatísticas do setor.' })
  async obterEstatisticas(@Param('id') id: string) {
    return this.setorProdutivoService.obterEstatisticasSetor(id);
  }
}

