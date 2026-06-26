import { z } from 'zod';

const numeroOpcional = z.string().optional();
const parseNumeroFlexivel = (valor: string): number => {
  const cleaned = valor.replace(/[^0-9,.-]/g, '');
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(',', '.');
  return Number(normalized);
};

export const isProdutoPrateleiraItem = (item: { tipo_item?: string | null }) =>
  String(item?.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO';

export const isItemAguardandoConfiguracao = (item: {
  tipo_item?: string | null;
  nome_servico?: string;
  materiais?: Array<{ insumo_id?: string }>;
}) => {
  if (isProdutoPrateleiraItem(item)) {
    return false;
  }
  const temNome = Boolean(item.nome_servico?.trim());
  const temMaterial = (item.materiais || []).some((material) =>
    Boolean(material?.insumo_id?.trim()),
  );
  return !temNome && !temMaterial;
};

export const validarMateriaisItensProduto = (
  itens:
    | Array<{
        tipo_item?: string;
        nome_servico?: string;
        materiais?: Array<{ insumo_id?: string }>;
      }>
    | undefined,
): string | null => {
  if (!itens?.length) {
    return 'Adicione pelo menos um produto ao orçamento';
  }

  for (let i = 0; i < itens.length; i++) {
    if (isProdutoPrateleiraItem(itens[i])) {
      continue;
    }
    if (isItemAguardandoConfiguracao(itens[i])) {
      return `O produto ${i + 1} ainda não foi configurado. Carregue um modelo, adicione um produto de prateleira ou preencha manualmente.`;
    }
    const temMaterial = (itens[i].materiais || []).some((material) =>
      Boolean(material?.insumo_id?.trim()),
    );
    if (!temMaterial) {
      return `O produto ${i + 1} deve ter pelo menos um material`;
    }
  }

  return null;
};

const itemProdutoSchema = z
  .object({
    tipo_item: z.enum(['SOB_DEMANDA', 'PRODUTO_FINITO']).optional(),
    produto_finito_id: z.string().optional(),
    sku_snapshot: z.string().optional(),
    preco_unitario_snapshot: z.string().optional(),
    preco_custo_snapshot: z.string().optional(),
    estoque_catalogo: z.number().optional(),
    imagem_snapshot_url: z.string().optional(),
    nome_servico: z.string().optional(),
    quantidade_produto: numeroOpcional,
    descricao: z.string().optional(),
    descricao_detalhada: z.string().optional(),
    largura_produto: numeroOpcional,
    altura_produto: numeroOpcional,
    profundidade_produto: numeroOpcional,
    tem_profundidade: z.boolean().optional(),
    unidade_medida_produto: z.string().optional(),
    area_produto: numeroOpcional,
    perimetro_produto: numeroOpcional,
    geometria_origem: z.enum(['MANUAL', 'IMAGEM', 'DXF']).optional(),
    arquivo_geometria_url: z.string().optional(),
    unidade_geometria: z.enum(['mm', 'cm', 'm']).optional(),

    materiais: z
      .array(
        z.object({
          insumo_id: z.string().optional(),
          quantidade: z.string().optional(),
          material_do_cliente: z.boolean().optional(),
          usa_medida_propria: z.boolean().optional(),
          largura_material: numeroOpcional,
          altura_material: numeroOpcional,
          profundidade_material: numeroOpcional,
          unidade_medida_material: z.enum(['mm', 'cm', 'm']).optional(),
        }),
      )
      .optional(),
    maquinas: z.array(
      z.object({
        maquina_id: z.string().optional(),
        horas_utilizadas: z.string().optional(),
      }),
    ).optional(),
    funcoes: z.array(
      z.object({
        funcao_id: z.string().optional(),
        horas_trabalhadas: z.string().optional(),
      }),
    ).optional(),
    servicos: z.array(
      z.object({
        servico_id: z.string().optional(),
        horas_trabalhadas: z.string().optional(),
      }),
    ).optional(),

    instalacao_necessaria: z.boolean().optional(),
    instalacao_tipo_id: z.string().optional(),
    instalacao_regra_cobranca: z.string().optional(),
    instalacao_valor_unitario: numeroOpcional,
    instalacao_usar_endereco_entrega: z.boolean().optional(),
    instalacao_endereco_snapshot: z.string().optional(),
    instalacao_cep: z.string().max(16).optional(),
    instalacao_logradouro: z.string().max(255).optional(),
    instalacao_numero: z.string().max(32).optional(),
    instalacao_complemento: z.string().max(255).optional(),
    instalacao_bairro: z.string().max(120).optional(),
    instalacao_cidade: z.string().max(120).optional(),
    instalacao_estado: z.string().max(2).optional(),
    instalacao_preco_cobrado: numeroOpcional,
    instalacao_custo_mao_obra: numeroOpcional,
    instalacao_custo_deslocamento: numeroOpcional,
    instalacao_tempo_estimado_min: numeroOpcional,
    instalacao_quantidade_pessoas: numeroOpcional,
    instalacao_observacoes: z.string().max(50000).optional(),
  })
  .superRefine((item, ctx) => {
    if (isProdutoPrateleiraItem(item)) {
      if (!item.produto_finito_id?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione um produto de prateleira válido',
          path: ['produto_finito_id'],
        });
      }
      return;
    }

    if (isItemAguardandoConfiguracao(item)) {
      return;
    }

    if (!item.nome_servico?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome do produto e obrigatorio',
        path: ['nome_servico'],
      });
    }

    const materiaisValidos = (item.materiais || []).filter(
      (material) =>
        material?.insumo_id?.trim() &&
        material?.quantidade?.trim() &&
        Number(material.quantidade.replace(',', '.')) > 0,
    );

    if (materiaisValidos.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adicione pelo menos um material',
        path: ['materiais'],
      });
    }
  });

