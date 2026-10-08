import { describe, expect, it } from 'vitest';
import { api } from '../helpers/http';

const lists = ['species', 'regions', 'structures', 'systems', 'layers', 'models', 'sources'];

describe('HTTP real del catálogo', () => {
  it.each(['health', ...lists, 'taxonomy', 'stats', 'search?q=os'])('GET %s devuelve JSON', async path => {
    const response = await api(path);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json();
    expect(body.meta.apiVersion).toBe('v1');
    expect(body.meta.dataVersion).toEqual(expect.any(String));
    expect(body).toHaveProperty('data');
  });

  it('semilla real contiene ambas especies y estructuras; no promete modelos disponibles', async () => {
    const species = (await (await api('species')).json()).data as { id: string }[];
    expect(species.length).toBeGreaterThanOrEqual(2);
    expect(new Set(species.map(item => item.id)).size).toBe(species.length);
    const structures = (await (await api('structures')).json()).data;
    expect(structures.length).toBeGreaterThan(0);
    const models = (await (await api('models')).json()).data as { availability: string }[];
    expect(models.filter(model => model.availability === 'available')).toHaveLength(0);
  });

  it.each(['regions', 'structures', 'models', 'sources'])('detalle y referencias de %s coinciden con lista', async path => {
    const list = await (await api(path)).json();
    for (const item of list.data as { id: string }[]) {
      const response = await api(`${path}/${encodeURIComponent(item.id)}`);
      expect(response.status).toBe(200);
      expect((await response.json()).data.id).toBe(item.id);
    }
  });

  it('filtros combinados y relaciones conservan IDs', async () => {
    const all = (await (await api('structures?limit=100')).json()).data as { id: string; speciesId: string; regionId: string; kind: string }[];
    const first = all[0];
    expect(first).toBeDefined();
    const query = new URLSearchParams({ species: first.speciesId, region: first.regionId, kind: first.kind });
    const filtered = await api(`structures?${query}`);
    expect(filtered.status).toBe(200);
    const rows = (await filtered.json()).data as typeof all;
    expect(rows.some(row => row.id === first.id)).toBe(true);
    expect(rows.every(row => row.speciesId === first.speciesId && row.regionId === first.regionId && row.kind === first.kind)).toBe(true);
    const relations = await api(`structures/${first.id}/relations`);
    expect(relations.status).toBe(200);
    expect(Array.isArray((await relations.json()).data)).toBe(true);
  });

  it('paginación limita y declara el total sin duplicados', async () => {
    const first = await (await api('structures?page=1&limit=1')).json();
    const second = await (await api('structures?page=2&limit=1')).json();
    expect(first.data).toHaveLength(1);
    expect(first.meta.pagination).toMatchObject({ page: 1, limit: 1 });
    expect(first.meta.pagination.total).toBeGreaterThan(0);
    if (second.data.length) expect(second.data[0].id).not.toBe(first.data[0].id);
    const empty = await (await api('structures?page=99999&limit=1')).json();
    expect(empty.data).toEqual([]);
  });

  it('relaciones documentadas apuntan a estructuras y fuentes existentes de una misma especie', async () => {
    const structures = (await (await api('structures?limit=100')).json()).data as { id: string; speciesId: string }[];
    const sources = new Set(((await (await api('sources?limit=100')).json()).data as { id: string }[]).map(row => row.id));
    const byId = new Map(structures.map(row => [row.id, row]));
    let count = 0;
    for (const structure of structures) {
      const body = await (await api(`structures/${encodeURIComponent(structure.id)}/relations?limit=100`)).json();
      for (const relation of body.data as { fromId: string; toId: string; sourceIds: string[] }[]) {
        count++;
        expect(byId.has(relation.fromId)).toBe(true);
        expect(byId.has(relation.toId)).toBe(true);
        expect(byId.get(relation.fromId)?.speciesId).toBe(byId.get(relation.toId)?.speciesId);
        expect(relation.sourceIds.length).toBeGreaterThan(0);
        expect(relation.sourceIds.every(id => sources.has(id))).toBe(true);
      }
    }
    expect(count).toBeGreaterThan(0);
  });

  it('búsqueda normaliza acentos, mayúsculas y sinónimos del catálogo', async () => {
    const rows = (await (await api('structures?limit=100')).json()).data as { id: string; aliases: string[] }[];
    const synonym = rows.find(row => row.aliases.length > 0);
    expect(synonym).toBeDefined();
    const q = synonym!.aliases[0].toLocaleUpperCase('es').normalize('NFD').replace(/\p{M}/gu, '');
    const response = await api(`search?${new URLSearchParams({ q })}`);
    expect(response.status).toBe(200);
    const results = (await response.json()).data as { structure: { id: string }; score: number }[];
    expect(results.some(row => row.structure.id === synonym!.id)).toBe(true);
  });

  it.each([
    'structures?page=0', 'structures?page=-1', 'structures?page=1.5', 'structures?page=1e2',
    'structures?limit=101', 'structures?limit=0', 'structures?page=1&page=2',
    'structures?unknown=true', 'structures?species=missing-species', 'structures?region=missing-region',
    'structures?kind=imaginary', 'search', 'search?q=%20%20', `search?q=${'a'.repeat(121)}`,
    'health?extra=1', 'stats?page=1', 'taxonomy?unknown=1',
  ])('parámetros inválidos %s producen 400', async path => {
    const response = await api(path);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
  });

  it.each(['regions', 'structures', 'models', 'sources'])('ID inexistente %s produce 404', async path => {
    const response = await api(`${path}/missing-resource`);
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe('NOT_FOUND');
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('%s está rechazado explícitamente', async method => {
    const response = await api('structures', { method });
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toContain('GET');
    expect((await response.json()).error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it.each(['health', ...lists, 'taxonomy', 'stats', 'search?q=os'])('%s rechaza parámetros desconocidos y mutaciones', async path => {
    const invalid = await api(`${path}${path.includes('?') ? '&' : '?'}unrecognized=1`);
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.code).toBe('VALIDATION_ERROR');
    const mutation = await api(path, { method: 'POST' });
    expect(mutation.status).toBe(405);
    expect((await mutation.json()).error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('HEAD omite cuerpo y OPTIONS anuncia métodos', async () => {
    const head = await api('structures', { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    const missing = await api('structures/missing-resource', { method: 'HEAD' });
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe('');
    const options = await api('structures', { method: 'OPTIONS' });
    expect(options.status).toBe(204);
    expect(options.headers.get('allow')).toContain('HEAD');
  });
});
