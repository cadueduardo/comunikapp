/**
 * Regressão: filtro PCP não pode excluir OS com tipo_vinculo_os NULL.
 * Rodar: node --test scripts/os-elegivel-pcp-kanban-filtro.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const TIPO_ADITIVA = 'ADITIVA_INSTALACAO';

/** Espelho da regra corrigida (sem import TS). */
function filtroCorrigido() {
  return {
    pular_pcp: { not: true },
    OR: [
      { tipo_vinculo_os: null },
      { tipo_vinculo_os: { not: TIPO_ADITIVA } },
    ],
  };
}

/** Regra antiga (bugada) — documentada para não reintroduzir. */
function filtroBugado() {
  return {
    pular_pcp: { not: true },
    NOT: { tipo_vinculo_os: TIPO_ADITIVA },
  };
}

function osPassaFiltroJs(os, filtro) {
  if (os.pular_pcp === true) return false;
  if (filtro.NOT) {
    // Emula SQL: NOT (col = X) → NULL não passa
    if (os.tipo_vinculo_os == null) return false;
    if (os.tipo_vinculo_os === filtro.NOT.tipo_vinculo_os) return false;
    return true;
  }
  if (filtro.OR) {
    return filtro.OR.some((clause) => {
      if ('tipo_vinculo_os' in clause && clause.tipo_vinculo_os === null) {
        return os.tipo_vinculo_os == null;
      }
      if (clause.tipo_vinculo_os?.not) {
        return (
          os.tipo_vinculo_os != null &&
          os.tipo_vinculo_os !== clause.tipo_vinculo_os.not
        );
      }
      return false;
    });
  }
  return true;
}

test('filtro bugado exclui OS comercial com tipo_vinculo null', () => {
  const os = { pular_pcp: false, tipo_vinculo_os: null };
  assert.equal(osPassaFiltroJs(os, filtroBugado()), false);
});

test('filtro corrigido inclui OS comercial com tipo_vinculo null', () => {
  const os = { pular_pcp: false, tipo_vinculo_os: null };
  assert.equal(osPassaFiltroJs(os, filtroCorrigido()), true);
});

test('filtro corrigido exclui aditiva de instalação', () => {
  const os = { pular_pcp: false, tipo_vinculo_os: TIPO_ADITIVA };
  assert.equal(osPassaFiltroJs(os, filtroCorrigido()), false);
});

test('filtro corrigido exclui pular_pcp=true', () => {
  const os = { pular_pcp: true, tipo_vinculo_os: null };
  assert.equal(osPassaFiltroJs(os, filtroCorrigido()), false);
});

test('filtro corrigido inclui outro vínculo não-aditiva', () => {
  const os = { pular_pcp: false, tipo_vinculo_os: 'OUTRO' };
  assert.equal(osPassaFiltroJs(os, filtroCorrigido()), true);
});
