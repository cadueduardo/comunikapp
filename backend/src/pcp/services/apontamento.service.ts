import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApontamentoData, CreateApontamentoDto, UpdateApontamentoDto } from '../interfaces/pcp.interfaces';
import { OSPCPIntegrationService } from './os-pcp-integration.service';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';

@Injectable()
export class ApontamentoService {
  constructor(
    private prisma: PrismaService,
    private osPCPIntegration: OSPCPIntegrationService,
    private validacaoEstoque: ValidacaoEstoqueService
  ) {}

  async criarApontamento(dto: CreateApontamentoDto): Promise<ApontamentoData> {
    // Verificar se OS existe
    const os = await this.prisma.ordemServico.findUnique({
      where: { id: dto.os_id }
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Verificar se etapa_instancia existe (se fornecida)
    if (dto.etapa_instancia_id) {
      const etapa = await this.prisma.etapaInstancia.findUnique({
        where: { id: dto.etapa_instancia_id }
      });

      if (!etapa) {
        throw new NotFoundException('Etapa não encontrada');
      }
    }

    // Validar tipo de apontamento
    this.validarTipoApontamento(dto.tipo, dto.etapa_instancia_id);

    const apontamento = await this.prisma.apontamento.create({
      data: {
        os_id: dto.os_id,
        etapa_instancia_id: dto.etapa_instancia_id,
        tipo: dto.tipo,
        data_apontamento: new Date(),
        usuario_id: dto.usuario_id || 'sistema', // TODO: Pegar do contexto de autenticação
        observacoes: dto.observacoes,
        quantidade_produzida: dto.quantidade_produzida,
        quantidade_refugo: dto.quantidade_refugo,
        tempo_gasto: dto.tempo_gasto,
        ip_origem: dto.ip_origem,
        user_agent: dto.user_agent
      }
    });

    // Processar integração com estoque se necessário
    await this.processarIntegracaoEstoque(apontamento);

    // Notificar módulo OS sobre apontamento
    await this.osPCPIntegration.notificarApontamento(dto.os_id, dto.tipo);

    return this.converterParaInterface(apontamento);
  }

  async buscarPorOS(osId: string): Promise<ApontamentoData[]> {
    const apontamentos = await this.prisma.apontamento.findMany({
      where: { os_id: osId },
      orderBy: { data_apontamento: 'desc' }
    });

    return apontamentos.map(apontamento => this.converterParaInterface(apontamento));
  }

  async buscarPorEtapa(etapaInstanciaId: string): Promise<ApontamentoData[]> {
    const apontamentos = await this.prisma.apontamento.findMany({
      where: { etapa_instancia_id: etapaInstanciaId },
      orderBy: { data_apontamento: 'desc' }
    });

    return apontamentos.map(apontamento => this.converterParaInterface(apontamento));
  }

  async buscarPorId(id: string): Promise<ApontamentoData | null> {
    const apontamento = await this.prisma.apontamento.findUnique({
      where: { id }
    });

    return apontamento ? this.converterParaInterface(apontamento) : null;
  }

  async atualizarApontamento(id: string, dto: UpdateApontamentoDto): Promise<ApontamentoData> {
    const apontamento = await this.prisma.apontamento.findUnique({
      where: { id }
    });

    if (!apontamento) {
      throw new NotFoundException('Apontamento não encontrado');
    }

    // Validar se pode ser editado (apenas apontamentos recentes)
    const tempoLimite = 24 * 60 * 60 * 1000; // 24 horas
    const tempoDecorrido = Date.now() - apontamento.data_apontamento.getTime();

    if (tempoDecorrido > tempoLimite) {
      throw new BadRequestException('Apontamento não pode ser editado após 24 horas');
    }

    const apontamentoAtualizado = await this.prisma.apontamento.update({
      where: { id },
      data: {
        observacoes: dto.observacoes,
        quantidade_produzida: dto.quantidade_produzida,
        quantidade_refugo: dto.quantidade_refugo,
        tempo_gasto: dto.tempo_gasto
      }
    });

    return this.converterParaInterface(apontamentoAtualizado);
  }

  async deletarApontamento(id: string): Promise<void> {
    const apontamento = await this.prisma.apontamento.findUnique({
      where: { id }
    });

    if (!apontamento) {
      throw new NotFoundException('Apontamento não encontrado');
    }

    // Validar se pode ser deletado (apenas apontamentos recentes)
    const tempoLimite = 24 * 60 * 60 * 1000; // 24 horas
    const tempoDecorrido = Date.now() - apontamento.data_apontamento.getTime();

    if (tempoDecorrido > tempoLimite) {
      throw new BadRequestException('Apontamento não pode ser deletado após 24 horas');
    }

    await this.prisma.apontamento.delete({
      where: { id }
    });
  }

  async listarApontamentos(filtros?: {
    os_id?: string;
    etapa_instancia_id?: string;
    tipo?: string;
    usuario_id?: string;
    data_inicio?: Date;
    data_fim?: Date;
  }): Promise<ApontamentoData[]> {
    const apontamentos = await this.prisma.apontamento.findMany({
      where: {
        ...filtros
      },
      orderBy: { data_apontamento: 'desc' }
    });

    return apontamentos.map(apontamento => this.converterParaInterface(apontamento));
  }

  private validarTipoApontamento(tipo: string, etapaInstanciaId?: string): void {
    const tiposValidos = ['INICIO', 'PAUSA', 'RETOMADA', 'CONCLUSAO', 'REFUGO'];
    
    if (!tiposValidos.includes(tipo)) {
      throw new BadRequestException(`Tipo de apontamento inválido: ${tipo}`);
    }

    // Validações específicas por tipo
    if (tipo === 'INICIO' && !etapaInstanciaId) {
      throw new BadRequestException('Apontamento de INÍCIO deve estar associado a uma etapa');
    }

    if (tipo === 'CONCLUSAO' && !etapaInstanciaId) {
      throw new BadRequestException('Apontamento de CONCLUSÃO deve estar associado a uma etapa');
    }
  }

  private async processarIntegracaoEstoque(apontamento: any): Promise<void> {
    // Processar integração com estoque baseado no tipo de apontamento
    const tiposComEstoque = ['INICIO', 'CONCLUSAO', 'REFUGO'];
    
    if (tiposComEstoque.includes(apontamento.tipo)) {
      try {
        // Buscar itens da OS para processar estoque
        const os = await this.prisma.ordemServico.findUnique({
          where: { id: apontamento.os_id },
          include: {
            itens: true
          }
        });

        if (!os || !os.itens) {
          console.log(`OS ${apontamento.os_id} não possui itens para processar estoque`);
          return;
        }

        // Preparar dados para validação de estoque
        // TODO: Implementar quando estrutura de itens estiver completa
        const insumos: any[] = [];

        if (apontamento.tipo === 'INICIO') {
          // Reservar materiais no início da produção
          console.log(`Reservando materiais para OS ${apontamento.os_id}`);
          // TODO: Implementar reserva de estoque
          
        } else if (apontamento.tipo === 'CONCLUSAO') {
          // Baixar materiais consumidos na conclusão
          console.log(`Baixando materiais consumidos para OS ${apontamento.os_id}`);
          // TODO: Implementar baixa de estoque
          
        } else if (apontamento.tipo === 'REFUGO') {
          // Baixar materiais refugados
          console.log(`Baixando materiais refugados para OS ${apontamento.os_id}`);
          // TODO: Implementar baixa de refugo
        }

        console.log(`Integração com estoque processada para apontamento ${apontamento.id} do tipo ${apontamento.tipo}`);
        
      } catch (error) {
        console.error(`Erro ao processar integração com estoque para apontamento ${apontamento.id}:`, error);
        // Não falhar o apontamento por erro de estoque
      }
    }
  }

  private converterParaInterface(apontamento: any): ApontamentoData {
    return {
      id: apontamento.id,
      os_id: apontamento.os_id,
      etapa_instancia_id: apontamento.etapa_instancia_id,
      tipo: apontamento.tipo,
      data_apontamento: apontamento.data_apontamento,
      usuario_id: apontamento.usuario_id,
      observacoes: apontamento.observacoes,
      quantidade_produzida: apontamento.quantidade_produzida,
      quantidade_refugo: apontamento.quantidade_refugo,
      tempo_gasto: apontamento.tempo_gasto,
      ip_origem: apontamento.ip_origem,
      user_agent: apontamento.user_agent,
      criado_em: apontamento.criado_em
    };
  }
}
