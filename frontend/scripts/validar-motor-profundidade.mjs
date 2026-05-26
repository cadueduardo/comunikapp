// Script de validacao das funcoes puras de profundidade (Fase 11).
// Como o frontend nao tem Jest/Vitest instalado, este script reproduz a logica
// das funcoes de calculo.utils.ts e valida via asserts.
// Roda standalone: node frontend/scripts/validar-motor-profundidade.mjs

import { strict as assert } from 'node:assert';

// ============================================================================
// Replicacao das funcoes (precisa estar sincronizado com calculo.utils.ts)
// ============================================================================

function converterParaMetros(valor, unidade) {
  switch (String(unidade).toLowerCase()) {
    case 'mm': return valor / 1000;
    case 'cm': return valor / 100;
    case 'm':  return valor;
    case 'm2': return valor;
    default:   return valor;
  }
}

function calcularArea(largura, altura, unidade) {
  if (!largura || !altura) return 0;
  return converterParaMetros(largura, unidade) * converterParaMetros(altura, unidade);
}

function calcularVolume(largura, altura, profundidade, unidade) {
  if (!largura || !altura || !profundidade) return 0;
  return (
    converterParaMetros(largura, unidade) *
    converterParaMetros(altura, unidade) *
    converterParaMetros(profundidade, unidade)
  );
}

function calcularAreaLateral(largura, altura, profundidade, unidade) {
  if (!largura || !altura || !profundidade) return 0;
  const L = converterParaMetros(largura, unidade);
  const A = converterParaMetros(altura, unidade);
  const P = converterParaMetros(profundidade, unidade);
  return 2 * (L + A) * P;
}

function insumoExigeProfundidade(unidadeUso) {
  if (!unidadeUso) return false;
  return unidadeUso === 'M3' || unidadeUso === 'M2_LATERAL';
}

// ============================================================================
// Helper
// ============================================================================

function aprox(recebido, esperado, tol, contexto) {
  const diff = Math.abs(recebido - esperado);
  assert.ok(
    diff <= tol,
    `[${contexto}] esperado ${esperado} +/- ${tol}, recebido ${recebido} (diff=${diff})`,
  );
}

// ============================================================================
// REGRESSAO ZERO - calcularArea continua igual ao que era antes da Fase 11
// ============================================================================

aprox(calcularArea(600, 400, 'mm'), 0.24, 1e-9, 'area-600x400mm');
aprox(calcularArea(80, 50, 'cm'), 0.40, 1e-9, 'area-80x50cm');
aprox(calcularArea(1, 2, 'm'), 2.00, 1e-9, 'area-1x2m');
assert.strictEqual(calcularArea(0, 400, 'mm'), 0, 'area-largura-zero');
assert.strictEqual(calcularArea(600, 0, 'mm'), 0, 'area-altura-zero');

// ============================================================================
// calcularVolume
// ============================================================================

aprox(calcularVolume(100, 100, 100, 'mm'), 0.001, 1e-9, 'volume-cubo-100mm');
aprox(calcularVolume(300, 200, 50, 'mm'), 0.3 * 0.2 * 0.05, 1e-9, 'volume-letra-300x200x50mm');
aprox(calcularVolume(50, 30, 20, 'cm'), 0.5 * 0.3 * 0.2, 1e-9, 'volume-totem-50x30x20cm');
aprox(calcularVolume(1, 0.5, 0.2, 'm'), 0.10, 1e-9, 'volume-display-1x05x02m');
assert.strictEqual(calcularVolume(600, 400, 0, 'mm'), 0, 'volume-prof-zero');
assert.strictEqual(calcularVolume(0, 400, 50, 'mm'), 0, 'volume-largura-zero');
assert.strictEqual(calcularVolume(600, 0, 50, 'mm'), 0, 'volume-altura-zero');

// ============================================================================
// calcularAreaLateral
// ============================================================================

aprox(calcularAreaLateral(300, 200, 50, 'mm'), 0.05, 1e-9, 'lateral-letra-300x200x50mm');
aprox(calcularAreaLateral(50, 30, 20, 'cm'), 0.32, 1e-9, 'lateral-totem-50x30x20cm');
aprox(calcularAreaLateral(1, 0.5, 0.2, 'm'), 0.6, 1e-9, 'lateral-display-1x05x02m');
assert.strictEqual(calcularAreaLateral(600, 400, 0, 'mm'), 0, 'lateral-prof-zero');
assert.strictEqual(calcularAreaLateral(0, 400, 50, 'mm'), 0, 'lateral-largura-zero');
assert.strictEqual(calcularAreaLateral(600, 0, 50, 'mm'), 0, 'lateral-altura-zero');

// ============================================================================
// insumoExigeProfundidade
// ============================================================================

assert.strictEqual(insumoExigeProfundidade('M3'), true, 'exige-prof-M3');
assert.strictEqual(insumoExigeProfundidade('M2_LATERAL'), true, 'exige-prof-M2_LATERAL');
assert.strictEqual(insumoExigeProfundidade('M2'), false, 'exige-prof-M2-nao-deveria');
assert.strictEqual(insumoExigeProfundidade('M'), false, 'exige-prof-M-nao-deveria');
assert.strictEqual(insumoExigeProfundidade('UNID'), false, 'exige-prof-UNID-nao-deveria');
assert.strictEqual(insumoExigeProfundidade(undefined), false, 'exige-prof-undefined');
assert.strictEqual(insumoExigeProfundidade(null), false, 'exige-prof-null');
assert.strictEqual(insumoExigeProfundidade(''), false, 'exige-prof-vazia');

// ============================================================================
// COERENCIA INTERNA - volume = area_plana * profundidade
// ============================================================================

{
  const L = 800, A = 600, P = 50, unidade = 'mm';
  const volumeDireto = calcularVolume(L, A, P, unidade);
  const volumeEsperado = calcularArea(L, A, unidade) * (P / 1000);
  aprox(volumeDireto, volumeEsperado, 1e-9, 'coerencia-volume-area-profundidade');
}

console.log('OK - todos os cenarios de profundidade passaram (Fase 11)');
