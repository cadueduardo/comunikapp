/**
 * Smoke E2E do módulo Compras (Fases 1–4) via API HTTP.
 *
 * Fluxo:
 *  1) fixtures (fornecedor AMBOS, categoria, insumo, matriz, localização)
 *  2) solicitação → enviar → aprovar
 *  3) pedido (MATERIAL + SERVICO) → aprovar → enviar
 *  4) recebimento material (confirmado) + aceite serviço (confirmado)
 *  5) conta a pagar from-pedido → pagamento parcial → estorno → pagamento final
 *
 * Pré-requisitos:
 *  - API em http://localhost:4000 (npm run dev)
 *  - Migration contas a pagar aplicada
 *  - JWT_SECRET no backend/.env
 *
 * Auth:
 *  - Preferência: COMPRAS_E2E_EMAIL + COMPRAS_E2E_PASSWORD (login real)
 *  - Fallback: gera JWT com JWT_SECRET para um ADMINISTRADOR da loja
 *
 * Uso:
 *   node scripts/compras-e2e-fluxo-completo.mjs
 *   COMPRAS_E2E_API_URL=http://127.0.0.1:4000 node scripts/compras-e2e-fluxo-completo.mjs
 */
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '..');

require('dotenv').config({ path: resolve(backendRoot, '.env') });

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const API_URL = (
  process.env.COMPRAS_E2E_API_URL ||
  process.env.API_BASE_URL ||
  'http://127.0.0.1:4000'
).replace(/\/$/, '');

const TAG = `E2E-COMPRAS-${new Date().toISOString().slice(0, 10)}`;
const prisma = new PrismaClient();

const steps = [];
let failed = false;

function log(msg) {
  console.log(msg);
}

function ok(nome, extra = '') {
  steps.push({ nome, ok: true });
  log(`  ✅ ${nome}${extra ? ` — ${extra}` : ''}`);
}

function fail(nome, err) {
  failed = true;
  steps.push({ nome, ok: false, err: String(err) });
  log(`  ❌ ${nome} — ${err}`);
}

async function api(method, path, token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.raw)) ||
      text ||
      res.statusText;
    const detail = Array.isArray(msg) ? msg.join('; ') : String(msg);
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${detail}`);
  }
  return data;
}

async function resolveAuth() {
  const email = process.env.COMPRAS_E2E_EMAIL?.trim();
  const password = process.env.COMPRAS_E2E_PASSWORD;

  if (email && password) {
    const res = await fetch(`${API_URL}/lojas/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(
        `Login falhou (${res.status}): ${data.message || JSON.stringify(data)}`,
      );
    }
    if (data.requires_2fa || data.two_factor_required) {
      throw new Error(
        'Usuário exige 2FA. Use COMPRAS_E2E_EMAIL de conta sem 2FA ou JWT_SECRET fallback.',
      );
    }
    const usuario = await prisma.usuario.findFirst({
      where: { email, ativo: true },
      include: { loja: true },
    });
    if (!usuario) {
      throw new Error(`Usuário ${email} não encontrado após login.`);
    }
    return { token: data.access_token, usuario, mode: 'login' };
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      'Defina COMPRAS_E2E_EMAIL/PASSWORD ou JWT_SECRET (>=32) no backend/.env',
    );
  }

  const usuario = await prisma.usuario.findFirst({
    where: { ativo: true, funcao: 'ADMINISTRADOR' },
    include: { loja: true },
    orderBy: { criado_em: 'asc' },
  });
  if (!usuario) {
    throw new Error('Nenhum usuário ADMINISTRADOR ativo encontrado.');
  }

  const token = jwt.sign(
    {
      sub: usuario.id,
      email: usuario.email,
      loja_id: usuario.loja_id,
      funcao: usuario.funcao,
      nome_completo: usuario.nome_completo,
    },
    secret,
    { expiresIn: '2h' },
  );

  return { token, usuario, mode: 'jwt' };
}

