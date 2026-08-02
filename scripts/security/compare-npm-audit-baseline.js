'use strict';

const fs = require('node:fs');

const PREFIX = '[audit-baseline]';

const SEVERITY_ORDER = ['info', 'low', 'moderate', 'high', 'critical'];

const GHSA_FROM_URL = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i;

function log(message) {
  process.stdout.write(`${PREFIX} ${message}\n`);
}

function logError(message) {
  process.stderr.write(`${PREFIX} ${message}\n`);
}

function severityRank(severity) {
  const normalized = String(severity || '').toLowerCase();
  const index = SEVERITY_ORDER.indexOf(normalized);
  return index === -1 ? -1 : index;
}

function extractAdvisory(viaItem) {
  if (viaItem.github_advisory_id) {
    return String(viaItem.github_advisory_id);
  }

  if (viaItem.url) {
    const match = String(viaItem.url).match(GHSA_FROM_URL);
    if (match) {
      return match[0];
    }
  }

  return null;
}

function sortNodes(nodes) {
  return [...nodes].sort((a, b) => a.localeCompare(b));
}

function nodesEqual(left, right) {
  const a = sortNodes(Array.isArray(left) ? left : []);
  const b = sortNodes(Array.isArray(right) ? right : []);
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function findingKey(finding) {
  return `${finding.package}|${finding.advisory}|${finding.range || ''}`;
}

function exceptionKey(exception) {
  return `${exception.package}|${exception.advisory}|${exception.rangeObserved || ''}`;
}

function parseAuditJson(raw, sourceLabel) {
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      error: `JSON inválido (${sourceLabel}): ${error.message}`,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      error: `JSON inválido (${sourceLabel}): raiz deve ser um objeto`,
    };
  }

  if (!parsed.vulnerabilities || typeof parsed.vulnerabilities !== 'object') {
    return {
      ok: false,
      error: `Audit sem objeto vulnerabilities (${sourceLabel})`,
    };
  }

  return { ok: true, audit: parsed };
}

function loadAuditFromFile(auditPath) {
  if (!auditPath) {
    return { ok: false, error: 'Arquivo de audit não informado' };
  }

  if (!fs.existsSync(auditPath)) {
    return {
      ok: false,
      error: `Arquivo de audit indisponível: ${auditPath}`,
    };
  }

  let raw;
  try {
    raw = fs.readFileSync(auditPath, 'utf8');
  } catch (error) {
    return {
      ok: false,
      error: `Falha ao ler audit (${auditPath}): ${error.message}`,
    };
  }

  return parseAuditJson(raw, auditPath);
}

function loadBaselineFromFile(baselinePath) {
  if (!baselinePath) {
    return { ok: false, error: 'Arquivo de baseline não informado' };
  }

  if (!fs.existsSync(baselinePath)) {
    return {
      ok: false,
      error: `Arquivo de baseline indisponível: ${baselinePath}`,
    };
  }

  let raw;
  try {
    raw = fs.readFileSync(baselinePath, 'utf8');
  } catch (error) {
    return {
      ok: false,
      error: `Falha ao ler baseline (${baselinePath}): ${error.message}`,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      error: `JSON inválido (baseline): ${error.message}`,
    };
  }

  return { ok: true, baseline: parsed };
}

function normalizeFindings(audit) {
  const findings = [];
  const vulnerabilities = audit.vulnerabilities || {};

  for (const packageName of Object.keys(vulnerabilities)) {
    const entry = vulnerabilities[packageName];
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const nodes = Array.isArray(entry.nodes) ? entry.nodes : [];
    const via = Array.isArray(entry.via) ? entry.via : [];

    for (const item of via) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const advisory = extractAdvisory(item);
      if (!advisory) {
        continue;
      }

      findings.push({
        package: packageName,
        advisory,
        severity: String(item.severity || entry.severity || '').toLowerCase(),
        range: item.range != null ? String(item.range) : '',
        nodes,
      });
    }
  }

  return findings;
}

function utcTodayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function findMatchingException(finding, exceptions) {
  return exceptions.filter(
    (exception) =>
      exception.package === finding.package &&
      exception.advisory === finding.advisory,
  );
}

function exceptionMatchesFinding(finding, exception) {
  if (exception.package !== finding.package) {
    return false;
  }
  if (exception.advisory !== finding.advisory) {
    return false;
  }

  const exceptionRange = exception.rangeObserved || '';
  const findingRange = finding.range || '';
  if (exceptionRange && findingRange && exceptionRange !== findingRange) {
    return false;
  }

  return true;
}

