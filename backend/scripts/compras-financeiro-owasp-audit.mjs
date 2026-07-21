#!/usr/bin/env node
/**
 * Auditoria estática OWASP Top 10 — módulos Compras e Financeiro (MVP).
 *
 * Uso:
 *   node scripts/compras-financeiro-owasp-audit.mjs
 *
 * Exit 0: sem gaps críticos (auth em todos os controllers).
 * Exit 1: gap crítico (controller/rota sem guard de autenticação).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BACKEND_ROOT = join(__dirname, '..');
const SRC = join(BACKEND_ROOT, 'src');

const MODULE_DIRS = [
  join(SRC, 'compras'),
  join(SRC, 'financeiro'),
];

const AUTH_GUARD_PATTERNS = [
  /@UseGuards\s*\(\s*JwtAuthGuard/,
  /@UseGuards\s*\([^)]*JwtAuthGuard/,
  /JwtAuthGuard/,
];

const PERMISSION_PATTERNS = [
  /assertPode\s*\(/,
  /PermissionsGuard/,
  /RequirePermissions/,
  /assertPodeVisualizar/,
  /assertPodeFechar/,
];

const UNSAFE_SQL_PATTERNS = [
  /\$queryRawUnsafe/,
  /\$executeRawUnsafe/,
  /prisma\.\$queryRaw\s*`[^`]*\$\{/,
  /prisma\.\$executeRaw\s*`[^`]*\$\{/,
];

const SSRF_PATTERNS = [
  /\bfetch\s*\(\s*(?:req\.|dto\.|body\.|params\.|query\.)/,
  /\baxios\.(?:get|post|put|patch|delete)\s*\(\s*(?:req\.|dto\.|body\.)/,
  /downloadFromUrl|fetchUrl|urlFromClient/i,
];

/** @param {string} dir */
function walkTsFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, acc);
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

/** @param {string} content */
function hasAuthGuard(content) {
  return AUTH_GUARD_PATTERNS.some((re) => re.test(content));
}

/** @param {string} filePath */
function rel(filePath) {
  return relative(BACKEND_ROOT, filePath).split(sep).join('/');
}

