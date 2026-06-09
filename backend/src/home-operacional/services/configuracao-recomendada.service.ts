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
  modalidades_entrega_criadas: string[];
  tipos_instalacao_criados: string[];
  workflow_criado: string | null;
  regras_validacao_criadas: number;
}

export interface ResultadoIgnorado {
  loja: string[];
  categorias?: string;
  tipos_material?: string;
  setores?: string;
  modalidades_entrega?: string;
  tipos_instalacao?: string;
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

  private readonly MODALIDADES_ENTREGA_DEFAULT: Array<{
    nome: string;
    descricao: string;
    exige_endereco: boolean;
    exige_valor: boolean;
    permite_retirada: boolean;
  }> = [
    {
      nome: 'Retirada no balcão',
      descricao: 'Cliente retira o pedido na empresa.',
      exige_endereco: false,
      exige_valor: false,
      permite_retirada: true,
    },
    {
      nome: 'Entrega própria',
      descricao: 'Entrega realizada pela equipe da empresa.',
      exige_endereco: true,
      exige_valor: true,
      permite_retirada: false,
    },
    {
      nome: 'Motoboy',
      descricao: 'Entrega por motoboy ou serviço local terceirizado.',
      exige_endereco: true,
      exige_valor: true,
      permite_retirada: false,
    },
    {
      nome: 'Transportadora',
      descricao: 'Envio por transportadora.',
      exige_endereco: true,
      exige_valor: true,
      permite_retirada: false,
    },
    {
      nome: 'Correios / envio externo',
      descricao: 'Envio por Correios ou outro serviço externo.',
      exige_endereco: true,
      exige_valor: true,
      permite_retirada: false,
    },
    {
      nome: 'Outro',
      descricao: 'Modalidade de entrega definida manualmente no orçamento.',
      exige_endereco: false,
      exige_valor: false,
      permite_retirada: false,
    },
  ];

  private readonly TIPOS_INSTALACAO_DEFAULT: Array<{
    nome: string;
    descricao: string;
    regra_cobranca: 'FIXO' | 'POR_M2' | 'POR_ML' | 'POR_UNIDADE' | 'POR_HORA' | 'MANUAL';
    exige_endereco: boolean;
    exige_agendamento: boolean;
  }> = [
    {
      nome: 'Aplicação simples',
      descricao: 'Aplicação ou instalação leve, normalmente sem equipe especializada.',
      regra_cobranca: 'FIXO',
      exige_endereco: true,
      exige_agendamento: false,
    },
    {
      nome: 'Instalação em fachada',
      descricao: 'Instalação de placa, letreiro ou comunicação visual em fachada.',
      regra_cobranca: 'POR_M2',
      exige_endereco: true,
      exige_agendamento: true,
    },
    {
      nome: 'Adesivação de vitrine',
      descricao: 'Aplicação de adesivo em vitrine, porta ou vidro.',
      regra_cobranca: 'POR_M2',
      exige_endereco: true,
      exige_agendamento: true,
    },
    {
      nome: 'Adesivação de veículo',
      descricao: 'Aplicação de adesivo, envelopamento parcial ou comunicação em veículo.',
      regra_cobranca: 'POR_M2',
      exige_endereco: true,
      exige_agendamento: true,
    },
    {
      nome: 'Instalação em altura',
      descricao: 'Instalação que exige cuidado operacional adicional por altura ou acesso.',
      regra_cobranca: 'MANUAL',
      exige_endereco: true,
      exige_agendamento: true,
    },
    {
      nome: 'Instalação elétrica',
      descricao: 'Instalação com ligação elétrica ou componente luminoso.',
      regra_cobranca: 'MANUAL',
      exige_endereco: true,
      exige_agendamento: true,
    },
    {
      nome: 'Outro',
      descricao: 'Tipo de instalação definido manualmente no orçamento.',
      regra_cobranca: 'MANUAL',
      exige_endereco: true,
      exige_agendamento: false,
    },
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
      modalidades_entrega_criadas: [],
      tipos_instalacao_criados: [],
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
    await this.garantirSetoresPadrao(lojaId, aplicado, ignorado);

    // 5. Entrega e instalacao para orientar orcamento e OS
    await this.aplicarEntregaInstalacao(lojaId, aplicado, ignorado, etapasParaConcluir);

    // 6. Workflow padrao de OS (cria ou repara vinculos com setores)
    await this.aplicarWorkflow(lojaId, aplicado, ignorado);

    // 7. Regras de validacao (cria por nome unico)
    await this.aplicarRegrasValidacao(lojaId, aplicado);

    // 8. Marcar etapas correspondentes como concluidas
    if (etapasParaConcluir.length > 0) {
      await this.onboardingService.marcarStepsComoConcluidos(lojaId, etapasParaConcluir);
    }

    return { aplicado, ignorado, etapas_marcadas_concluidas: etapasParaConcluir };
  }

