import { z } from 'zod';

export const createFormSchema = (mode: 'novo' | 'editar' | 'template') => z.object({
  cliente_id: mode === 'template' ? z.string().optional() : z.string().min(1, 'Selecione um cliente'),
  // Configurações globais
  margem_lucro_customizada: z.string().optional(),
  impostos_customizados: z.string().optional(),
  condicoes_comerciais: z.string().optional(),
  // Itens de produto
  itens_produto: z.array(z.object({
    nome_servico: z.string().min(1, 'Nome do produto é obrigatório'),
    quantidade_produto: z.string().optional(),
    descricao: z.string().optional(),
    // Medidas do produto
    largura_produto: z.string().optional(),
    altura_produto: z.string().optional(),
    unidade_medida_produto: z.string().optional(),
    area_produto: z.string().optional(),
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
  })).min(1, 'Adicione pelo menos um produto'),
});

export type FormValues = z.infer<ReturnType<typeof createFormSchema>>; 