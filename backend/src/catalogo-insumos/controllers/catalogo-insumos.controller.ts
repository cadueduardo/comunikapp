import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CatalogoInsumosService } from '../services/catalogo-insumos.service';
import {
  CreateCatalogoInsumoDto,
  UpdateCatalogoInsumoDto,
  BuscarInsumosDto,
} from '../dto';
import { CatalogoInsumo, PaginatedResult } from '../interfaces';
import { CatalogoInsumoEntity, PaginatedResultEntity } from '../entities/catalogo-insumo.entity';

@ApiTags('Catálogo de Insumos')
@Controller('api/catalogo-insumos')
export class CatalogoInsumosController {
  constructor(
    private readonly catalogoInsumosService: CatalogoInsumosService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo insumo no catálogo' })
  @ApiResponse({
    status: 201,
    description: 'Insumo criado com sucesso',
    type: CatalogoInsumoEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou código já existe',
  })
  async createInsumo(
    @Body() dto: CreateCatalogoInsumoDto,
  ): Promise<CatalogoInsumo> {
    return this.catalogoInsumosService.createInsumo(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar insumos com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de insumos encontrados',
    type: PaginatedResultEntity,
  })
  @ApiQuery({ name: 'nome', required: false, description: 'Nome do insumo' })
  @ApiQuery({ name: 'categoria_id', required: false, description: 'ID da categoria' })
  @ApiQuery({ name: 'marca', required: false, description: 'Marca do insumo' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por ativos' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  async buscarInsumos(
    @Query() filtros: BuscarInsumosDto,
  ): Promise<PaginatedResult<CatalogoInsumo>> {
    return this.catalogoInsumosService.buscarInsumos(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar insumo por ID' })
  @ApiParam({ name: 'id', description: 'ID do insumo' })
  @ApiResponse({
    status: 200,
    description: 'Insumo encontrado',
    type: CatalogoInsumoEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Insumo não encontrado',
  })
  async findInsumoById(@Param('id') id: string): Promise<CatalogoInsumo> {
    return this.catalogoInsumosService.findInsumoById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar insumo existente' })
  @ApiParam({ name: 'id', description: 'ID do insumo' })
  @ApiResponse({
    status: 200,
    description: 'Insumo atualizado com sucesso',
    type: CatalogoInsumoEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Insumo não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou código já existe',
  })
  async updateInsumo(
    @Param('id') id: string,
    @Body() dto: UpdateCatalogoInsumoDto,
  ): Promise<CatalogoInsumo> {
    return this.catalogoInsumosService.updateInsumo(id, dto);
  }

  @Delete(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar insumo (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID do insumo' })
  @ApiResponse({
    status: 200,
    description: 'Insumo desativado com sucesso',
    type: CatalogoInsumoEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Insumo não encontrado',
  })
  async deactivateInsumo(@Param('id') id: string): Promise<CatalogoInsumo> {
    return this.catalogoInsumosService.deactivateInsumo(id);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Ativar insumo desativado' })
  @ApiParam({ name: 'id', description: 'ID do insumo' })
  @ApiResponse({
    status: 200,
    description: 'Insumo ativado com sucesso',
    type: CatalogoInsumoEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Insumo não encontrado',
  })
  async activateInsumo(@Param('id') id: string): Promise<CatalogoInsumo> {
    return this.catalogoInsumosService.activateInsumo(id);
  }

  @Get('categoria/:categoriaId')
  @ApiOperation({ summary: 'Buscar insumos por categoria' })
  @ApiParam({ name: 'categoriaId', description: 'ID da categoria' })
  @ApiResponse({
    status: 200,
    description: 'Lista de insumos da categoria',
    type: [CatalogoInsumoEntity],
  })
  async findInsumosByCategoria(
    @Param('categoriaId') categoriaId: string,
  ): Promise<CatalogoInsumo[]> {
    return this.catalogoInsumosService.findInsumosByCategoria(categoriaId);
  }

  @Get('marca/:marca')
  @ApiOperation({ summary: 'Buscar insumos por marca' })
  @ApiParam({ name: 'marca', description: 'Nome da marca' })
  @ApiResponse({
    status: 200,
    description: 'Lista de insumos da marca',
    type: [CatalogoInsumoEntity],
  })
  async findInsumosByMarca(
    @Param('marca') marca: string,
  ): Promise<CatalogoInsumo[]> {
    return this.catalogoInsumosService.findInsumosByMarca(marca);
  }
}