  async aplicarSomenteEntregaInstalacao(
    lojaId: string,
  ): Promise<AplicarConfiguracaoRecomendadaResultado> {
    const aplicado: ResultadoAplicado = {
      loja: {},
      categorias_criadas: [],
      tipos_material_criados: [],
      setores_criados: [],
      modalidades_entrega_criadas: [],
      tipos_instalacao_criados: [],
      workflow_criado: null,
      regras_validacao_criadas: 0,
    };
    const ignorado: ResultadoIgnorado = { loja: [] };
    const etapasParaConcluir: OnboardingStepId[] = [];

    await this.aplicarEntregaInstalacao(lojaId, aplicado, ignorado, etapasParaConcluir);

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

  private async garantirSetoresPadrao(
    lojaId: string,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
  ): Promise<void> {
    const existentes = await this.prisma.setorProdutivo.count({
      where: { loja_id: lojaId },
    });
    if (existentes > 0) {
      if (!ignorado.setores) {
        ignorado.setores = 'já existem setores produtivos na loja';
      }
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
            ativo: true,
          },
        });
        aplicado.setores_criados.push(setor.nome);
      } catch {
        // ignora conflito por race
      }
    }
  }

  private async vincularSetoresAoWorkflow(
    workflowId: string,
    lojaId: string,
  ): Promise<number> {
    const setores = await this.prisma.setorProdutivo.findMany({
      where: { loja_id: lojaId, ativo: true },
      orderBy: { ordem: 'asc' },
    });

    if (setores.length === 0) {
      return 0;
    }

    const vinculosExistentes = await this.prisma.workflowSetor.findMany({
      where: { workflow_id: workflowId },
      select: { setor_id: true },
    });
    const setoresJaVinculados = new Set(
      vinculosExistentes.map((vinculo) => vinculo.setor_id),
    );

    const novosVinculos = setores
      .filter((setor) => !setoresJaVinculados.has(setor.id))
      .map((setor, index) => ({
        workflow_id: workflowId,
        setor_id: setor.id,
        ordem: setor.ordem ?? index + 1,
      }));

    if (novosVinculos.length === 0) {
      return vinculosExistentes.length;
    }

    await this.prisma.workflowSetor.createMany({
      data: novosVinculos,
      skipDuplicates: true,
    });

    return vinculosExistentes.length + novosVinculos.length;
  }

  private async aplicarEntregaInstalacao(
    lojaId: string,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
    etapasParaConcluir: OnboardingStepId[],
  ): Promise<void> {
    const [modalidadesExistentes, tiposExistentes] = await Promise.all([
      this.prisma.modalidadeEntrega.findMany({
        where: { loja_id: lojaId },
        select: { nome: true },
      }),
      this.prisma.tipoInstalacao.findMany({
        where: { loja_id: lojaId },
        select: { nome: true },
      }),
    ]);

    const nomesModalidades = new Set(
      modalidadesExistentes.map((item) => item.nome.trim().toLowerCase()),
    );
    const modalidadesParaCriar = this.MODALIDADES_ENTREGA_DEFAULT.filter(
      (item) => !nomesModalidades.has(item.nome.trim().toLowerCase()),
    );

    if (modalidadesParaCriar.length > 0) {
      await this.prisma.modalidadeEntrega.createMany({
        data: modalidadesParaCriar.map((item) => ({
          loja_id: lojaId,
          nome: item.nome,
          descricao: item.descricao,
          ativo: true,
          exige_endereco: item.exige_endereco,
          exige_valor: item.exige_valor,
          permite_retirada: item.permite_retirada,
        })),
        skipDuplicates: true,
      });
      aplicado.modalidades_entrega_criadas = modalidadesParaCriar.map(
        (item) => item.nome,
      );
    } else {
      ignorado.modalidades_entrega =
        'modalidades de entrega recomendadas ja existem na loja';
    }

    const nomesTipos = new Set(
      tiposExistentes.map((item) => item.nome.trim().toLowerCase()),
    );
    const tiposParaCriar = this.TIPOS_INSTALACAO_DEFAULT.filter(
      (item) => !nomesTipos.has(item.nome.trim().toLowerCase()),
    );

    if (tiposParaCriar.length > 0) {
      await this.prisma.tipoInstalacao.createMany({
        data: tiposParaCriar.map((item) => ({
          loja_id: lojaId,
          nome: item.nome,
          descricao: item.descricao,
          ativo: true,
          regra_cobranca: item.regra_cobranca,
          exige_endereco: item.exige_endereco,
          exige_agendamento: item.exige_agendamento,
        })),
        skipDuplicates: true,
      });
      aplicado.tipos_instalacao_criados = tiposParaCriar.map(
        (item) => item.nome,
      );
    } else {
      ignorado.tipos_instalacao =
        'tipos de instalacao recomendados ja existem na loja';
    }

    const temModalidade =
      modalidadesExistentes.length > 0 || modalidadesParaCriar.length > 0;
    const temTipo = tiposExistentes.length > 0 || tiposParaCriar.length > 0;
    if (temModalidade && temTipo) {
      etapasParaConcluir.push(OnboardingStepId.CONFIGURAR_ENTREGA_INSTALACAO);
    }
  }

  private async aplicarWorkflow(
    lojaId: string,
    aplicado: ResultadoAplicado,
    ignorado: ResultadoIgnorado,
  ): Promise<void> {
    // Garante setores antes de criar/vincular workflow (evita workflow "vazio").
    await this.garantirSetoresPadrao(lojaId, aplicado, ignorado);

    const workflowExistente = await this.prisma.workflowOS.findFirst({
      where: { loja_id: lojaId, nome: this.WORKFLOW_DEFAULT_NOME },
      select: { id: true },
    });

    let workflowId = workflowExistente?.id;

    if (!workflowId) {
      const totalWorkflows = await this.prisma.workflowOS.count({
        where: { loja_id: lojaId },
      });
      if (totalWorkflows > 0) {
        ignorado.workflow =
          'já existe outro workflow na loja; mantido sem alterar nome ou setores';
        return;
      }

      const workflowCriado = await this.prisma.workflowOS.create({
        data: {
          loja_id: lojaId,
          nome: this.WORKFLOW_DEFAULT_NOME,
          descricao: 'Workflow gerado pela configuração recomendada.',
          sequencial: true,
          ativo: true,
          etapas: JSON.stringify(this.WORKFLOW_DEFAULT_ETAPAS),
        },
        select: { id: true },
      });
      workflowId = workflowCriado.id;
    }

    const totalVinculos = await this.vincularSetoresAoWorkflow(workflowId, lojaId);
    if (totalVinculos === 0) {
      ignorado.workflow =
        'workflow padrão sem setores produtivos vinculados (cadastre setores ativos)';
    }

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
