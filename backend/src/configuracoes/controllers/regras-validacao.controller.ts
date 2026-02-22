/**
 * Controller de Regras de Validação
 * CRUD para regras de validação
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequestWithUser } from '../../auth/auth.service';
import { RegrasValidacaoService } from '../services/regras-validacao.service';
import {
  CreateRegraValidacaoDto,
  UpdateRegraValidacaoDto,
  ListarRegrasDto,
  TestarRegraDto,
} from '../dto/regra-validacao.dto';

@ApiTags('Configurações - Regras de Validação')
@ApiBearerAuth()
@Controller('configuracoes/regras-validacao')
@UseGuards(JwtAuthGuard)
export class RegrasValidacaoController {
  constructor(private readonly regraService: RegrasValidacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova regra de validação' })
  @ApiResponse({
    status: 201,
    description: 'Regra criada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async criarRegra(
    @Body() dto: CreateRegraValidacaoDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.regraService.criar(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar regras de validação' })
  @ApiQuery({ name: 'loja_id', required: false, description: 'ID da loja' })
  @ApiQuery({
    name: 'categoria',
    required: false,
    description: 'Categoria da regra',
  })
  @ApiQuery({ name: 'ativo', required: false, description: 'Apenas ativas' })
  @ApiQuery({ name: 'busca', required: false, description: 'Termo de busca' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite por página',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de regras obtida com sucesso',
  })
  async listarRegras(@Query() filtros: ListarRegrasDto) {
    return await this.regraService.listar(filtros);
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Listar categorias de regras' })
  @ApiResponse({
    status: 200,
    description: 'Categorias obtidas com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          cor: { type: 'string' },
          icone: { type: 'string' },
        },
      },
    },
  })
  async listarCategorias() {
    return await this.regraService.obterCategorias();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter regra específica' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({
    status: 200,
    description: 'Regra obtida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Regra não encontrada',
  })
  async obterRegra(@Param('id', ParseUUIDPipe) id: string) {
    return await this.regraService.obter(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar regra' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({
    status: 200,
    description: 'Regra atualizada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Regra não encontrada',
  })
  async atualizarRegra(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegraValidacaoDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.regraService.atualizar(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar regra' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({
    status: 200,
    description: 'Regra deletada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Regra não encontrada',
  })
  async deletarRegra(@Param('id', ParseUUIDPipe) id: string) {
    await this.regraService.deletar(id);
    return { sucesso: true, mensagem: 'Regra deletada com sucesso' };
  }

  @Post(':id/duplicar')
  @ApiOperation({ summary: 'Duplicar regra' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({
    status: 201,
    description: 'Regra duplicada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Regra não encontrada',
  })
  async duplicarRegra(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return await this.regraService.duplicar(id, req.user.id);
  }

  @Post(':id/testar')
  @ApiOperation({ summary: 'Testar regra específica' })
  @ApiParam({ name: 'id', description: 'ID da regra' })
  @ApiResponse({
    status: 200,
    description: 'Teste executado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Regra não encontrada',
  })
  async testarRegra(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TestarRegraDto,
    @Request() req: RequestWithUser,
  ) {
    return await this.regraService.testar(id, dto, req.user.loja_id);
  }
}
