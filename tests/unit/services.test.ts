import { describe, expect, it } from 'vitest';
import { catalogRepository } from '@/modules/anatomy/repositories/catalog-repository';
import { catalogService, createCatalogService } from '@/modules/catalog/services/catalog-service';

describe('Servicios del catálogo real', () => {
  it('filtra especies, regiones jerárquicas y clases de estructura', () => {
    expect(catalogService.species({species:'feline'}).map(row => row.id)).toEqual(['feline']);
    const rows = catalogService.structures({species:'canine',region:'thoracic-limb',kind:'muscle'});
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(row => row.speciesId === 'canine' && row.kind === 'muscle')).toBe(true);
    expect(catalogService.regions({species:'feline'}).every(row => row.speciesIds.includes('feline'))).toBe(true);
    expect(catalogService.structures({species:'feline',region:'pelvic-limb'})).toEqual([]);
  });
  it('rechaza filtros desconocidos y distingue recurso inexistente', () => {
    expect(() => catalogService.structures({species:'missing'})).toThrow('Filtro species desconocido');
    expect(() => catalogService.models({region:'missing'})).toThrow('Filtro region desconocido');
    expect(() => catalogService.structures({system:'missing'})).toThrow('Filtro system desconocido');
    expect(() => catalogService.structure('missing')).toThrow('Recurso inexistente');
    expect(() => catalogService.relations('missing')).toThrow('Recurso inexistente');
  });
  it('devuelve relaciones documentadas tanto entrantes como salientes', () => {
    const catalog = catalogRepository.read();
    const relation = catalog.relations[0];
    expect(relation).toBeDefined();
    expect(catalogService.relations(relation.fromId).map(row => row.id)).toContain(relation.id);
    expect(catalogService.relations(relation.toId,{type:relation.type}).map(row => row.id)).toContain(relation.id);
  });
  it('busca nombres, sinónimos y filtros combinados sin modificar los datos', () => {
    expect(catalogService.search({q:'omoplato',species:'canine'})[0]?.structure.id).toBe('canine:scapula');
    expect(catalogService.search({q:'biceps',species:'canine',kind:'muscle'}).every(row => row.structure.kind === 'muscle' && row.structure.speciesId === 'canine')).toBe(true);
    expect(catalogService.search({q:'zzznomatch'})).toEqual([]);
  });
  it('refleja registros incompletos, revisión pendiente y archivos no disponibles', () => {
    const catalog = catalogRepository.read();
    const stats = catalogService.stats();
    expect(stats.structures).toBe(catalog.structures.length);
    expect(stats.incompleteRecords).toBe(catalog.structures.filter(row => row.completeness === 'partial').length);
    expect(stats.structuresScientificallyVerified).toBe(0);
    expect(stats.modelsAvailable).toBe(3);
    expect(catalogService.region('neck').contentAvailability).toBe('pending');
    expect(catalogService.layers().some(row => row.available)).toBe(true);
    expect(catalogService.layers().some(row => !row.available)).toBe(true);
    expect(catalogService.layers().filter(row => ['ligaments', 'fascias'].includes(row.id)).every(row => row.structureIds.length === 0)).toBe(true);
  });
  it('las modificaciones de consumidores no alteran el repositorio', () => {
    const catalog = catalogRepository.read();
    catalog.structures.length = 0;
    expect(catalogRepository.read().structures.length).toBeGreaterThan(0);
  });
  it('propaga los errores del repositorio', () => {
    const broken = createCatalogService({read() { throw new Error('Controlled repository failure'); }});
    expect(() => broken.stats()).toThrow('Controlled repository failure');
  });
});
