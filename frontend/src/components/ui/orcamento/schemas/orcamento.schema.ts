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

    itens_produto: z
      .array(
        z.object({
          nome_servico: z.string().min(1, 'Nome do produto e obrigatorio'),
          quantidade_produto: numeroOpcional,
          descricao: z.string().optional(),
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
                insumo_id: z.string().min(1, 'Selecione um material'),
                quantidade: z.string().min(1, 'Quantidade e obrigatoria').refine(
                  (val) => {
                    const num = Number(val.replace(',', '.'));
                    return !Number.isNaN(num) && num > 0;
                  },
                  'Quantidade deve ser um numero valido maior que zero',
                ),
                material_do_cliente: z.boolean().optional(),
              }),
            )
            .min(1, 'Adicione pelo menos um material'),
          maquinas: z.array(
            z.object({
              maquina_id: z.string().min(1, 'Selecione uma maquina'),
              horas_utilizadas: z.string().min(1, 'Horas utilizadas e obrigatoria'),
            }),
          ),
          funcoes: z.array(
            z.object({
              funcao_id: z.string().min(1, 'Selecione uma funcao'),
              horas_trabalhadas: z.string().min(1, 'Horas trabalhadas e obrigatoria'),
            }),
          ),
          servicos: z.array(
            z.object({
              servico_id: z.string().min(1, 'Selecione um servico'),
              horas_trabalhadas: z.string().min(1, 'Horas trabalhadas e obrigatoria'),
            }),
          ),

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
        }),
      )
      .min(1, 'Adicione pelo menos um produto'),
  });

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>;
