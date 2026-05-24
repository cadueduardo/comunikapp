import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardingService } from './onboarding.service';
import { OnboardingStepId } from '../enums/onboarding-step.enum';

export interface AplicarOpcoes {
  sobrescreverExistentes: boolean;
}

export interface ResultadoAplicado {
  loja: Record<string, unknown>;
  categorias_criadas: string[];
  tipos_material_criados: string[];
  setores_criados: string[];
  workflow_criado: string | null;
  regras_validacao_criadas: number;
}

export interface ResultadoIgnorado {
  loja: string[];
  categorias?: string;
  tipos_material?: string;
  setores?: string;
  workflow?: string;
}

export interface AplicarConfiguracaoRecomendadaResultado {
  aplicado: ResultadoAplicado;
  ignorado: ResultadoIgnorado;
  etapas_marcadas_concluidas: OnboardingStepId[];
}

/**
 * Aplica defaults sensatos para uma empresa de comunicacao visual iniciante.
 * Valores definidos em docs/fase-0-home-operacional/08-configuracao-recomendada-defaults.md
 *
 * Regras:
 * - Operacao idempotente.
 * - Nunca sobrescreve valor ja preenchido pelo usuario, salvo se
 *   `sobrescreverExistentes = true` (e mesmo assim apenas em campos da loja).
 * - Categorias, tipos de material, setores e workflow so sao criados se a
 *   loja ainda nao tiver nenhum desses dados.
 */
@Injectable()
export class ConfiguracaoRecomendadaService {
  // Valores defaults (mesmos do documento 08). Caso o produto altere os
  // valores no futuro, mexer apenas aqui.
  private readonly DEFAULT_MARGEM_PCT = 45.0;
  private readonly DEFAULT_IMPOSTO_PCT = 6.0;
  private readonly DEFAULT_TIPO_MARGEM = 'markup';
  private readonly DEFAULT_HORAS_PRODUTIVAS_MES = 352;
  private readonly DEFAULT_CONDICAO_TIPO = 'ENTRADA_SALDO';
  private readonly DEFAULT_CONDICAO_ENTRADA_PCT = 50.0;
  private readonly DEFAULT_CONDICAO_DESCRICAO =
    '50% na assinatura do pedido, 50% na entrega';

  private readonly CATEGORIAS_DEFAULT = [
    'Acrílico',
    'ACM',
    'PVC Expandido',
    'Lona',
    'Adesivo Vinílico',
    'Tinta',
    'Acabamento',
    'Outros',
  ];

  // Logica de consumo segue o enum tipomaterial_logica_consumo do Prisma.
  // Valores aceitos hoje: area | perimetro | quantidade_fixa | custom.
  private readonly TIPOS_MATERIAL_DEFAULT: Array<{
    nome: string;
    logica: 'area' | 'perimetro' | 'quantidade_fixa' | 'custom';
  }> = [
    { nome: 'Chapa Rígida', logica: 'area' },
    { nome: 'Lona', logica: 'area' },
    { nome: 'Vinil/Adesivo', logica: 'area' },
    { nome: 'Unitário', logica: 'quantidade_fixa' },
  ];

  private readonly SETORES_DEFAULT: Array<{ nome: string; cor: string; ordem: number }> = [
    { nome: 'Corte', cor: '#3B82F6', ordem: 1 },
    { nome: 'Impressão', cor: '#10B981', ordem: 2 },
    { nome: 'Acabamento', cor: '#F59E0B', ordem: 3 },
    { nome: 'Montagem', cor: '#8B5CF6', ordem: 4 },
    { nome: 'Entrega/Instalação', cor: '#6B7280', ordem: 5 },
  ];

  private readonly WORKFLOW_DEFAULT_NOME = 'Workflow Padrão';
  private readonly WORKFLOW_DEFAULT_ETAPAS = [
    { nome: 'Revisão técnica', ordem: 1 },
    { nome: 'Corte / Impressão', ordem: 2 },
    { nome: 'Acabamento', ordem: 3 },
    { nome: 'Montagem', ordem: 4 },
    { nome: 'Inspeção final', ordem: 5 },
    { nome: 'Entrega', ordem: 6 },
  ];

