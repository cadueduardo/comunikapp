import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CentroCustoService } from '../services/centro-custo.service';

@ApiTags('Controles de Centro de Custo')
@ApiBearerAuth()
@Controller('os/centro-custo')
@UseGuards(JwtAuthGuard)
export class CentroCustoController {
  constructor(private readonly centroCustoService: CentroCustoService) {}

  @Get('listar/:lojaId')
  @ApiOperation({ summary: 'Listar todos os centros de custo de uma loja' })
  @ApiResponse({
    status: 200,
    description: 'Lista de centros de custo obtida com sucesso',
  })
  async listarCentrosCusto(@Param('lojaId') lojaId: string) {
    const centrosCusto =
      await this.centroCustoService.listarCentrosCusto(lojaId);

    return {
      loja_id: lojaId,
      total_centros: centrosCusto.length,
      centros_custo: centrosCusto,
    };
  }

  @Get('validar-orcamento/:centroCusto')
  @ApiOperation({ summary: 'Validar orçamento disponível no centro de custo' })
  @ApiResponse({
    status: 200,
    description: 'Validação de orçamento realizada com sucesso',
  })
  @ApiQuery({ name: 'valor_solicitado', required: true, type: Number })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  async validarOrcamentoDisponivel(
    @Param('centroCusto') centroCusto: string,
    @Query('valor_solicitado') valorSolicitado: number,
    @Query('loja_id') lojaId: string,
  ) {
    const validacao = await this.centroCustoService.validarOrcamentoDisponivel(
      centroCusto,
      valorSolicitado,
      lojaId,
    );

    return {
      centro_custo: centroCusto,
      valor_solicitado: valorSolicitado,
      loja_id: lojaId,
      ...validacao,
    };
  }

  @Post('reservar-orcamento')
  @ApiOperation({ summary: 'Reservar orçamento no centro de custo' })
  @ApiResponse({ status: 200, description: 'Orçamento reservado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Orçamento insuficiente ou dados inválidos',
  })
  async reservarOrcamento(
    @Body()
    body: {
      centro_custo: string;
      valor: number;
      loja_id: string;
      os_id: string;
      observacoes?: string;
    },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    const resultado = await this.centroCustoService.reservarOrcamento(
      body.centro_custo,
      body.valor,
      body.loja_id,
      body.os_id,
      usuarioId,
      body.observacoes,
    );

    return {
      sucesso: resultado.sucesso,
      reserva_id: resultado.reserva_id,
      valor_reservado: resultado.valor_reservado,
      data_reserva: resultado.data_reserva,
      motivo_rejeicao: resultado.motivo_rejeicao,
      centro_custo: body.centro_custo,
      os_id: body.os_id,
    };
  }

  @Patch('liberar-orcamento')
  @ApiOperation({ summary: 'Liberar orçamento reservado' })
  @ApiResponse({ status: 200, description: 'Orçamento liberado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Reserva não encontrada ou dados inválidos',
  })
  async liberarOrcamento(
    @Body()
    body: {
      reserva_id: string;
      centro_custo: string;
      valor: number;
      loja_id: string;
      os_id: string;
      motivo?: string;
    },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    const resultado = await this.centroCustoService.liberarOrcamento(
      body.reserva_id,
      body.centro_custo,
      body.valor,
      body.loja_id,
      body.os_id,
      usuarioId,
      body.motivo,
    );

    return {
      sucesso: resultado.sucesso,
      motivo: resultado.motivo,
      reserva_id: body.reserva_id,
      valor_liberado: body.valor,
      centro_custo: body.centro_custo,
      os_id: body.os_id,
    };
  }

  @Get('relatorio-consumo-departamento')
  @ApiOperation({ summary: 'Obter relatório de consumo por departamento' })
  @ApiResponse({ status: 200, description: 'Relatório obtido com sucesso' })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  @ApiQuery({ name: 'departamento', required: false, type: String })
  @ApiQuery({ name: 'periodo_inicio', required: false, type: Date })
  @ApiQuery({ name: 'periodo_fim', required: false, type: Date })
  async obterRelatorioConsumoDepartamento(
    @Query('loja_id') lojaId: string,
    @Query('departamento') departamento?: string,
    @Query('periodo_inicio') periodoInicio?: Date,
    @Query('periodo_fim') periodoFim?: Date,
  ) {
    const relatorios =
      await this.centroCustoService.obterRelatorioConsumoDepartamento(
        lojaId,
        departamento,
        periodoInicio,
        periodoFim,
      );

    return {
      loja_id: lojaId,
      departamento: departamento,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      total_departamentos: relatorios.length,
      relatorios: relatorios,
    };
  }

