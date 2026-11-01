import { describe, expect, it } from 'vitest';
import { isSafeExternalUrl, safeLocalImagePath } from '@/modules/media/safety';
import { visualReferenceSchema } from '@/modules/media/schemas';
import { mediaRepository, provenanceRepository, validateReferenceIntegrity } from '@/modules/media/repository';
import { mediaProvenanceSchema } from '@/modules/media/provenance';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
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
  it('admite rutas locales /media/<especie>/ y rechaza otras especies o recorridos', () => {
    expect(safeLocalImagePath('/media/canine/commons-canine-pelvis-msu.jpg')).toBe(true);
    expect(safeLocalImagePath('/media/feline/thumbs/commons-feline-skull-gape.jpg')).toBe(true);
    for (const value of ['/media/wolf/a.jpg', '/media/canine/../a.jpg', '/media/canine/A.JPG', '/media/canine/a.svg', '/media/canine/x/y/a.jpg']) expect(safeLocalImagePath(value)).toBe(false);
  });
  it('enlaza la página oficial de Commons y nunca el servidor de archivos (sin hotlink)', () => {
    expect(isSafeExternalUrl('https://commons.wikimedia.org/wiki/File:Dog_pelvis.JPG')).toBe(true);
    expect(isSafeExternalUrl('https://upload.wikimedia.org/wikipedia/commons/8/8c/Dog_pelvis.JPG')).toBe(false);
  });
  describe('procedencia de imágenes locales', () => {
    const catalog = catalogRepository.read();
    const rows = mediaRepository.read();
    const provenance = provenanceRepository.read();
    const internal = rows.find(row => row.displayMode === 'internal')!;
    it('toda imagen local tiene procedencia coherente y las referencias reales no tienen errores', () => {
      expect(rows.filter(row => row.displayMode === 'internal').map(row => row.id).sort()).toEqual(provenance.map(entry => entry.referenceId).sort());
      expect(validateReferenceIntegrity(rows, catalog, provenance)).toEqual([]);
      expect(rows.every(row => row.review.status === 'pending')).toBe(true);
    });
    it('las copias publicables coinciden con su SHA-256 registrado', () => {
      for (const entry of provenance) for (const file of [entry.published, entry.thumbnail]) {
        expect(createHash('sha256').update(readFileSync(`public${file.path}`)).digest('hex')).toBe(file.sha256);
      }
    });
    it('rechaza imagen local sin procedencia, con estructuras distintas o sin enlace de licencia', () => {
      expect(validateReferenceIntegrity([internal], catalog, [])).toContain(`${internal.id}: imagen local sin registro de procedencia`);
      const forelimb = rows.find(row => row.id === 'commons-canine-forelimb-msu')!;
      const forelimbEntry = provenance.find(item => item.referenceId === forelimb.id)!;
      expect(validateReferenceIntegrity([{ ...forelimb, structureIds: ['canine:scapula'] }], catalog, [forelimbEntry])).toContain(`${forelimb.id}: estructuras distintas de las comprobadas en la imagen`);
      const sharedAlike = rows.find(row => row.id === 'commons-feline-skull-gape')!;
      const gape = provenance.find(item => item.referenceId === sharedAlike.id)!;
      expect(validateReferenceIntegrity([{ ...sharedAlike, license: { ...sharedAlike.license, label: 'CC BY-SA 3.0' } }], catalog, [gape])).toContain(`${sharedAlike.id}: falta el enlace de la licencia en la atribución visible`);
      expect(validateReferenceIntegrity([{ ...sharedAlike, sourceUrl: 'https://commons.wikimedia.org/wiki/File:Otro.jpg' }], catalog, [gape])).toContain(`${sharedAlike.id}: el enlace debe ser la página oficial del archivo`);
      expect(validateReferenceIntegrity([], catalog, [gape])).toContain(`${gape.referenceId}: procedencia sin referencia interna`);
    });
    it('rechaza licencias NC/ND, URL de licencia incoherente y originales fuera de workbench', () => {
      const entry = provenance[0];
      expect(mediaProvenanceSchema.safeParse({ ...entry, license: { ...entry.license, shortName: 'CC BY-NC 4.0' } }).success).toBe(false);
      expect(mediaProvenanceSchema.safeParse({ ...entry, license: { ...entry.license, url: 'https://creativecommons.org/licenses/by-nc/4.0/' } }).success).toBe(false);
      expect(mediaProvenanceSchema.safeParse({ ...entry, license: { ...entry.license, redistributionAllowed: false } }).success).toBe(false);
      expect(mediaProvenanceSchema.safeParse({ ...entry, original: { ...entry.original, path: 'public/media/x/original-a.jpg' } }).success).toBe(false);
      expect(mediaProvenanceSchema.safeParse({ ...entry, filePageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/x.jpg' }).success).toBe(false);
    });
    it('acepta estructuras de subregiones de la región de la referencia y no al revés', () => {
      const forelimb = rows.find(row => row.id === 'commons-canine-forelimb-msu')!;
      expect(forelimb.structureIds).toContain('canine:scapula');
      const sisson = rows.find(row => row.id === 'ia-sisson-canine-thoracic-limb')!;
      expect(validateReferenceIntegrity([{ ...sisson, regionId: 'shoulder' }], catalog, [])).toContain(`${sisson.id}: estructura incompatible canine:radius`);
    });
  });
  it('sanitiza fallos inesperados del repositorio', async () => {
    const get = createReferencesHandler(false, { read() { throw new Error('secret filesystem'); } });
    const response = await get(new Request('http://localhost/api/v1/references'));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('secret');
  });
});
