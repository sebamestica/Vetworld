import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { calculateCalibration, calibrationSchema } from '../../src/modules/anatomy/schemas/asset-review';

if (!process.argv[2]) throw new Error('Indicar archivo de medidas documentadas del mismo espécimen');
const input = calibrationSchema.parse(JSON.parse((await readFile(process.argv[2], 'utf8')).replace(/^\uFEFF/, '')));
if (input.assetId !== 'feline:tavernier-skeleton') throw new Error('Este piloto calibra únicamente el activo felino registrado');
const source = await readFile('workbench/processing/feline/cat-skeleton/source/Chat.glb');
if (createHash('sha256').update(source).digest('hex') !== input.sourceSha256) throw new Error('Medidas de otra versión del archivo');
console.log(JSON.stringify(calculateCalibration(input), null, 2));
