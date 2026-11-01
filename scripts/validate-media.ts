/**
 * Valida la galería: esquema e integridad de referencias, procedencia completa de toda
 * imagen local (licencia redistribuible, atribución, página oficial del archivo), existencia
 * y SHA-256 de las copias publicables, firma JPEG/PNG/WebP y, si están presentes (workbench/
 * está fuera de git), el SHA-256 y el SHA-1 de Commons de los originales conservados.
 * Uso: tsx scripts/validate-media.ts [--require-originals]
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { mediaRepository, provenanceRepository } from '../src/modules/media/repository';

const requireOriginals = process.argv.includes('--require-originals');
const references = mediaRepository.read();
const provenance = provenanceRepository.read();
const errors: string[] = [];
const hash = (algorithm: 'sha1' | 'sha256', data: Buffer) => createHash(algorithm).update(data).digest('hex');
const signature = (data: Buffer) => (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) || data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || (data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP');

let originalsChecked = 0;
for (const reference of references.filter(item => item.displayMode === 'internal')) {
  const entry = provenance.find(item => item.referenceId === reference.id);
  if (!entry) { errors.push(`${reference.id}: sin procedencia`); continue; }
  if (!reference.license.verified || !reference.license.redistributionAllowed) errors.push(`${reference.id}: licencia no redistribuible`);
  if (/\bN[CD]\b|NonCommercial|NoDerivatives/i.test(reference.license.label + entry.license.shortName)) errors.push(`${reference.id}: licencia NC/ND incompatible con redistribución`);
  if (reference.review.status !== 'pending') errors.push(`${reference.id}: revisión distinta de pending sin revisión humana registrada`);
  for (const file of [entry.published, entry.thumbnail]) {
    const path = resolve('public', file.path.slice(1));
    if (!existsSync(path) || !statSync(path).isFile()) { errors.push(`${reference.id}: archivo publicable ausente ${file.path}`); continue; }
    const data = readFileSync(path);
    if (!signature(data)) errors.push(`${reference.id}: firma de imagen no reconocida ${file.path}`);
    if (data.length !== file.byteSize) errors.push(`${reference.id}: tamaño distinto ${file.path}`);
    if (hash('sha256', data) !== file.sha256) errors.push(`${reference.id}: SHA-256 distinto ${file.path}`);
  }
  const original = resolve(entry.original.path);
  if (existsSync(original)) {
    const data = readFileSync(original);
    if (hash('sha256', data) !== entry.original.sha256 || hash('sha1', data) !== entry.original.commonsSha1 || data.length !== entry.original.byteSize) errors.push(`${reference.id}: el original conservado no coincide con su registro`);
    originalsChecked += 1;
  } else if (requireOriginals) errors.push(`${reference.id}: original ausente ${entry.original.path}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const internal = references.filter(item => item.displayMode === 'internal').length;
console.log(`${references.length} referencias válidas; ${internal} medios internos con procedencia, licencia redistribuible, atribución y SHA-256 comprobados; originales verificados ${originalsChecked}/${internal}${originalsChecked < internal ? ' (workbench/ no versionado)' : ''}. Revisión humana pendiente.`);
