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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EstoqueSimpleService } from '../services/estoque-simple.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { Loja } from '@prisma/client';

@ApiTags('Gestão de Lotes')
@ApiBearerAuth()
@Controller('api/estoque/lotes')
@UseGuards(JwtAuthGuard)
export class LotesController {
  private readonly logger = new Logger(LotesController.name);

  constructor(private readonly estoqueService: EstoqueSimpleService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo lote' })
  @ApiResponse({ status: 201, description: 'Lote criado com sucesso' })
  async criarLote(@GetLoja() loja: Loja, @Body() data: any) {
    this.logger.log(`📦 Criando lote para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      const lote = await this.estoqueService.criarLote(context, data);

      return {
        success: true,
        data: lote,
        message: 'Lote criado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao criar lote: ${error.message}`);
      throw error;
    }
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
  async listarLotes(@GetLoja() loja: Loja, @Query() query: any) {
    this.logger.log(`📦 Listando lotes para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      const lotes = await this.estoqueService.listarLotes(context, query);

      return {
        success: true,
        data: lotes,
        message: 'Lotes listados com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar lotes: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lote por ID' })
  @ApiResponse({ status: 200, description: 'Lote encontrado com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async buscarLote(@GetLoja() loja: Loja, @Param('id') id: string) {
    this.logger.log(`📦 Buscando lote ${id} para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      const lote = await this.estoqueService.buscarLotePorId(context, id);

      if (!lote) {
        throw new NotFoundException('Lote não encontrado');
      }

      return {
        success: true,
        data: lote,
        message: 'Lote encontrado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar lote: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lote' })
  @ApiResponse({ status: 200, description: 'Lote atualizado com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async atualizarLote(
    @GetLoja() loja: Loja,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.logger.log(`📦 Atualizando lote ${id} para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      const lote = await this.estoqueService.atualizarLote(context, id, data);

      return {
        success: true,
        data: lote,
        message: 'Lote atualizado com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar lote: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir lote' })
  @ApiResponse({ status: 200, description: 'Lote excluído com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async excluirLote(@GetLoja() loja: Loja, @Param('id') id: string) {
    this.logger.log(`📦 Excluindo lote ${id} para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      await this.estoqueService.excluirLote(context, id);

      return {
        success: true,
        message: 'Lote excluído com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao excluir lote: ${error.message}`);
      throw error;
    }
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
    @GetLoja() loja: Loja,
    @Query('dias') dias: string = '30',
  ) {
    this.logger.log(
      `📦 Buscando lotes próximos do vencimento para loja: ${loja.id}`,
    );

    try {
      const context = { lojaId: loja.id };
      const diasNum = parseInt(dias) || 30;
      const lotes = await this.estoqueService.lotesProximosVencimento(
        context,
        diasNum,
      );

      return {
        success: true,
        data: lotes,
        message: 'Lotes próximos do vencimento retornados com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar lotes próximos do vencimento: ${error.message}`,
      );
      throw error;
    }
  }

  @Post(':id/consumir')
  @ApiOperation({ summary: 'Consumir quantidade do lote' })
  @ApiResponse({ status: 200, description: 'Quantidade consumida com sucesso' })
  @ApiParam({ name: 'id', description: 'ID do lote' })
  async consumirLote(
    @GetLoja() loja: Loja,
    @Param('id') id: string,
    @Body() data: { quantidade: number },
  ) {
    this.logger.log(`📦 Consumindo lote ${id} para loja: ${loja.id}`);

    try {
      if (!data.quantidade || data.quantidade <= 0) {
        throw new BadRequestException('Quantidade deve ser maior que zero');
      }

      const context = { lojaId: loja.id };
      const resultado = await this.estoqueService.consumirLote(
        context,
        id,
        data.quantidade,
      );

      return {
        success: true,
        data: resultado,
        message: 'Quantidade consumida com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao consumir lote: ${error.message}`);
      throw error;
    }
  }
}
