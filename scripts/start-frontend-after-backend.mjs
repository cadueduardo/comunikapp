import net from 'node:net';
import { spawn } from 'node:child_process';

const host = process.env.BACKEND_STARTUP_HOST || '127.0.0.1';
const port = Number(process.env.BACKEND_STARTUP_PORT || process.env.PORT || 4000);
const timeoutMs = Number(process.env.BACKEND_STARTUP_TIMEOUT_MS || 120_000);
const startedAt = Date.now();

function canConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (connected) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(connected);
    };

    socket.setTimeout(750);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForBackend() {
  process.stdout.write(
    `[dev:frontend] Aguardando backend em ${host}:${port}...\n`,
  );

  while (Date.now() - startedAt < timeoutMs) {
    if (await canConnect()) {
      process.stdout.write('[dev:frontend] Backend disponível. Iniciando Next.js.\n');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(
    `Backend não ficou disponível em ${host}:${port} após ${timeoutMs}ms.`,
  );
}

try {
  await waitForBackend();
} catch (error) {
  process.stderr.write(`[dev:frontend] ${error.message}\n`);
  process.exit(1);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const frontendArgs = [
  'run',
  'dev',
  '--prefix',
  'frontend',
  ...process.argv.slice(2),
];
const frontend = spawn(npmCommand, frontendArgs, {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: false,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!frontend.killed) {
      frontend.kill(signal);
    }
  });
}

frontend.once('error', (error) => {
  process.stderr.write(
    `[dev:frontend] Falha ao iniciar o frontend: ${error.message}\n`,
  );
  process.exitCode = 1;
});

frontend.once('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
