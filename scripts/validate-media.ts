import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { mediaRepository } from '../src/modules/media/repository';
const references = mediaRepository.read();
for (const reference of references) {
  if (reference.displayMode === 'internal') {
    for (const path of [reference.imagePath, reference.thumbnailPath]) {
      if (!path || !(await stat(resolve('public', path.slice(1)))).isFile()) throw new Error(`Archivo interno ausente: ${reference.id}`);
    }
  }
}
console.log(`${references.length} referencias válidas; ${references.filter(item => item.displayMode === 'internal').length} medios internos. Revisión humana pendiente.`);
