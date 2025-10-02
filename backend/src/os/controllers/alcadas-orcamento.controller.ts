import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AlcadasOrcamentoService } from '../services/alcadas-orcamento.service';

@ApiTags('Alçadas e Orçamento OS Interna')
@ApiBearerAuth()
@Controller('os/alcadas-orcamento')
@UseGuards(JwtAuthGuard)
export class AlcadasOrcamentoController {
  constructor(private readonly alcadasOrcamentoService: AlcadasOrcamentoService) {}

  @Get('configuracoes-alcada')
  @ApiOperation({ summary: 'Obter configurações de alçadas por função' })
  @ApiResponse({ status: 200, description: 'Configurações de alçadas obtidas com sucesso' })
  async obterConfiguracoesAlcada() {
    return {
      configuracoes: [
        { funcao: 'SUPERVISOR', limite_maximo: 500, pode_aprovar_automaticamente: true },
        { funcao: 'GERENTE', limite_maximo: 2000, pode_aprovar_automaticamente: true },
        { funcao: 'DIRETOR', limite_maximo: 10000, pode_aprovar_automaticamente: true },
        { funcao: 'ADMIN', limite_maximo: 50000, pode_aprovar_automaticamente: true }
      ]
    };
  }

  @Post('validar-aprovacao-automatica')
  @ApiOperation({ summary: 'Validar se usuário pode aprovar valor automaticamente' })
  @ApiResponse({ status: 200, description: 'Validação realizada com sucesso' })
  async validarAprovacaoAutomatica(
    @Body() body: { funcao_usuario: string; valor_estimado: number },
    @Request() req: any
  ) {
    const resultado = await this.alcadasOrcamentoService.podeAprovarAutomaticamente(
      body.funcao_usuario,
      body.valor_estimado
    );

    return {
      pode_aprovar: resultado.pode,
      motivo: resultado.motivo,
      valor_estimado: body.valor_estimado,
      funcao_usuario: body.funcao_usuario
    };
  }

  @Post('identificar-aprovador')
  @ApiOperation({ summary: 'Identificar aprovador necessário baseado no valor' })
  @ApiResponse({ status: 200, description: 'Aprovador identificado com sucesso' })
  async identificarAprovadorNecessario(
    @Body() body: { valor_estimado: number }
  ) {
    const aprovadorNecessario = await this.alcadasOrcamentoService.identificarAprovadorNecessario(
      body.valor_estimado
    );

    return {
      valor_estimado: body.valor_estimado,
      aprovador_necessario: aprovadorNecessario
    };
  }

  @Get('validar-orcamento/:centroCusto')
  @ApiOperation({ summary: 'Validar orçamento disponível no centro de custo' })
  @ApiResponse({ status: 200, description: 'Validação de orçamento realizada com sucesso' })
  @ApiQuery({ name: 'valor_solicitado', required: true, type: Number })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  async validarOrcamentoDisponivel(
    @Param('centroCusto') centroCusto: string,
    @Query('valor_solicitado') valorSolicitado: number,
    @Query('loja_id') lojaId: string
  ) {
    const validacao = await this.alcadasOrcamentoService.validarOrcamentoDisponivel(
      centroCusto,
      valorSolicitado,
      lojaId
    );

    return validacao;
  }

  @Post('reservar-orcamento')
  @ApiOperation({ summary: 'Reservar orçamento no centro de custo' })
  @ApiResponse({ status: 200, description: 'Orçamento reservado com sucesso' })
  async reservarOrcamento(
    @Body() body: {
      centro_custo: string;
      valor: number;
      loja_id: string;
      os_id: string;
    }
  ) {
    const resultado = await this.alcadasOrcamentoService.reservarOrcamento(
      body.centro_custo,
      body.valor,
      body.loja_id,
      body.os_id
    );

    return {
      sucesso: resultado.sucesso,
      motivo: resultado.motivo,
      centro_custo: body.centro_custo,
      valor_reservado: body.valor,
      os_id: body.os_id
    };
  }

  @Patch('liberar-orcamento')
  @ApiOperation({ summary: 'Liberar orçamento reservado' })
  @ApiResponse({ status: 200, description: 'Orçamento liberado com sucesso' })
  async liberarOrcamento(
    @Body() body: {
      centro_custo: string;
      valor: number;
      loja_id: string;
      os_id: string;
    }
  ) {
    const resultado = await this.alcadasOrcamentoService.liberarOrcamento(
      body.centro_custo,
      body.valor,
      body.loja_id,
      body.os_id
    );

    return {
      sucesso: resultado.sucesso,
      motivo: resultado.motivo,
      centro_custo: body.centro_custo,
      valor_liberado: body.valor,
      os_id: body.os_id
    };
  }

  @Post('processar-aprovacao-automatica')
  @ApiOperation({ summary: 'Processar aprovação automática se possível' })
  @ApiResponse({ status: 200, description: 'Processamento realizado com sucesso' })
  async processarAprovacaoAutomatica(
    @Body() body: {
      os_id: string;
      valor_estimado: number;
      centro_custo: string;
      loja_id: string;
      usuario_id: string;
    }
  ) {
    const resultado = await this.alcadasOrcamentoService.processarAprovacaoAutomatica(
      body.os_id,
      body.valor_estimado,
      body.centro_custo,
      body.loja_id,
      body.usuario_id
    );

    return {
      aprovada_automaticamente: resultado.aprovada_automaticamente,
      motivo: resultado.motivo,
      os_id: body.os_id,
      valor_estimado: body.valor_estimado
    };
  }

  @Get('relatorio-consumo-departamento')
  @ApiOperation({ summary: 'Obter relatório de consumo por departamento' })
  @ApiResponse({ status: 200, description: 'Relatório obtido com sucesso' })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  @ApiQuery({ name: 'periodo_inicio', required: false, type: Date })
  @ApiQuery({ name: 'periodo_fim', required: false, type: Date })
  async obterRelatorioConsumoDepartamento(
    @Query('loja_id') lojaId: string,
    @Query('periodo_inicio') periodoInicio?: Date,
    @Query('periodo_fim') periodoFim?: Date
  ) {
    const relatorio = await this.alcadasOrcamentoService.obterRelatorioConsumoDepartamento(
      lojaId,
      periodoInicio,
      periodoFim
    );

    return {
      loja_id: lojaId,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      ...relatorio
    };
  }

  @Get('alertas-limite-gastos')
  @ApiOperation({ summary: 'Obter alertas de limite de gastos' })
  @ApiResponse({ status: 200, description: 'Alertas obtidos com sucesso' })
  @ApiQuery({ name: 'loja_id', required: true, type: String })
  async obterAlertasLimiteGastos(@Query('loja_id') lojaId: string) {
    // TODO: Implementar alertas reais
    return {
      loja_id: lojaId,
      alertas: [
        {
          centro_custo: 'CC001',
          tipo_alerta: 'LIMITE_PROXIMO',
          percentual_utilizado: 85,
          mensagem: 'Centro de custo CC001 próximo do limite (85% utilizado)'
        }
      ]
    };
  }
}

