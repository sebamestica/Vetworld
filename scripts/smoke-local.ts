import { spawn } from 'node:child_process';
import { startLocalServer } from '../tests/helpers/http-server';

const mode = process.argv.includes('--production') ? 'start' : 'dev';
const server = await startLocalServer(mode);
try {
  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/smoke-api.ts'], {
      cwd: process.cwd(), env: { ...process.env, API_BASE_URL: server.baseUrl },
      stdio: 'inherit', shell: false, windowsHide: true,
    });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
  process.exitCode = code;
} finally {
  await server.stop();
}
