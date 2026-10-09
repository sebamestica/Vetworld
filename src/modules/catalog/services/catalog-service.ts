import { ApiError } from '@/lib/errors/api-error';
import { catalogRepository, type CatalogRepository } from '@/modules/anatomy/repositories/catalog-repository';
import { structureKinds, type Catalog, type Structure, type StructureKind, type Relation } from '@/modules/anatomy/schemas/catalog';
import { scoreTerm } from '@/modules/search/normalize';

export interface CatalogQuery {
  species?: string; region?: string; kind?: StructureKind; system?: string; q?: string; type?: Relation['type'];
}
const sorted = <T extends { id: string }>(rows: T[]): T[] => [...rows].sort((a, b) => a.id.localeCompare(b.id));
type ContentAvailability = 'complete' | 'partial' | 'pending';
type ModelAvailability = 'available' | 'pending' | 'unavailable';

export function createCatalogService(repository: CatalogRepository) {
  const read = (query: CatalogQuery = {}) => {
    const catalog = repository.read();
    for (const [filter, collection] of [['species', 'species'], ['region', 'regions'], ['system', 'systems']] as const) {
      const id = query[filter];
      if (id && !catalog[collection].some(row => row.id === id)) throw new ApiError(400, 'VALIDATION_ERROR', `Filtro ${filter} desconocido`);
    }
    return catalog;
  };
  const find = <T extends {id: string}>(rows: T[], id: string): T => {
    const row = rows.find(item => item.id === id);
    if (!row) throw new ApiError(404, 'NOT_FOUND', 'Recurso inexistente');
    return row;
  };
  const regionIds = (catalog: Catalog, id: string): Set<string> => {
    const result = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const region of catalog.regions) if (region.parentId && result.has(region.parentId) && !result.has(region.id)) { result.add(region.id); changed = true; }
    }
    return result;
  };
  const filterStructures = (catalog: Catalog, query: CatalogQuery): Structure[] => {
    const regions = query.region ? regionIds(catalog, query.region) : undefined;
    return sorted(catalog.structures.filter(row => (!query.species || row.speciesId === query.species) && (!regions || regions.has(row.regionId)) && (!query.kind || row.kind === query.kind) && (!query.system || row.systemId === query.system)));
  };
  const filterModels = (catalog: Catalog, query: CatalogQuery) => {
    const regions = query.region ? regionIds(catalog, query.region) : undefined;
    return sorted(catalog.models.filter(row => (!query.species || row.speciesId === query.species) && (!regions || (row.regionId !== null && regions.has(row.regionId)))));
  };
  const availability = (catalog: Catalog, query: CatalogQuery): {contentAvailability: ContentAvailability; modelAvailability: ModelAvailability} => {
    const structures = filterStructures(catalog, query);
    const models = filterModels(catalog, query);
    return {
      // Individual complete cards do not establish exhaustive regional coverage.
      contentAvailability: !structures.length ? 'pending' : 'partial',
      modelAvailability: models.some(row => row.availability === 'available') ? 'available' : models.some(row => row.availability === 'pending') ? 'pending' : 'unavailable',
    };
  };
  const regionView = (catalog: Catalog, id: string, query: CatalogQuery) => ({
    ...find(catalog.regions, id),
    speciesIds: sorted(catalog.species.filter(row => !query.species || row.id === query.species)).map(row => row.id),
    subdivisionIds: sorted(catalog.regions.filter(row => row.parentId === id)).map(row => row.id),
    structureIds: filterStructures(catalog, {...query, region: id}).map(row => row.id),
    ...availability(catalog, {...query, region: id}),
  });
  return {
    species(query: CatalogQuery = {}) {
      const catalog = read(query);
      return sorted(catalog.species.filter(row => !query.species || row.id === query.species)).map(row => ({...row,
        regions: sorted(catalog.regions).map(region => ({regionId: region.id, ...availability(catalog, {species: row.id, region: region.id})})),
        structureCount: filterStructures(catalog, {species: row.id}).length,
      }));
    },
    regions(query: CatalogQuery = {}) { const catalog = read(query); return sorted(catalog.regions.filter(row => !query.region || regionIds(catalog, query.region).has(row.id))).map(row => regionView(catalog, row.id, query)); },
    region(id: string, query: CatalogQuery = {}) { const catalog = read(query); return regionView(catalog, id, query); },
    structures(query: CatalogQuery = {}) { return filterStructures(read(query), query); },
    structure(id: string) { return find(read().structures, id); },
    relations(id: string, query: CatalogQuery = {}) { const catalog = read(query); find(catalog.structures, id); return sorted(catalog.relations.filter(row => (row.fromId === id || row.toId === id) && (!query.type || row.type === query.type))); },
    search(query: CatalogQuery = {}) { return filterStructures(read(query), query).map(structure => ({structure, score: scoreTerm(query.q ?? '', [structure.canonicalLatinName, structure.spanishName, ...structure.aliases])})).filter(row => row.score > 0).sort((a,b) => b.score - a.score || a.structure.id.localeCompare(b.structure.id)); },
    systems() { return sorted(read().systems); },
    layers(query: CatalogQuery = {}) {
      const catalog = read(query);
      const structures = filterStructures(catalog, query);
      const models = filterModels(catalog, query);
      return sorted(catalog.layers).map(layer => {
        // Muscle depth cannot be inferred from kind; only documented mesh mappings associate it.
        const mappedIds = new Set(models.flatMap(model => model.meshMappings.filter(mapping => mapping.layerId === layer.id).map(mapping => mapping.structureId)));
        const requiresDepth = ['superficial-muscles', 'deep-muscles'].includes(layer.id);
        return {...layer, structureIds: structures.filter(row => layer.kinds.includes(row.kind) && (!requiresDepth || mappedIds.has(row.id))).map(row => row.id), modelIds: models.filter(row => row.layerIds.includes(layer.id)).map(row => row.id), available: models.some(row => row.availability === 'available' && row.layerIds.includes(layer.id))};
      });
    },
    models(query: CatalogQuery = {}) { return filterModels(read(query), query); },
    model(id: string) { return find(read().models, id); },
    sources() { return sorted(read().sources); },
    source(id: string) { return find(read().sources, id); },
    taxonomy() { return {structureKinds: [...structureKinds], relationTypes: ['origin', 'insertion', 'innervated_by', 'associated_tendon', 'adjacent_to', 'articulates_with'], reviewStatuses: ['pending','reviewed','validated'], modelAvailability: ['pending','available','unavailable']}; },
    stats() { const catalog = read(); return {species: catalog.species.length, regions: catalog.regions.length, structures: catalog.structures.length, modelsAvailable: catalog.models.filter(row => row.availability === 'available').length, modelsPending: catalog.models.filter(row => row.availability === 'pending').length, structuresScientificallyVerified: catalog.structures.filter(row => row.review.status === 'validated').length, incompleteRecords: catalog.structures.filter(row => row.completeness === 'partial').length}; },
  };
}
export const catalogService = createCatalogService(catalogRepository);
