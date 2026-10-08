import species from '../../../../data/anatomy/species.json';
import regions from '../../../../data/anatomy/regions.json';
import systems from '../../../../data/anatomy/systems.json';
import layers from '../../../../data/anatomy/layers.json';
import structures from '../../../../data/anatomy/structures.json';
import relations from '../../../../data/anatomy/relations.json';
import sources from '../../../../data/anatomy/sources.json';
import models from '../../../../data/anatomy/models.json';
import metadata from '../../../../data/anatomy/metadata.json';
import { catalogSchema, type Catalog } from '../schemas/catalog';
import { validateCatalog } from '../validation/validate-catalog';

export interface CatalogRepository { read(): Catalog }

let snapshot: Catalog | undefined;
export const catalogRepository: CatalogRepository = {
  read() {
    if (!snapshot) {
      const parsed = catalogSchema.safeParse({ ...metadata, species, regions, systems, layers, structures, relations, sources, models });
      // File existence/checksum checks belong to validate:data/CI, before deployment.
      // Requests validate metadata/references without processing static 3D assets.
      if (!parsed.success || validateCatalog(parsed.data).errors.length) throw new Error('No se pudo leer el catálogo');
      snapshot = parsed.data;
    }
    return structuredClone(snapshot);
  },
};
