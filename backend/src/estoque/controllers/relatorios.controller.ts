import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RelatoriosEstoqueService } from '../services/relatorios-estoque.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { GetLoja } from '../../auth/decorators';
import { loja } from '@prisma/client';

@ApiTags('Relatórios de Estoque')
@ApiBearerAuth()
@Controller('api/estoque/relatorios')
@UseGuards(JwtAuthGuard)
export class RelatoriosController {
  private readonly logger = new Logger(RelatoriosController.name);

  constructor(private readonly relatoriosService: RelatoriosEstoqueService) {}

  @Get('baixo')
  @ApiOperation({ summary: 'Relatório de estoque baixo' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de estoque baixo retornado com sucesso',
  })
  async relatorioEstoqueBaixo(@GetLoja() loja: loja) {
    this.logger.log(
      `📊 Gerando relatório de estoque baixo para loja: ${loja.id}`,
    );

    try {
      const context = { lojaId: loja.id };
      const relatorio =
        await this.relatoriosService.relatorioEstoqueBaixo(context);

      return {
        success: true,
        data: relatorio,
        message: 'Relatório de estoque baixo gerado com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao gerar relatório de estoque baixo: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('vencimento')
  @ApiOperation({ summary: 'Relatório de próximos vencimentos' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de vencimentos retornado com sucesso',
  })
  async relatorioVencimento(@GetLoja() loja: loja) {
    this.logger.log(
      `📊 Gerando relatório de vencimentos para loja: ${loja.id}`,
    );

    try {
      const context = { lojaId: loja.id };
      const relatorio =
        await this.relatoriosService.relatorioVencimento(context);

      return {
        success: true,
        data: relatorio,
        message: 'Relatório de vencimentos gerado com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao gerar relatório de vencimentos: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('ocupacao')
  @ApiOperation({ summary: 'Relatório de ocupação por depósito' })
  @ApiResponse({
    status: 200,
    description: 'Relatório de ocupação retornado com sucesso',
  })
  async relatorioOcupacao(@GetLoja() loja: loja) {
    this.logger.log(`📊 Gerando relatório de ocupação para loja: ${loja.id}`);

    try {
      const context = { lojaId: loja.id };
      const relatorio = await this.relatoriosService.relatorioOcupacao(context);

      return {
        success: true,
        data: relatorio,
        message: 'Relatório de ocupação gerado com sucesso',
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao gerar relatório de ocupação: ${error.message}`,
      );
      throw error;
    }
  }
}
