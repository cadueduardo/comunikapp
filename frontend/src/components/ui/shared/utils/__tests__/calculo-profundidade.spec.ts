/**
 * Fase 11 — testes das funções puras de profundidade.
 *
 * Cobre `calcularVolume`, `calcularAreaLateral` e `insumoExigeProfundidade`,
 * mais o teste de regressão zero para `calcularArea`.
 *
 * Padrão `.spec.ts` segue convenção do arquivo
 * `preview-calculo-correcao-materiais.spec.ts` deste mesmo diretório.
 *
 * Validação executável (sem infra de Jest no frontend) em
 * `frontend/scripts/validar-motor-profundidade.mjs` — rodar com:
 *   node frontend/scripts/validar-motor-profundidade.mjs
 */

import {
  calcularArea,
  calcularVolume,
  calcularAreaLateral,
  insumoExigeProfundidade,
} from '../calculo.utils';

// =============================================================================
// Helper local (mesmo padrão do .spec.ts existente)
// =============================================================================

function assertAprox(
  recebido: number,
  esperado: number,
  tolerancia: number,
  contexto: string,
): void {
  const diff = Math.abs(recebido - esperado);
  if (diff > tolerancia) {
    throw new Error(
      `[${contexto}] esperado ${esperado} ± ${tolerancia}, recebido ${recebido} (diff=${diff})`,
    );
  }
}

// =============================================================================
// REGRESSÃO ZERO — calcularArea continua igual ao que era antes da Fase 11
// =============================================================================

// (1) Produto plano 600×400 mm: área = 0.24 m²
assertAprox(calcularArea(600, 400, 'mm'), 0.24, 1e-9, 'area-600x400mm');

// (2) Produto plano 80×50 cm: área = 0.40 m²
assertAprox(calcularArea(80, 50, 'cm'), 0.40, 1e-9, 'area-80x50cm');

// (3) Produto plano 1×2 m: área = 2.00 m²
assertAprox(calcularArea(1, 2, 'm'), 2.00, 1e-9, 'area-1x2m');

// (4) Dimensão ausente: retorna 0 (comportamento atual)
if (calcularArea(0, 400, 'mm') !== 0) throw new Error('area-largura-zero');
if (calcularArea(600, 0, 'mm') !== 0) throw new Error('area-altura-zero');

// =============================================================================
// calcularVolume — fórmula L × A × P, normalizado em m³
// =============================================================================

// (5) Cubo 100×100×100 mm = 0.001 m³ (1 dm³)
assertAprox(calcularVolume(100, 100, 100, 'mm'), 0.001, 1e-9, 'volume-cubo-100mm');

// (6) Letra caixa 300×200×50 mm = 0.003 m³
assertAprox(
  calcularVolume(300, 200, 50, 'mm'),
  0.3 * 0.2 * 0.05,
  1e-9,
  'volume-letra-300x200x50mm',
);

// (7) Totem 50×30×20 cm = 0.030 m³
assertAprox(
  calcularVolume(50, 30, 20, 'cm'),
  0.5 * 0.3 * 0.2,
  1e-9,
  'volume-totem-50x30x20cm',
);

// (8) Display 1×0.5×0.2 m = 0.10 m³
assertAprox(calcularVolume(1, 0.5, 0.2, 'm'), 0.10, 1e-9, 'volume-display-1x05x02m');

// (9) Profundidade ausente: retorna 0 (salvaguarda anti-erro)
if (calcularVolume(600, 400, 0, 'mm') !== 0) throw new Error('volume-prof-zero');

// (10) Largura ou altura ausente: retorna 0
if (calcularVolume(0, 400, 50, 'mm') !== 0) throw new Error('volume-largura-zero');
if (calcularVolume(600, 0, 50, 'mm') !== 0) throw new Error('volume-altura-zero');

// =============================================================================
// calcularAreaLateral — fórmula (2L + 2A) × P, caixa aberta, m²
// =============================================================================

// (11) Letra caixa 300×200×50 mm:
//      perímetro = 2*(300+200) = 1000 mm = 1.0 m
//      área lateral = 1.0 × 0.05 = 0.05 m²
assertAprox(
  calcularAreaLateral(300, 200, 50, 'mm'),
  0.05,
  1e-9,
  'lateral-letra-300x200x50mm',
);

// (12) Totem 50×30×20 cm:
//      perímetro = 2*(50+30) = 160 cm = 1.6 m
//      área lateral = 1.6 × 0.20 = 0.32 m²
assertAprox(
  calcularAreaLateral(50, 30, 20, 'cm'),
  0.32,
  1e-9,
  'lateral-totem-50x30x20cm',
);

// (13) Display 1×0.5×0.2 m:
//      perímetro = 2*(1+0.5) = 3 m
//      área lateral = 3 × 0.2 = 0.6 m²
assertAprox(
  calcularAreaLateral(1, 0.5, 0.2, 'm'),
  0.6,
  1e-9,
  'lateral-display-1x05x02m',
);

// (14) Profundidade ausente: 0 (salvaguarda anti-erro)
if (calcularAreaLateral(600, 400, 0, 'mm') !== 0) throw new Error('lateral-prof-zero');

// (15) Largura ou altura ausente: 0
if (calcularAreaLateral(0, 400, 50, 'mm') !== 0) throw new Error('lateral-largura-zero');
if (calcularAreaLateral(600, 0, 50, 'mm') !== 0) throw new Error('lateral-altura-zero');

// =============================================================================
// insumoExigeProfundidade — quais unidade_uso disparam aviso
// =============================================================================

// (16) M3 exige profundidade
if (!insumoExigeProfundidade('M3')) throw new Error('exige-prof-M3');

// (17) M2_LATERAL exige profundidade
if (!insumoExigeProfundidade('M2_LATERAL')) throw new Error('exige-prof-M2_LATERAL');

// (18) M2 NÃO exige profundidade (regressão zero)
if (insumoExigeProfundidade('M2')) throw new Error('exige-prof-M2-nao-deveria');

// (19) M NÃO exige profundidade (regressão zero)
if (insumoExigeProfundidade('M')) throw new Error('exige-prof-M-nao-deveria');

// (20) UNID NÃO exige profundidade
if (insumoExigeProfundidade('UNID')) throw new Error('exige-prof-UNID-nao-deveria');

// (21) Undefined/null NÃO exigem profundidade
if (insumoExigeProfundidade(undefined)) throw new Error('exige-prof-undefined-nao-deveria');
if (insumoExigeProfundidade(null)) throw new Error('exige-prof-null-nao-deveria');

// =============================================================================
// COERÊNCIA INTERNA — volume = área plana × profundidade
// =============================================================================

// (22) Para qualquer 3-tupla, volume(L,A,P) = area(L,A) × profundidade_em_m
{
  const L = 800, A = 600, P = 50, unidade = 'mm';
  const volumeDireto = calcularVolume(L, A, P, unidade);
  const volumeEsperado = calcularArea(L, A, unidade) * (P / 1000); // P em mm → m
  assertAprox(volumeDireto, volumeEsperado, 1e-9, 'coerencia-volume-area-profundidade');
}

// eslint-disable-next-line no-console
console.log('OK - todos os 22 cenarios de profundidade passaram (Fase 11)');
