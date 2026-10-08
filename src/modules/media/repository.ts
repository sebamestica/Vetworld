import rawReferences from '../../../data/anatomy/visual-references.json';
import { z } from 'zod';
import { catalogRepository } from '@/modules/anatomy/repositories/catalog-repository';
import type { Catalog } from '@/modules/anatomy/schemas/catalog';
import { visualReferenceSchema, type VisualReference } from './schemas';

export function validateReferenceIntegrity(rows: VisualReference[], catalog: Catalog): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const row of rows) {
    if (ids.has(row.id)) errors.push(`${row.id}: ID duplicado`);
    ids.add(row.id);
    if (!catalog.species.some(item => item.id === row.speciesId)) errors.push(`${row.id}: especie inexistente`);
    if (!catalog.regions.some(item => item.id === row.regionId)) errors.push(`${row.id}: región inexistente`);
    const source = catalog.sources.find(item => item.id === row.sourceId);
    if (!source) errors.push(`${row.id}: fuente inexistente`);
    for (const id of row.structureIds) {
      const structure = catalog.structures.find(item => item.id === id);
      if (!structure || structure.speciesId !== row.speciesId || structure.regionId !== row.regionId) errors.push(`${row.id}: estructura incompatible ${id}`);
      if (!source?.supportedStructureIds.includes(id)) errors.push(`${row.id}: estructura sin respaldo ${id}`);
    }
  }
  return errors;
}
export const mediaRepository = {
  read(): VisualReference[] {
    const rows = z.array(visualReferenceSchema).parse(rawReferences);
    if (validateReferenceIntegrity(rows, catalogRepository.read()).length) throw new Error('Referencias inválidas');
    return structuredClone(rows);
  },
};
