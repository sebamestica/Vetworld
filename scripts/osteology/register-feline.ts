import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const read = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const save = async (path: string, value: unknown) => writeFile(path, JSON.stringify(value, null, 2) + '\n');
const acquisition = await read('data/osteology/feline-acquisition.json');
const bytes = await readFile('public/models/feline/tavernier-skeleton.glb');
const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
const sha256 = createHash('sha256').update(bytes).digest('hex');
const license = { label: 'CC BY-NC-SA 4.0 — atribución, uso no comercial, compartir igual e indicar cambios', verified: true, redistributionAllowed: true };
const assets = await read('data/viewer/assets.json');
for (const asset of assets) if (asset.purpose === 'scientific') {
  asset.availability = 'pending'; asset.license = { label: 'Permiso de archivo no comprobado; cuarentena privada', verified: false, redistributionAllowed: false };
}
const id = 'feline:tavernier-skeleton';
const asset = { id, speciesId: 'feline', regionId: 'all', title: 'Esqueleto felino — candidato fotogramétrico', purpose: 'scientific', scope: 'whole-body',
  format: 'glb', resourceUrl: '/models/feline/tavernier-skeleton.glb', unit: 'source-unverified', scaleToMeters: 1, physicalScaleVerified: false,
  orientation: 'Orientación fuente conservada; ejes anatómicos pendientes', byteSize: bytes.length, triangleCount: 74235,
  estimatedGpuBytes: document.buffers.reduce((sum: number, buffer: {byteLength: number}) => sum + buffer.byteLength, 0), sha256,
  license, attribution: acquisition.attribution, sourceUrl: acquisition.sourceUrl, licenseUrl: acquisition.license.url,
  reviewStatus: 'pending', availability: 'available', meshMappings: [], visualNodes: [{nodeId: 'chat', layerId: 'skeleton'}],
  layers: [{ id: 'skeleton', label: 'Esqueleto' }], specimen: null };
await save('data/viewer/assets.json', [...assets.filter((entry: {id: string}) => entry.id !== id), asset]);
const models = await read('data/anatomy/models.json');
for (const model of models) if (model.availability === 'available') {
  model.availability = 'unavailable'; model.resourceUrl = null; model.fileEvidence = null;
  model.license = { label: 'Permiso de reutilización del archivo no comprobado', verified: false, redistributionAllowed: false };
  model.notes += ' Retirado del circuito publicable; original conservado en cuarentena privada.';
}
const model = { id, speciesId: 'feline', regionId: null, scope: 'whole-body', format: 'glb', resourceUrl: asset.resourceUrl,
  landingPageUrl: acquisition.sourceUrl, structureIds: [], meshMappings: [], layerIds: ['skeleton'], lod: 'original',
  evidenceType: 'photogrammetry-candidate-unsegmented', license, authors: [acquisition.author], sourceIds: ['tavernier-cat-skeleton'],
  review: {status: 'pending', notes: 'Escala física, cobertura e identificación ósea pendientes; una malla de conjunto.'}, availability: 'available',
  fileEvidence: {sha256, byteSize: bytes.length, verifiedAt: new Date().toISOString()},
  notes: 'Disponible para visualización no comercial bajo NC-SA; sin huesos identificados individualmente. No acredita esqueleto íntegro científicamente validado.' };
await save('data/anatomy/models.json', [...models.filter((entry: {id: string}) => entry.id !== id), model]);
const sources = await read('data/anatomy/sources.json');
for (const source of sources) if (['innervate-vr-canine-limb', 'feline-skeletal-3d', 'nih-3d-dog-skull', 'nav-6th-edition'].includes(source.id)) source.license = {label: 'Redistribución de archivos no comprobada; referencia bibliográfica conservada', verified: false, redistributionAllowed: false};
await save('data/anatomy/sources.json', [...sources.filter((entry: {id: string}) => entry.id !== 'tavernier-cat-skeleton'), {
  id: 'tavernier-cat-skeleton', title: 'Cat Skeleton', authors: [acquisition.author], url: acquisition.sourceUrl,
  publicationType: 'photogrammetry-model', license, supportedStructureIds: [],
}]);
await writeFile('public/models/feline/ATTRIBUTION.txt', `${acquisition.attribution}\n${acquisition.sourceUrl}\n${acquisition.license.url}\nArchivo GLB original sin cambios geométricos. Escala, cobertura e identificación anatómica pendientes.\n`);
console.log(`${id}: ${bytes.length} bytes; SHA256 ${sha256}; sin correspondencias anatómicas inventadas.`);
