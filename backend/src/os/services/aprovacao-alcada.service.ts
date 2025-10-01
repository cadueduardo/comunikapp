import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusAprovacao } from '../interfaces/os-direta-interna.interface';

export enum NivelAlcada {
  AUTOMATICA = 'AUTOMATICA',
  GERENTE_DEPARTAMENTO = 'GERENTE_DEPARTAMENTO',
  DIRETORIA = 'DIRETORIA',
}

export interface ConfiguracaoAlcada {
  nivel: NivelAlcada;
  valorMinimo: number;
  valorMaximo?: number;
  cargoAprovador: string;
  departamentoAprovador?: string;
}

export interface ResultadoValidacaoAlcada {
  nivelRequerido: NivelAlcada;
  aprovadorRequerido: string;
  valorEstimado: number;
  centroCusto: string;
  orcamentoDisponivel: number;
  podeAprovar: boolean;
  motivoBloqueio?: string;
}

@Injectable()
export class AprovacaoAlcadaService {
  private readonly configuracoesAlcada: ConfiguracaoAlcada[] = [
    {
      nivel: NivelAlcada.AUTOMATICA,
      valorMinimo: 0,
      valorMaximo: 500,
      cargoAprovador: 'SISTEMA',
    },
    {
      nivel: NivelAlcada.GERENTE_DEPARTAMENTO,
      valorMinimo: 500,
      valorMaximo: 2000,
      cargoAprovador: 'GERENTE_DEPARTAMENTO',
    },
    {
      nivel: NivelAlcada.DIRETORIA,
      valorMinimo: 2000,
      cargoAprovador: 'DIRETORIA',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determina o nível de alçada necessário baseado no valor estimado
   */
  determinarNivelAlcada(valorEstimado: number): NivelAlcada {
    const configuracao = this.configuracoesAlcada.find(
      (config) =>
        valorEstimado >= config.valorMinimo &&
        (config.valorMaximo === undefined || valorEstimado <= config.valorMaximo),
    );

    if (!configuracao) {
      throw new Error(`Valor ${valorEstimado} não se enquadra em nenhuma alçada configurada`);
    }

    return configuracao.nivel;
  }

  /**
   * Valida se uma OS interna pode ser aprovada baseado na alçada e orçamento disponível
   */
  async validarAprovacaoAlcada(
    valorEstimado: number,
    centroCusto: string,
    departamentoSolicitante: string,
    lojaId: string,
  ): Promise<ResultadoValidacaoAlcada> {
    try {
      // 1. Determinar nível de alçada necessário
      const nivelRequerido = this.determinarNivelAlcada(valorEstimado);
      
      // 2. Verificar orçamento disponível no centro de custo
      const orcamentoDisponivel = await this.verificarOrcamentoDisponivel(centroCusto, lojaId);
      
      // 3. Verificar se há orçamento suficiente
      const podeAprovar = orcamentoDisponivel >= valorEstimado;
      
      // 4. Determinar aprovador necessário
      const aprovadorRequerido = this.determinarAprovadorRequerido(
        nivelRequerido,
        departamentoSolicitante,
      );

      return {
        nivelRequerido,
        aprovadorRequerido,
        valorEstimado,
        centroCusto,
        orcamentoDisponivel,
        podeAprovar,
        motivoBloqueio: podeAprovar
          ? undefined
          : `Orçamento insuficiente. Disponível: R$ ${orcamentoDisponivel.toFixed(2)}, Necessário: R$ ${valorEstimado.toFixed(2)}`,
      };
    } catch (error) {
      throw new Error(`Erro ao validar aprovação por alçada: ${error.message}`);
    }
  }

  /**
   * Aprova uma OS interna baseado na alçada do usuário
   */
  async aprovarOSInterna(
    osId: string,
    aprovadorId: string,
    aprovadorCargo: string,
    observacoes?: string,
  ): Promise<void> {
    try {
      // 1. Buscar OS e validar se é interna
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
        include: { cliente: true },
      });

      if (!os) {
        throw new Error('OS não encontrada');
      }

      if (os.tipo_os !== 'INTERNA') {
        throw new Error('Aprovação por alçada só é válida para OS Interna');
      }

      // 2. Validar se o aprovador tem permissão
      const valorEstimado = Number(os.valor_orcado || 0);
      const validacao = await this.validarAprovacaoAlcada(
        valorEstimado,
        os.centro_custo || '',
        os.departamento_solicitante || '',
        os.loja_id,
      );

      if (!this.validarPermissaoAprovador(aprovadorCargo, validacao.nivelRequerido)) {
        throw new Error('Usuário não tem permissão para aprovar esta OS');
      }

      // 3. Atualizar OS com aprovação
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          aprovacao_gerencial: StatusAprovacao.APROVADA,
          aprovacao_gerencial_por: aprovadorId,
          aprovacao_gerencial_em: new Date(),
          aprovacao_gerencial_obs: observacoes,
          status: 'APROVADA_ORCAMENTARIA',
          modificado_por: aprovadorId,
          motivo_modificacao: 'Aprovação por alçada',
          versao: { increment: 1 },
        },
      });

      // 4. Reservar orçamento no centro de custo
      await this.reservarOrcamento(validacao.centroCusto, valorEstimado, os.loja_id);

      // 5. Registrar log de aprovação
      await this.registrarLogAprovacao(osId, aprovadorId, 'APROVADA', observacoes);
    } catch (error) {
      throw new Error(`Erro ao aprovar OS interna: ${error.message}`);
    }
  }

  /**
   * Rejeita uma OS interna
   */
  async rejeitarOSInterna(
    osId: string,
    aprovadorId: string,
    motivoRejeicao: string,
  ): Promise<void> {
    try {
      // 1. Buscar OS e validar se é interna
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
      });

      if (!os) {
        throw new Error('OS não encontrada');
      }

      if (os.tipo_os !== 'INTERNA') {
        throw new Error('Rejeição por alçada só é válida para OS Interna');
      }

      // 2. Atualizar OS com rejeição
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          aprovacao_gerencial: StatusAprovacao.REJEITADA,
          aprovacao_gerencial_por: aprovadorId,
          aprovacao_gerencial_em: new Date(),
          aprovacao_gerencial_obs: motivoRejeicao,
          status: 'REJEITADA_ORCAMENTARIA',
          modificado_por: aprovadorId,
          motivo_modificacao: 'Rejeição por alçada',
          versao: { increment: 1 },
        },
      });

      // 3. Registrar log de rejeição
      await this.registrarLogAprovacao(osId, aprovadorId, 'REJEITADA', motivoRejeicao);
    } catch (error) {
      throw new Error(`Erro ao rejeitar OS interna: ${error.message}`);
    }
  }

  /**
   * Lista OS internas pendentes de aprovação por alçada
   */
  async listarOSPendentesAprovacao(
    lojaId: string,
    aprovadorCargo: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      // Buscar OS internas pendentes
      const osPendentes = await this.prisma.ordemServico.findMany({
        where: {
          loja_id: lojaId,
          tipo_os: 'INTERNA',
          status: 'AGUARDANDO_APROVACAO_ORCAMENTARIA',
          aprovacao_gerencial: StatusAprovacao.PENDENTE,
        },
        include: {
          cliente: true,
        },
        skip,
        take: limit,
        orderBy: { criado_em: 'desc' },
      });

      // Filtrar por alçada do aprovador
      const osFiltradas = [];
      for (const os of osPendentes) {
        const valorEstimado = Number(os.valor_orcado || 0);
        const nivelRequerido = this.determinarNivelAlcada(valorEstimado);
        
        if (this.validarPermissaoAprovador(aprovadorCargo, nivelRequerido)) {
          osFiltradas.push(os);
        }
      }

      const total = await this.prisma.ordemServico.count({
        where: {
          loja_id: lojaId,
          tipo_os: 'INTERNA',
          status: 'AGUARDANDO_APROVACAO_ORCAMENTARIA',
          aprovacao_gerencial: StatusAprovacao.PENDENTE,
        },
      });

      return {
        data: osFiltradas,
        total: osFiltradas.length,
        page,
        limit,
        totalPages: Math.ceil(osFiltradas.length / limit),
      };
    } catch (error) {
      throw new Error(`Erro ao listar OS pendentes: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas de aprovação por alçada
   */
  async obterEstatisticasAprovacao(lojaId: string, periodoInicio?: Date, periodoFim?: Date) {
    try {
      const whereClause: any = {
        loja_id: lojaId,
        tipo_os: 'INTERNA',
      };

      if (periodoInicio && periodoFim) {
        whereClause.criado_em = {
          gte: periodoInicio,
          lte: periodoFim,
        };
      }

      // Usar findMany com agregação manual para evitar problemas com groupBy
      const osInternas = await this.prisma.ordemServico.findMany({
        where: whereClause,
        select: {
          aprovacao_gerencial: true,
          valor_orcado: true,
        },
      });

      // Agregar manualmente
      const estatisticas = osInternas.reduce((acc, os) => {
        const status = os.aprovacao_gerencial || 'PENDENTE';
        if (!acc[status]) {
          acc[status] = { quantidade: 0, valorTotal: 0 };
        }
        acc[status].quantidade += 1;
        acc[status].valorTotal += Number(os.valor_orcado || 0);
        return acc;
      }, {} as Record<string, { quantidade: number; valorTotal: number }>);

      return Object.entries(estatisticas).map(([status, data]) => ({
        status,
        quantidade: data.quantidade,
        valorTotal: data.valorTotal,
      }));
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }

  // Métodos privados auxiliares

  private async verificarOrcamentoDisponivel(centroCusto: string, lojaId: string): Promise<number> {
    // TODO: Implementar verificação real de orçamento disponível
    // Por enquanto, retorna um valor simulado
    return 10000; // R$ 10.000,00 simulado
  }

  private determinarAprovadorRequerido(
    nivel: NivelAlcada,
    departamentoSolicitante: string,
  ): string {
    switch (nivel) {
      case NivelAlcada.AUTOMATICA:
        return 'SISTEMA';
      case NivelAlcada.GERENTE_DEPARTAMENTO:
        return `GERENTE_${departamentoSolicitante}`;
      case NivelAlcada.DIRETORIA:
        return 'DIRETORIA';
      default:
        return 'INDEFINIDO';
    }
  }

  private validarPermissaoAprovador(cargoAprovador: string, nivelRequerido: NivelAlcada): boolean {
    switch (nivelRequerido) {
      case NivelAlcada.AUTOMATICA:
        return true; // Sistema aprova automaticamente
      case NivelAlcada.GERENTE_DEPARTAMENTO:
        return cargoAprovador.includes('GERENTE') || cargoAprovador === 'DIRETORIA';
      case NivelAlcada.DIRETORIA:
        return cargoAprovador === 'DIRETORIA';
      default:
        return false;
    }
  }

  private async reservarOrcamento(centroCusto: string, valor: number, lojaId: string): Promise<void> {
    // TODO: Implementar reserva real de orçamento
    // Por enquanto, apenas registra o log
    console.log(`Reservando R$ ${valor} no centro de custo ${centroCusto} da loja ${lojaId}`);
  }

  private async registrarLogAprovacao(
    osId: string,
    aprovadorId: string,
    acao: string,
    observacoes?: string,
  ): Promise<void> {
    // TODO: Implementar sistema de logs
    console.log(`OS ${osId} ${acao} por ${aprovadorId}: ${observacoes || 'Sem observações'}`);
  }
}
