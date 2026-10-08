import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalogSchema } from '../src/modules/anatomy/schemas/catalog';
import { validateCatalogAssets } from '../src/modules/anatomy/validation/validate-assets';
import { validateCatalog } from '../src/modules/anatomy/validation/validate-catalog';
try {
 const read=(name:string):unknown=>JSON.parse(readFileSync(resolve('data/anatomy',`${name}.json`),'utf8').replace(/^\uFEFF/,''));
 const metadata=read('metadata') as {dataVersion:string};
 const catalog=catalogSchema.parse({...metadata,...Object.fromEntries(['species','regions','systems','layers','structures','relations','sources','models'].map(key=>[key,read(key)]))});
 const metadataResult=validateCatalog(catalog);
 const assetsResult=validateCatalogAssets(catalog);
 const result={errors:[...metadataResult.errors,...assetsResult.errors],warnings:[...metadataResult.warnings,...assetsResult.warnings]};
 if (result.errors.length) {
   console.error("ERRORES DETECTADOS:", JSON.stringify(result.errors, null, 2));
 } else {
   console.log(JSON.stringify({ dataVersion: catalog.dataVersion, structures: catalog.structures.length, errors: [], warningsCount: result.warnings.length }, null, 2));
 }
 if(result.errors.length)process.exitCode=1;
} catch(error){console.error('Catálogo inválido:',error instanceof Error?error.message:'error desconocido');process.exitCode=1;}
