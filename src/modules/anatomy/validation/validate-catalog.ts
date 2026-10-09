import type { Catalog } from '../schemas/catalog';

export function validateCatalog(catalog: Catalog): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const check = (valid: boolean, message: string) => { if (!valid) errors.push(message); };
  const unique = (values: string[], label: string) => check(new Set(values).size === values.length, `${label}: referencias duplicadas`);
  const groups = ['species', 'regions', 'systems', 'layers', 'structures', 'relations', 'sources', 'models'] as const;
  for (const group of groups) {
    const seen = new Set<string>();
    for (const item of catalog[group]) {
      check(!seen.has(item.id), `${group}: ID duplicado ${item.id}`);
      seen.add(item.id);
    }
  }
  const species = new Map(catalog.species.map(x => [x.id, x]));
  const regions = new Map(catalog.regions.map(x => [x.id, x]));
  const systems = new Map(catalog.systems.map(x => [x.id, x]));
  const layers = new Map(catalog.layers.map(x => [x.id, x]));
  const structures = new Map(catalog.structures.map(x => [x.id, x]));
  const sources = new Map(catalog.sources.map(x => [x.id, x]));
  const models = new Map(catalog.models.map(x => [x.id, x]));

  const containsRegion = (ancestor: string, child: string) => {
    const seen = new Set<string>();
    let current: string | null = child;
    while (current && !seen.has(current)) {
      if (current === ancestor) return true;
      seen.add(current);
      current = regions.get(current)?.parentId ?? null;
    }
    return false;
  };
  for (const region of catalog.regions) {
    if (region.parentId) check(regions.has(region.parentId), `${region.id}: región padre inexistente`);
    const seen = new Set([region.id]);
    let current = region.parentId;
    while (current) {
      if (seen.has(current)) { errors.push(`${region.id}: ciclo de regiones`); break; }
      seen.add(current);
      current = regions.get(current)?.parentId ?? null;
    }
  }
  for (const structure of catalog.structures) {
    const label = structure.id;
    check(species.has(structure.speciesId), `${label}: especie inexistente`);
    check(regions.has(structure.regionId), `${label}: región inexistente`);
    check(systems.has(structure.systemId), `${label}: sistema inexistente`);
    for (const field of ['sourceIds', 'modelIds', 'aliases', 'missingFields'] as const) unique(structure[field], `${label}.${field}`);
    unique(structure.photoRefs.map(p => p.id), `${label}.photoRefs`);
    for (const field of structure.missingFields) {
      const value = (structure as unknown as Record<string, unknown>)[field];
      check(value === undefined || value === null || (Array.isArray(value) && value.length === 0), `${label}: campo pendiente ya presente ${field}`);
    }
    for (const id of structure.sourceIds) {
      check(sources.has(id), `${label}: fuente inexistente ${id}`);
      check(sources.get(id)?.supportedStructureIds.includes(label) ?? false, `${label}: fuente sin respaldo recíproco ${id}`);
    }
    for (const id of structure.modelIds) {
      const model = models.get(id);
      check(!!model, `${label}: modelo inexistente ${id}`);
      if (model) check(model.speciesId === structure.speciesId && model.structureIds.includes(label) && (model.scope === 'whole-body' || (model.regionId !== null && containsRegion(model.regionId, structure.regionId))), `${label}: modelo incompatible ${id}`);
    }
    for (const photo of structure.photoRefs) {
      check(sources.has(photo.sourceId), `${label}: fuente de fotografía inexistente`);
      check(new URL(photo.url).protocol === 'https:', `${label}: fotografía debe usar HTTPS`);
      if (!photo.license.verified || !photo.license.redistributionAllowed) warnings.push(`${label}: fotografía sin permiso de reutilización verificado; no habilitar publicación`);
    }
    if (structure.completeness === 'partial') warnings.push(`${label}: incompleto (${structure.missingFields.join(', ')})`);
    if (structure.review.status === 'pending') warnings.push(`${label}: revisión humana pendiente`);
  }
  for (const source of catalog.sources) {
    unique(source.supportedStructureIds, `${source.id}.supportedStructureIds`);
    if (!source.supportedStructureIds.length) warnings.push(`${source.id}: fuente sin estructuras asociadas`);
    for (const id of source.supportedStructureIds) check(structures.get(id)?.sourceIds.includes(source.id) ?? false, `${source.id}: estructura respaldada inexistente o no recíproca ${id}`);
    if (!source.license.verified) warnings.push(`${source.id}: licencia no verificada`);
  }
  for (const layer of catalog.layers) unique(layer.kinds, `${layer.id}.kinds`);
  for (const relation of catalog.relations) {
    const from = structures.get(relation.fromId);
    const to = structures.get(relation.toId);
    unique(relation.sourceIds, `${relation.id}.sourceIds`);
    check(!!from && !!to, `${relation.id}: referencia anatómica inexistente`);
    if (from && to) {
      check(from.speciesId === to.speciesId, `${relation.id}: especies incompatibles`);
      check(from.id !== to.id, `${relation.id}: autorrelación inválida`);
      if (['origin', 'insertion'].includes(relation.type)) check(from.kind === 'muscle' && to.kind === 'bone', `${relation.id}: relación muscular incompatible`);
      if (relation.type === 'innervated_by') check(from.kind === 'muscle' && to.kind === 'nerve', `${relation.id}: inervación incompatible`);
      if (relation.type === 'associated_tendon') check(from.kind === 'muscle' && to.kind === 'tendon', `${relation.id}: tendón incompatible`);
      if (relation.type === 'articulates_with') check(from.kind === 'bone' && to.kind === 'bone', `${relation.id}: articulación incompatible`);
    }
    for (const id of relation.sourceIds) check(sources.get(id)?.supportedStructureIds.includes(relation.fromId) === true && sources.get(id)?.supportedStructureIds.includes(relation.toId) === true, `${relation.id}: fuente no respalda ambos extremos ${id}`);
  }
  for (const model of catalog.models) {
    check(species.has(model.speciesId) && (model.regionId !== null ? regions.has(model.regionId) : model.scope === 'whole-body'), `${model.id}: especie o región inexistente`);
    for (const field of ['sourceIds', 'structureIds', 'layerIds'] as const) unique(model[field], `${model.id}.${field}`);
    for (const id of model.sourceIds) check(sources.has(id), `${model.id}: fuente inexistente ${id}`);
    for (const id of model.structureIds) {
      const structure = structures.get(id);
      check(!!structure, `${model.id}: estructura inexistente ${id}`);
      if (structure) {
        check(structure.speciesId === model.speciesId && (model.scope === 'whole-body' || (model.regionId !== null && containsRegion(model.regionId, structure.regionId))), `${model.id}: estructura incompatible ${id}`);
        check(structure.modelIds.includes(model.id), `${model.id}: asociación de modelo no recíproca ${id}`);
      }
    }
    for (const id of model.layerIds) check(layers.has(id), `${model.id}: capa inexistente ${id}`);
    const nodes = new Set<string>();
    for (const mapping of model.meshMappings) {
      check(!nodes.has(mapping.nodeId), `${model.id}: malla duplicada ${mapping.nodeId}`);
      nodes.add(mapping.nodeId);
      check(model.structureIds.includes(mapping.structureId), `${model.id}: malla sin estructura declarada`);
      check(model.layerIds.includes(mapping.layerId), `${model.id}: malla sin capa declarada`);
      const structure = structures.get(mapping.structureId);
      check(!!structure, `${model.id}: malla con estructura inexistente`);
      check(layers.has(mapping.layerId), `${model.id}: malla con capa inexistente`);
      if (structure) check(layers.get(mapping.layerId)?.kinds.includes(structure.kind) ?? false, `${model.id}: tipo incompatible con capa`);
    }
    if (model.availability === 'available') {
      check(!!model.resourceUrl && !!model.format && !!model.fileEvidence, `${model.id}: disponible sin evidencia de archivo`);
      check(model.license.verified && model.license.redistributionAllowed, `${model.id}: disponible sin licencia autorizada`);
      check(model.sourceIds.length > 0, `${model.id}: disponible sin procedencia científica`);
    } else warnings.push(`${model.id}: Modelo 3D no disponible; ${model.availability}`);
    if (model.resourceUrl?.startsWith('/')) {
      const segments = model.resourceUrl.split('/');
      check(!segments.includes('..') && !segments.includes('.') && !model.resourceUrl.includes('\\') && !/[?#%]/.test(model.resourceUrl) && !model.resourceUrl.startsWith('//'), `${model.id}: ruta fuera de public o sintaxis inválida`);
    } else if (model.resourceUrl) {
      try { check(new URL(model.resourceUrl).protocol === 'https:', `${model.id}: URL debe usar HTTPS`); }
      catch { errors.push(`${model.id}: URL inválida`); }
    }
  }
  return { errors, warnings };
}
