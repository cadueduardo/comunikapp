import { z } from 'zod';

export const createFormSchema = (mode: 'novo' | 'editar' | 'template') => z.object({
  cliente_id: mode === 'template' ? z.string().optional() : z.string().min(1, 'Selecione um cliente'),
  titulo: mode === 'template'
    ? z.string().optional()
    : z.string().min(3, 'Informe um título com pelo menos 3 caracteres'),
  // Configurações globais
  margem_lucro_customizada: z.string().optional(),
  impostos_customizados: z.string().optional(),
  /** 'markup' | 'margem_por_dentro' | '' (usar padrão da loja) */
  tipo_margem_lucro: z.enum(['markup', 'margem_por_dentro', '']).optional(),
  condicoes_comerciais: z.string().optional(),
  // Configurações comerciais
  prazo_entrega: z.string().optional(),
  /**
   * DEPRECATED (Fase 6 - 2026-05-25): substituido por condicao_pagamento_*.
   * Mantido aqui apenas para nao quebrar formularios antigos em execucao.
   * Novos orcamentos nao gravam mais este campo (gerado a partir dos estruturados).
   */
  forma_pagamento: z.string().optional(),
  validade_proposta: z.string().optional(),
  // Fase 6 - Condicao de pagamento estruturada
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
  condicao_pagamento_entrada_pct: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = Number(val.replace(',', '.'));
        return !Number.isNaN(num) && num >= 1 && num <= 99;
      },
      'Percentual de entrada deve estar entre 1 e 99',
    ),
  condicao_pagamento_parcelas: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const num = Number(val);
        return Number.isInteger(num) && num >= 2 && num <= 36;
      },
      'Numero de parcelas deve estar entre 2 e 36',
    ),
  condicao_pagamento_descricao: z.string().max(255).optional(),
  atendente: z.string().optional(),
  comissao_percentual: z.string().optional().refine(
    (val) => {
      if (!val || val.trim() === '') return true; // Opcional
      const cleanVal = val.replace(',', '.');
      const num = Number(cleanVal);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    'Comissão deve ser um número entre 0 e 100'
  ),
  // Itens de produto
  itens_produto: z.array(z.object({
    nome_servico: z.string().min(1, 'Nome do produto é obrigatório'),
    quantidade_produto: z.string().optional(),
    descricao: z.string().optional(),
    // Medidas do produto
    largura_produto: z.string().optional(),
    altura_produto: z.string().optional(),
    // Fase 11: profundidade opcional para produtos 3D (totens, letras caixa, displays).
    // Quando preenchida, segue a mesma 'unidade_geometria' do produto.
    profundidade_produto: z.string().optional(),
    // Fase 11: flag controlada pelo checkbox "Este produto tem profundidade (3D)".
    // Quando false ou ausente, o campo profundidade_produto fica oculto e e ignorado pelo motor.
    tem_profundidade: z.boolean().optional(),
    unidade_medida_produto: z.string().optional(),
    area_produto: z.string().optional(),
    perimetro_produto: z.string().optional(),
    geometria_origem: z.enum(['MANUAL', 'IMAGEM', 'DXF']).optional(),
    arquivo_geometria_url: z.string().optional(),
    unidade_geometria: z.enum(['mm', 'cm', 'm']).optional(),
    // Materiais utilizados para este produto
    materiais: z.array(z.object({
      insumo_id: z.string().min(1, 'Selecione um material'),
      quantidade: z.string().min(1, 'Quantidade é obrigatória').refine(
        (val) => {
          const cleanVal = val.replace(',', '.');
          const num = Number(cleanVal);
          return !isNaN(num) && num > 0;
        },
        'Quantidade deve ser um número válido maior que zero'
      ),
      material_do_cliente: z.boolean().optional(),
    })).min(1, 'Adicione pelo menos um material'),
    // Máquinas utilizadas para este produto
    maquinas: z.array(z.object({
      maquina_id: z.string().min(1, 'Selecione uma máquina'),
      horas_utilizadas: z.string().min(1, 'Horas utilizadas é obrigatória'),
    })),
    // Funções utilizadas para este produto
    funcoes: z.array(z.object({
      funcao_id: z.string().min(1, 'Selecione uma função'),
      horas_trabalhadas: z.string().min(1, 'Horas trabalhadas é obrigatória'),
    })),
    // Serviços manuais utilizados para este produto
    servicos: z.array(z.object({
      servico_id: z.string().min(1, 'Selecione um serviço'),
      horas_trabalhadas: z.string().min(1, 'Horas trabalhadas é obrigatória'),
    })),
  })).min(1, 'Adicione pelo menos um produto'),
});

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>;
