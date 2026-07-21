#!/usr/bin/env node
/**
 * Smoke de carga leve — listagens Compras (e contas a pagar).
 *
 * Variáveis de ambiente:
 *   BASE_URL      — ex.: http://127.0.0.1:4000
 *   ACCESS_TOKEN  — JWT Bearer
 *   LOJA          — opcional, header x-loja-id
 *   SMOKE_N       — total de requisições (default 20)
 *   SMOKE_CONCURRENCY — concorrência (default 5)
 *
 * Sem BASE_URL/ACCESS_TOKEN: imprime instruções e exit 0 (dry-run).
 *
 * Uso:
 *   node scripts/compras-listagens-smoke-carga.mjs
 *   BASE_URL=http://127.0.0.1:4000 ACCESS_TOKEN=eyJ... node scripts/compras-listagens-smoke-carga.mjs
 */
const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';
const LOJA = process.env.LOJA || '';
const TOTAL = Number(process.env.SMOKE_N || '20');
const CONCURRENCY = Number(process.env.SMOKE_CONCURRENCY || '5');

const ENDPOINTS = [
  { name: 'solicitacoes', method: 'GET', path: '/compras/solicitacoes' },
  { name: 'pedidos', method: 'GET', path: '/compras/pedidos' },
  { name: 'contas-pagar', method: 'GET', path: '/financeiro/contas-pagar' },
];

function printDryRun() {
  console.log('# Smoke carga listagens — modo dry-run\n');
  console.log('Credenciais não informadas. Defina:\n');
  console.log('  BASE_URL=http://127.0.0.1:4000');
  console.log('  ACCESS_TOKEN=<jwt>');
  console.log('  LOJA=<uuid-opcional>');
  console.log('  SMOKE_N=20');
  console.log('  SMOKE_CONCURRENCY=5\n');
  console.log('Endpoints que seriam exercitados:');
  for (const ep of ENDPOINTS) {
    console.log(`  - ${ep.method} ${ep.path}`);
  }
  console.log('\nExit 0 — CI não falha sem credenciais.');
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function requestOnce(ep) {
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };
  if (LOJA) headers['x-loja-id'] = LOJA;

  const start = performance.now();
  let status = 0;
  let ok = false;
  let error = null;
  try {
    const res = await fetch(`${BASE_URL}${ep.path}`, {
      method: ep.method,
      headers,
    });
    status = res.status;
    ok = res.ok;
    if (!ok) {
      const text = await res.text();
      error = text.slice(0, 200);
    }
  } catch (err) {
    error = String(err);
  }
  const ms = performance.now() - start;
  return { ms, status, ok, error };
}

async function runPool(tasks, concurrency) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

async function main() {
  if (!BASE_URL || !ACCESS_TOKEN) {
    printDryRun();
    process.exit(0);
  }

  console.log('# Smoke carga listagens — Compras / Financeiro\n');
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`N=${TOTAL} concurrency=${CONCURRENCY}\n`);

  let hasFailure = false;

  for (const ep of ENDPOINTS) {
    const tasks = Array.from({ length: TOTAL }, () => () => requestOnce(ep));
    const results = await runPool(tasks, CONCURRENCY);
    const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
    const errors = results.filter((r) => !r.ok);
    const p50 = percentile(latencies, 50).toFixed(1);
    const p95 = percentile(latencies, 95).toFixed(1);

    console.log(`## ${ep.name} — ${ep.method} ${ep.path}`);
    console.log(`- Requisições: ${TOTAL}`);
    console.log(`- Erros: ${errors.length}`);
    console.log(`- Latência p50: ${p50} ms`);
    console.log(`- Latência p95: ${p95} ms`);
    if (errors.length > 0) {
      hasFailure = true;
      const sample = errors[0];
      console.log(`- Amostra erro: status=${sample.status} ${sample.error ?? ''}`);
    }
    console.log('');
  }

  if (hasFailure) {
    console.log('Resultado: FALHA (pelo menos um endpoint com erros)');
    process.exit(1);
  }
  console.log('Resultado: OK');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