  @Get('relatorio-consolidado')
  @ApiOperation({
    summary: 'Obter relatório consolidado de todos os departamentos',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório consolidado obtido com sucesso',
  })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  @ApiQuery({ name: 'periodo_inicio', required: false, type: Date })
  @ApiQuery({ name: 'periodo_fim', required: false, type: Date })
  async obterRelatorioConsolidado(
    @Query('loja_id') lojaId: string,
    @Query('periodo_inicio') periodoInicio?: Date,
    @Query('periodo_fim') periodoFim?: Date,
  ) {
    const relatorio = await this.centroCustoService.obterRelatorioConsolidado(
      lojaId,
      periodoInicio,
      periodoFim,
    );

    return {
      loja_id: lojaId,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      ...relatorio,
    };
  }

  @Get('alertas-limite-gastos')
  @ApiOperation({ summary: 'Obter alertas de limite de gastos' })
  @ApiResponse({ status: 200, description: 'Alertas obtidos com sucesso' })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  @ApiQuery({ name: 'departamento', required: false, type: String })
  @ApiQuery({ name: 'apenas_criticos', required: false, type: Boolean })
  async obterAlertasLimiteGastos(
    @Query('loja_id') lojaId: string,
    @Query('departamento') departamento?: string,
    @Query('apenas_criticos') apenasCriticos?: boolean,
  ) {
    const alertas = await this.centroCustoService.obterAlertasLimiteGastos(
      lojaId,
      departamento,
      apenasCriticos,
    );

    return {
      loja_id: lojaId,
      departamento: departamento,
      apenas_criticos: apenasCriticos,
      total_alertas: alertas.length,
      alertas: alertas,
    };
  }

  @Post('enviar-alertas')
  @ApiOperation({ summary: 'Enviar alertas de limite de gastos' })
  @ApiResponse({ status: 200, description: 'Alertas enviados com sucesso' })
  async enviarAlertasLimiteGastos(
    @Body()
    body: {
      loja_id: string;
      alertas: Array<{
        centro_custo: string;
        tipo_alerta:
          | 'LIMITE_PROXIMO'
          | 'LIMITE_ATINGIDO'
          | 'ORCAMENTO_ESGOTADO';
        percentual_utilizado: number;
        valor_restante: number;
        mensagem: string;
        prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
        data_alerta: Date;
      }>;
    },
  ) {
    await this.centroCustoService.enviarAlertasLimiteGastos(
      body.loja_id,
      body.alertas,
    );

    return {
      sucesso: true,
      loja_id: body.loja_id,
      alertas_enviados: body.alertas.length,
      mensagem: 'Alertas enviados com sucesso',
    };
  }

  @Get('historico-movimentacoes/:centroCusto')
  @ApiOperation({
    summary: 'Obter histórico de movimentações do centro de custo',
  })
  @ApiResponse({ status: 200, description: 'Histórico obtido com sucesso' })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  @ApiQuery({ name: 'periodo_inicio', required: false, type: Date })
  @ApiQuery({ name: 'periodo_fim', required: false, type: Date })
  async obterHistoricoMovimentacoes(
    @Param('centroCusto') centroCusto: string,
    @Query('loja_id') lojaId: string,
    @Query('periodo_inicio') periodoInicio?: Date,
    @Query('periodo_fim') periodoFim?: Date,
  ) {
    const historico = await this.centroCustoService.obterHistoricoMovimentacoes(
      centroCusto,
      lojaId,
      periodoInicio,
      periodoFim,
    );

    return {
      centro_custo: centroCusto,
      loja_id: lojaId,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      total_movimentacoes: historico.length,
      movimentacoes: historico,
    };
  }

  @Get('dashboard-centro-custo/:lojaId')
  @ApiOperation({ summary: 'Obter dashboard consolidado de centro de custo' })
  @ApiResponse({ status: 200, description: 'Dashboard obtido com sucesso' })
  async obterDashboardCentroCusto(@Param('lojaId') lojaId: string) {
    const [centrosCusto, relatorioConsolidado, alertas] = await Promise.all([
      this.centroCustoService.listarCentrosCusto(lojaId),
      this.centroCustoService.obterRelatorioConsolidado(lojaId),
      this.centroCustoService.obterAlertasLimiteGastos(lojaId),
    ]);

    return {
      loja_id: lojaId,
      resumo: {
        total_centros_custo: centrosCusto.length,
        centros_ativos: centrosCusto.filter((cc) => cc.status === 'ATIVO')
          .length,
        total_alertas: alertas.length,
        alertas_criticos: alertas.filter((a) => a.prioridade === 'CRITICA')
          .length,
      },
      orcamento_total: relatorioConsolidado.total_geral,
      departamentos: relatorioConsolidado.departamentos,
      alertas: alertas,
      centros_custo: centrosCusto,
    };
  }
}
