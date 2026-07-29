#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

function warn(message) {
  console.warn(`[deploy-product-update] AVISO: ${message}`);
}

function git(args) {
  return execFileSync('git', args, {
    cwd: require('node:path').resolve(__dirname, '..', '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

async function main() {
  const secret = process.env.ADMIN_DEPLOY_WEBHOOK_SECRET;
  if (!secret) {
    warn('ADMIN_DEPLOY_WEBHOOK_SECRET ausente; rascunho não foi criado.');
    return;
  }

  const commitAfter = git([
    'rev-parse',
    process.env.DEPLOY_COMMIT_AFTER || 'HEAD',
  ]);
  const commitBefore = process.env.DEPLOY_COMMIT_BEFORE
    ? git(['rev-parse', process.env.DEPLOY_COMMIT_BEFORE])
    : undefined;
  const environment = process.env.DEPLOY_ENVIRONMENT || 'production';
  const version =
    process.env.DEPLOY_VERSION ||
    process.env.npm_package_version ||
    commitAfter.slice(0, 10);
  const range =
    commitBefore && commitBefore !== commitAfter
      ? `${commitBefore}..${commitAfter}`
      : commitAfter;
  let changes = [];
  try {
    changes = git([
      'log',
      '--format=%s',
      '--no-merges',
      '-n',
      '100',
      range,
    ])
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    changes = [];
  }

  const content =
    changes.length > 0
      ? [
          'Rascunho gerado automaticamente após o deploy.',
          '',
          'Alterações técnicas identificadas:',
          ...changes.map((change) => `- ${change.slice(0, 300)}`),
          '',
          'Revise a linguagem, o impacto, os módulos e os canais antes de publicar.',
        ].join('\n')
      : 'Rascunho gerado automaticamente após o deploy. Revise e descreva as mudanças relevantes antes de publicar.';
  const endpoint =
    process.env.PRODUCT_UPDATES_WEBHOOK_URL ||
    `http://127.0.0.1:${process.env.PORT || '4000'}/admin/v1/internal/deploy-product-updates`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commitSha: commitAfter,
        environment,
        version,
        title: `Atualização do ComunikApp — ${version}`,
        summary:
          'Uma nova versão foi implantada e aguarda revisão das notas para os clientes.',
        content,
        category: 'IMPROVEMENT',
        modules: [],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      warn(`API respondeu HTTP ${response.status}; o deploy permanece válido.`);
      return;
    }
    const result = await response.json();
    console.log(
      result.created
        ? '[deploy-product-update] Rascunho criado para revisão.'
        : '[deploy-product-update] Rascunho já existente; nenhuma duplicação.',
    );
  } catch (error) {
    warn(
      `${error instanceof Error ? error.message : 'falha desconhecida'}; o deploy permanece válido.`,
    );
  }
}

main().catch((error) => {
  warn(
    `${error instanceof Error ? error.message : 'falha desconhecida'}; o deploy permanece válido.`,
  );
});
