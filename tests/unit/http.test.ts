import { describe, expect, it } from 'vitest';
import { createHandler } from '@/lib/api/handler';
import { parseQuery, paginate } from '@/lib/api/http';
import { querySchemas, errorSchema } from '@/lib/api/contracts';
import { catalogService } from '@/modules/catalog/services/catalog-service';
import { catalogRepository } from '@/modules/anatomy/repositories/catalog-repository';

describe('entrada HTTP y errores controlados', () => {
  it.each(['page=0', 'page=1.5', 'page=1e2', 'limit=101', 'page=', 'page=1&page=2', 'unknown=1', 'species=%GG', 'species=%FF'])('rechaza %s', query => {
    expect(() => parseQuery(`http://localhost/api/v1/structures?${query}`, querySchemas.structures)).toThrow();
  });
  it('pagina sin modificar colección y acepta páginas vacías', () => {
    const rows = [1, 2, 3];
    expect(paginate(rows, 2, 2)).toEqual({ items: [3], pagination: { page: 2, limit: 2, total: 3, totalPages: 2 } });
    expect(paginate(rows, 3, 2).items).toEqual([]);
    expect(rows).toEqual([1, 2, 3]);
  });
  it('fallo de catálogo es 500 sin secretos ni trazas', async () => {
    const get = createHandler('health', catalogService, { read() { throw new Error('C:/secret token=private'); } });
    const response = await get(new Request('http://localhost/api/v1/health'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(errorSchema.safeParse(body).success).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/secret|private|stack/);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('respuesta incompatible del servicio produce 500', async () => {
    const broken = { ...catalogService, stats: () => ({ ...catalogService.stats(), species: -1 }) };
    const response = await createHandler('stats', broken, catalogRepository)(new Request('http://localhost/api/v1/stats'));
    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe('INTERNAL_ERROR');
  });
});
