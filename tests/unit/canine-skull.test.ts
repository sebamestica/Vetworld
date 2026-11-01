import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { viewerAssets } from '../../src/modules/viewer/assets';
import { viewerAssetSchema } from '../../src/modules/viewer/manifest';
import { meshPresentation } from '../../src/modules/viewer/visibility';
import { assetCredit, workspaceAsset } from '../../src/modules/viewer/selection';
import { catalogService } from '../../src/modules/catalog/services/catalog-service';

const ID = 'canine:agancz-skull-scan';
const asset = viewerAssets.find(entry => entry.id === ID)!;
const available = new Set(catalogService.models().filter(m => m.availability === 'available').map(m => m.id));

describe('Cráneo canino fotogramétrico CC BY 4.0 (Zenodo 10327538)', () => {
  it('manifiesto y catálogo coinciden con el archivo publicado', () => {
    const bytes = readFileSync(`public${asset.resourceUrl}`);
    expect(bytes.length).toBe(asset.byteSize);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    const model = catalogService.model(ID);
    expect(model.fileEvidence).toMatchObject({ sha256: asset.sha256, byteSize: asset.byteSize });
    expect(model).toMatchObject({ speciesId: 'canine', regionId: 'head', scope: 'regional', availability: 'available', resourceUrl: asset.resourceUrl, landingPageUrl: 'https://zenodo.org/records/10327538' });
    expect(model.license).toEqual(asset.license);
    expect(model.review.status).toBe('pending');
    expect(asset.reviewStatus).toBe('pending');
  });
  it('no declara huesos ni escala física', () => {
    expect(asset.meshMappings).toEqual([]);
    expect(catalogService.model(ID).structureIds).toEqual([]);
    expect(catalogService.model(ID).meshMappings).toEqual([]);
    expect(asset.unit).toBe('source-unverified');
    expect(asset.physicalScaleVerified).toBe(false);
    expect(meshPresentation(asset, 'agancz_dog_skull_scan', {}, null)).toMatchObject({ visible: true, mapping: undefined });
    expect(meshPresentation(asset, 'agancz_dog_skull_scan', {}, 'canine:skull').visible).toBe(false);
  });
  it('exige atribución completa para publicar un activo científico', () => {
    expect(viewerAssetSchema.safeParse({ ...asset, credit: undefined }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, licenseUrl: undefined }).success).toBe(false);
    expect(assetCredit(asset)).toEqual({ label: 'Canis Familiaris (Dog) Skull · Abby Gancz (agancz)', licenseName: 'CC BY 4.0', changes: 'Derivado modificado: unión de 6 trozos, soldado de vértices y decimación a 199.997 triángulos', sourceUrl: 'https://zenodo.org/records/10327538', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' });
    expect(assetCredit(viewerAssets.find(a => a.id === 'canine-technical-demo'))).toBeNull();
  });
  it('elige el activo de la página principal sin sustituir regiones ni especies', () => {
    expect(workspaceAsset(viewerAssets, 'canine', 'all', available)).toEqual({ asset, coverage: 'partial' });
    expect(workspaceAsset(viewerAssets, 'canine', 'head', available)).toEqual({ asset, coverage: 'region' });
    expect(workspaceAsset(viewerAssets, 'canine', 'thoracic-limb', available)).toBeNull();
    expect(workspaceAsset(viewerAssets, 'canine', 'all', new Set())).toBeNull();
    expect(workspaceAsset(viewerAssets, 'feline', 'all', available)?.asset.id).toBe('feline:tavernier-skeleton');
    expect(workspaceAsset(viewerAssets, 'feline', 'head', available)?.coverage).toBe('whole-body');
  });
});