  private readonly REGRAS_VALIDACAO_DEFAULT: Array<{
    nome: string;
    descricao: string;
    categoria: string;
    tipo: 'BLOQUEIO' | 'ALERTA' | 'INFO';
    condicoes: object;
    mensagem: string;
    prioridade: number;
  }> = [
    {
      nome: 'Material sem estoque mínimo',
      descricao: 'Alerta quando um insumo nao tem estoque minimo definido.',
      categoria: 'estoque',
      tipo: 'ALERTA',
      condicoes: { campo: 'insumo.estoque_minimo', operador: 'is_null' },
      mensagem: 'Cadastre estoque mínimo para receber alertas.',
      prioridade: 10,
    },
    {
      nome: 'Orçamento sem cliente',
      descricao: 'Bloqueia aprovacao de orcamento sem cliente vinculado.',
      categoria: 'orcamento',
      tipo: 'BLOQUEIO',
      condicoes: { campo: 'orcamento.cliente_id', operador: 'is_null' },
      mensagem: 'Selecione um cliente para aprovar o orçamento.',
      prioridade: 1,
    },
    {
      nome: 'OS sem responsável',
      descricao: 'Alerta quando uma OS e criada sem responsavel atribuido.',
      categoria: 'os',
      tipo: 'ALERTA',
      condicoes: { campo: 'os.responsavel_id', operador: 'is_null' },
      mensagem: 'Atribua um responsável para acompanhar a OS.',
      prioridade: 20,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly onboardingService: OnboardingService,
  ) {}

  async aplicar(
    lojaId: string,
    opcoes: AplicarOpcoes,
  ): Promise<AplicarConfiguracaoRecomendadaResultado> {
    const aplicado: ResultadoAplicado = {
      loja: {},
      categorias_criadas: [],
      tipos_material_criados: [],
      setores_criados: [],
      workflow_criado: null,
      regras_validacao_criadas: 0,
    };
    const ignorado: ResultadoIgnorado = { loja: [] };
    const etapasParaConcluir: OnboardingStepId[] = [];

    // 1. Defaults na loja
    await this.aplicarDefaultsLoja(lojaId, opcoes, aplicado, ignorado, etapasParaConcluir);

    // 2. Categorias (so cria se nao houver nenhuma)
    await this.aplicarCategorias(lojaId, aplicado, ignorado);

    // 3. Tipos de material (so cria se nao houver nenhum)
    await this.aplicarTiposMaterial(lojaId, aplicado, ignorado);

    // 4. Setores produtivos (so cria se nao houver nenhum)
    await this.aplicarSetores(lojaId, aplicado, ignorado);

    // 5. Workflow padrao de OS (so cria se nao houver nenhum)
    await this.aplicarWorkflow(lojaId, aplicado, ignorado);

    // 6. Regras de validacao (cria por nome unico)
    await this.aplicarRegrasValidacao(lojaId, aplicado);

    // 7. Marcar etapas correspondentes como concluidas
    if (etapasParaConcluir.length > 0) {
      await this.onboardingService.marcarStepsComoConcluidos(lojaId, etapasParaConcluir);
    }

    return { aplicado, ignorado, etapas_marcadas_concluidas: etapasParaConcluir };
  }

  // ------------------------------------------------------------------
  // Internos
  // ------------------------------------------------------------------

  private async aplicarDefaultsLoja(
    lojaId: string,
    opcoes: AplicarOpcoes,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
    etapasParaConcluir: OnboardingStepId[],
  ): Promise<void> {
    const loja = await this.prisma.loja.findUnique({ where: { id: lojaId } });
    if (!loja) return;

    const atualizacoes: Record<string, unknown> = {};

    const podeEscrever = (valorExistente: unknown): boolean =>
      opcoes.sobrescreverExistentes || valorExistente === null || valorExistente === undefined;

    if (podeEscrever(loja.margem_lucro_padrao)) {
      atualizacoes.margem_lucro_padrao = this.DEFAULT_MARGEM_PCT;
      aplicado.loja['margem_lucro_padrao'] = this.DEFAULT_MARGEM_PCT;
    } else {
      ignorado.loja.push('margem_lucro_padrao');
    }

    if (podeEscrever(loja.tipo_margem_lucro)) {
      atualizacoes.tipo_margem_lucro = this.DEFAULT_TIPO_MARGEM;
      aplicado.loja['tipo_margem_lucro'] = this.DEFAULT_TIPO_MARGEM;
    } else {
      ignorado.loja.push('tipo_margem_lucro');
    }

    if (podeEscrever(loja.impostos_padrao)) {
      atualizacoes.impostos_padrao = this.DEFAULT_IMPOSTO_PCT;
      aplicado.loja['impostos_padrao'] = this.DEFAULT_IMPOSTO_PCT;
    } else {
      ignorado.loja.push('impostos_padrao');
    }

    if (podeEscrever(loja.horas_produtivas_mensais)) {
      atualizacoes.horas_produtivas_mensais = this.DEFAULT_HORAS_PRODUTIVAS_MES;
      aplicado.loja['horas_produtivas_mensais'] = this.DEFAULT_HORAS_PRODUTIVAS_MES;
    } else {
      ignorado.loja.push('horas_produtivas_mensais');
    }

    if (podeEscrever(loja.condicao_pagamento_padrao_tipo)) {
      atualizacoes.condicao_pagamento_padrao_tipo = this.DEFAULT_CONDICAO_TIPO;
      atualizacoes.condicao_pagamento_padrao_entrada_pct = this.DEFAULT_CONDICAO_ENTRADA_PCT;
      atualizacoes.condicao_pagamento_padrao_descricao = this.DEFAULT_CONDICAO_DESCRICAO;
      aplicado.loja['condicao_pagamento_padrao_tipo'] = this.DEFAULT_CONDICAO_TIPO;
      aplicado.loja['condicao_pagamento_padrao_entrada_pct'] = this.DEFAULT_CONDICAO_ENTRADA_PCT;
      aplicado.loja['condicao_pagamento_padrao_descricao'] = this.DEFAULT_CONDICAO_DESCRICAO;
      etapasParaConcluir.push(OnboardingStepId.CONDICAO_PAGAMENTO);
    } else {
      ignorado.loja.push('condicao_pagamento_padrao_tipo');
    }

    if (Object.keys(atualizacoes).length > 0) {
      atualizacoes.atualizado_em = new Date();
      await this.prisma.loja.update({ where: { id: lojaId }, data: atualizacoes });
    }

    // Marca margem_imposto como concluida se ambos ficaram preenchidos.
    const margemOk = aplicado.loja['margem_lucro_padrao'] !== undefined || loja.margem_lucro_padrao !== null;
    const impostoOk = aplicado.loja['impostos_padrao'] !== undefined || loja.impostos_padrao !== null;
    if (margemOk && impostoOk) {
      etapasParaConcluir.push(OnboardingStepId.MARGEM_IMPOSTO);
    }

    // Marca dados_empresa como concluida se ja preenchidos.
    if (!!loja.nome && !!loja.telefone && (!!loja.cnpj || !!loja.cpf)) {
      etapasParaConcluir.push(OnboardingStepId.DADOS_EMPRESA);
    }
  }

  private async aplicarCategorias(
    lojaId: string,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
  ): Promise<void> {
    const existentes = await this.prisma.categoria.count({ where: { loja_id: lojaId } });
    if (existentes > 0) {
      ignorado.categorias = 'já existem categorias na loja';
      return;
    }
    await this.prisma.categoria.createMany({
      data: this.CATEGORIAS_DEFAULT.map((nome) => ({ loja_id: lojaId, nome })),
      skipDuplicates: true,
    });
    aplicado.categorias_criadas = [...this.CATEGORIAS_DEFAULT];
  }

  private async aplicarTiposMaterial(
    lojaId: string,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
  ): Promise<void> {
    const existentes = await this.prisma.tipomaterial.count({ where: { loja_id: lojaId } });
    if (existentes > 0) {
      ignorado.tipos_material = 'já existem tipos de material na loja';
      return;
    }
    for (const tipo of this.TIPOS_MATERIAL_DEFAULT) {
      try {
        await this.prisma.tipomaterial.create({
          data: {
            id: this.gerarId(),
            loja_id: lojaId,
            nome: tipo.nome,
            logica_consumo: tipo.logica,
            atualizado_em: new Date(),
          },
        });
        aplicado.tipos_material_criados.push(tipo.nome);
      } catch {
        // Se houver conflito por race, ignora silenciosamente.
      }
    }
  }

  private async aplicarSetores(
    lojaId: string,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
  ): Promise<void> {
    const existentes = await this.prisma.setorProdutivo.count({ where: { loja_id: lojaId } });
    if (existentes > 0) {
      ignorado.setores = 'já existem setores produtivos na loja';
      return;
    }
    for (const setor of this.SETORES_DEFAULT) {
      try {
        await this.prisma.setorProdutivo.create({
          data: {
            loja_id: lojaId,
            nome: setor.nome,
            cor: setor.cor,
            ordem: setor.ordem,
          },
        });
        aplicado.setores_criados.push(setor.nome);
      } catch {
        // ignora
      }
    }
  }

  private async aplicarWorkflow(
    lojaId: string,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
  ): Promise<void> {
    const existentes = await this.prisma.workflowOS.count({ where: { loja_id: lojaId } });
    if (existentes > 0) {
      ignorado.workflow = 'já existe pelo menos um workflow de OS na loja';
      return;
    }
    await this.prisma.workflowOS.create({
      data: {
        loja_id: lojaId,
        nome: this.WORKFLOW_DEFAULT_NOME,
        descricao: 'Workflow gerado pela configuração recomendada.',
        sequencial: true,
        ativo: true,
        etapas: JSON.stringify(this.WORKFLOW_DEFAULT_ETAPAS),
      },
    });
    aplicado.workflow_criado = this.WORKFLOW_DEFAULT_NOME;
  }

  private async aplicarRegrasValidacao(
    lojaId: string,
    aplicado: ResultadoAplicado,
  ): Promise<void> {
    for (const regra of this.REGRAS_VALIDACAO_DEFAULT) {
      const existente = await this.prisma.regraValidacao.findFirst({
        where: { loja_id: lojaId, nome: regra.nome },
      });
      if (existente) continue;
      await this.prisma.regraValidacao.create({
        data: {
          loja_id: lojaId,
          nome: regra.nome,
          descricao: regra.descricao,
          categoria: regra.categoria,
          tipo: regra.tipo,
          mensagem: regra.mensagem,
          prioridade: regra.prioridade,
          ativo: true,
          condicoes: JSON.stringify(regra.condicoes),
        },
      });
      aplicado.regras_validacao_criadas += 1;
    }
  }

  private gerarId(): string {
    return 'tm_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  }
}
