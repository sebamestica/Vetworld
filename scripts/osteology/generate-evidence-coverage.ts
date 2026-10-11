import { readFile, writeFile } from 'node:fs/promises';
import { evidenceCoverageSchema } from '../../src/modules/anatomy/schemas/evidence-coverage';

const read = async (path: string) => JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const reference = await read('data/osteology/reference/feline.json');
const structures = await read('data/anatomy/structures.json');
const pilots = await read('workbench/segmentation/feline/pilot/surface-proposals.json');
const families = {scapula:'feline:scapula', humerus:'feline:humerus', femur:'feline:femur', tibia:'feline:tibia'} as const;
const rows = reference.structures.map((entry: {id: string; kind: string; side: string}) => {
  const key = entry.id.split(':').at(-1) as keyof typeof families;
  const bibliography = families[key] ?? null;
  const exists = bibliography && structures.some((row: {id: string; fieldEvidence?: unknown[]}) => row.id === bibliography && row.fieldEvidence?.length);
  return {referenceId: entry.id, kind: entry.kind, side: entry.side, bibliographicRecordId: exists ? bibliography : null,
    evidenceStatus: exists ? 'curated_partial' : 'not_curated', geometryStatus:'not_identified', reviewStatus:'pending'};
});
const output = evidenceCoverageSchema.parse({speciesId:'feline',assetId:pilots.assetId,sourceSha256:pilots.sourceSha256,
  expectedSpecimenBoneCount:null,anatomicallyAcceptedBones:0,referenceEntryCount:rows.length,rows,
  pilot:pilots.groups.map((group: {proposalId: string; proposedStructureId: string; faceIndices: number[]}) => ({proposalId:group.proposalId, proposedStructureId:group.proposedStructureId,sourceFaces:group.faceIndices.length,side:'unknown',status:'private_roi_requires_review',publicAvailable:false})),
});
await writeFile('data/osteology/feline-evidence-coverage.json',JSON.stringify(output,null,2)+'\n');
console.log(`${output.rows.length} entradas; ${output.rows.filter(row=>row.evidenceStatus==='curated_partial').length} con ficha de familia bibliográfica; 0 huesos admitidos; 3 propuestas privadas.`);
