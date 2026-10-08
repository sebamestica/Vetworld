import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { referenceResponseSchema, referencesResponseSchema } from '@/modules/media/schemas';
import { api } from '../helpers/http';

const baseline = JSON.parse(readFileSync('docs/api/openapi.json', 'utf8'));
describe('referencias curadas: contrato aditivo', () => {
  it('lista mantiene el baseline publicado', () => { expect(z.toJSONSchema(referencesResponseSchema, { unrepresentable: 'any' })).toEqual(baseline.components.schemas.references); });
  it('detalle mantiene el baseline publicado', () => { expect(z.toJSONSchema(referenceResponseSchema, { unrepresentable: 'any' })).toEqual(baseline.components.schemas.reference); });
  it('lista y detalle reales son contractuales', async () => {
    const result = referencesResponseSchema.parse(await (await api('references?species=canine')).json());
    expect(result.data.length).toBeGreaterThan(0);
    for (const item of result.data) {
      const response = await api(`references/${item.id}`);
      expect(response.status).toBe(200);
      expect(referenceResponseSchema.parse(await response.json()).data.id).toBe(item.id);
    }
  });
});
