import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransferenciasService } from '../services/transferencias.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { loja } from '@prisma/client';

@ApiTags('Transferências de Estoque')
@ApiBearerAuth()
@Controller('api/estoque/transferencias')
@UseGuards(JwtAuthGuard)
export class TransferenciasController {
  private readonly logger = new Logger(TransferenciasController.name);

  constructor(private readonly transferenciasService: TransferenciasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova transferência' })
  @ApiResponse({ status: 201, description: 'Transferência criada com sucesso' })
  async criarTransferencia(@GetLoja() loja: loja, @Body() data: any) {
    this.logger.log(`🔄 Criando transferência para loja: ${loja.id}`);

    try {
      if (
        !data.itemId ||
        !data.localizacaoOrigemId ||
        !data.localizacaoDestinoId ||
        !data.quantidade
      ) {
        throw new BadRequestException(
          'Dados obrigatórios: itemId, localizacaoOrigemId, localizacaoDestinoId, quantidade',
        );
      }

      if (data.localizacaoOrigemId === data.localizacaoDestinoId) {
        throw new BadRequestException(
          'Localização de origem e destino não podem ser iguais',
        );
      }

      const context = { lojaId: loja.id };
      const transferencia = await this.transferenciasService.criarTransferencia(
        context,
        data,
      );

      return {
        success: true,
        data: transferencia,
        message: 'Transferência criada com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao criar transferência: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar transferências' })
  @ApiResponse({
    status: 200,
    description: 'Lista de transferências retornada com sucesso',
  })
  @ApiQuery({
    name: 'itemId',
    required: false,
    description: 'Filtrar por item de estoque',
  })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    description: 'Data de início (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    description: 'Data de fim (YYYY-MM-DD)',
  })
  async listarTransferencias(@GetLoja() loja: loja, @Query() query: any) {
    this.logger.log(`🔄 Listando transferências para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      const transferencias =
        await this.transferenciasService.listarTransferencias(context, query);

      return {
        success: true,
        data: transferencias,
        message: 'Transferências listadas com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar transferências: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transferência por ID' })
  @ApiResponse({
    status: 200,
    description: 'Transferência encontrada com sucesso',
  })
  async buscarTransferencia(@GetLoja() loja: loja, @Param('id') id: string) {
    this.logger.log(`🔄 Buscando transferência ${id} para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      const transferencia =
        await this.transferenciasService.buscarTransferenciaPorId(context, id);

      return {
        success: true,
        data: transferencia,
        message: 'Transferência encontrada com sucesso',
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar transferência: ${error.message}`);
      throw error;
    }
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Histórico de transferências de um item' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de transferências retornado',
  })
  async historicoTransferenciasItem(
    @GetLoja() loja: loja,
    @Param('itemId') itemId: string,
  ) {
    this.logger.log(
      `🔄 Buscando histórico de transferências do item ${itemId} para loja: ${loja.id}`,
    );

    try {
      const context = { lojaId: loja.id };
      const historico = await this.transferenciasService.listarHistoricoPorItem(
        context,
        itemId,
      );

      return {
        success: true,
        data: historico,
        message: 'Histórico de transferências retornado com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao buscar histórico de transferências: ${error.message}`,
      );
      throw error;
    }
  }
}
