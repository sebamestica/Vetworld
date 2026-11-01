import rawReferences from '../../../data/anatomy/visual-references.json';
import rawProvenance from '../../../data/anatomy/media-provenance.json';
import { z } from 'zod';
import { catalogRepository } from '@/modules/anatomy/repositories/catalog-repository';
import type { Catalog } from '@/modules/anatomy/schemas/catalog';
import { visualReferenceSchema, type VisualReference } from './schemas';
import { mediaProvenanceSchema, type MediaProvenance } from './provenance';

/** La región de la referencia contiene a la de la estructura (igual o ascendiente). */
function regionContains(catalog: Catalog, ancestor: string, regionId: string): boolean {
  const seen = new Set<string>();
  let current: string | null = regionId;
  while (current && !seen.has(current)) {
    if (current === ancestor) return true;
    seen.add(current);
    current = catalog.regions.find(item => item.id === current)?.parentId ?? null;
  }
  return false;
}

/**
 * Coherencia entre una referencia interna y su registro de procedencia: misma especie,
 * estructuras, archivos, página del archivo, autor y licencia visible completa.
 */
function validateInternal(row: VisualReference, entry: MediaProvenance | undefined): string[] {
  if (!entry) return [`${row.id}: imagen local sin registro de procedencia`];
  const errors: string[] = [];
  if (row.sourceId !== entry.referenceId) errors.push(`${row.id}: sourceId debe ser el registro de procedencia ${entry.referenceId}`);
  if (row.speciesId !== entry.speciesId) errors.push(`${row.id}: especie distinta de la procedencia`);
  if ([...row.structureIds].sort().join() !== [...entry.depictedStructureIds].sort().join()) errors.push(`${row.id}: estructuras distintas de las comprobadas en la imagen`);
  if (row.imagePath !== entry.published.path || row.thumbnailPath !== entry.thumbnail.path) errors.push(`${row.id}: rutas distintas de la procedencia`);
  if (row.sourceUrl !== entry.filePageUrl) errors.push(`${row.id}: el enlace debe ser la página oficial del archivo`);
  if (!row.authors.includes(entry.author)) errors.push(`${row.id}: autor no atribuido`);
  if (!row.license.label.includes(entry.license.shortName)) errors.push(`${row.id}: licencia no visible`);
  if (entry.license.attributionRequired && !row.license.label.includes(entry.license.url)) errors.push(`${row.id}: falta el enlace de la licencia en la atribución visible`);
  if (row.verifiedAt !== entry.verifiedAt) errors.push(`${row.id}: fecha de verificación distinta`);
  return errors;
}

export function validateReferenceIntegrity(rows: VisualReference[], catalog: Catalog, provenance: MediaProvenance[] = []): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const entries = new Map(provenance.map(entry => [entry.referenceId, entry]));
  for (const row of rows) {
    if (ids.has(row.id)) errors.push(`${row.id}: ID duplicado`);
    ids.add(row.id);
    if (!catalog.species.some(item => item.id === row.speciesId)) errors.push(`${row.id}: especie inexistente`);
    if (!catalog.regions.some(item => item.id === row.regionId)) errors.push(`${row.id}: región inexistente`);
    const internal = row.displayMode === 'internal';
    const source = internal ? undefined : catalog.sources.find(item => item.id === row.sourceId);
    if (internal) errors.push(...validateInternal(row, entries.get(row.id)));
    else if (!source) errors.push(`${row.id}: fuente inexistente`);
    for (const id of row.structureIds) {
      const structure = catalog.structures.find(item => item.id === id);
      if (!structure || structure.speciesId !== row.speciesId || !regionContains(catalog, row.regionId, structure.regionId)) errors.push(`${row.id}: estructura incompatible ${id}`);
      if (!internal && !source?.supportedStructureIds.includes(id)) errors.push(`${row.id}: estructura sin respaldo ${id}`);
    }
  }
  for (const entry of provenance) {
    if (!rows.some(row => row.id === entry.referenceId && row.displayMode === 'internal')) errors.push(`${entry.referenceId}: procedencia sin referencia interna`);
  }
  return errors;
}

export const provenanceRepository = {
  read(): MediaProvenance[] { return structuredClone(z.array(mediaProvenanceSchema).parse(rawProvenance)); },
};

export const mediaRepository = {
  read(): VisualReference[] {
    const rows = z.array(visualReferenceSchema).parse(rawReferences);
    if (validateReferenceIntegrity(rows, catalogRepository.read(), provenanceRepository.read()).length) throw new Error('Referencias inválidas');
    return structuredClone(rows);
  },
};
