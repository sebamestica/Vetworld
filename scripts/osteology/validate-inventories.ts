import { readFile, writeFile } from 'node:fs/promises';
import { referenceInventorySchema, referenceCoverage } from '../../src/modules/anatomy/schemas/osteology';

const reports = [];
for (const species of ['canine', 'feline']) {
  const inventory = referenceInventorySchema.parse(JSON.parse(await readFile(`data/osteology/reference/${species}.json`, 'utf8')));
  reports.push(referenceCoverage(inventory));
  console.log(`${species}: ${inventory.structures.length} registros válidos; 0 mallas admitidas; espécimen pendiente.`);
}
if (process.argv.includes('--report')) {
  await writeFile('data/osteology/coverage.json', `${JSON.stringify({ schemaVersion: 1, reports }, null, 2)}\n`);
}
