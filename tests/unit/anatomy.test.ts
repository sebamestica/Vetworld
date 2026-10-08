import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe,it,expect } from 'vitest';
import { catalogSchema,structureSchema } from '../../src/modules/anatomy/schemas/catalog';
import { validateCatalogAssets } from '../../src/modules/anatomy/validation/validate-assets';
import { validateCatalog } from '../../src/modules/anatomy/validation/validate-catalog';
const read=(name:string):unknown=>JSON.parse(readFileSync(resolve('data/anatomy',`${name}.json`),'utf8'));
const load=()=>catalogSchema.parse({...read('metadata') as object,...Object.fromEntries(['species','regions','systems','layers','structures','relations','sources','models'].map(key=>[key,read(key)]))});
describe('Catálogo científico e integridad',()=>{
 it('semilla íntegra, pequeña y revisión pendiente',()=>{const c=load();expect(validateCatalog(c).errors).toEqual([]);expect(c.structures.length).toBeGreaterThanOrEqual(8);expect(c.structures.every(s=>s.review.status==='pending')).toBe(true);expect(c.models.some(m=>m.availability==='available')).toBe(true);expect(c.models.some(m=>m.availability==='pending')).toBe(true);});
 it('detecta duplicados',()=>{const c=load();c.structures.push(c.structures[0]!);expect(validateCatalog(c).errors.join()).toContain('duplicado');});
 it('detecta referencias inexistentes',()=>{const c=load();c.structures[0]!.sourceIds=['absent'];expect(validateCatalog(c).errors.join()).toContain('fuente inexistente');});
 it('impide relaciones entre especies',()=>{const c=load();c.relations[0]!.toId='feline:scapula';expect(validateCatalog(c).errors.join()).toContain('especies incompatibles');});
 it('detecta semántica incorrecta de inervación',()=>{const c=load();c.relations[1]!.toId='canine:scapula';expect(validateCatalog(c).errors.join()).toContain('inervación incompatible');});
 it('no acepta origen muscular para ligamentos',()=>{const c=load();const muscle=c.structures.find(s=>s.kind==='muscle')!;expect(structureSchema.safeParse({...muscle,kind:'ligament'}).success).toBe(false);});
 it('rechaza falsa disponibilidad de activos',()=>{const c=load();c.models[0]!.availability='available';expect(validateCatalog(c).errors.join()).toContain('sin evidencia');expect(validateCatalog(c).errors.join()).toContain('sin licencia');});
 it('detecta archivo local inexistente y traversal',()=>{const c=load();c.models[0]!.resourceUrl='/missing.glb';expect(validateCatalogAssets(c).errors.join()).toContain('archivo local inexistente');c.models[0]!.resourceUrl='/../../private.glb';expect(validateCatalog(c).errors.join()).toContain('fuera de public');});
 it('detecta mallas duplicadas y asociaciones inválidas',()=>{const c=load();c.models[0]!.meshMappings=[{nodeId:'mesh',structureId:'canine:scapula',layerId:'skeleton'},{nodeId:'mesh',structureId:'canine:scapula',layerId:'skeleton'}];expect(validateCatalog(c).errors.join()).toContain('malla duplicada');});
 it('exige responsable en revisión validada',()=>{const c=load();expect(structureSchema.safeParse({...c.structures[0],review:{status:'validated'}}).success).toBe(false);});
 it('registra incompletitud sin rechazar campos opcionales ausentes',()=>{const c=load();expect(validateCatalog(c).warnings.join()).toContain('incompleto');expect(c.structures[0]!.detailedDescription).toBeUndefined();});
});

// Activos sintéticos exclusivos de pruebas, fuera del catálogo de producción.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { modelSchema } from '../../src/modules/anatomy/schemas/catalog';

describe('Evidencia de activos y referencias anidadas', () => {
 it('verifica archivo local sintético y rechaza hash/tamaño incorrectos', () => {
  const fixtureBase=resolve('tests/fixtures');
  mkdirSync(fixtureBase,{recursive:true});
  const root=mkdtempSync(join(fixtureBase,'.asset-fixture-'));
  try {
   const bytes=Buffer.from('synthetic-test-only');
   writeFileSync(join(root,'synthetic.glb'),bytes);
   const c=load();const m=c.models[0]!;for(const x of c.models)if(x.id!==m.id){x.availability='pending';x.resourceUrl=null;x.fileEvidence=null;}
   Object.assign(m,{availability:'available',resourceUrl:'/synthetic.glb',format:'glb',sourceIds:[c.sources[0]!.id],license:{label:'Fixture sintética propia',verified:true,redistributionAllowed:true},fileEvidence:{sha256:createHash('sha256').update(bytes).digest('hex'),byteSize:bytes.length,verifiedAt:'2026-10-08T00:00:00Z'}});
   expect(validateCatalogAssets(c,{publicRoot:root}).errors).toEqual([]);
   m.fileEvidence!.sha256='0'.repeat(64);m.fileEvidence!.byteSize=999;
   const result=validateCatalogAssets(c,{publicRoot:root});
   expect(result.errors.join()).toContain('SHA-256');expect(result.errors.join()).toContain('tamaño');
   expect(validateCatalog(c).errors).toEqual([]);
  } finally {
   const target=relative(fixtureBase,resolve(root));
   if(!target||target.startsWith('..')||isAbsolute(target))throw new Error('Fixture fuera del directorio de pruebas');
   rmSync(root,{recursive:true,force:true});
  }
 });
 it('sin IO conserva contención de rutas',()=>{const c=load();c.models[0]!.resourceUrl='/../../secret.glb';expect(validateCatalog(c).errors.join()).toContain('fuera de public');});
 it('exige reciprocidad y región compatible del modelo',()=>{const c=load();const m=c.models[0]!;m.structureIds=['canine:scapula'];expect(validateCatalog(c).errors.join()).toContain('no recíproca');expect(validateCatalog(c).errors.join()).toContain('estructura incompatible');m.regionId='thoracic-limb';c.structures.find(s=>s.id==='canine:scapula')!.modelIds.push(m.id);expect(validateCatalog(c).errors).toEqual([]);});
 it('detecta fuentes anidadas duplicadas y campos pendientes ya presentes',()=>{const c=load();c.structures[0]!.sourceIds.push(c.structures[0]!.sourceIds[0]!);c.structures[0]!.missingFields.push('summary');expect(validateCatalog(c).errors.join()).toContain('referencias duplicadas');expect(validateCatalog(c).errors.join()).toContain('campo pendiente ya presente');});
 it('rechaza licencia de modelo sin documentación',()=>{const c=load();expect(modelSchema.safeParse({...c.models[0],license:{verified:false,redistributionAllowed:false}}).success).toBe(false);});
 it('fotografías sin permiso generan advertencias y HTTP es inválido',()=>{const c=load();c.structures[0]!.photoRefs=[{id:'test-photo',url:'http://example.org/test.jpg',sourceId:c.sources[0]!.id,license:{label:'No comprobada',verified:false,redistributionAllowed:false}}];expect(validateCatalog(c).errors.join()).toContain('HTTPS');expect(validateCatalog(c).warnings.join()).toContain('fotografía sin permiso');});
});
