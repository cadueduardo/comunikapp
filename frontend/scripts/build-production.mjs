import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

if (!process.env.NEXT_PUBLIC_APP_VERSION) {
  const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  process.env.NEXT_PUBLIC_APP_VERSION = pkg.version ?? '1.0.0';
}

try {
  process.env.NEXT_PUBLIC_GIT_SHA = execSync('git rev-parse --short HEAD', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();
} catch {
  process.env.NEXT_PUBLIC_GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? '';
}

console.log(
  `[build] Versao da plataforma: ${process.env.NEXT_PUBLIC_APP_VERSION}` +
    (process.env.NEXT_PUBLIC_GIT_SHA ? ` (${process.env.NEXT_PUBLIC_GIT_SHA})` : ''),
);

execSync('next build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});
