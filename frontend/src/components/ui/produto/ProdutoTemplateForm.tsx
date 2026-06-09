'use client';

import { useRouter } from 'next/navigation';
import { OrcamentoV2Form } from '@/components/ui/orcamentos-v2/orcamento-v2-form';

interface ProdutoTemplateFormProps {
  mode: 'novo' | 'editar';
  initialData?: Record<string, unknown>;
  produtoId?: string;
}

const toStringValue = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const getNestedId = (item: Record<string, unknown>, key: string): string => {
  const directValue = item[`${key}_id`];
  if (directValue) {
    return String(directValue);
  }

  const nested = item[key];
  if (nested && typeof nested === 'object' && 'id' in nested) {
    return String((nested as { id?: unknown }).id || '');
  }

  return '';
};

const mapProdutoParaOrcamento = (initialData?: Record<string, unknown>) => {
  if (!initialData) {
    return undefined;
  }

  const itens = Array.isArray(initialData.itens) ? initialData.itens : [];
  const maquinas = Array.isArray(initialData.maquinas) ? initialData.maquinas : [];
  const funcoes = Array.isArray(initialData.funcoes) ? initialData.funcoes : [];

  const nomeServico = toStringValue(initialData.nome_servico || initialData.nome);
  const descricao = toStringValue(initialData.descricao_produto || initialData.descricao);

  return {
    titulo: nomeServico,
    nome_servico: nomeServico,
    descricao,
    margem_lucro_customizada: initialData.margem_lucro_customizada ?? '30',
    impostos_customizados: initialData.impostos_customizados ?? '25',
    comissao_percentual: initialData.comissao_percentual ?? '5',
    itens_produto: [
      {
        nome_servico: nomeServico,
        descricao,
        quantidade_produto: toStringValue(initialData.quantidade_padrao, '1'),
        largura_produto: toStringValue(initialData.largura_produto),
        altura_produto: toStringValue(initialData.altura_produto),
        profundidade_produto: toStringValue(initialData.profundidade_produto),
        tem_profundidade: Number(initialData.profundidade_produto || 0) > 0,
        unidade_medida_produto: toStringValue(initialData.unidade_medida_produto, 'un'),
        area_produto: toStringValue(initialData.area_produto),
        perimetro_produto: toStringValue(initialData.perimetro_produto),
        geometria_origem: initialData.geometria_origem || 'MANUAL',
        arquivo_geometria_url: toStringValue(initialData.arquivo_geometria_url),
        unidade_geometria: initialData.unidade_geometria || 'mm',
        materiais: itens.length > 0
          ? itens.map((item) => {
              const material = item as Record<string, unknown>;
              return {
                insumo_id: getNestedId(material, 'insumo'),
                quantidade: toStringValue(material.quantidade, '1'),
                material_do_cliente: Boolean(material.material_do_cliente),
              };
            })
          : [{ insumo_id: '', quantidade: '1', material_do_cliente: false }],
        maquinas: maquinas.length > 0
          ? maquinas.map((item) => {
              const maquina = item as Record<string, unknown>;
              return {
                maquina_id: getNestedId(maquina, 'maquina'),
                horas_utilizadas: toStringValue(maquina.horas_utilizadas, '1'),
              };
            })
          : [{ maquina_id: '', horas_utilizadas: '1' }],
        funcoes: funcoes.length > 0
          ? funcoes.map((item) => {
              const funcao = item as Record<string, unknown>;
              return {
                funcao_id: getNestedId(funcao, 'funcao'),
                horas_trabalhadas: toStringValue(funcao.horas_trabalhadas, '1'),
              };
            })
          : [{ funcao_id: '', horas_trabalhadas: '1' }],
        servicos: [{ servico_id: '', horas_trabalhadas: '1' }],
        instalacao_necessaria: false,
        instalacao_regra_cobranca: 'FIXO',
        instalacao_usar_endereco_entrega: true,
      },
    ],
  };
};

export function ProdutoTemplateForm({
  mode,
  initialData,
  produtoId,
}: ProdutoTemplateFormProps) {
  const router = useRouter();

  return (
    <OrcamentoV2Form
      mode="template"
      initialData={mapProdutoParaOrcamento(initialData)}
      orcamentoId={mode === 'editar' ? produtoId : undefined}
      showPreview
      onSuccess={() => router.push('/produtos')}
    />
  );
}
