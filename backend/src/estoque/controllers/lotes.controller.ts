import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { QueryLotesDto } from '../dto/query-lotes.dto';
import { LotesService } from '../services/lotes.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { loja } from '@prisma/client';
import { withLog } from './controller-utils';

@ApiTags('Gestão de Lotes')
@ApiBearerAuth()
@Controller('api/estoque/lotes')
@UseGuards(JwtAuthGuard)
export class LotesController {
  private readonly logger = new Logger(LotesController.name);

  constructor(private readonly lotesService: LotesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo lote' })
  @ApiResponse({ status: 201, description: 'Lote criado com sucesso' })
  async criarLote(@GetLoja() loja: loja, @Body() data: any) {
    this.logger.log(`📦 Criando lote para loja: ${loja.id}`);
    const context = { lojaId: loja.id };
    return withLog(this.logger, 'Erro ao criar lote', 'Lote criado com sucesso', () =>
      this.lotesService.criarLote(context, data),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar lotes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de lotes retornada com sucesso',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'estoqueId',
    required: false,
    description: 'Filtrar por item de estoque',
  })
  async listarLotes(@GetLoja() loja: loja, @Query() query: QueryLotesDto) {
    this.logger.log(`📦 Listando lotes para loja: ${loja.id}`);
    const context = { lojaId: loja.id };
    return withLog(this.logger, 'Erro ao listar lotes', 'Lotes listados com sucesso', () =>
      this.lotesService.listarLotes(context, query),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lote por ID' })
  @ApiResponse({ status: 200, description: 'Lote encontrado com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async buscarLote(@GetLoja() loja: loja, @Param('id') id: string) {
    this.logger.log(`📦 Buscando lote ${id} para loja: ${loja.id}`);
    const context = { lojaId: loja.id };
    return withLog(this.logger, 'Erro ao buscar lote', 'Lote encontrado com sucesso', async () => {
      const lote = await this.lotesService.buscarLotePorId(context, id);
      if (!lote) throw new NotFoundException('Lote não encontrado');
      return lote;
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lote' })
  @ApiResponse({ status: 200, description: 'Lote atualizado com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async atualizarLote(
    @GetLoja() loja: loja,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.logger.log(`📦 Atualizando lote ${id} para loja: ${loja.id}`);
    const context = { lojaId: loja.id };
    return withLog(this.logger, 'Erro ao atualizar lote', 'Lote atualizado com sucesso', () =>
      this.lotesService.atualizarLote(context, id, data),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir lote' })
  @ApiResponse({ status: 200, description: 'Lote excluído com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async excluirLote(@GetLoja() loja: loja, @Param('id') id: string) {
    this.logger.log(`📦 Excluindo lote ${id} para loja: ${loja.id}`);
    const context = { lojaId: loja.id };
    return withLog(this.logger, 'Erro ao excluir lote', 'Lote excluído com sucesso', async () => {
      await this.lotesService.excluirLote(context, id);
      return undefined as any;
    });
  }

  @Get('vencimento/proximos')
  @ApiOperation({ summary: 'Lotes próximos do vencimento' })
  @ApiResponse({
    status: 200,
    description: 'Lotes próximos do vencimento retornados',
  })
  @ApiQuery({
    name: 'dias',
    required: false,
    description: 'Dias para vencimento (padrão: 30)',
  })
  async lotesProximosVencimento(
    @GetLoja() loja: loja,
    @Query('dias') dias: string = '30',
  ) {
    this.logger.log(`📦 Buscando lotes próximos do vencimento para loja: ${loja.id}`);
    const context = { lojaId: loja.id };
    const diasNum = parseInt(dias) || 30;
    return withLog(this.logger, 'Erro ao buscar lotes próximos do vencimento', 'Lotes próximos do vencimento retornados com sucesso', () =>
      this.lotesService.lotesProximosVencimento(context, diasNum),
    );
  }

  @Post(':id/consumir')
  @ApiOperation({ summary: 'Consumir quantidade do lote' })
  @ApiResponse({ status: 200, description: 'Quantidade consumida com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async consumirLote(
    @GetLoja() loja: loja,
    @Param('id') id: string,
    @Body() data: { quantidade: number },
  ) {
    this.logger.log(`📦 Consumindo lote ${id} para loja: ${loja.id}`);
    if (!data.quantidade || data.quantidade <= 0) {
      throw new BadRequestException('Quantidade deve ser maior que zero');
    }
    const context = { lojaId: loja.id };
    return withLog(this.logger, 'Erro ao consumir lote', 'Quantidade consumida com sucesso', () =>
      this.lotesService.consumirLote(context, id, data.quantidade),
    );
  }
}
