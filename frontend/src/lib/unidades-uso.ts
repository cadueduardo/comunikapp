import { UNIDADES_COMPRA, type UnidadeOption } from './unidades-compra';

// Fase 11 — Opção B: lista de unidades disponíveis no campo "Unidade de Uso" do Insumo.
//
// Premissa: TODA unidade de compra pode ser unidade de uso (você compra em M³ e usa em M³,
// ou compra em FOLHA e usa em FOLHA). Por isso herdamos `UNIDADES_COMPRA` por inteiro.
//
// Além disso, existem unidades "derivadas de uso" que NÃO fazem sentido como unidade de compra
// (ninguém compra material em "M² lateral de caixa aberta") mas SIM como forma de consumir
// no produto. Essas ficam aqui exclusivamente.
//
// Quando aparecer uma nova unidade derivada (ex.: M2_TAMPA para fechar caixa, ML_BORDA para
// fita lateral), adicione neste array e amplie o `MaterialSection` para roteá-la no switch.

const UNIDADES_USO_DERIVADAS: UnidadeOption[] = [
  // Caixa aberta (4 laterais sem tampa/fundo): (2L + 2A) × P em m².
  // Cálculo automático em MaterialSection quando o produto está marcado como 3D.
  { value: 'M2_LATERAL', label: 'M² LATERAL (caixa aberta — 4 laterais)' },
];

export const UNIDADES_USO: UnidadeOption[] = [
  ...UNIDADES_COMPRA,
  ...UNIDADES_USO_DERIVADAS,
];

export type { UnidadeOption } from './unidades-compra';
