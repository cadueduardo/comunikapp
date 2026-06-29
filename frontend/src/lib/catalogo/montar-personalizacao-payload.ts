import { calcularPrecoLinhaPersonalizada } from './personalizacao-preco';
import type {
  CatalogoRegrasOrcamento,
  GradeDistribuicaoLinha,
  PersonalizacaoVdpModo,
} from './personalizacao-orcamento.types';

export type ItemPersonalizacaoForm = {
  personalizacao_ativa?: boolean;
  personalizacao_modo?: 'ESTAMPA' | 'IMPRINT_LIVRE' | '';
  personalizacao_estampa_id?: string;
  personalizacao_processo_id?: string;
  personalizacao_valores_campos?: Record<string, string>;
  personalizacao_valores_campos_vdp?: Array<Record<string, string>>;
  personalizacao_vdp_modo?: PersonalizacaoVdpModo;
  personalizacao_grade_distribuicao?: GradeDistribuicaoLinha[];
  catalogo_regras?: CatalogoRegrasOrcamento;
  preco_unitario_snapshot?: string;
  quantidade_produto?: string;
};

export function montarPersonalizacaoBackendPayload(
  item: ItemPersonalizacaoForm,
  quantidade: number,
): Record<string, unknown> | undefined {
  if (!item.personalizacao_ativa || !item.personalizacao_modo) {
    return undefined;
  }

  const modo = item.personalizacao_modo;
  const vdpModo = item.personalizacao_vdp_modo || 'INLINE';
  let valoresCampos: Record<string, string> | Array<Record<string, string>> =
    item.personalizacao_valores_campos ?? {};

  if (quantidade > 1 && vdpModo === 'PLANILHA') {
    valoresCampos = item.personalizacao_valores_campos_vdp ?? [];
  }

  const grade = item.personalizacao_grade_distribuicao?.length
    ? item.personalizacao_grade_distribuicao
    : undefined;

  return {
    modo,
    estampa_id: modo === 'ESTAMPA' ? item.personalizacao_estampa_id || null : null,
    processo_id:
      modo === 'IMPRINT_LIVRE'
        ? item.personalizacao_processo_id || null
        : modo === 'ESTAMPA'
          ? item.catalogo_regras?.estampas_permitidas?.find(
              (e) => e.id === item.personalizacao_estampa_id,
            )?.processo?.id ?? null
          : null,
    valores_campos: valoresCampos,
    grade_distribuicao: grade ?? null,
  };
}

export function calcularPrecoPrateleiraComPersonalizacao(
  item: ItemPersonalizacaoForm,
  quantidade: number,
  precoUnitarioBase: number,
): number {
  if (!item.personalizacao_ativa || !item.personalizacao_modo) {
    return precoUnitarioBase * quantidade;
  }

  const regras = item.catalogo_regras;
  const modo = item.personalizacao_modo;
  const estampa =
    regras?.estampas_permitidas?.find((e) => e.id === item.personalizacao_estampa_id) ??
    null;
  const processo =
    modo === 'ESTAMPA'
      ? estampa?.processo ?? null
      : regras?.processos_livres_permitidos?.find(
          (p) => p.id === item.personalizacao_processo_id,
        ) ?? null;
  const precoAdicional = modo === 'ESTAMPA' ? Number(estampa?.preco_adicional || 0) : 0;

  return calcularPrecoLinhaPersonalizada({
    precoBaseProduto: precoUnitarioBase,
    precoAdicionalEstampa: precoAdicional,
    quantidade,
    processo,
  }).precoTotalLinha;
}