async function ensureFixtures(lojaId) {
  const suffix = randomUUID().slice(0, 8);

  let fornecedor = await prisma.fornecedor.findFirst({
    where: {
      loja_id: lojaId,
      ativo: true,
      tipo: { in: ['AMBOS', 'INSUMO'] },
      nome: { startsWith: 'E2E Compras' },
    },
  });
  if (!fornecedor) {
    fornecedor = await prisma.fornecedor.create({
      data: {
        loja_id: lojaId,
        nome: `E2E Compras ${suffix}`,
        razao_social: `E2E Compras LTDA ${suffix}`,
        tipo: 'AMBOS',
        ativo: true,
      },
    });
  } else if (fornecedor.tipo === 'INSUMO') {
    fornecedor = await prisma.fornecedor.update({
      where: { id: fornecedor.id },
      data: { tipo: 'AMBOS' },
    });
  }

  let categoria = await prisma.categoria.findFirst({
    where: { loja_id: lojaId, nome: 'E2E Compras' },
  });
  if (!categoria) {
    categoria = await prisma.categoria.create({
      data: { loja_id: lojaId, nome: 'E2E Compras' },
    });
  }

  let insumo = await prisma.insumo.findFirst({
    where: {
      loja_id: lojaId,
      ativo: true,
      nome: { startsWith: 'E2E Insumo Compras' },
    },
  });
  if (!insumo) {
    insumo = await prisma.insumo.create({
      data: {
        loja_id: lojaId,
        nome: `E2E Insumo Compras ${suffix}`,
        custo_unitario: 10,
        categoriaId: categoria.id,
        fornecedorId: fornecedor.id,
        fator_conversao: 1,
        quantidade_compra: 1,
        unidade_uso: 'UN',
        unidade_compra: 'UN',
        ativo: true,
      },
    });
  }

  await prisma.insumoFornecedor.upsert({
    where: {
      insumo_id_fornecedor_id: {
        insumo_id: insumo.id,
        fornecedor_id: fornecedor.id,
      },
    },
    create: {
      loja_id: lojaId,
      insumo_id: insumo.id,
      fornecedor_id: fornecedor.id,
      preco_custo: 12.5,
      codigo_ref: `E2E-${suffix}`,
      padrao: true,
    },
    update: {
      preco_custo: 12.5,
      padrao: true,
    },
  });

  let localizacao = await prisma.estoque_localizacoes.findFirst({
    where: { lojaId, ativo: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!localizacao) {
    localizacao = await prisma.estoque_localizacoes.create({
      data: {
        codigo: `E2E-LOC-${suffix}`,
        deposito: 'E2E',
        descricao: 'Localização criada pelo smoke Compras',
        lojaId,
        ativo: true,
      },
    });
  }

  return { fornecedor, categoria, insumo, localizacao };
}

async function main() {
  log('');
  log('══════════════════════════════════════════════════════');
  log('  Smoke E2E — Módulo Compras (SC → PC → RC/AS → CP)');
  log(`  API: ${API_URL}`);
  log('══════════════════════════════════════════════════════');
  log('');

  // Health check
  try {
    const probe = await fetch(`${API_URL}/lojas/login`, { method: 'OPTIONS' });
    ok('API alcançável', `OPTIONS /lojas/login → ${probe.status}`);
  } catch (e) {
    fail('API alcançável', e.message || e);
    log('\nSuba o backend (npm run dev) e rode de novo.\n');
    process.exit(1);
  }

  let token;
  let usuario;
  let fixtures;

  try {
    const auth = await resolveAuth();
    token = auth.token;
    usuario = auth.usuario;
    ok(
      'Autenticação',
      `${auth.mode} · ${usuario.email} · loja ${usuario.loja_id}`,
    );
  } catch (e) {
    fail('Autenticação', e.message || e);
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    fixtures = await ensureFixtures(usuario.loja_id);
    ok(
      'Fixtures',
      `fornecedor=${fixtures.fornecedor.nome} · insumo=${fixtures.insumo.nome}`,
    );
  } catch (e) {
    fail('Fixtures', e.message || e);
    await prisma.$disconnect();
    process.exit(1);
  }

  const { fornecedor, insumo, localizacao } = fixtures;
  let solicitacao;
  let pedido;
  let itemMaterial;
  let itemServico;
  let recebimento;
  let aceite;
  let conta;
  let pagamento;

  // --- Solicitação ---
  log('\n── Fase 1/2: Solicitação ──');
  try {
    solicitacao = await api('POST', '/compras/solicitacoes', token, {
      prioridade: 'NORMAL',
      origem_tipo: 'MANUAL',
      justificativa: `${TAG} solicitação smoke`,
      itens: [
        {
          tipo: 'MATERIAL',
          insumo_id: insumo.id,
          quantidade: 4,
          unidade: 'UN',
        },
        {
          tipo: 'SERVICO',
          descricao: `Serviço instalação E2E ${TAG}`,
          quantidade: 1,
          unidade: 'SV',
        },
      ],
    });
    ok('Criar solicitação', solicitacao.numero || solicitacao.id);
  } catch (e) {
    fail('Criar solicitação', e.message || e);
  }

  if (solicitacao?.id) {
    try {
      solicitacao = await api(
        'POST',
        `/compras/solicitacoes/${solicitacao.id}/enviar`,
        token,
        {},
      );
      ok('Enviar solicitação', `status=${solicitacao.status}`);
    } catch (e) {
      fail('Enviar solicitação', e.message || e);
    }

    if (solicitacao.status !== 'APROVADA') {
      try {
        solicitacao = await api(
          'POST',
          `/compras/solicitacoes/${solicitacao.id}/aprovar`,
          token,
          {},
        );
        ok('Aprovar solicitação', `status=${solicitacao.status}`);
      } catch (e) {
        fail('Aprovar solicitação', e.message || e);
      }
    } else {
      ok('Aprovar solicitação', 'autoaprovada no enviar (D2)');
    }
  }

  // --- Pedido ---
  log('\n── Fase 2: Pedido ──');
  try {
    pedido = await api('POST', '/compras/pedidos', token, {
      fornecedor_id: fornecedor.id,
      observacoes: `${TAG} pedido smoke`,
      condicao_pagamento: '30 dias',
      itens: [
        {
          tipo: 'MATERIAL',
          insumo_id: insumo.id,
          descricao_snapshot: insumo.nome,
          quantidade: 4,
          unidade_snapshot: 'UN',
          preco_unitario: 12.5,
        },
        {
          tipo: 'SERVICO',
          descricao_snapshot: `Serviço instalação E2E ${TAG}`,
          quantidade: 1,
          unidade_snapshot: 'SV',
          preco_unitario: 100,
        },
      ],
    });
    itemMaterial = (pedido.itens || []).find((i) => i.tipo === 'MATERIAL');
    itemServico = (pedido.itens || []).find((i) => i.tipo === 'SERVICO');
    ok(
      'Criar pedido',
      `${pedido.numero} · total=${pedido.total} · itens=${(pedido.itens || []).length}`,
    );
  } catch (e) {
    fail('Criar pedido', e.message || e);
  }

  if (pedido?.id) {
    try {
      pedido = await api(
        'POST',
        `/compras/pedidos/${pedido.id}/aprovar`,
        token,
        {},
      );
      ok('Aprovar pedido', `status=${pedido.status}`);
    } catch (e) {
      fail('Aprovar pedido', e.message || e);
    }

    try {
      pedido = await api(
        'POST',
        `/compras/pedidos/${pedido.id}/enviar`,
        token,
        {},
      );
      ok('Enviar pedido ao fornecedor', `status=${pedido.status}`);
    } catch (e) {
      fail('Enviar pedido ao fornecedor', e.message || e);
    }

    try {
      const vis = await api(
        'GET',
        `/compras/pedidos/${pedido.id}/visualizacao`,
        token,
      );
      ok(
        'Visualização imprimível',
        vis?.pedido?.numero || vis?.numero || 'ok',
      );
    } catch (e) {
      fail('Visualização imprimível', e.message || e);
    }
  }

  // --- Recebimento + Aceite ---
  log('\n── Fase 3: Recebimento / Aceite ──');
  if (pedido?.id && itemMaterial?.id) {
    try {
      recebimento = await api(
        'POST',
        `/compras/pedidos/${pedido.id}/recebimentos`,
        token,
        {
          confirmar: true,
          chave_idempotente: `e2e-rc-${pedido.id}`,
          observacao: `${TAG} recebimento parcial`,
          itens: [
            {
              pedido_item_id: itemMaterial.id,
              quantidade_recebida: 2,
              quantidade_aceita: 2,
              localizacao_id: localizacao.id,
            },
          ],
        },
      );
      ok(
        'Recebimento material confirmado',
        `status=${recebimento.status} · id=${recebimento.id}`,
      );
    } catch (e) {
      fail('Recebimento material confirmado', e.message || e);
    }
  } else {
    fail('Recebimento material confirmado', 'pedido/item MATERIAL ausente');
  }

  if (pedido?.id && itemServico?.id) {
    try {
      aceite = await api(
        'POST',
        `/compras/pedidos/${pedido.id}/aceites-servico`,
        token,
        {
          confirmar: true,
          aceite_final: true,
          chave_idempotente: `e2e-as-${pedido.id}`,
          observacao: `${TAG} aceite serviço`,
          itens: [
            {
              pedido_item_id: itemServico.id,
              quantidade_aceita: 1,
              percentual_aceito: 100,
            },
          ],
        },
      );
      ok(
        'Aceite serviço confirmado',
        `status=${aceite.status} · id=${aceite.id}`,
      );
    } catch (e) {
      fail('Aceite serviço confirmado', e.message || e);
    }
  } else {
    fail('Aceite serviço confirmado', 'pedido/item SERVICO ausente');
  }

  // --- Contas a pagar ---
  log('\n── Fase 4: Contas a pagar ──');
  if (pedido?.id) {
    try {
      conta = await api(
        'POST',
        `/financeiro/contas-pagar/from-pedido/${pedido.id}`,
        token,
        {},
      );
      ok(
        'Gerar conta a partir do pedido',
        `doc=${conta.numero_documento} · status=${conta.status} · total=${conta.valor_total}`,
      );
    } catch (e) {
      fail('Gerar conta a partir do pedido', e.message || e);
    }
  }

  if (conta?.id) {
    try {
      const list = await api('GET', '/financeiro/contas-pagar', token);
      const found = Array.isArray(list)
        ? list.some((c) => c.id === conta.id)
        : false;
      if (!found) throw new Error('conta não apareceu na listagem');
      ok('Listar contas a pagar', `${list.length} registro(s)`);
    } catch (e) {
      fail('Listar contas a pagar', e.message || e);
    }

    try {
      const detalhe = await api(
        'GET',
        `/financeiro/contas-pagar/${conta.id}`,
        token,
      );
      ok(
        'Detalhe conta',
        `parcelas=${(detalhe.parcelas || []).length} · pagos=${detalhe.valor_pago}`,
      );
      conta = detalhe;
    } catch (e) {
      fail('Detalhe conta', e.message || e);
    }

    const parcelaId = conta.parcelas?.[0]?.id;
    const valorParcial = 50;

    try {
      pagamento = await api(
        'POST',
        `/financeiro/contas-pagar/${conta.id}/pagamentos`,
        token,
        {
          valor: valorParcial,
          data_pagamento: new Date().toISOString(),
          metodo: 'PIX',
          parcela_id: parcelaId,
          chave_idempotente: `e2e-pg-parcial-${conta.id}`,
          referencia: `${TAG}-PIX-parcial`,
          apropriacoes: [
            {
              destino_tipo: 'ADMINISTRATIVO',
              valor: valorParcial,
            },
          ],
        },
      );
      ok(
        'Registrar pagamento parcial',
        `valor=${pagamento.valor ?? valorParcial} · id=${pagamento.id || pagamento.pagamentos?.at?.(-1)?.id}`,
      );
      // resposta pode ser a conta atualizada
      if (pagamento.pagamentos) {
        conta = pagamento;
        pagamento = pagamento.pagamentos.find((p) => !p.estornado) ||
          pagamento.pagamentos.at(-1);
      }
    } catch (e) {
      fail('Registrar pagamento parcial', e.message || e);
    }

    const pagamentoId = pagamento?.id;
    if (pagamentoId) {
      try {
        await api(
          'POST',
          `/financeiro/pagamentos/${pagamentoId}/estornar`,
          token,
          { motivo: `${TAG} estorno smoke` },
        );
        const aposEstorno = await api(
          'GET',
          `/financeiro/contas-pagar/${conta.id}`,
          token,
        );
        ok(
          'Estornar pagamento',
          `status=${aposEstorno.status} · pago=${aposEstorno.valor_pago}`,
        );
        conta = aposEstorno;
      } catch (e) {
        fail('Estornar pagamento', e.message || e);
      }
    } else {
      fail('Estornar pagamento', 'id do pagamento não retornado');
    }

    try {
      const valorFinal = Number(conta.valor_total);
      const pgFinal = await api(
        'POST',
        `/financeiro/contas-pagar/${conta.id}/pagamentos`,
        token,
        {
          valor: valorFinal,
          data_pagamento: new Date().toISOString(),
          metodo: 'TED',
          parcela_id: parcelaId,
          chave_idempotente: `e2e-pg-final-${conta.id}`,
          referencia: `${TAG}-TED-final`,
          apropriacoes: [
            {
              destino_tipo: 'ADMINISTRATIVO',
              valor: valorFinal,
            },
          ],
        },
      );
      const contaPaga = await api(
        'GET',
        `/financeiro/contas-pagar/${conta.id}`,
        token,
      );
      if (Number(contaPaga.valor_pago) < valorFinal) {
        throw new Error(
          `valor_pago=${contaPaga.valor_pago} esperado >= ${valorFinal}`,
        );
      }
      ok(
        'Registrar pagamento integral',
        `pg=${pgFinal.id} · status=${contaPaga.status} · pago=${contaPaga.valor_pago}`,
      );
      conta = contaPaga;
    } catch (e) {
      fail('Registrar pagamento integral', e.message || e);
    }
  }

  // --- Resumo ---
  log('\n══════════════════════════════════════════════════════');
  const passed = steps.filter((s) => s.ok).length;
  const total = steps.length;
  log(`  Resultado: ${passed}/${total} passos OK`);
  if (solicitacao?.id) log(`  Solicitação: ${solicitacao.numero || solicitacao.id}`);
  if (pedido?.id) log(`  Pedido:      ${pedido.numero || pedido.id}`);
  if (conta?.id) log(`  Conta:       ${conta.numero_documento || conta.id}`);
  log('══════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (err) => {
  console.error('\nFalha fatal:', err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