/** @param {string} content @param {string} filePath */
function extractControllers(content, filePath) {
  const controllers = [];
  const classRe =
    /@Controller\s*\(\s*['"`]([^'"`]+)['"`]\s*\)[\s\S]*?export class (\w+)/g;
  let m;
  while ((m = classRe.exec(content)) !== null) {
    const basePath = m[1];
    const className = m[2];
    const exportIdx = content.indexOf(`export class ${className}`, m.index);
    const braceStart = content.indexOf('{', exportIdx);
    if (braceStart === -1) continue;

    let depth = 0;
    let braceEnd = braceStart;
    for (let i = braceStart; i < content.length; i++) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') depth--;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }
    const classBody = content.slice(braceStart, braceEnd + 1);
    const headerSlice = content.slice(m.index, braceStart);
    const guarded = hasAuthGuard(headerSlice) || hasAuthGuard(classBody.slice(0, 200));
    const httpRoutes = [];
    const routeRe =
      /@(Get|Post|Patch|Put|Delete)\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;
    let rm;
    while ((rm = routeRe.exec(classBody)) !== null) {
      const method = rm[1].toUpperCase();
      const sub = rm[2] ?? '';
      const pathSuffix = sub ? `/${sub}` : '';
      httpRoutes.push({
        method,
        path: `/${basePath}${pathSuffix}`.replace(/\/+/g, '/'),
      });
    }
    controllers.push({
      file: rel(filePath),
      className,
      basePath,
      guarded,
      routes: httpRoutes,
    });
  }
  return controllers;
}

/** @param {string[]} files */
function auditControllers(files) {
  const controllers = [];
  const unguarded = [];
  for (const file of files.filter((f) => f.endsWith('.controller.ts'))) {
    const content = readFileSync(file, 'utf8');
    for (const ctrl of extractControllers(content, file)) {
      controllers.push(ctrl);
      if (!ctrl.guarded) {
        unguarded.push(ctrl);
      }
    }
  }
  return { controllers, unguarded };
}

/** @param {string[]} files */
function auditDtos(files) {
  const dtos = files.filter((f) => f.includes(`${sep}dto${sep}`) && f.endsWith('.dto.ts'));
  const withValidator = [];
  const withoutValidator = [];
  for (const file of dtos) {
    const content = readFileSync(file, 'utf8');
    const entry = rel(file);
    if (/from\s+['"]class-validator['"]/.test(content)) {
      withValidator.push(entry);
    } else {
      withoutValidator.push(entry);
    }
  }
  return { total: dtos.length, withValidator, withoutValidator };
}

/** @param {string[]} files */
function auditSqlAndSsrf(files) {
  const unsafeSql = [];
  const ssrfHits = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const entry = rel(file);
    for (const re of UNSAFE_SQL_PATTERNS) {
      if (re.test(content)) {
        unsafeSql.push({ file: entry, pattern: re.source });
        break;
      }
    }
    for (const re of SSRF_PATTERNS) {
      if (re.test(content)) {
        ssrfHits.push({ file: entry, pattern: re.source });
      }
    }
  }
  return { unsafeSql, ssrfHits };
}

/** @param {string[]} files */
function auditTenantPatterns(files) {
  const serviceFiles = files.filter((f) => f.endsWith('.service.ts'));
  let lojaIdRefs = 0;
  let findFirstWithLoja = 0;
  for (const file of serviceFiles) {
    const content = readFileSync(file, 'utf8');
    lojaIdRefs += (content.match(/loja_id/g) ?? []).length;
    findFirstWithLoja += (content.match(/findFirst\s*\(\s*\{[^}]*loja_id/g) ?? [])
      .length;
  }
  return { serviceFiles: serviceFiles.length, lojaIdRefs, findFirstWithLoja };
}

/** @param {string[]} serviceFiles */
function auditPermissionsInServices(serviceFiles) {
  const withPerm = [];
  const readOnlyNoPerm = [];
  const readPatterns = [
    /async\s+findAll\s*\(/,
    /async\s+findOne\s*\(/,
    /async\s+list\s*\(/,
    /async\s+historico\s*\(/,
    /async\s+visualizacao\s*\(/,
    /async\s+listByPedido\s*\(/,
  ];
  for (const file of serviceFiles) {
    const content = readFileSync(file, 'utf8');
    const entry = rel(file);
    const hasPermCheck = PERMISSION_PATTERNS.some((re) => re.test(content));
    const hasReadMethods = readPatterns.some((re) => re.test(content));
    if (hasPermCheck) {
      withPerm.push(entry);
    } else if (hasReadMethods) {
      readOnlyNoPerm.push(entry);
    }
  }
  return { withPerm, readOnlyNoPerm };
}

function main() {
  const allFiles = MODULE_DIRS.flatMap((d) => walkTsFiles(d));
  const controllerFiles = allFiles.filter((f) => f.endsWith('.controller.ts'));

  const { controllers, unguarded } = auditControllers(allFiles);
  const dtos = auditDtos(allFiles);
  const { unsafeSql, ssrfHits } = auditSqlAndSsrf(allFiles);
  const tenant = auditTenantPatterns(allFiles);
  const serviceFiles = allFiles.filter((f) => f.endsWith('.service.ts'));
  const perms = auditPermissionsInServices(serviceFiles);

  const critical = [];
  const warnings = [];

  if (unguarded.length > 0) {
    critical.push(
      `${unguarded.length} controller(s) sem JwtAuthGuard/@UseGuards`,
    );
  }
  if (unsafeSql.length > 0) {
    critical.push(`${unsafeSql.length} arquivo(s) com SQL raw inseguro`);
  }
  if (ssrfHits.length > 0) {
    critical.push(`${ssrfHits.length} possível(is) vetor(es) SSRF`);
  }
  if (dtos.withoutValidator.length > 0) {
    warnings.push(
      `${dtos.withoutValidator.length} DTO(s) sem import class-validator (amostra)`,
    );
  }
  if (perms.readOnlyNoPerm.length > 0) {
    warnings.push(
      `${perms.readOnlyNoPerm.length} service(s) de leitura sem assertPode explícito (confiar JWT+loja_id)`,
    );
  }

  console.log('# Auditoria OWASP — Compras / Financeiro\n');
  console.log(`Escaneados: ${controllerFiles.length} controllers, ${dtos.total} DTOs, ${serviceFiles.length} services\n`);

  console.log('## Controllers e autenticação\n');
  console.log('| Controller | Base | Guard JWT | Rotas |');
  console.log('|---|---|---|---|');
  for (const c of controllers) {
    console.log(
      `| ${c.className} | \`${c.basePath}\` | ${c.guarded ? 'OK' : '**GAP**'} | ${c.routes.length} |`,
    );
  }
  console.log('');

  if (unguarded.length > 0) {
    console.log('### GAP CRÍTICO — controllers sem guard\n');
    for (const c of unguarded) {
      console.log(`- \`${c.file}\` — ${c.className}`);
      for (const r of c.routes) {
        console.log(`  - ${r.method} ${r.path}`);
      }
    }
    console.log('');
  }

  console.log('## DTOs / class-validator (amostra)\n');
  console.log(`- Com validator: ${dtos.withValidator.length}/${dtos.total}`);
  if (dtos.withoutValidator.length > 0) {
    console.log('- Sem validator:');
    for (const d of dtos.withoutValidator.slice(0, 10)) {
      console.log(`  - \`${d}\``);
    }
    if (dtos.withoutValidator.length > 10) {
      console.log(`  - … +${dtos.withoutValidator.length - 10} arquivo(s)`);
    }
  }
  console.log('');

  console.log('## SQL parametrizado\n');
  if (unsafeSql.length === 0) {
    console.log('- OK: nenhum `$queryRawUnsafe` / concatenação detectada em compras/financeiro.');
  } else {
    for (const hit of unsafeSql) {
      console.log(`- GAP: \`${hit.file}\` (${hit.pattern})`);
    }
  }
  console.log('');

  console.log('## Anexos / SSRF\n');
  if (ssrfHits.length === 0) {
    console.log('- OK: nenhum fetch de URL arbitrária do client nos módulos.');
  } else {
    for (const hit of ssrfHits) {
      console.log(`- GAP: \`${hit.file}\` (${hit.pattern})`);
    }
  }
  console.log('');

  console.log('## Isolamento tenant (heurística)\n');
  console.log(`- Referências \`loja_id\` em services: ${tenant.lojaIdRefs}`);
  console.log(`- \`findFirst\` com \`loja_id\`: ${tenant.findFirstWithLoja}`);
  console.log('');

  console.log('## Permissões finas (serviço)\n');
  console.log(`- Services com assertPode/guards: ${perms.withPerm.length}`);
  if (perms.readOnlyNoPerm.length > 0) {
    console.log('- Leituras sem permissão específica (PARCIAL — ver doc fase-6):');
    for (const s of perms.readOnlyNoPerm) {
      console.log(`  - \`${s}\``);
    }
  }
  console.log('');

  console.log('## Resumo\n');
  if (critical.length === 0) {
    console.log('- **Críticos:** nenhum');
  } else {
    console.log('- **Críticos:**');
    for (const c of critical) {
      console.log(`  - ${c}`);
    }
  }
  if (warnings.length === 0) {
    console.log('- **Avisos:** nenhum');
  } else {
    console.log('- **Avisos (não bloqueiam exit 0):**');
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
  }

  console.log('\n---');
  console.log('Doc: `docs/modulo de compras/fase-6-auditoria-owasp-producao.md`');

  process.exit(critical.length > 0 ? 1 : 0);
}

main();
