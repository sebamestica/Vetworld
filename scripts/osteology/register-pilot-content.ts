import { readFile, writeFile } from 'node:fs/promises';
import { structureSchema, sourceSchema } from '../../src/modules/anatomy/schemas/catalog';

const read = async (path: string) => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const save = async (path: string, data: unknown) => writeFile(path, JSON.stringify(data, null, 2) + '\n');
const input = await read('data/osteology/research/feline-pilot-content.json');
const structures = await read('data/anatomy/structures.json');
const relations = await read('data/anatomy/relations.json');
for (const record of input.records) {
  const previous = structures.find((entry: {id: string}) => entry.id === record.id);
  const {reviewStatus, ...content} = record;
  if (reviewStatus !== 'pending') throw new Error('No admitir revisión humana inexistente');
  const structure = structureSchema.parse({...content, speciesId: 'feline', systemId: 'skeletal', kind: 'bone',
    fieldEvidence: content.fieldEvidence.map((entry: {locator: string}) => ({...entry, locator: entry.locator.replace(/; workbench\/.*$/, '')})),
    sourceIds: [...new Set([...content.sourceIds, ...relations.filter((entry: {fromId: string; toId: string}) => entry.fromId === record.id || entry.toId === record.id).flatMap((entry: {sourceIds: string[]}) => entry.sourceIds)])],
    modelIds: previous?.modelIds ?? [], photoRefs: [], completeness: 'partial',
    review: {status: 'pending', notes: 'Ficha bibliográfica; no hueso identificado en Tavernier. Fuente histórica auxiliar cotejada con NAV y literatura moderna. Sin lateralidad de espécimen asignada.'},
  });
  const index = structures.findIndex((entry: {id: string}) => entry.id === structure.id);
  if (index < 0) structures.push(structure); else structures[index] = structure;
}
const sources = await read('data/anatomy/sources.json');
for (const source of input.sources) {
  const index = sources.findIndex((entry: {id: string}) => entry.id === source.id);
  if (index < 0) sources.push(sourceSchema.parse(source));
}
// Bibliographic reciprocity follows actual assertions, not a blanket source assignment.
for (const source of sources) source.supportedStructureIds = structures.filter((entry: {sourceIds: string[]}) => entry.sourceIds.includes(source.id)).map((entry: {id: string}) => entry.id);
await save('data/anatomy/structures.json', structures);
await save('data/anatomy/sources.json', sources);
console.log('Cuatro fichas bibliográficas incorporadas; cero nuevas mallas admitidas.');
