import { z } from 'zod';
import type { CatalogoRegrasOrcamento, GradeDistribuicaoLinha } from '@/lib/catalogo/personalizacao-orcamento.types';
import { somaGradeDistribuicao } from '@/components/ui/orcamento/catalogo/GradeDistribuicaoMini';

const gradeDistribuicaoSchema = z.object({
  atributos: z.record(z.string(), z.string()),
  quantidade: z.number().min(0),
});

const catalogoRegrasSchema = z
  .object({
    personalizavel: z.boolean(),
    modos_habilitados: z.array(z.string()).optional(),
    estampas_permitidas: z.array(z.unknown()).optional(),
    processos_livres_permitidos: z.array(z.unknown()).optional(),
    grade_atributos_def: z
      .array(
        z.object({
          chave: z.string(),
          label: z.string(),
          opcoes: z.array(z.string()),
        }),
      )
      .optional(),
  })
  .passthrough();

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
        modo_fulfillment?: string;
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
    if (itens[i].modo_fulfillment === 'OUTSOURCE') {
      continue;
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
    /** Fallback gerencial do preview (não vai para a proposta do cliente). */
    custo_total_producao: z.union([z.number(), z.string()]).optional(),
    produto_finito: z
      .object({
        sku: z.string().optional(),
        estoque_atual: z.number().optional(),
        preco_custo: z.union([z.number(), z.string()]).optional().nullable(),
        imagens: z
          .array(z.object({ url_imagem: z.string().optional() }).passthrough())
          .optional(),
      })
      .passthrough()
      .optional(),
    estoque_catalogo: z.number().optional(),
    imagem_snapshot_url: z.string().optional(),
    modo_fulfillment: z
      .enum(['PICK', 'MAKE', 'HIBRIDO', 'OUTSOURCE'])
      .optional(),
    fornecedor_terceirizado_id: z.string().optional(),
    terceirizacao_modelo_custo: z
      .enum(['DETALHADO', 'PRECO_FECHADO'])
      .optional(),
    terceirizacao_quantidade_cotada: numeroOpcional,
    terceirizacao_custo_unitario: numeroOpcional,
    terceirizacao_custo_setup: numeroOpcional,
    terceirizacao_custo_frete: numeroOpcional,
    terceirizacao_custo_total: numeroOpcional,
    terceirizacao_prazo_dias: numeroOpcional,
    terceirizacao_observacoes: z.string().max(50000).optional(),
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
    geometria_origem: z.enum(['MANUAL', 'IMAGEM', 'PDF', 'DXF']).optional(),
    arquivo_geometria_url: z.string().optional(),
    unidade_geometria: z.enum(['mm', 'cm', 'm']).optional(),

    materiais: z
      .array(
        z.object({
          item_insumo_id: z.string().optional(),
          insumo_id: z.string().optional(),
          quantidade: z.string().optional(),
          unidade: z.string().optional(),
          material_do_cliente: z.boolean().optional(),
          fornecedor_previsto_id: z.string().optional(),
          fornecedor_nome_snapshot: z.string().optional(),
          codigo_ref_snapshot: z.string().optional(),
          preco_compra_snapshot: numeroOpcional,
          preco_unitario_previsto: numeroOpcional,
          usa_medida_propria: z.boolean().optional(),
          largura_material: numeroOpcional,
          altura_material: numeroOpcional,
          profundidade_material: numeroOpcional,
          unidade_medida_material: z.enum(['mm', 'cm', 'm']).optional(),
          calculo_chapa: z.record(z.string(), z.unknown()).nullable().optional(),
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
        origem: z.string().optional(),
        custo_hora: z.union([z.string(), z.number()]).optional(),
        custo_total: z.union([z.string(), z.number()]).optional(),
        descricao: z.string().optional(),
      }),
    ).optional(),

    responsabilidade_arte: z.string().optional(),
    politica_cobranca_arte: z.string().optional(),
    finalidade_anexo: z.string().optional(),
    complexidade_arte: z.string().optional(),
    arte_custo_automatico: z.boolean().optional(),
    arte_horas_calculadas: z.number().nullable().optional(),
    arte_custo_calculado: z.number().nullable().optional(),
    arte_referencia_servico_id: z.string().nullable().optional(),

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
    instalacao_executor_tipo: z
      .enum(['EQUIPE_INTERNA', 'PARCEIRO_PRODUCAO', 'OUTRO_PARCEIRO'])
      .optional(),
    instalacao_fornecedor_id: z.string().optional(),
    instalacao_incluida_cotacao: z.boolean().optional(),
    instalacao_distribuicao: z
      .enum(['ENDERECO_UNICO', 'MULTIPLOS_ENDERECOS', 'A_DEFINIR'])
      .optional(),
    logistica_modo: z
      .enum([
        'RETIRADA_CLIENTE',
        'ENTREGA_EMPRESA',
        'EQUIPE_INSTALACAO',
        'ENTREGA_ANTES_INSTALACAO',
        'PARCEIRO_DIRETO',
      ])
      .optional(),
    entrega_produto_modalidade_id: z.string().optional(),
    entrega_produto_prazo_dias: numeroOpcional,
    entrega_produto_valor_cobrado: numeroOpcional,
    entrega_produto_custo_estimado: numeroOpcional,
    entrega_produto_observacoes: z.string().max(50000).optional(),

    catalogo_regras: catalogoRegrasSchema.optional(),
    personalizacao_ativa: z.boolean().optional(),
    personalizacao_modo: z.enum(['ESTAMPA', 'IMPRINT_LIVRE', '']).optional(),
    personalizacao_estampa_id: z.string().optional(),
    personalizacao_processo_id: z.string().optional(),
    personalizacao_valores_campos: z.record(z.string(), z.string()).optional(),
    personalizacao_valores_campos_vdp: z.array(z.record(z.string(), z.string())).optional(),
    personalizacao_vdp_modo: z.enum(['INLINE', 'PLANILHA']).optional(),
    personalizacao_grade_distribuicao: z.array(gradeDistribuicaoSchema).optional(),
    personalizacao_preco_total_linha: z.string().optional(),
  })
  .superRefine((item, ctx) => {
    if (
      item.modo_fulfillment === 'OUTSOURCE' ||
      item.modo_fulfillment === 'HIBRIDO'
    ) {
      if (!item.fornecedor_terceirizado_id?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione o parceiro terceirizado',
          path: ['fornecedor_terceirizado_id'],
        });
      }
      const modeloCusto = item.terceirizacao_modelo_custo || 'DETALHADO';
      const quantidade = Number(
        String(item.quantidade_produto || '0').replace(',', '.'),
      );
      const custoUnitario = Number(
        String(item.terceirizacao_custo_unitario || '0').replace(',', '.'),
      );
      const custoSetup = Number(
        String(item.terceirizacao_custo_setup || '0').replace(',', '.'),
      );
      const custoFrete = Number(
        String(item.terceirizacao_custo_frete || '0').replace(',', '.'),
      );
      const custoTotalInformado = Number(
        String(item.terceirizacao_custo_total || '0').replace(',', '.'),
      );
      const custoTotal =
        modeloCusto === 'PRECO_FECHADO'
          ? custoTotalInformado
          : custoUnitario * quantidade + custoSetup + custoFrete;
      if (!Number.isFinite(custoTotal) || custoTotal <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe um custo de terceirização maior que zero',
          path: [
            modeloCusto === 'PRECO_FECHADO'
              ? 'terceirizacao_custo_total'
              : 'terceirizacao_custo_unitario',
          ],
        });
      }
    }

    if (isProdutoPrateleiraItem(item)) {
      if (!item.produto_finito_id?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione um produto de prateleira válido',
          path: ['produto_finito_id'],
        });
      }

      const regras = item.catalogo_regras as CatalogoRegrasOrcamento | undefined;
      if (item.personalizacao_ativa && regras?.personalizavel) {
        const modo = item.personalizacao_modo;
        if (!modo) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Selecione o modo de personalização',
            path: ['personalizacao_modo'],
          });
        }

        if (modo === 'ESTAMPA' && !item.personalizacao_estampa_id?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Selecione uma estampa',
            path: ['personalizacao_estampa_id'],
          });
        }

        if (modo === 'IMPRINT_LIVRE' && !item.personalizacao_processo_id?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Selecione o processo de decoração',
            path: ['personalizacao_processo_id'],
          });
        }

        const qty = Math.max(
          Math.floor(Number(String(item.quantidade_produto || '1').replace(',', '.')) || 1),
          1,
        );
        const gradeDef = regras?.grade_atributos_def ?? [];
        if (gradeDef.length > 0 && qty > 1) {
          const linhas = (item.personalizacao_grade_distribuicao ?? []) as GradeDistribuicaoLinha[];
          if (somaGradeDistribuicao(linhas) !== qty) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'A soma da grade de atributos deve ser igual à quantidade total',
              path: ['personalizacao_grade_distribuicao'],
            });
          }
        }

        const estampa = regras?.estampas_permitidas?.find(
          (e) => e.id === item.personalizacao_estampa_id,
        );
        type CampoValidacao = { chave: string; obrigatorio: boolean; label: string };
        const campos: CampoValidacao[] =
          modo === 'ESTAMPA'
            ? (estampa?.conjunto_campos?.campos ?? []).map((c) => ({
                chave: c.chave,
                obrigatorio: c.obrigatorio,
                label: c.label,
              }))
            : modo === 'IMPRINT_LIVRE'
              ? [{ chave: 'texto_personalizacao', obrigatorio: true, label: 'Texto' }]
              : [];

        if (qty > 1 && campos.length > 0) {
          const vdpModo = item.personalizacao_vdp_modo || 'INLINE';
          if (vdpModo === 'PLANILHA') {
            const vdp = item.personalizacao_valores_campos_vdp ?? [];
            if (vdp.length !== qty) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Importe uma planilha com ${qty} linha(s) de dados`,
                path: ['personalizacao_valores_campos_vdp'],
              });
            }
          } else {
            for (const campo of campos) {
              if (!campo.obrigatorio) continue;
              const val = item.personalizacao_valores_campos?.[campo.chave]?.trim();
              if (!val) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Preencha o campo: ${campo.label}`,
                  path: ['personalizacao_valores_campos', campo.chave],
                });
              }
            }
          }
        } else if (campos.length > 0) {
          for (const campo of campos) {
            if (!campo.obrigatorio) continue;
            const val = item.personalizacao_valores_campos?.[campo.chave]?.trim();
            if (!val) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Preencha o campo: ${campo.label}`,
                path: ['personalizacao_valores_campos', campo.chave],
              });
            }
          }
        }
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

    if (
      item.instalacao_necessaria &&
      item.instalacao_executor_tipo !== 'EQUIPE_INTERNA' &&
      !item.instalacao_fornecedor_id?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o parceiro responsável pela instalação',
        path: ['instalacao_fornecedor_id'],
      });
    }

    const materiaisValidos = (item.materiais || []).filter(
      (material) =>
        material?.insumo_id?.trim() &&
        material?.quantidade?.trim() &&
        Number(material.quantidade.replace(',', '.')) > 0,
    );

    if (
      item.modo_fulfillment !== 'OUTSOURCE' &&
      materiaisValidos.length === 0
    ) {
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
