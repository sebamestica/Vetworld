import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, it } from 'vitest';
import { createHandler } from '../../src/lib/api/handler';
import { errorSchema } from '../../src/lib/api/contracts';
import { catalogService } from '../../src/modules/catalog/services/catalog-service';

async function throughHttp(handler: ReturnType<typeof createHandler>): Promise<void> {
  const server = createServer(async (incoming, outgoing) => {
    const response = await handler(new Request(`http://127.0.0.1${incoming.url ?? '/'}`));
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(await response.text());
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`, { signal: AbortSignal.timeout(5000) });
    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(errorSchema.safeParse(body).success).toBe(true);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(body)).not.toMatch(/secret|password|stack|internal-path/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

it('fallo de lectura devuelve 500 mediante HTTP real sin exponer trazas', async () => {
  await throughHttp(createHandler('health', catalogService, {
    read() { throw new Error('secret password internal-path'); },
  }));
});

it('salida inválida devuelve 500 mediante HTTP real', async () => {
  await throughHttp(createHandler('stats', {
    ...catalogService,
    stats() { return { ...catalogService.stats(), species: -1 }; },
  }));
});
