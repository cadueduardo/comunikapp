import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { OrcamentosService } from './orcamentos.service';
import { CalcularOrcamentoDto } from './dto/calcular-orcamento.dto';
import { ResultadoCalculoDto } from './dto/resultado-calculo.dto';
import { CreateOrcamentoDto } from './dto/create-orcamento.dto';
import { UpdateOrcamentoDto } from './dto/update-orcamento.dto';
import { AcaoClienteDto } from './dto/acao-cliente.dto';
import { CurrentLojaId } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/decorators';

@Controller('orcamentos')
@UseGuards(JwtAuthGuard)
export class OrcamentosController {
  constructor(private readonly orcamentosService: OrcamentosService) {}

  /**
   * SSE endpoint para notificações em tempo real
   */
  @Get(':id/events')
  @Public()
  async streamEvents(@Param('id') id: string, @Res() res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Enviar heartbeat a cada 30 segundos
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);

    // Verificar novas mensagens a cada 5 segundos (reduzido para evitar sobrecarga)
    const checkMessages = setInterval(async () => {
      try {
        const mensagens = await this.orcamentosService.getMensagensNaoVisualizadas(id);
        if (mensagens.length > 0) {
          res.write(`data: ${JSON.stringify({ 
            type: 'new_messages', 
            count: mensagens.length
          })}\n\n`);
        }
      } catch (error) {
        console.error('Erro ao verificar mensagens:', error);
      }
    }, 5000);

    // Limpar intervalos quando a conexão for fechada
    res.on('close', () => {
      clearInterval(heartbeat);
      clearInterval(checkMessages);
    });
  }

  /**
   * Endpoint para calcular um orçamento
   * Implementa a Tarefa 2.5 - Motor de Cálculo de Orçamento
   */
  @Post('calcular')
  async calcularOrcamento(
    @Body() dto: CalcularOrcamentoDto,
    @CurrentLojaId() lojaId: string
  ): Promise<ResultadoCalculoDto> {
    console.log('Dados recebidos no controller:', JSON.stringify(dto, null, 2));
    console.log('Loja ID:', lojaId);
    console.log('Tipo de dados:', typeof dto);
    console.log('Estrutura do DTO:', {
      nome_servico: typeof dto.nome_servico,
      descricao: typeof dto.descricao,
      horas_producao: typeof dto.horas_producao,
      itens: Array.isArray(dto.itens) ? dto.itens.length : 'não é array',
      cliente_id: typeof dto.cliente_id,
      margem_lucro_customizada: typeof dto.margem_lucro_customizada,
      impostos_customizados: typeof dto.impostos_customizados,
    });
    return this.orcamentosService.calcularOrcamento(dto, lojaId);
  }

  /**
   * CRUD Operations para Orçamentos
   * Implementa a Tarefa 2.6 - Módulo de Orçamento Rápido
   */

  @Post()
  async create(
    @Body() createOrcamentoDto: CreateOrcamentoDto,
    @CurrentLojaId() lojaId: string
  ) {
    return this.orcamentosService.create(createOrcamentoDto, lojaId);
  }

  @Get()
  async findAll(@CurrentLojaId() lojaId: string) {
    console.log('Listando orçamentos para loja:', lojaId);
    const orcamentos = await this.orcamentosService.findAll(lojaId);
    console.log('Orçamentos encontrados:', orcamentos.length);
    return orcamentos;
  }

  @Get('debug/token')
  async debugToken(@CurrentLojaId() lojaId: string) {
    console.log('Debug token - Loja ID:', lojaId);
    return {
      loja_id: lojaId,
      token_valido: !!lojaId,
      timestamp: new Date().toISOString()
    };
  }

  @Get('test/:id')
  async testFindOne(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string
  ) {
    console.log('Test endpoint - Buscando orçamento:', { id, lojaId });
    console.log('Test endpoint - Token válido:', !!lojaId);
    
    // Usar o service para buscar
    try {
      const orcamento = await this.orcamentosService.findOne(id, lojaId);
      return {
        orcamento_encontrado: true,
        loja_usuario: lojaId,
        orcamento: orcamento
      };
    } catch (error) {
      console.log('Test endpoint - Erro ao buscar:', error.message);
      return {
        orcamento_encontrado: false,
        loja_usuario: lojaId,
        erro: error.message
      };
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string
  ) {
    console.log('Controller - Buscando orçamento:', { id, lojaId });
    console.log('Controller - Token válido:', !!lojaId);
    return this.orcamentosService.findOne(id, lojaId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrcamentoDto: UpdateOrcamentoDto,
    @CurrentLojaId() lojaId: string
  ) {
    console.log('Controller - Update recebido:', { id, lojaId });
    console.log('Controller - Dados do update:', updateOrcamentoDto);
    return this.orcamentosService.update(id, updateOrcamentoDto, lojaId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentLojaId() lojaId: string
  ) {
    return this.orcamentosService.remove(id, lojaId);
  }

  /**
   * Endpoints Públicos para Ações do Cliente
   */

  @Get(':id/publico')
  @Public()
  async findOnePublico(@Param('id') id: string) {
    return this.orcamentosService.findOnePublico(id);
  }

  @Post(':id/publico/acao')
  @Public()
  async acaoCliente(@Param('id') id: string, @Body() acaoDto: AcaoClienteDto) {
    return this.orcamentosService.acaoCliente(id, acaoDto);
  }

  /**
   * Marcar mensagem como visualizada
   */
  @Post(':orcamentoId/mensagens/:mensagemId/visualizar')
  @UseGuards(JwtAuthGuard)
  async marcarMensagemComoVisualizada(
    @Param('orcamentoId') orcamentoId: string,
    @Param('mensagemId') mensagemId: string
  ) {
    return this.orcamentosService.marcarMensagemComoVisualizada(orcamentoId, mensagemId);
  }
}