function compareAuditToBaseline(audit, baseline, scope, options = {}) {
  const failures = [];
  const cleanup = [];
  const today = options.today || utcTodayIso();

  if (!baseline || typeof baseline !== 'object') {
    return {
      ok: false,
      exitCode: 1,
      failures: ['Baseline inválido: raiz deve ser um objeto'],
      cleanup,
    };
  }

  const scopeConfig = baseline.scopes?.[scope];
  if (!scopeConfig) {
    return {
      ok: false,
      exitCode: 1,
      failures: [`Scope inexistente no baseline: ${scope}`],
      cleanup,
    };
  }

  const exceptions = Array.isArray(scopeConfig.exceptions)
    ? scopeConfig.exceptions
    : [];

  const findings = normalizeFindings(audit);
  const matchedExceptionIds = new Set();

  for (const finding of findings) {
    if (finding.severity === 'critical') {
      failures.push(
        `Crítica não permitida: package=${finding.package} advisory=${finding.advisory}`,
      );
      continue;
    }

    const candidates = findMatchingException(finding, exceptions);
    const exception = candidates.find((item) =>
      exceptionMatchesFinding(finding, item),
    );

    if (!exception) {
      failures.push(
        `Finding não coberto: package=${finding.package} advisory=${finding.advisory} range=${finding.range || '(vazio)'}`,
      );
      continue;
    }

    matchedExceptionIds.add(exception.id);

    const findingRank = severityRank(finding.severity);
    const maxRank = severityRank(exception.maxSeverity);
    if (findingRank > maxRank) {
      failures.push(
        `Severidade acima do baseline: id=${exception.id} package=${finding.package} advisory=${finding.advisory} finding=${finding.severity} max=${exception.maxSeverity}`,
      );
    }

    if (!nodesEqual(finding.nodes, exception.nodes)) {
      failures.push(
        `Nodes divergentes: id=${exception.id} package=${finding.package} advisory=${finding.advisory}`,
      );
    }

    const exceptionRange = exception.rangeObserved || '';
    const findingRange = finding.range || '';
    if (exceptionRange && findingRange && exceptionRange !== findingRange) {
      failures.push(
        `Range divergente: id=${exception.id} package=${finding.package} advisory=${finding.advisory} expected=${exceptionRange} actual=${findingRange}`,
      );
    }

    if (exception.expiresAt && exception.expiresAt < today) {
      failures.push(
        `Exceção expirada: id=${exception.id} package=${finding.package} advisory=${finding.advisory} expiresAt=${exception.expiresAt}`,
      );
    }
  }

  for (const exception of exceptions) {
    const hasFinding = findings.some((finding) => {
      if (!exceptionMatchesFinding(finding, exception)) {
        return false;
      }
      return true;
    });

    if (!hasFinding) {
      cleanup.push({
        id: exception.id,
        package: exception.package,
        advisory: exception.advisory,
      });
    }
  }

  return {
    ok: failures.length === 0,
    exitCode: failures.length === 0 ? 0 : 1,
    failures,
    cleanup,
  };
}

function parseArgs(argv) {
  const args = {
    scope: null,
    audit: null,
    baseline: null,
    auditJson: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--scope') {
      args.scope = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === '--audit') {
      args.audit = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === '--baseline') {
      args.baseline = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === '--audit-json') {
      args.auditJson = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (!args.scope || (!args.audit && !args.auditJson) || !args.baseline) {
    logError(
      'Uso: node scripts/security/compare-npm-audit-baseline.js --scope <backend|frontend> --audit <path.json> --baseline <path.json>',
    );
    logError(
      'Alternativa: --audit-json \'<json>\' (para testes)',
    );
    return 1;
  }

  let auditResult;
  if (args.auditJson != null) {
    auditResult = parseAuditJson(args.auditJson, '--audit-json');
  } else {
    auditResult = loadAuditFromFile(args.audit);
  }

  if (!auditResult.ok) {
    logError(auditResult.error);
    return 1;
  }

  const baselineResult = loadBaselineFromFile(args.baseline);
  if (!baselineResult.ok) {
    logError(baselineResult.error);
    return 1;
  }

  const comparison = compareAuditToBaseline(
    auditResult.audit,
    baselineResult.baseline,
    args.scope,
  );

  for (const item of comparison.cleanup) {
    log(
      `CLEANUP_NEEDED id=${item.id} package=${item.package} advisory=${item.advisory}`,
    );
  }

  if (comparison.ok) {
    log(`OK scope=${args.scope} findings cobertos pelo baseline`);
    return 0;
  }

  for (const failure of comparison.failures) {
    logError(failure);
  }

  return comparison.exitCode;
}

const exported = {
  compareAuditToBaseline,
  normalizeFindings,
  parseAuditJson,
  loadAuditFromFile,
  loadBaselineFromFile,
  extractAdvisory,
  severityRank,
  nodesEqual,
  utcTodayIso,
  findingKey,
  exceptionKey,
  runCli,
};

module.exports = exported;

if (require.main === module) {
  process.exit(runCli());
}
