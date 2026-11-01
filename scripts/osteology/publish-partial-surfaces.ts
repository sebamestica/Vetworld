/**
 * Publica el derivado felino de superficies parciales (CC BY-NC-SA 4.0, ShareAlike).
 * Regenera la partición en memoria desde la propuesta privada, exige que coincida byte a byte
 * con el export privado ya inspeccionado, comprueba conservación geométrica frente al original
 * y copia a public/ sin sobrescribir un archivo distinto. No modifica el GLB original.
 * Uso: npx tsx scripts/osteology/publish-partial-surfaces.ts <proposals.json en workbench> <export.glb en workbench>
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { segmentationReviewSchema } from '../../src/modules/anatomy/schemas/asset-review';
import { comparePartitionedGlb, partitionGlb } from '../../src/modules/anatomy/services/partition-glb';

const [proposalsPath, exportPath] = process.argv.slice(2);
if (!proposalsPath || !exportPath) throw new Error('Indicar propuesta JSON y export privado (ambos en workbench).');
const workspace = resolve('workbench');
for (const path of [proposalsPath, exportPath]) { const rel = relative(workspace, resolve(path)); if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Entradas fuera de workbench'); }
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const ORIGINAL = 'public/models/feline/tavernier-skeleton.glb', TARGET = 'public/models/feline/tavernier-partial-surfaces.glb';
const original = await readFile(ORIGINAL);
const review = segmentationReviewSchema.parse(JSON.parse((await readFile(proposalsPath, 'utf8')).replace(/^﻿/, '')));
if (review.assetId !== 'feline:tavernier-skeleton' || sha(original) !== review.sourceSha256) throw new Error('Propuesta de otro activo o versión');
if (review.groups.some(group => group.side !== 'unknown')) throw new Error('Lado asignado sin ejes acreditados');
const regenerated = partitionGlb(original, review.groups.map(group => ({nodeId: `proposal-${group.proposalId}`, faceIndices: group.faceIndices})));
const exported = await readFile(exportPath);
if (!regenerated.equals(exported)) throw new Error('El export privado no coincide con la regeneración determinista');
const report = comparePartitionedGlb(original, regenerated);
if (report.issues.length || report.triangles !== review.triangleCount) throw new Error(`Conservación geométrica no acreditada: ${report.issues.join('; ')}`);
if (existsSync(TARGET)) {
  if (!(await readFile(TARGET)).equals(regenerated)) throw new Error(`${TARGET} existe con otro contenido; no se sobrescribe`);
} else await writeFile(TARGET, regenerated, {flag: 'wx'});
console.log(JSON.stringify({target: TARGET, sha256: sha(regenerated), byteSize: regenerated.length, sourceSha256: sha(original), triangles: report.triangles, nodes: report.nodes, issues: report.issues}, null, 2));
