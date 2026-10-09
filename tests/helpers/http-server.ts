import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext { apiBaseUrl: string }
}

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Puerto local no disponible');
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return address.port;
}

export async function startLocalServer(mode: 'dev' | 'start' = 'dev'): Promise<{ baseUrl: string; stop: () => Promise<void> }> {
  if (mode === 'dev') try {
    const existing = await fetch('http://127.0.0.1:3000/api/v1/health', { signal: AbortSignal.timeout(1000) });
    if (existing.status === 200) {
      return { baseUrl: 'http://127.0.0.1:3000', stop: async () => {} };
    }
  } catch { /* No running dev server, spawn isolated instance */ }
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', mode, '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(), env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', shell: false, windowsHide: true,
  });
  let output = '';
  child.stdout.on('data', chunk => { output = (output + String(chunk)).slice(-12000); });
  child.stderr.on('data', chunk => { output = (output + String(chunk)).slice(-12000); });
  const stop = async () => {
    if (child.exitCode !== null || !child.pid) return;
    if (process.platform === 'win32') {
      await new Promise<void>(resolve => {
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { shell: false, stdio: 'ignore', windowsHide: true });
        killer.once('error', () => { child.kill(); resolve(); });
        killer.once('exit', () => resolve());
      });
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill(); }
    }
  };
  try {
    const deadline = Date.now() + 110000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Next finalizó (${child.exitCode}): ${output}`);
      try {
        const response = await fetch(`${baseUrl}/api/v1/health`, { signal: AbortSignal.timeout(10000) });
        if (response.status === 200) {
          return { baseUrl, stop };
        }
      } catch { /* La primera compilación puede tardar. */ }
      await delay(250);
    }
    throw new Error(`Tiempo de espera agotado al iniciar Next: ${output}`);
  } catch (error) { await stop(); throw error; }
}

export default async function setup(project: TestProject) {
  const server = await startLocalServer(process.env.API_TEST_MODE === 'production' ? 'start' : 'dev');
  project.provide('apiBaseUrl', server.baseUrl);
  return server.stop;
}
