import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { SetoresProdutivosService } from '../../services/centros-de-trabalho/setores-produtivos.service';
import {
  CreateSetorProdutivoDto,
  UpdateSetorProdutivoDto,
} from '../../dto/centros-de-trabalho/setores-produtivos.dto';
import { LojaId } from '../../../auth/loja-id.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Centros de Trabalho - Setores Produtivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('centros-de-trabalho/setores-produtivos')
export class SetoresProdutivosController {
  constructor(
    private readonly setoresProdutivosService: SetoresProdutivosService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo setor produtivo' })
  @ApiResponse({
    status: 201,
    description: 'Setor produtivo criado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async criar(@LojaId() lojaId: string, @Body() dto: CreateSetorProdutivoDto) {
    return this.setoresProdutivosService.criar(lojaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os setores produtivos da loja' })
  @ApiResponse({ status: 200, description: 'Lista de setores produtivos.' })
  async listar(@LojaId() lojaId: string, @Query('ativo') ativo?: string) {
    const ativoBoolean = ativo ? ativo === 'true' : undefined;
    return this.setoresProdutivosService.listar(lojaId, ativoBoolean);
  }

  @Get('operador/:operadorId')
  @ApiOperation({ summary: 'Obtém o setor produtivo associado a um operador' })
  @ApiResponse({ status: 200, description: 'Setor produtivo do operador.' })
  @ApiResponse({
    status: 404,
    description: 'Operador não associado a um setor.',
  })
  async obterPorOperador(@Param('operadorId') operadorId: string) {
    return this.setoresProdutivosService.obterPorOperador(operadorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém um setor produtivo pelo ID' })
  @ApiResponse({ status: 200, description: 'Setor produtivo encontrado.' })
  @ApiResponse({ status: 404, description: 'Setor produtivo não encontrado.' })
  async obterPorId(@Param('id') id: string, @LojaId() lojaId: string) {
    return this.setoresProdutivosService.obterPorId(id, lojaId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um setor produtivo existente' })
  @ApiResponse({
    status: 200,
    description: 'Setor produtivo atualizado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Setor produtivo não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async atualizar(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @Body() dto: UpdateSetorProdutivoDto,
  ) {
    return this.setoresProdutivosService.atualizar(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deleta um setor produtivo' })
  @ApiResponse({
    status: 204,
    description: 'Setor produtivo deletado com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Setor produtivo não encontrado.' })
  async deletar(@Param('id') id: string, @LojaId() lojaId: string) {
    await this.setoresProdutivosService.deletar(id, lojaId);
    return { message: 'Setor produtivo deletado com sucesso' };
  }

  @Get(':id/estatisticas')
  @ApiOperation({ summary: 'Obtém estatísticas de um setor produtivo' })
  @ApiResponse({ status: 200, description: 'Estatísticas do setor.' })
  async obterEstatisticas(@Param('id') id: string) {
    return this.setoresProdutivosService.obterEstatisticasSetor(id);
  }
}
