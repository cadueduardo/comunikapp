import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ONBOARDING_ETAPAS_CATALOGO } from '../catalogos/onboarding-etapas.catalogo';
import { OnboardingStatus } from '../enums/onboarding-status.enum';
import { OnboardingStepId } from '../enums/onboarding-step.enum';
import {
  OnboardingEtapaCatalogo,
  OnboardingEtapaEstado,
  OnboardingResumo,
} from '../interfaces/onboarding.interface';

type AcaoStep = 'ignorar' | 'reativar';

/**
 * Servico do onboarding operacional. Responsabilidades:
 * - Detectar automaticamente quais etapas estao concluidas via queries.
 * - Persistir estado de "ignorado" / "reativado".
 * - Calcular progresso (apenas etapas obrigatorias entram no denominador).
 *
 * NUNCA conclui uma etapa sem que a deteccao automatica retorne true,
 * exceto quando a propria acao do usuario implica conclusao (ex.: aplicar
 * configuracao recomendada marca explicitamente etapas correspondentes).
 */
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async obterResumo(lojaId: string): Promise<OnboardingResumo> {
    const [estadosPersistidos, deteccoes] = await Promise.all([
      this.prisma.onboardingOperacional.findMany({ where: { loja_id: lojaId } }),
      this.detectarConclusoes(lojaId),
    ]);

    const persistidosPorStep = new Map(
      estadosPersistidos.map((e) => [e.step_id, e]),
    );

    const etapas: OnboardingEtapaEstado[] = [];
    for (const catalogo of ONBOARDING_ETAPAS_CATALOGO) {
      const persistido = persistidosPorStep.get(catalogo.step_id);
      const detectadoConcluido = deteccoes[catalogo.step_id] === true;

      let status: OnboardingStatus;
      let concluidoEm: Date | null = persistido?.concluido_em ?? null;
      const ignoradoEm: Date | null = persistido?.ignorado_em ?? null;

      if (persistido?.status === OnboardingStatus.IGNORADO) {
        status = OnboardingStatus.IGNORADO;
      } else if (detectadoConcluido) {
        status = OnboardingStatus.CONCLUIDO;
        if (!concluidoEm) {
          // Persiste o momento da deteccao para auditoria, sem bloquear o request.
          await this.marcarComoConcluidoAutomaticamente(lojaId, catalogo.step_id);
          concluidoEm = new Date();
        }
      } else {
        status = OnboardingStatus.PENDENTE;
      }

      etapas.push(this.montarEstado(catalogo, status, concluidoEm, ignoradoEm));
    }

    return this.calcularResumo(etapas);
  }

  async atualizarStep(
    lojaId: string,
    stepId: string,
    acao: AcaoStep,
  ): Promise<OnboardingResumo> {
    const stepValido = ONBOARDING_ETAPAS_CATALOGO.find((c) => c.step_id === stepId);
    if (!stepValido) {
      throw new NotFoundException(`Etapa de onboarding desconhecida: ${stepId}`);
    }
    if (acao !== 'ignorar' && acao !== 'reativar') {
      throw new BadRequestException(`Acao invalida: ${acao}. Use 'ignorar' ou 'reativar'.`);
    }

    if (acao === 'ignorar') {
      await this.prisma.onboardingOperacional.upsert({
        where: { loja_id_step_id: { loja_id: lojaId, step_id: stepId } },
        create: {
          loja_id: lojaId,
          step_id: stepId,
          status: OnboardingStatus.IGNORADO,
          ignorado_em: new Date(),
        },
        update: {
          status: OnboardingStatus.IGNORADO,
          ignorado_em: new Date(),
        },
      });
    } else {
      // Reativar: limpar marcacao de ignorado; status final volta a depender
      // da deteccao automatica (no proximo obterResumo).
      await this.prisma.onboardingOperacional.upsert({
        where: { loja_id_step_id: { loja_id: lojaId, step_id: stepId } },
        create: {
          loja_id: lojaId,
          step_id: stepId,
          status: OnboardingStatus.PENDENTE,
          ignorado_em: null,
        },
        update: {
          status: OnboardingStatus.PENDENTE,
          ignorado_em: null,
        },
      });
    }

    return this.obterResumo(lojaId);
  }

  /**
   * Marca explicitamente uma lista de steps como concluidos. Usado pelo
   * ConfiguracaoRecomendadaService apos aplicar defaults.
   */
  async marcarStepsComoConcluidos(
    lojaId: string,
    stepIds: OnboardingStepId[],
  ): Promise<void> {
    const agora = new Date();
    await Promise.all(
      stepIds.map((stepId) =>
        this.prisma.onboardingOperacional.upsert({
          where: { loja_id_step_id: { loja_id: lojaId, step_id: stepId } },
          create: {
            loja_id: lojaId,
            step_id: stepId,
            status: OnboardingStatus.CONCLUIDO,
            concluido_em: agora,
          },
          update: {
            status: OnboardingStatus.CONCLUIDO,
            concluido_em: agora,
            ignorado_em: null,
          },
        }),
      ),
    );
  }

  // ------------------------------------------------------------------
  // Internos
  // ------------------------------------------------------------------

  private async marcarComoConcluidoAutomaticamente(
    lojaId: string,
    stepId: string,
  ): Promise<void> {
    try {
      await this.prisma.onboardingOperacional.upsert({
        where: { loja_id_step_id: { loja_id: lojaId, step_id: stepId } },
        create: {
          loja_id: lojaId,
          step_id: stepId,
          status: OnboardingStatus.CONCLUIDO,
          concluido_em: new Date(),
        },
        update: {
          status: OnboardingStatus.CONCLUIDO,
          concluido_em: new Date(),
        },
      });
    } catch {
      // Persistencia silenciosa: se falhar, a deteccao continua valendo no
      // proximo request. Nao bloquear o resumo por causa disso.
    }
  }

  /**
   * Detecta etapas concluidas com queries leves. Cada bloco e independente
   * para evitar que uma falha derrube as outras leituras.
   */
  private async detectarConclusoes(
    lojaId: string,
  ): Promise<Partial<Record<OnboardingStepId, boolean>>> {
    const resultado: Partial<Record<OnboardingStepId, boolean>> = {};

    const [
      loja,
      clientesCount,
      insumosCount,
      maquinasCount,
      servicosCount,
      modalidadesEntregaCount,
      tiposInstalacaoCount,
      orcamentosCount,
      aprovadosCount,
      producaoCount,
    ] =
      await Promise.all([
        this.prisma.loja.findUnique({
          where: { id: lojaId },
          select: {
            nome: true,
            telefone: true,
            cnpj: true,
            cpf: true,
            margem_lucro_padrao: true,
            impostos_padrao: true,
            comissao_padrao: true,
            condicao_pagamento_padrao_tipo: true,
            pcp_nivel: true,
          },
        }),
        this.prisma.cliente.count({ where: { loja_id: lojaId } }),
        this.prisma.insumo.count({ where: { loja_id: lojaId, ativo: true } }),
        this.prisma.maquina.count({ where: { loja_id: lojaId, ativo: true } }),
        this.prisma.servico_manual.count({
          where: { loja_id: lojaId, ativo: true },
        }),
        this.prisma.modalidadeEntrega.count({
          where: { loja_id: lojaId, ativo: true },
        }),
        this.prisma.tipoInstalacao.count({
          where: { loja_id: lojaId, ativo: true },
        }),
        this.prisma.orcamento.count({ where: { loja_id: lojaId } }),
        this.prisma.orcamento.count({
          where: { loja_id: lojaId, status: 'aprovado' },
        }),
        this.prisma.ordemServico.count({
          where: {
            loja_id: lojaId,
            status: { in: ['PRODUCAO', 'ACABAMENTO', 'FINALIZADA'] },
          },
        }),
      ]);

    if (loja) {
      resultado[OnboardingStepId.DADOS_EMPRESA] =
        !!loja.nome && !!loja.telefone && (!!loja.cnpj || !!loja.cpf);
      resultado[OnboardingStepId.MARGEM_IMPOSTO] =
        loja.margem_lucro_padrao !== null &&
        loja.impostos_padrao !== null &&
        loja.comissao_padrao !== null;
      resultado[OnboardingStepId.CONDICAO_PAGAMENTO] =
        !!loja.condicao_pagamento_padrao_tipo;
      resultado[OnboardingStepId.CONFIGURAR_PRODUCAO] =
        loja.pcp_nivel === 'ESSENCIAL' ||
        loja.pcp_nivel === 'ORGANIZADO' ||
        loja.pcp_nivel === 'COMPLETO';
    }

    resultado[OnboardingStepId.PRIMEIRO_CLIENTE] = clientesCount > 0;
    resultado[OnboardingStepId.PRIMEIRO_MATERIAL] = insumosCount > 0;
    resultado[OnboardingStepId.PRIMEIRA_MAQUINA] =
      maquinasCount > 0 || servicosCount > 0;
    resultado[OnboardingStepId.CONFIGURAR_ENTREGA_INSTALACAO] =
      modalidadesEntregaCount > 0 && tiposInstalacaoCount > 0;
    resultado[OnboardingStepId.PRIMEIRO_ORCAMENTO] = orcamentosCount > 0;
    resultado[OnboardingStepId.PRIMEIRA_APROVACAO] = aprovadosCount > 0;
    resultado[OnboardingStepId.PRIMEIRA_PRODUCAO] = producaoCount > 0;

    // PRIMEIRO_RECEBIMENTO depende do modulo financeiro (Fase 6); por
    // enquanto fica sempre como nao detectado, podendo ser marcado
    // manualmente pelo proprio modulo no futuro.
    resultado[OnboardingStepId.PRIMEIRO_RECEBIMENTO] = false;

    return resultado;
  }

  private montarEstado(
    catalogo: OnboardingEtapaCatalogo,
    status: OnboardingStatus,
    concluidoEm: Date | null,
    ignoradoEm: Date | null,
  ): OnboardingEtapaEstado {
    return {
      step_id: catalogo.step_id,
      titulo: catalogo.titulo,
      descricao_curta: catalogo.descricao_curta,
      acao_label: catalogo.acao_label,
      acao_href: catalogo.acao_href,
      obrigatoria: catalogo.obrigatoria,
      status,
      concluido_em: concluidoEm,
      ignorado_em: ignoradoEm,
    };
  }

  private calcularResumo(etapas: OnboardingEtapaEstado[]): OnboardingResumo {
    const totalObrigatorias = etapas.filter((e) => e.obrigatoria).length;
    const obrigatoriasConcluidas = etapas.filter(
      (e) => e.obrigatoria && e.status === OnboardingStatus.CONCLUIDO,
    ).length;

    const progressoPct =
      totalObrigatorias === 0
        ? 100
        : Math.round((100 * obrigatoriasConcluidas) / totalObrigatorias);

    return {
      progresso_pct: progressoPct,
      total_etapas: etapas.length,
      total_obrigatorias: totalObrigatorias,
      obrigatorias_concluidas: obrigatoriasConcluidas,
      etapas,
    };
  }
}
