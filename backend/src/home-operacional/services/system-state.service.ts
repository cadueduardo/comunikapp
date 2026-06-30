import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingService } from './onboarding.service';

export type BannerNivel = 'critico' | 'atencao' | 'informativo';

export interface BannerAcaoLink {
  tipo: 'link';
  label: string;
  href: string;
}

export interface BannerAcaoEndpoint {
  tipo: 'endpoint';
  label: string;
  metodo: 'POST' | 'PATCH';
  endpoint: string;
}

export type BannerAcao = BannerAcaoLink | BannerAcaoEndpoint;

export interface BannerMensagem {
  id: string;
  nivel: BannerNivel;
  titulo: string;
  descricao?: string;
  acao?: BannerAcao;
  dismissable: boolean;
  prioridade: number;
}

/**
 * Servico responsavel por montar as mensagens do banner de estado no topo da
 * Home. Catalogo completo em
 * docs/fase-0-home-operacional/09-system-state-banner-catalogo.md
 */
@Injectable()
export class SystemStateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onboardingService: OnboardingService,
  ) {}

  async listarMensagens(lojaId: string): Promise<BannerMensagem[]> {
    const mensagens: BannerMensagem[] = [];

    const [trial, configuracaoIncompleta, insumosChapaIncompletos] =
      await Promise.all([
        this.checarTrial(lojaId),
        this.checarConfiguracaoIncompleta(lojaId),
        this.checarInsumosChapaSemTamanho(lojaId),
      ]);

    if (trial) mensagens.push(trial);
    if (configuracaoIncompleta) mensagens.push(configuracaoIncompleta);
    if (insumosChapaIncompletos) mensagens.push(insumosChapaIncompletos);

    // Ordena por prioridade (menor numero = mais importante).
    mensagens.sort((a, b) => a.prioridade - b.prioridade);

    return mensagens;
  }

  // ------------------------------------------------------------------
  // Checadores individuais (cada um e independente para nao derrubar os
  // outros se o banco/tabela ainda nao tiver o campo esperado).
  // ------------------------------------------------------------------

  private async checarTrial(lojaId: string): Promise<BannerMensagem | null> {
    try {
      const loja = await this.prisma.loja.findUnique({
        where: { id: lojaId },
        select: {
          assinatura_ativa: true,
          data_inicio_trial: true,
          trial_restante_dias: true,
        },
      });
      if (!loja || loja.assinatura_ativa) return null;
      if (!loja.data_inicio_trial && !loja.trial_restante_dias) return null;

      const diasRestantes = this.calcularDiasRestantesTrial(
        loja.data_inicio_trial,
        loja.trial_restante_dias,
      );
      if (diasRestantes === null) return null;

      if (diasRestantes <= 0) {
        return {
          id: 'trial_expirado',
          nivel: 'critico',
          titulo: 'Seu período de avaliação encerrou',
          descricao:
            'Ative seu plano para evitar bloqueio das funcionalidades.',
          acao: {
            tipo: 'link',
            label: 'Ativar plano agora',
            href: '/configuracoes/assinatura',
          },
          dismissable: false,
          prioridade: 1,
        };
      }

      if (diasRestantes <= 7) {
        return {
          id: 'trial_expirando',
          nivel: 'atencao',
          titulo: `Seu período de avaliação termina em ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'}`,
          descricao: 'Ative seu plano para continuar usando todos os recursos.',
          acao: {
            tipo: 'link',
            label: 'Ativar plano',
            href: '/configuracoes/assinatura',
          },
          dismissable: false,
          prioridade: 10,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async checarConfiguracaoIncompleta(
    lojaId: string,
  ): Promise<BannerMensagem | null> {
    try {
      const resumo = await this.onboardingService.obterResumo(lojaId);
      if (resumo.progresso_pct >= 60) return null;
      return {
        id: 'configuracao_incompleta',
        nivel: 'informativo',
        titulo: 'Configuração mínima incompleta',
        descricao:
          'Aplique a configuração recomendada para começar mais rápido.',
        acao: {
          tipo: 'endpoint',
          label: 'Aplicar configuração recomendada',
          metodo: 'POST',
          endpoint:
            '/home-operacional/onboarding/aplicar-configuracao-recomendada',
        },
        dismissable: true,
        prioridade: 40,
      };
    } catch {
      return null;
    }
  }

  private async checarInsumosChapaSemTamanho(
    lojaId: string,
  ): Promise<BannerMensagem | null> {
    // Os campos largura_chapa_mm / altura_chapa_mm serao criados na Fase 6.
    // Por enquanto usamos os campos legados largura / altura como proxy.
    try {
      const count = await this.prisma.insumo.count({
        where: {
          loja_id: lojaId,
          ativo: true,
          // Tipos de material com logica de area ou volume sao candidatos a chapa.
          OR: [
            { largura: null, tipoMaterial: { logica_consumo: 'area' } },
            { altura: null, tipoMaterial: { logica_consumo: 'area' } },
          ],
        },
      });
      if (count === 0) return null;
      return {
        id: 'insumos_chapa_sem_tamanho',
        nivel: 'atencao',
        titulo: `${count} insumo${count === 1 ? '' : 's'} sem tamanho de chapa cadastrado`,
        descricao:
          'Cadastre largura e altura para conseguir calcular sobras corretamente.',
        acao: {
          tipo: 'link',
          label: 'Revisar insumos',
          href: '/insumos',
        },
        dismissable: false,
        prioridade: 30,
      };
    } catch {
      return null;
    }
  }

  private calcularDiasRestantesTrial(
    dataInicio: Date | null,
    diasRestantesArmazenado: number | null,
  ): number | null {
    if (
      diasRestantesArmazenado !== null &&
      diasRestantesArmazenado !== undefined
    ) {
      return diasRestantesArmazenado;
    }
    if (!dataInicio) return null;
    const TRIAL_DIAS = 14;
    const diff = Date.now() - new Date(dataInicio).getTime();
    const passados = Math.floor(diff / (1000 * 60 * 60 * 24));
    return TRIAL_DIAS - passados;
  }
}
