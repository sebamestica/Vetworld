import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { responseSchemas, errorSchema } from '../../src/lib/api/contracts';
import { api } from '../helpers/http';

const baseline = JSON.parse(readFileSync('docs/api/openapi.json', 'utf8')) as { components: { schemas: Record<string, unknown> } };
const routes = {
  health: 'health', species: 'species', regions: 'regions', structures: 'structures',
  search: 'search?q=os', systems: 'systems', layers: 'layers', models: 'models',
  sources: 'sources', taxonomy: 'taxonomy', stats: 'stats',
} as const;

describe('contrato publicado y HTTP real', () => {
  it.each(Object.keys(responseSchemas) as (keyof typeof responseSchemas)[])('%s coincide con OpenAPI versionado', key => {
    expect(z.toJSONSchema(responseSchemas[key], { unrepresentable: 'any' })).toEqual(baseline.components.schemas[key]);
  });
  it('errores coinciden con esquema publicado', () => {
    expect(z.toJSONSchema(errorSchema, { unrepresentable: 'any' })).toEqual(baseline.components.schemas.error);
  });
  it.each(Object.entries(routes))('%s respeta el contrato', async (key, path) => {
    const response = await api(path);
    expect(response.status).toBe(200);
    expect(responseSchemas[key as keyof typeof responseSchemas].safeParse(await response.json()).success).toBe(true);
  });
  it.each([
    ['regions', 'region'], ['structures', 'structure'], ['models', 'model'], ['sources', 'source'],
  ] as const)('%s detalles respetan contrato', async (list, key) => {
    const rows = (await (await api(list)).json()).data as { id: string }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const response = await api(`${list}/${row.id}`);
      expect(response.status).toBe(200);
      expect(responseSchemas[key].safeParse(await response.json()).success).toBe(true);
    }
  });
  it('relaciones respeta contrato', async () => {
    const rows = (await (await api('structures')).json()).data as { id: string }[];
    const response = await api(`structures/${rows[0].id}/relations`);
    expect(response.status).toBe(200);
    expect(responseSchemas.relations.safeParse(await response.json()).success).toBe(true);
  });
  it.each([['structures?limit=-1', 400], ['structures/missing-resource', 404]] as const)('error %s es JSON contractual', async (path, status) => {
    const response = await api(path);
    expect(response.status).toBe(status);
    expect(errorSchema.safeParse(await response.json()).success).toBe(true);
  });
});
