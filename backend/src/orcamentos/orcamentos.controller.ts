import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Res,
  Request,
  NotFoundException,
} from '@nestjs/common';
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
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Enviar heartbeat a cada 30 segundos
    const heartbeat = setInterval(() => {
      res.write(
        `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`,
      );
    }, 30000);

    // Verificar novas mensagens a cada 5 segundos (reduzido para evitar sobrecarga)
    const checkMessages = setInterval(async () => {
      try {
        const mensagens =
          await this.orcamentosService.getMensagensNaoVisualizadas(id);
        if (mensagens.length > 0) {
          res.write(
            `data: ${JSON.stringify({
              type: 'new_messages',
              count: mensagens.length,
            })}\n\n`,
          );
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
    @CurrentLojaId() lojaId: string,
  ): Promise<ResultadoCalculoDto> {
    return this.orcamentosService.calcularOrcamento(dto, lojaId);
  }

  /**
   * CRUD Operations para Orçamentos
   * Implementa a Tarefa 2.6 - Módulo de Orçamento Rápido
   */

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createOrcamentoDto: CreateOrcamentoDto, @Request() req) {
    console.log('💼 Criando novo orçamento...');
    // Processando dados do orçamento...

    const result = await this.orcamentosService.create(
      createOrcamentoDto,
      req.user.loja_id,
    );

    console.log('✅ Orçamento criado com sucesso!');

    return result;
  }

  @Post('rascunho')
  @UseGuards(JwtAuthGuard)
  async salvarRascunho(
    @Body() createOrcamentoDto: CreateOrcamentoDto,
    @Request() req,
  ) {
    return this.orcamentosService.salvarRascunho(
      createOrcamentoDto,
      req.user.loja_id,
    );
  }

  @Post(':id/enviar')
  @UseGuards(JwtAuthGuard)
  async enviarOrcamento(@Param('id') id: string, @Request() req) {
    return this.orcamentosService.enviarOrcamento(id, req.user.loja_id);
  }

  @Post('aprovar/:codigo')
  @Public()
  async aprovarOrcamento(@Param('codigo') codigo: string) {
    console.log('🔍 Controller - Código recebido:', JSON.stringify(codigo));
    console.log('🔍 Controller - Enviando para service...');
    return this.orcamentosService.aprovarOrcamento(codigo);
  }

  @Post('reenviar-codigo/:id')
  @Public()
  async reenviarCodigoAprovacao(@Param('id') id: string) {
    console.log(
      '📧 Controller - Reenviando código de aprovação para orçamento:',
      id,
    );
    return this.orcamentosService.reenviarCodigoAprovacao(id);
  }

  @Get()
  async findAll(@CurrentLojaId() lojaId: string) {
    const orcamentos = await this.orcamentosService.findAll(lojaId);

    console.log(`📋 ${orcamentos.length} orçamentos encontrados`);

    // Converter valores Decimal para number de forma mais robusta
    const orcamentosConvertidos = orcamentos.map((orcamento) => {
      // Função auxiliar para converter Decimal de forma segura
      const convertDecimal = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;
        // Se for um objeto Decimal do Prisma
        if (value && typeof value === 'object' && 'toNumber' in value) {
          return value.toNumber();
        }
        // Tentar conversão direta
        const converted = Number(value);
        return isNaN(converted) ? 0 : converted;
      };

      const precoFinalConvertido = convertDecimal(orcamento.preco_final);
      const custoTotalConvertido = convertDecimal(orcamento.custo_total);

      return {
        ...orcamento,
        preco_final: precoFinalConvertido,
        custo_material: convertDecimal(orcamento.custo_material),
        custo_mao_obra: convertDecimal(orcamento.custo_mao_obra),
        custo_indireto: convertDecimal(orcamento.custo_indireto),
        custo_total: custoTotalConvertido,
        margem_lucro: convertDecimal(orcamento.margem_lucro),
        impostos: convertDecimal(orcamento.impostos),
        quantidade_produto: orcamento.quantidade_produto
          ? convertDecimal(orcamento.quantidade_produto)
          : null,
      };
    });

    // Debug removido - logs limpos para melhor visualização

    return orcamentosConvertidos;
  }

  @Get('debug/token')
  async debugToken(@CurrentLojaId() lojaId: string) {
    return {
      loja_id: lojaId,
      token_valido: !!lojaId,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test/:id')
  async testFindOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    // Usar o service para buscar
    try {
      const orcamento = await this.orcamentosService.findOne(id, lojaId);
      return {
        orcamento_encontrado: true,
        loja_usuario: lojaId,
        orcamento: orcamento,
      };
    } catch (error) {
      return {
        orcamento_encontrado: false,
        loja_usuario: lojaId,
        erro: error.message,
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.orcamentosService.findOne(id, lojaId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrcamentoDto: UpdateOrcamentoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.orcamentosService.update(id, updateOrcamentoDto, lojaId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
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
  async acaoClientePublico(
    @Param('id') id: string,
    @Body()
    body: {
      acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR';
      observacoes?: string;
      cliente_nome?: string;
      cliente_email?: string;
    },
  ) {
    return this.orcamentosService.processarAcaoCliente(id, body.acao, {
      observacoes: body.observacoes,
      cliente_nome: body.cliente_nome,
      cliente_email: body.cliente_email,
    });
  }

  // Endpoint removido - substituído pelo acaoClientePublico acima

  /**
   * Marcar mensagem como visualizada
   */
  @Post(':orcamentoId/mensagens/:mensagemId/visualizar')
  @UseGuards(JwtAuthGuard)
  async marcarMensagemComoVisualizada(
    @Param('orcamentoId') orcamentoId: string,
    @Param('mensagemId') mensagemId: string,
  ) {
    return this.orcamentosService.marcarMensagemComoVisualizada(
      orcamentoId,
      mensagemId,
    );
  }

  @Post('recalcular-existentes')
  @UseGuards(JwtAuthGuard)
  async recalcularOrcamentosExistentes(@Request() req) {
    const lojaId = req.user.loja_id;
    return this.orcamentosService.recalcularOrcamentosExistentes(lojaId);
  }
}
