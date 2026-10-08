import { existsSync, realpathSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import type { Catalog } from '../schemas/catalog';

/** Solo CLI/CI: nunca importar desde rutas HTTP ni repositorios runtime. */
export function validateCatalogAssets(catalog: Catalog, options: { publicRoot?: string } = {}): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const check = (valid: boolean, message: string) => { if (!valid) errors.push(message); };
  const root = resolve(options.publicRoot ?? 'public');
  for (const model of catalog.models) {
    if (!model.resourceUrl?.startsWith('/')) continue;
    const candidate = resolve(root, '.' + model.resourceUrl);
    const rel = relative(root, candidate);
    const safe = !rel.startsWith('..') && !isAbsolute(rel) && !model.resourceUrl.includes('\\') && !/[?#%]/.test(model.resourceUrl);
    check(safe, `${model.id}: ruta fuera de public o sintaxis inválida`);
    if (!safe) continue;
    check(existsSync(candidate), `${model.id}: archivo local inexistente`);
    if (!existsSync(candidate)) continue;
    const actual = relative(realpathSync(root), realpathSync(candidate));
    const actualSafe = !actual.startsWith('..') && !isAbsolute(actual);
    check(actualSafe, `${model.id}: enlace fuera de public`);
    if (!actualSafe) continue;
    const stat = statSync(candidate);
    check(stat.isFile(), `${model.id}: recurso local no es archivo`);
    if (model.availability === 'available' && model.fileEvidence && stat.isFile()) {
      check(stat.size === model.fileEvidence.byteSize, `${model.id}: tamaño de archivo no coincide`);
      check(createHash('sha256').update(readFileSync(candidate)).digest('hex') === model.fileEvidence.sha256, `${model.id}: SHA-256 no coincide`);
    }
  }
  return { errors, warnings: [] };
}
