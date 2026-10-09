import { describe, expect, it } from 'vitest';
import { viewerAssets } from '../../src/modules/viewer/assets';
import { viewerAssetSchema } from '../../src/modules/viewer/manifest';
import { meshPresentation } from '../../src/modules/viewer/visibility';
import { catalogService } from '../../src/modules/catalog/services/catalog-service';

const asset = viewerAssets.find(entry => entry.id === 'feline:tavernier-skeleton')!;
describe('Conjunto felino sin identificación ósea ficticia', () => {
  it('publica geometría de conjunto con escala desconocida y sin huesos declarados', () => {
    expect(viewerAssetSchema.safeParse(asset).success).toBe(true);
    expect(asset.meshMappings).toEqual([]);
    expect(asset.physicalScaleVerified).toBe(false);
    const model = catalogService.model(asset.id);
    expect(model.regionId).toBeNull();
    expect(model.scope).toBe('whole-body');
    expect(model.structureIds).toEqual([]);
    expect(model.review.status).toBe('pending');
  });
  it('muestra un nodo no seleccionable; capas, transparencia y aislamiento son reales', () => {
    expect(meshPresentation(asset, 'chat', {}, null)).toMatchObject({visible: true, mapping: undefined});
    expect(meshPresentation(asset, 'chat', {skeleton: {visible: false, opacity: 1}}, null).visible).toBe(false);
    expect(meshPresentation(asset, 'chat', {skeleton: {visible: true, opacity: .5}}, null).opacity).toBe(.5);
    expect(meshPresentation(asset, 'chat', {}, 'feline:skull').visible).toBe(false);
    expect(meshPresentation(asset, 'other', {}, null).visible).toBe(false);
  });
  it('no permite convertir escala desconocida o un activo sin nodos declarados', () => {
    expect(viewerAssetSchema.safeParse({...asset, scaleToMeters: .01}).success).toBe(false);
    expect(viewerAssetSchema.safeParse({...asset, visualNodes: []}).success).toBe(false);
    expect(viewerAssetSchema.safeParse({...asset, sourceUrl: 'javascript:alert(1)'}).success).toBe(false);
    expect(viewerAssetSchema.safeParse({...asset, licenseUrl: 'https://user:pass@example.com'}).success).toBe(false);
  });
  it('los modelos regionales de permisos inciertos permanecen indisponibles', () => {
    expect(catalogService.models({species: 'canine'}).some(entry => entry.availability === 'available')).toBe(false);
    expect(catalogService.models({species: 'feline', region: 'head'}).some(entry => entry.id === asset.id)).toBe(false);
    expect(catalogService.models({species: 'feline'}).filter(entry => entry.availability === 'available').map(entry => entry.id)).toEqual([asset.id]);
  });
});
