/**
 * Puerta de calidad rápida para integrar lotes de agentes.
 * Uso: tsx scripts/qa/gate.ts [--full]   (--full añade integración, contratos y build)
 */
import { spawnSync } from 'node:child_process';

const quick = ['lint', 'typecheck', 'test', 'validate:data', 'validate:viewer', 'validate:media', 'anatomy:validate', 'osteology:validate'];
const full = ['test:integration', 'test:contracts', 'build'];
const steps = process.argv.includes('--full') ? [...quick, ...full] : quick;
const results: { step: string; ok: boolean; seconds: number }[] = [];
for (const step of steps) {
  const start = Date.now();
  const run = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', `npm run -s ${step}`], { stdio: 'inherit' })
    : spawnSync('npm', ['run', '-s', step], { stdio: 'inherit' });
  results.push({ step, ok: run.status === 0, seconds: Math.round((Date.now() - start) / 1000) });
}
console.log('\n== Resumen gate ==');
for (const r of results) console.log(`${r.ok ? 'OK   ' : 'FALLO'} ${r.step} (${r.seconds}s)`);
if (results.some((r) => !r.ok)) process.exitCode = 1;
