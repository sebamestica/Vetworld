/**
 * Prepara las copias publicables de imágenes de referencia con licencia verificada.
 *
 * Lee data/anatomy/media-provenance.json, comprueba el original conservado en
 * workbench/incoming/media/<id>/ contra el SHA-1 publicado por Wikimedia Commons,
 * genera una copia redimensionada y una miniatura JPEG en public/media/<especie>/
 * y registra en el manifiesto hashes, dimensiones y la transformación aplicada.
 * Nunca modifica el original. Uso: tsx scripts/media/prepare-reference-images.ts
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { mediaProvenanceSchema, type MediaProvenance } from '../../src/modules/media/provenance';

const manifestPath = resolve('data/anatomy/media-provenance.json');
const IMAGE_MAX = 1600;
const THUMB_MAX = 480;
const sha = (algorithm: 'sha1' | 'sha256', data: Buffer) => createHash(algorithm).update(data).digest('hex');

async function derive(input: Buffer, maxEdge: number, target: string) {
  const output = await sharp(input).rotate().resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const meta = await sharp(output).metadata();
  mkdirSync(dirname(resolve('public', target.slice(1))), { recursive: true });
  writeFileSync(resolve('public', target.slice(1)), output);
  return { path: target, sha256: sha('sha256', output), byteSize: output.length, width: meta.width ?? 0, height: meta.height ?? 0 };
}

// Los campos calculados (hashes, dimensiones, transformación) se rellenan aquí y el resultado se valida completo.
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as MediaProvenance[];
for (const entry of manifest) {
  const original = readFileSync(resolve(entry.original.path));
  if (sha('sha1', original) !== entry.original.commonsSha1) throw new Error(`${entry.referenceId}: el original no coincide con el SHA-1 de Commons`);
  const meta = await sharp(original).metadata();
  entry.original = { ...entry.original, sha256: sha('sha256', original), byteSize: original.length, width: meta.width ?? 0, height: meta.height ?? 0 };
  entry.published = await derive(original, IMAGE_MAX, entry.published.path);
  entry.thumbnail = await derive(original, THUMB_MAX, entry.thumbnail.path);
  entry.transformation = `Copia derivada con sharp ${sharp.versions.sharp}: orientación EXIF aplicada, reducción proporcional a ${IMAGE_MAX} px (miniatura ${THUMB_MAX} px) en el lado mayor, JPEG calidad 82 (mozjpeg) y metadatos EXIF/XMP eliminados. Sin recorte, retoque ni anotaciones.`;
  console.log(`${entry.referenceId}: ${entry.published.width}x${entry.published.height} ${entry.published.sha256}`);
}
mediaProvenanceSchema.array().parse(manifest);
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${manifest.length} imágenes preparadas; originales intactos.`);
