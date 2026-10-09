import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-z0-9][a-z0-9:-]*$/);
const text = z.string().trim().min(1);
const ids = z.array(idSchema);
const texts = z.array(text);
export const structureKinds = ['bone','muscle','tendon','ligament','joint','nerve','artery','vein','fascia','cartilage','organ'] as const;
export const structureKindSchema = z.enum(structureKinds);
export type StructureKind = z.infer<typeof structureKindSchema>;
export const reviewSchema = z.strictObject({status:z.enum(['pending','reviewed','validated']),reviewer:text.optional(),reviewedAt:z.iso.datetime().optional(),notes:text.optional()}).superRefine((v,c)=>{if(v.status!=='pending'&&(!v.reviewer||!v.reviewedAt)) c.addIssue({code:'custom',message:'La revisión requiere responsable y fecha'});});
export const licenseSchema = z.strictObject({label:text,verified:z.boolean(),redistributionAllowed:z.boolean()});
export const speciesSchema = z.strictObject({id:idSchema,scientificName:text,spanishName:text,aliases:texts});
export const regionSchema = z.strictObject({id:idSchema,spanishName:text,parentId:idSchema.nullable()});
export const systemSchema = z.strictObject({id:idSchema,spanishName:text});
export const layerSchema = z.strictObject({id:idSchema,spanishName:text,kinds:z.array(structureKindSchema)});
export const photoRefSchema = z.strictObject({id:idSchema,url:z.url(),sourceId:idSchema,license:licenseSchema});
export const structureSchema = z.strictObject({
 id:idSchema,speciesId:idSchema,regionId:idSchema,systemId:idSchema,kind:structureKindSchema,canonicalLatinName:text,spanishName:text,aliases:texts,summary:text,
 detailedDescription:text.optional(),morphology:text.optional(),location:text.optional(),origin:texts.optional(),insertion:texts.optional(),action:texts.optional(),function:texts.optional(),innervation:texts.optional(),vascularSupply:texts.optional(),attachments:texts.optional(),landmarks:texts.optional(),speciesDifferences:texts.optional(),
 sourceIds:ids.min(1),modelIds:ids,photoRefs:z.array(photoRefSchema),review:reviewSchema,completeness:z.enum(['complete','partial']),missingFields:texts
}).superRefine((v,c)=>{if(v.kind!=='muscle'&&(v.origin!==undefined||v.insertion!==undefined||v.action!==undefined))c.addIssue({code:'custom',message:'Origen, inserción y acción muscular solo corresponden a músculos; utilizar attachments/function para otros tipos'});if(v.completeness==='partial'&&!v.missingFields.length)c.addIssue({code:'custom',message:'Identificar campos pendientes'});if(v.completeness==='complete'&&v.missingFields.length)c.addIssue({code:'custom',message:'Registro completo con campos pendientes'});});
export const relationSchema = z.strictObject({id:idSchema,fromId:idSchema,toId:idSchema,type:z.enum(['origin','insertion','innervated_by','associated_tendon','adjacent_to','articulates_with']),sourceIds:ids.min(1)});
export const sourceSchema = z.strictObject({id:idSchema,title:text,authors:texts.min(1),institution:text.optional(),year:z.number().int().min(1500).max(2100).optional(),url:z.url().optional(),doi:text.optional(),publicationType:text,license:licenseSchema,supportedStructureIds:ids}).refine(v=>!!v.url||!!v.doi,{message:'La fuente requiere URL o DOI'});
export const modelSchema = z.strictObject({id:idSchema,speciesId:idSchema,regionId:idSchema.nullable(),scope:z.enum(['regional','whole-body']).optional(),format:z.enum(['glb','gltf','obj','stl']).nullable(),resourceUrl:text.nullable(),landingPageUrl:z.url(),structureIds:ids,meshMappings:z.array(z.strictObject({nodeId:text,structureId:idSchema,layerId:idSchema})),layerIds:ids,lod:text.nullable(),evidenceType:text,license:licenseSchema,authors:texts.min(1),sourceIds:ids,review:reviewSchema,availability:z.enum(['pending','available','unavailable']),fileEvidence:z.strictObject({sha256:z.string().regex(/^[a-f0-9]{64}$/),verifiedAt:z.iso.datetime(),byteSize:z.number().int().positive()}).nullable(),notes:text});
export const catalogSchema = z.strictObject({dataVersion:text,species:z.array(speciesSchema),regions:z.array(regionSchema),systems:z.array(systemSchema),layers:z.array(layerSchema),structures:z.array(structureSchema),relations:z.array(relationSchema),sources:z.array(sourceSchema),models:z.array(modelSchema)});
export type Catalog = z.infer<typeof catalogSchema>;
export type Species = z.infer<typeof speciesSchema>;
export type Region = z.infer<typeof regionSchema>;
export type System = z.infer<typeof systemSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type Structure = z.infer<typeof structureSchema>;
export type Relation = z.infer<typeof relationSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Model = z.infer<typeof modelSchema>;
