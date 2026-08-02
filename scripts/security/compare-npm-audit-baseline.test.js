'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  compareAuditToBaseline,
  normalizeFindings,
  parseAuditJson,
  loadAuditFromFile,
  runCli,
} = require('./compare-npm-audit-baseline');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    failed += 1;
    process.stderr.write(`not ok - ${name}\n`);
    process.stderr.write(`${error.stack || error.message}\n`);
  }
}

function makeBaseline(exceptions, scope = 'backend') {
  return {
    version: 1,
    scopes: {
      [scope]: { exceptions },
    },
  };
}

function makeAudit(vulnerabilities) {
  return {
    auditReportVersion: 2,
    vulnerabilities,
  };
}

function sampleException(overrides = {}) {
  return {
    id: 'exc-sharp-001',
    package: 'sharp',
    advisory: 'GHSA-f88m-g3jw-g9cj',
    maxSeverity: 'high',
    nodes: ['node_modules/sharp'],
    rangeObserved: '<0.35.0',
    justification: 'Aguardando upgrade major',
    approvedAt: '2026-08-02',
    expiresAt: '2026-09-15',
    ...overrides,
  };
}

function sampleFindingAudit() {
  return makeAudit({
    sharp: {
      name: 'sharp',
      severity: 'high',
      via: [
        {
          url: 'https://github.com/advisories/GHSA-f88m-g3jw-g9cj',
          severity: 'high',
          range: '<0.35.0',
        },
      ],
      nodes: ['node_modules/sharp'],
    },
  });
}

function withTempFiles(auditObject, baselineObject, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-baseline-'));
  const auditPath = path.join(dir, 'audit.json');
  const baselinePath = path.join(dir, 'baseline.json');

  fs.writeFileSync(auditPath, JSON.stringify(auditObject));
  fs.writeFileSync(baselinePath, JSON.stringify(baselineObject));

  try {
    fn({ auditPath, baselinePath, dir });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function captureOutput(fn) {
  const stdout = [];
  const stderr = [];
  const originalStdout = process.stdout.write.bind(process.stdout);
  const originalStderr = process.stderr.write.bind(process.stderr);

  process.stdout.write = (chunk) => {
    stdout.push(String(chunk));
    return true;
  };
  process.stderr.write = (chunk) => {
    stderr.push(String(chunk));
    return true;
  };

  try {
    const exitCode = fn();
    return {
      exitCode,
      stdout: stdout.join(''),
      stderr: stderr.join(''),
    };
  } finally {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  }
}

test('baseline idêntico passa', () => {
  const audit = sampleFindingAudit();
  const baseline = makeBaseline([sampleException()]);
  const result = compareAuditToBaseline(audit, baseline, 'backend', {
    today: '2026-08-01',
  });

  assert.equal(result.ok, true);
  assert.equal(result.exitCode, 0);
  assert.equal(result.failures.length, 0);
  assert.equal(result.cleanup.length, 0);
});

test('finding novo falha', () => {
  const audit = makeAudit({
    lodash: {
      name: 'lodash',
      severity: 'high',
      via: [
        {
          url: 'https://github.com/advisories/GHSA-xx99-yy88-zz77',
          severity: 'high',
          range: '<4.17.21',
        },
      ],
      nodes: ['node_modules/lodash'],
    },
  });
  const baseline = makeBaseline([sampleException()]);
  const result = compareAuditToBaseline(audit, baseline, 'backend', {
    today: '2026-08-01',
  });

  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 1);
  assert.match(result.failures.join('\n'), /Finding não coberto/);
});

test('critical falha mesmo se listado no baseline', () => {
  const audit = makeAudit({
    pkg: {
      name: 'pkg',
      severity: 'critical',
      via: [
        {
          url: 'https://github.com/advisories/GHSA-crit-ical-0001',
          severity: 'critical',
          range: '<1.0.0',
        },
      ],
      nodes: ['node_modules/pkg'],
    },
  });
  const baseline = makeBaseline([
    sampleException({
      id: 'exc-critical',
      package: 'pkg',
      advisory: 'GHSA-crit-ical-0001',
      maxSeverity: 'critical',
      nodes: ['node_modules/pkg'],
      rangeObserved: '<1.0.0',
    }),
  ]);
  const result = compareAuditToBaseline(audit, baseline, 'backend', {
    today: '2026-08-01',
  });

  assert.equal(result.ok, false);
  assert.match(result.failures.join('\n'), /Crítica não permitida/);
});

test('severidade aumentada falha', () => {
  const audit = makeAudit({
    sharp: {
      name: 'sharp',
      severity: 'high',
      via: [
        {
          url: 'https://github.com/advisories/GHSA-f88m-g3jw-g9cj',
          severity: 'high',
          range: '<0.35.0',
        },
      ],
      nodes: ['node_modules/sharp'],
    },
  });
  const baseline = makeBaseline([
    sampleException({ maxSeverity: 'moderate' }),
  ]);
  const result = compareAuditToBaseline(audit, baseline, 'backend', {
    today: '2026-08-01',
  });

  assert.equal(result.ok, false);
  assert.match(result.failures.join('\n'), /Severidade acima do baseline/);
});

test('exceção expirada falha', () => {
  const audit = sampleFindingAudit();
  const baseline = makeBaseline([
    sampleException({ expiresAt: '2026-09-15' }),
  ]);
  const result = compareAuditToBaseline(audit, baseline, 'backend', {
    today: '2026-09-16',
  });

  assert.equal(result.ok, false);
  assert.match(result.failures.join('\n'), /Exceção expirada/);
});

test('JSON inválido falha', () => {
  const parsed = parseAuditJson('{ invalid', 'teste');
  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /JSON inválido/);
});