export const createFormSchema = (mode: 'novo' | 'editar' | 'template') =>
  z.object({
    cliente_id:
      mode === 'template'
        ? z.string().optional()
        : z.string().min(1, 'Selecione um cliente'),
    titulo:
      mode === 'template'
        ? z.string().optional()
        : z.string().min(3, 'Informe um titulo com pelo menos 3 caracteres'),

    margem_lucro_customizada: numeroOpcional,
    impostos_customizados: numeroOpcional,
    valor_final_manual: numeroOpcional.refine((val) => {
      if (!val || val.trim() === '') return true;
      const num = parseNumeroFlexivel(val);
      return !Number.isNaN(num) && num >= 0;
    }, 'Valor final deve ser um numero valido maior ou igual a zero'),
    tipo_margem_lucro: z.enum(['markup', 'margem_por_dentro', '']).optional(),
    condicoes_comerciais: z.string().optional(),
    prazo_entrega: z.string().optional(),
    forma_pagamento: z.string().optional(),
    validade_proposta: z.string().optional(),

    condicao_pagamento_tipo: z
      .enum([
        'A_VISTA',
        'ENTRADA_SALDO',
        'FATURADO_30',
        'FATURADO_60',
        'FATURADO_90',
        'PARCELADO',
        'PERSONALIZADO',
      ])
      .optional(),
    condicao_pagamento_entrada_pct: numeroOpcional.refine((val) => {
      if (!val || val.trim() === '') return true;
      const num = Number(val.replace(',', '.'));
      return !Number.isNaN(num) && num >= 1 && num <= 99;
    }, 'Percentual de entrada deve estar entre 1 e 99'),
    condicao_pagamento_parcelas: numeroOpcional.refine((val) => {
      if (!val || val.trim() === '') return true;
      const num = Number(val);
      return Number.isInteger(num) && num >= 2 && num <= 36;
    }, 'Numero de parcelas deve estar entre 2 e 36'),
    condicao_pagamento_descricao: z.string().max(255).optional(),

    entrega_modalidade_id: z.string().optional(),
    entrega_modalidade_nome: z.string().max(255).optional(),
    entrega_usar_endereco_cliente: z.boolean().optional(),
    entrega_endereco_snapshot: z.string().optional(),
    entrega_cep: z.string().max(16).optional(),
    entrega_logradouro: z.string().max(255).optional(),
    entrega_numero: z.string().max(32).optional(),
    entrega_complemento: z.string().max(255).optional(),
    entrega_bairro: z.string().max(120).optional(),
    entrega_cidade: z.string().max(120).optional(),
    entrega_estado: z.string().max(2).optional(),
    entrega_prazo_dias: numeroOpcional,
    entrega_valor_cobrado: numeroOpcional,
    entrega_custo_estimado: numeroOpcional,
    entrega_observacoes: z.string().max(50000).optional(),

    atendente: z.string().optional(),
    comissao_percentual: numeroOpcional.refine((val) => {
      if (!val || val.trim() === '') return true;
      const num = Number(val.replace(',', '.'));
      return !Number.isNaN(num) && num >= 0 && num <= 100;
    }, 'Comissao deve ser um numero entre 0 e 100'),

    itens_produto: z.array(itemProdutoSchema).min(1, 'Adicione pelo menos um produto'),
  });

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>;
