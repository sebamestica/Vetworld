import { describe, expect, it } from 'vitest';
import { isSafeExternalUrl, safeLocalImagePath } from '@/modules/media/safety';
import { visualReferenceSchema } from '@/modules/media/schemas';
import { mediaRepository, validateReferenceIntegrity } from '@/modules/media/repository';
import { catalogRepository } from '@/modules/anatomy/repositories/catalog-repository';
import { createReferencesHandler } from '@/modules/media/handler';

describe('Referencias científicas y derechos', () => {
  it.each(['http://open.lib.umn.edu/', 'https://open.lib.umn.edu.evil.org/', 'https://user@open.lib.umn.edu/', 'https://open.lib.umn.edu:8443/', 'javascript:alert(1)', 'https://open.lib.umn.edu\\@evil.org/', ' https://open.lib.umn.edu/'])('rechaza URL insegura %s', value => expect(isSafeExternalUrl(value)).toBe(false));
  it('admite el capítulo primario HTTPS', () => expect(isSafeExternalUrl(mediaRepository.read()[0].sourceUrl)).toBe(true));
  it.each(['/reference-images/../a.jpg', '/reference-images/%2e%2e/a.jpg', '/reference-images/a.jpg?q=x', '/reference-images/a.svg', '//reference-images/a.jpg'])('rechaza ruta insegura %s', value => expect(safeLocalImagePath(value)).toBe(false));
  it('requiere permisos para imágenes internas y prohíbe hotlinks', () => {
    const row = mediaRepository.read()[0];
    expect(visualReferenceSchema.safeParse({ ...row, displayMode: 'internal', imagePath: '/reference-images/a.jpg', thumbnailPath: '/reference-images/b.jpg' }).success).toBe(false);
    expect(visualReferenceSchema.safeParse({ ...row, imagePath: 'https://open.lib.umn.edu/a.jpg' }).success).toBe(false);
    expect(visualReferenceSchema.safeParse({ ...row, displayMode: 'internal', license: { ...row.license, redistributionAllowed: true }, imagePath: '/reference-images/a.jpg', thumbnailPath: '/reference-images/b.jpg' }).success).toBe(true);
  });
  it('detecta cruces de especie, IDs y fuentes inválidas', () => {
    const row = mediaRepository.read()[0];
    expect(validateReferenceIntegrity([{ ...row, speciesId: row.speciesId === 'canine' ? 'feline' : 'canine' }], catalogRepository.read()).length).toBeGreaterThan(0);
    expect(validateReferenceIntegrity([row, row], catalogRepository.read()).length).toBeGreaterThan(0);
  });
  it('sanitiza fallos inesperados del repositorio', async () => {
    const get = createReferencesHandler(false, { read() { throw new Error('secret filesystem'); } });
    const response = await get(new Request('http://localhost/api/v1/references'));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('secret');
  });
});
