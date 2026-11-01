import { describe, expect, it } from 'vitest';
import { referencesResponseSchema, referenceResponseSchema } from '@/modules/media/schemas';
import { api } from '../helpers/http';
import rawReferences from '../../data/anatomy/visual-references.json';
describe('HTTP real de referencias', () => {
  it('lista, pagina y obtiene detalles de referencias pendientes', async () => {
    const response = await api('references?limit=1');
    expect(response.status).toBe(200);
    const body = referencesResponseSchema.parse(await response.json());
    expect(body.data).toHaveLength(1);
    expect(body.meta.pagination.total).toBe(rawReferences.length);
    const detail = await api(`references/${body.data[0].id}`);
    expect(detail.status).toBe(200);
    expect(referenceResponseSchema.parse(await detail.json()).data).toEqual(body.data[0]);
    expect(body.data[0].review.status).toBe('pending');
  });
  it('las imágenes locales solo se sirven desde /media/<especie>/ con licencia redistribuible y las externas no llevan imagen', async () => {
    const body = referencesResponseSchema.parse(await (await api('references?limit=100')).json());
    expect(body.data.every(row => row.review.status === 'pending')).toBe(true);
    for (const row of body.data) {
      if (row.displayMode === 'internal') {
        expect(row.license.verified && row.license.redistributionAllowed).toBe(true);
        expect(row.imagePath?.startsWith(`/media/${row.speciesId}/`)).toBe(true);
      } else expect([row.imagePath, row.thumbnailPath]).toEqual([null, null]);
    }
    const scapula = referencesResponseSchema.parse(await (await api('references?structure=canine:scapula')).json());
    expect(scapula.data.map(row => row.id)).toContain('commons-canine-forelimb-msu');
  });
  it('filtra especies, estructuras y regiones descendientes', async () => {
    const body = await (await api('references?species=canine&structure=canine:biceps-brachii&region=thoracic-limb')).json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].speciesId).toBe('canine');
  });
  it.each(['unknown=x', 'species=canine&species=feline', 'species=unknown', 'structure=feline:nope', 'region=unknown', 'page=1e2', 'limit=101'])('rechaza %s', async query => expect((await api(`references?${query}`)).status).toBe(400));
  it('404, HEAD, OPTIONS y métodos de escritura', async () => {
    expect((await api('references/missing')).status).toBe(404);
    const head = await api('references', { method: 'HEAD' });
    expect(head.status).toBe(200); expect(await head.text()).toBe('');
    expect((await api('references', { method: 'OPTIONS' })).status).toBe(204);
    expect((await api('references', { method: 'POST' })).status).toBe(405);
  });
});