test('audit indisponível (arquivo inexistente) falha', () => {
  const loaded = loadAuditFromFile(path.join(os.tmpdir(), 'audit-inexistente.json'));
  assert.equal(loaded.ok, false);
  assert.match(loaded.error, /indisponível/);
});

test('finding removido reporta CLEANUP_NEEDED e passa', () => {
  const audit = makeAudit({});
  const baseline = makeBaseline([sampleException()]);
  const result = compareAuditToBaseline(audit, baseline, 'backend', {
    today: '2026-08-01',
  });

  assert.equal(result.ok, true);
  assert.equal(result.exitCode, 0);
  assert.equal(result.cleanup.length, 1);
  assert.equal(result.cleanup[0].id, 'exc-sharp-001');

  withTempFiles(audit, baseline, ({ auditPath, baselinePath }) => {
    const output = captureOutput(() =>
      runCli([
        '--scope',
        'backend',
        '--audit',
        auditPath,
        '--baseline',
        baselinePath,
      ]),
    );

    assert.equal(output.exitCode, 0);
    assert.match(
      output.stdout,
      /CLEANUP_NEEDED id=exc-sharp-001 package=sharp advisory=GHSA-f88m-g3jw-g9cj/,
    );
  });
});

test('normalizeFindings ignora via string e extrai GHSA da URL', () => {
  const audit = makeAudit({
    minimatch: {
      name: 'minimatch',
      severity: 'high',
      via: ['brace-expansion'],
      nodes: ['node_modules/minimatch'],
    },
    axios: {
      name: 'axios',
      severity: 'moderate',
      via: [
        {
          github_advisory_id: 'GHSA-custom-advisory-id',
          severity: 'moderate',
          range: '<1.0.0',
        },
      ],
      nodes: ['node_modules/axios'],
    },
  });

  const findings = normalizeFindings(audit);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].package, 'axios');
  assert.equal(findings[0].advisory, 'GHSA-custom-advisory-id');
});

if (failed > 0) {
  process.stderr.write(`\n${failed} teste(s) falharam, ${passed} passaram.\n`);
  process.exit(1);
}

process.stdout.write(`\n${passed} teste(s) passaram.\n`);
