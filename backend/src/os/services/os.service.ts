/**
 * Service principal para CRUD de Ordens de Serviço
 * Limite: ≤ 400 linhas conforme premissas
 * Funcionalidades: CRUD básico, numeração automática, validações
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOSDto } from '../dto/create-os.dto';
import { UpdateOSDto, AvancarEtapaDto } from '../dto/update-os.dto';
import {
  OrdemServicoData,
  StatusOS,
  TipoMovimentacaoOS,
  ApiResponse,
  PaginatedResponse,
} from '../interfaces/os.interfaces';

@Injectable()
export class OSService {
  private readonly logger = new Logger(OSService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== CRUD BÁSICO =====

  async create(lojaId: string, createOSDto: CreateOSDto): Promise<OrdemServicoData> {
    try {
      this.logger.log(`Criando nova OS para loja ${lojaId}`);

      // 1. Gerar número sequencial
      const numero = await this.gerarNumeroOS(lojaId);

      // 2. Validar dados básicos
      await this.validarDadosOS(lojaId, createOSDto);

      // 3. Criar OS
      const os = await this.prisma.ordemServico.create({
        data: {
          numero,
          loja_id: lojaId,
          cliente_id: createOSDto.cliente_id,
          orcamento_id: createOSDto.orcamento_id,
          nome_servico: createOSDto.nome_servico,
          descricao: createOSDto.descricao,
          quantidade: createOSDto.quantidade,
          parametros_tecnicos: createOSDto.parametros_tecnicos 
            ? JSON.stringify(createOSDto.parametros_tecnicos)
            : null,
          insumos_calculados: createOSDto.insumos_calculados
            ? JSON.stringify(createOSDto.insumos_calculados)
            : null,
          data_prazo: createOSDto.data_prazo ? new Date(createOSDto.data_prazo) : null,
          responsavel_id: createOSDto.responsavel_id,
          observacoes: createOSDto.observacoes,
          status: StatusOS.FILA,
          materiais_disponivel: false,
        },
      });

      // 4. Registrar movimentação inicial
      await this.adicionarMovimentacao(
        os.id,
        TipoMovimentacaoOS.CRIACAO,
        null,
        StatusOS.FILA,
        createOSDto.responsavel_id || 'SISTEMA',
        'OS criada no sistema',
      );

      this.logger.log(`✅ OS #${numero} criada com sucesso - ID: ${os.id}`);
      return this.formatarOrdemServico(os);
    } catch (error) {
      this.logger.error('Erro ao criar OS:', error);
      throw error;
    }
  }

  async findAll(
    lojaId: string,
    page = 1,
    limit = 20,
    status?: string,
    responsavel?: string,
  ): Promise<PaginatedResponse<OrdemServicoData>> {
    try {
      const skip = (page - 1) * limit;

      // Filtros opcionais
      const where: any = { loja_id: lojaId };
      if (status) where.status = status;
      if (responsavel) where.responsavel_id = responsavel;

      // Buscar com paginação
      const [total, ordens] = await Promise.all([
        this.prisma.ordemServico.count({ where }),
        this.prisma.ordemServico.findMany({
          where,
          skip,
          take: limit,
          orderBy: { criado_em: 'desc' },
          include: {
            itens: true,
            movimentacoes: {
              take: 1,
              orderBy: { data_movimentacao: 'desc' },
            },
          },
        }),
      ]);

      const data = ordens.map(os => this.formatarOrdemServico(os));

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Erro ao buscar OS:', error);
      throw error;
    }
  }

  async findOne(id: string, lojaId: string): Promise<OrdemServicoData> {
    try {
      const os = await this.prisma.ordemServico.findFirst({
        where: { id, loja_id: lojaId }, // Isolamento por tenant
        include: {
          itens: true,
          movimentacoes: {
            orderBy: { data_movimentacao: 'desc' },
          },
          checklists: {
            orderBy: { ordem: 'asc' },
          },
        },
      });

      if (!os) {
        throw new NotFoundException(`OS com ID ${id} não encontrada`);
      }

      return this.formatarOrdemServico(os);
    } catch (error) {
      this.logger.error(`Erro ao buscar OS ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    lojaId: string,
    updateOSDto: UpdateOSDto,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      // Verificar se OS existe e pertence à loja
      const osExistente = await this.findOne(id, lojaId);

      // Preparar dados para atualização
      const dadosAtualizacao: any = {};
      
      if (updateOSDto.nome_servico) dadosAtualizacao.nome_servico = updateOSDto.nome_servico;
      if (updateOSDto.descricao) dadosAtualizacao.descricao = updateOSDto.descricao;
      if (updateOSDto.quantidade) dadosAtualizacao.quantidade = updateOSDto.quantidade;
      if (updateOSDto.data_prazo) dadosAtualizacao.data_prazo = new Date(updateOSDto.data_prazo);
      if (updateOSDto.responsavel_id) dadosAtualizacao.responsavel_id = updateOSDto.responsavel_id;
      if (updateOSDto.observacoes) dadosAtualizacao.observacoes = updateOSDto.observacoes;
      
      if (updateOSDto.parametros_tecnicos) {
        dadosAtualizacao.parametros_tecnicos = JSON.stringify(updateOSDto.parametros_tecnicos);
      }

      // Atualizar OS
      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id },
        data: dadosAtualizacao,
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        id,
        TipoMovimentacaoOS.ADICIONAR_OBSERVACAO,
        osExistente.status,
        osExistente.status,
        usuarioId,
        'OS atualizada',
      );

      this.logger.log(`✅ OS #${osAtualizada.numero} atualizada com sucesso`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao atualizar OS ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string, lojaId: string, usuarioId: string): Promise<void> {
    try {
      // Verificar se OS existe e pertence à loja
      const os = await this.findOne(id, lojaId);

      // Validar se pode ser excluída
      if (os.status === StatusOS.FINALIZADA) {
        throw new BadRequestException('Não é possível excluir OS finalizada');
      }

      // Registrar movimentação de cancelamento
      await this.adicionarMovimentacao(
        id,
        TipoMovimentacaoOS.CANCELAR,
        os.status,
        StatusOS.CANCELADA,
        usuarioId,
        'OS cancelada/excluída',
      );

      // Excluir OS (cascade irá remover relacionamentos)
      await this.prisma.ordemServico.delete({
        where: { id },
      });

      this.logger.log(`✅ OS #${os.numero} excluída com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao excluir OS ${id}:`, error);
      throw error;
    }
  }

  // ===== MÉTODOS ESPECÍFICOS =====

  async avancarEtapa(
    id: string,
    lojaId: string,
    avancarDto: AvancarEtapaDto,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      const os = await this.findOne(id, lojaId);

      // Validar transição de etapa
      const transicaoValida = await this.validarTransicaoEtapa(
        os.status,
        avancarDto.nova_etapa,
      );

      if (!transicaoValida.valida) {
        throw new BadRequestException(transicaoValida.motivo);
      }

      // Atualizar status da OS
      const osAtualizada = await this.prisma.ordemServico.update({
        where: { id },
        data: { status: avancarDto.nova_etapa },
      });

      // Registrar movimentação
      await this.adicionarMovimentacao(
        id,
        TipoMovimentacaoOS.AVANCAR_ETAPA,
        os.status,
        avancarDto.nova_etapa,
        usuarioId,
        avancarDto.observacoes || `Etapa avançada para ${avancarDto.nova_etapa}`,
      );

      this.logger.log(`✅ OS #${os.numero} avançou de ${os.status} para ${avancarDto.nova_etapa}`);
      return this.formatarOrdemServico(osAtualizada);
    } catch (error) {
      this.logger.error(`Erro ao avançar etapa da OS ${id}:`, error);
      throw error;
    }
  }

  async gerarNumeroOS(lojaId: string): Promise<string> {
    try {
      // Buscar última OS da loja
      const ultimaOS = await this.prisma.ordemServico.findFirst({
        where: { loja_id: lojaId },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });

      // Calcular próximo número
      const proximoNumero = ultimaOS 
        ? parseInt(ultimaOS.numero) + 1 
        : 1;

      // Formatar com zeros à esquerda (6 dígitos)
      return proximoNumero.toString().padStart(6, '0');
    } catch (error) {
      this.logger.error('Erro ao gerar número da OS:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private async validarDadosOS(lojaId: string, dados: CreateOSDto): Promise<void> {
    // TODO: Implementar validações específicas
    // - Verificar se cliente existe e pertence à loja
    // - Verificar se orçamento existe e está aprovado
    // - Validar parâmetros técnicos
  }

  private async validarTransicaoEtapa(
    etapaAtual: string,
    novaEtapa: string,
  ): Promise<{ valida: boolean; motivo?: string }> {
    
    // Transições válidas por etapa
    const transicoesValidas = {
      'FILA': ['PRODUCAO', 'CANCELADA', 'PAUSADA'],
      'PRODUCAO': ['ACABAMENTO', 'PAUSADA', 'AGUARDANDO_MATERIAL'],
      'ACABAMENTO': ['FINALIZADA', 'PRODUCAO'], // Pode voltar para produção
      'PAUSADA': ['FILA', 'PRODUCAO', 'ACABAMENTO'], // Pode retomar qualquer etapa
      'AGUARDANDO_MATERIAL': ['FILA', 'PRODUCAO'], // Quando material chegar
      'FINALIZADA': [], // Estado final
      'CANCELADA': [], // Estado final
    };

    const transicoesPermitidas = transicoesValidas[etapaAtual] || [];
    const valida = transicoesPermitidas.includes(novaEtapa);

    return {
      valida,
      motivo: valida 
        ? undefined 
        : `Transição de ${etapaAtual} para ${novaEtapa} não é permitida`,
    };
  }

  private async adicionarMovimentacao(
    osId: string,
    tipo: TipoMovimentacaoOS,
    etapaAnterior: string | null,
    etapaAtual: string,
    usuarioId: string,
    observacoes?: string,
  ): Promise<void> {
    try {
      await this.prisma.movimentacaoOS.create({
        data: {
          os_id: osId,
          etapa_anterior: etapaAnterior,
          etapa_atual: etapaAtual,
          usuario_id: usuarioId,
          observacoes,
          data_movimentacao: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Erro ao adicionar movimentação:', error);
      // Não falhar a operação principal por erro no log
    }
  }

  private formatarOrdemServico(os: any): OrdemServicoData {
    return {
      id: os.id,
      numero: os.numero,
      loja_id: os.loja_id,
      cliente_id: os.cliente_id,
      orcamento_id: os.orcamento_id,
      data_abertura: os.data_abertura,
      data_prazo: os.data_prazo,
      status: os.status as StatusOS,
      responsavel_id: os.responsavel_id,
      observacoes: os.observacoes,
      nome_servico: os.nome_servico,
      descricao: os.descricao,
      quantidade: parseFloat(os.quantidade.toString()),
      parametros_tecnicos: os.parametros_tecnicos 
        ? JSON.parse(os.parametros_tecnicos)
        : null,
      insumos_calculados: os.insumos_calculados
        ? JSON.parse(os.insumos_calculados)
        : null,
      materiais_disponivel: os.materiais_disponivel,
      criado_em: os.criado_em,
      atualizado_em: os.atualizado_em,
    };
  }

  // ===== MÉTODOS DE CONSULTA =====

  async buscarPorStatus(lojaId: string, status: StatusOS): Promise<OrdemServicoData[]> {
    try {
      const ordens = await this.prisma.ordemServico.findMany({
        where: { loja_id: lojaId, status },
        orderBy: { criado_em: 'desc' },
        include: {
          movimentacoes: {
            take: 1,
            orderBy: { data_movimentacao: 'desc' },
          },
        },
      });

      return ordens.map(os => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error(`Erro ao buscar OS por status ${status}:`, error);
      throw error;
    }
  }

  async buscarPorResponsavel(lojaId: string, responsavelId: string): Promise<OrdemServicoData[]> {
    try {
      const ordens = await this.prisma.ordemServico.findMany({
        where: { 
          loja_id: lojaId, 
          responsavel_id: responsavelId,
          status: { not: StatusOS.FINALIZADA }, // Apenas OS ativas
        },
        orderBy: { criado_em: 'desc' },
      });

      return ordens.map(os => this.formatarOrdemServico(os));
    } catch (error) {
      this.logger.error(`Erro ao buscar OS por responsável ${responsavelId}:`, error);
      throw error;
    }
  }

  async getEstatisticas(lojaId: string): Promise<{
    total: number;
    por_status: Record<string, number>;
    prazo_vencendo: number;
    atrasadas: number;
  }> {
    try {
      const hoje = new Date();
      const proximaSemana = new Date();
      proximaSemana.setDate(hoje.getDate() + 7);

      const [total, porStatus, prazoVencendo, atrasadas] = await Promise.all([
        // Total de OS ativas
        this.prisma.ordemServico.count({
          where: { 
            loja_id: lojaId, 
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),

        // Agrupamento por status
        this.prisma.ordemServico.groupBy({
          by: ['status'],
          where: { loja_id: lojaId },
          _count: { status: true },
        }),

        // Prazo vencendo (próximos 7 dias)
        this.prisma.ordemServico.count({
          where: {
            loja_id: lojaId,
            data_prazo: { lte: proximaSemana, gte: hoje },
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),

        // Atrasadas
        this.prisma.ordemServico.count({
          where: {
            loja_id: lojaId,
            data_prazo: { lt: hoje },
            status: { notIn: [StatusOS.FINALIZADA, StatusOS.CANCELADA] },
          },
        }),
      ]);

      // Formatar estatísticas por status
      const statusStats = porStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        por_status: statusStats,
        prazo_vencendo: prazoVencendo,
        atrasadas,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE INTEGRAÇÃO =====

  async criarOSDeOrcamento(
    lojaId: string,
    dadosOrcamento: any,
    usuarioId: string,
  ): Promise<OrdemServicoData> {
    try {
      this.logger.log(`Criando OS a partir do orçamento ${dadosOrcamento.orcamento_id}`);

      const createDto: CreateOSDto = {
        cliente_id: dadosOrcamento.cliente_id,
        orcamento_id: dadosOrcamento.orcamento_id,
        nome_servico: dadosOrcamento.nome_servico,
        descricao: dadosOrcamento.descricao,
        quantidade: dadosOrcamento.quantidade_produto,
        parametros_tecnicos: {
          largura: dadosOrcamento.largura_produto,
          altura: dadosOrcamento.altura_produto,
          area: dadosOrcamento.area_produto,
          unidade_medida: dadosOrcamento.unidade_medida_produto,
        },
        responsavel_id: dadosOrcamento.responsavel_id,
        insumos_calculados: dadosOrcamento.custos_calculados,
      };

      const os = await this.create(lojaId, createDto);

      this.logger.log(`✅ OS #${os.numero} criada automaticamente do orçamento`);
      return os;
    } catch (error) {
      this.logger.error('Erro ao criar OS de orçamento:', error);
      throw error;
    }
  }

  // ===== HEALTH CHECK =====

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // Verificar conexão com banco
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check falhou:', error);
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
