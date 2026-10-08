import { responseSchemas, errorSchema } from '../src/lib/api/contracts';

const base = (process.env.API_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const parsed = new URL(base);
if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
  throw new Error('API_BASE_URL debe ser una URL HTTP(S) sin credenciales, query ni fragmento');
}
const endpoints: { path: string; key?: keyof typeof responseSchemas; status: number }[] = [
  ...(['health', 'species', 'regions', 'structures', 'systems', 'layers', 'models', 'sources', 'taxonomy', 'stats'] as const)
    .map(key => ({ path: key, key, status: 200 })),
  { path: 'search?q=scapula', key: 'search', status: 200 },
  { path: 'structures?limit=-1', status: 400 },
  { path: 'structures/missing-resource', status: 404 },
];
let failures = 0;
for (let index = 0; index < endpoints.length; index++) {
  const item = endpoints[index];
  const endpoint = `${base}/api/v1/${item.path}`;
  let received: number | null = null;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(15000), redirect: 'error' });
    received = response.status;
    const json: unknown = await response.json();
    const schema = item.key ? responseSchemas[item.key] : errorSchema;
    const validation = schema.safeParse(json);
    const contentType = response.headers.get('content-type');
    const passed = received === item.status && contentType?.includes('application/json') && validation.success;
    if (!passed) failures++;
    console.log(JSON.stringify({ endpoint, received, expected: item.status, contentType, error: passed ? null : 'HTTP o contrato incorrecto', validation: validation.success ? 'ok' : validation.error.issues, result: passed ? 'PASS' : 'FAIL' }));
    if (passed && item.key && ['regions', 'structures', 'models', 'sources'].includes(item.key)) {
      const rows = (json as { data: { id: string }[] }).data;
      const first = rows[0];
      if (first) {
        const detailKey = { regions: 'region', structures: 'structure', models: 'model', sources: 'source' } as const;
        endpoints.push({ path: `${item.key}/${encodeURIComponent(first.id)}`, key: detailKey[item.key as keyof typeof detailKey], status: 200 });
        if (item.key === 'structures') endpoints.push({ path: `structures/${encodeURIComponent(first.id)}/relations`, key: 'relations', status: 200 });
      }
    }
  } catch (error) {
    failures++;
    console.error(JSON.stringify({ endpoint, received, expected: item.status, error: error instanceof Error ? error.message : 'Error inesperado', validation: 'no ejecutada', result: 'FAIL' }));
  }
}
console.log(`Smoke: ${endpoints.length - failures}/${endpoints.length} correctos. URL: ${base}`);
if (failures) process.exitCode = 1;
