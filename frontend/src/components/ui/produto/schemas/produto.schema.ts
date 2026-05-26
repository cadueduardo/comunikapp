import { z } from 'zod';

export const createProdutoSchema = () => z.object({
  // Itens de produto (apenas um produto por template)
  itens_produto: z.array(z.object({
    nome_servico: z.string().min(1, 'Nome do produto é obrigatório'),
    descricao: z.string().optional(),
    // Medidas do produto
    largura_produto: z.string().optional(),
    altura_produto: z.string().optional(),
    // Fase 11: profundidade opcional para templates de produtos 3D (totens, letras caixa, displays).
    profundidade_produto: z.string().optional(),
    // Fase 11: flag controlada pelo checkbox "Este template tem profundidade (3D)".
    tem_profundidade: z.boolean().optional(),
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
  })).length(1, 'Produto template deve ter exatamente um item'),
});

export type ProdutoFormValues = z.infer<ReturnType<typeof createProdutoSchema>>; 