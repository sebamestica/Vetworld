import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { segmentationReviewSchema } from '../../src/modules/anatomy/schemas/asset-review';
import { partitionGlb } from '../../src/modules/anatomy/services/partition-glb';

const input = process.argv[2];
if (!input) throw new Error('Indicar JSON de anotaciones en workbench.');
const workspace = resolve('workbench');
const candidate = resolve(input);
const rel = relative(workspace, candidate);
if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Anotaciones fuera de workbench');
const review = segmentationReviewSchema.parse(JSON.parse((await readFile(candidate, 'utf8')).replace(/^\uFEFF/, '')));
if (review.assetId !== 'feline:tavernier-skeleton') throw new Error('Este piloto requiere el activo felino registrado');
const source = await readFile('workbench/processing/feline/cat-skeleton/source/Chat.glb');
if (createHash('sha256').update(source).digest('hex') !== review.sourceSha256) throw new Error('Anotaciones de otra versión del archivo');
const document = JSON.parse(source.subarray(20, 20 + source.readUInt32LE(12)).toString('utf8'));
const primitive = document.meshes[0].primitives[0];
if (document.accessors[primitive.indices].count / 3 !== review.triangleCount) throw new Error('Conteo de caras no coincide con la fuente');
if (!review.groups.length) throw new Error('No hay límites anatómicos anotados; no generar un despiece ficticio');
const preview = process.argv.includes('--preview');
if (!preview && review.status !== 'human-reviewed') throw new Error('Se requiere revisión humana; --preview genera solamente propuesta privada');
if (!preview && review.reviewer) {
  const record = resolve(review.reviewer.evidenceRecord);
  const recordRelative = relative(workspace, record);
  if (recordRelative.startsWith('..') || isAbsolute(recordRelative)) throw new Error('Registro humano debe conservarse privadamente en workbench');
  if (!(await readFile(record, 'utf8')).trim()) throw new Error('Registro humano vacío');
}
const bytes = partitionGlb(source, review.groups.map(group => ({nodeId: `proposal-${group.proposalId}`, faceIndices: group.faceIndices})));
const folder = resolve('workbench/segmentation/feline/exports');
await mkdir(folder, {recursive: true});
const sha256 = createHash('sha256').update(bytes).digest('hex');
const file = resolve(folder, `${preview ? 'proposal' : 'reviewed-partition'}-${sha256}.glb`);
await writeFile(file, bytes, {flag: 'wx'});
await writeFile(`${file}.json`, JSON.stringify({sourceSha256: review.sourceSha256, sha256, byteSize: bytes.length,
  status: preview ? 'private-proposal-not-anatomically-validated' : 'human-reviewed-requires-technical-admission',
  originalCoordinatesPreserved: true, newAnatomyGenerated: false, groups: review.groups,
  reviewer: review.reviewer, publicAvailable: false}, null, 2) + '\n', {flag: 'wx'});
console.log(`Partición privada creada: ${file}. No se actualizó API ni catálogo científico.`);
