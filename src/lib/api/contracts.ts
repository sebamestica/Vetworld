import { z } from 'zod';
import {
  idSchema, speciesSchema, regionSchema, structureSchema, relationSchema,
  modelSchema, sourceSchema, layerSchema, systemSchema, structureKindSchema, structureKinds,
} from '@/modules/anatomy/schemas/catalog';

export const paginationSchema = z.strictObject({
  page: z.number().int().min(1), limit: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
});
const metaSchema = z.strictObject({ apiVersion: z.literal('v1'), dataVersion: z.string().min(1) });
const availabilitySchema = z.enum(['complete', 'partial', 'pending']);
const modelAvailabilitySchema = z.enum(['available', 'pending', 'unavailable']);
export const speciesResponseItemSchema = speciesSchema.extend({
  regions: z.array(z.strictObject({ regionId: idSchema, contentAvailability: availabilitySchema, modelAvailability: modelAvailabilitySchema })),
  structureCount: z.number().int().nonnegative(),
});
export const regionResponseItemSchema = regionSchema.extend({
  speciesIds: z.array(idSchema), subdivisionIds: z.array(idSchema), structureIds: z.array(idSchema),
  contentAvailability: availabilitySchema, modelAvailability: modelAvailabilitySchema,
});
export const layerResponseItemSchema = layerSchema.extend({ structureIds: z.array(idSchema), modelIds: z.array(idSchema), available: z.boolean() });
export const healthDataSchema = z.strictObject({ status: z.literal('ok'), apiVersion: z.literal('v1'), catalogStatus: z.literal('readable'), dataVersion: z.string().min(1) });
export const statsDataSchema = z.strictObject({
  species: z.number().int().nonnegative(), regions: z.number().int().nonnegative(), structures: z.number().int().nonnegative(),
  modelsAvailable: z.number().int().nonnegative(), modelsPending: z.number().int().nonnegative(),
  structuresScientificallyVerified: z.number().int().nonnegative(), incompleteRecords: z.number().int().nonnegative(),
});
export const taxonomyDataSchema = z.strictObject({
  structureKinds: z.array(structureKindSchema), relationTypes: z.array(relationSchema.shape.type),
  reviewStatuses: z.array(z.enum(['pending', 'reviewed', 'validated'])), modelAvailability: z.array(modelAvailabilitySchema),
});
const one = <T extends z.ZodType>(data: T) => z.strictObject({ data, meta: metaSchema });
const list = <T extends z.ZodType>(item: T) => z.strictObject({ data: z.array(item), meta: metaSchema.extend({ pagination: paginationSchema }) });
export const responseSchemas = {
  health: one(healthDataSchema), species: list(speciesResponseItemSchema), regions: list(regionResponseItemSchema),
  region: one(regionResponseItemSchema), structures: list(structureSchema), structure: one(structureSchema),
  relations: list(relationSchema), search: list(z.strictObject({ structure: structureSchema, score: z.number().positive() })),
  systems: list(systemSchema), layers: list(layerResponseItemSchema), models: list(modelSchema), model: one(modelSchema),
  sources: list(sourceSchema), source: one(sourceSchema), taxonomy: one(taxonomyDataSchema), stats: one(statsDataSchema),
};
export type Endpoint = keyof typeof responseSchemas;
export const errorSchema = z.strictObject({ error: z.strictObject({
  code: z.enum(['VALIDATION_ERROR', 'NOT_FOUND', 'METHOD_NOT_ALLOWED', 'INTERNAL_ERROR']),
  message: z.string().min(1),
  details: z.array(z.strictObject({ field: z.string(), message: z.string() })).optional(),
}) });

// Strict lexical integers avoid coercion of empty strings, decimals or exponential notation.
const integerParam = (fallback: number, max: number) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().min(1).max(max)).optional().default(fallback);
const pageFields = { page: integerParam(1, 1_000_000), limit: integerParam(20, 100) };
const species = idSchema.optional(); const region = idSchema.optional();
const structureFilters = { species, region, kind: structureKindSchema.optional(), system: idSchema.optional() };
const empty = z.strictObject({});
const paged = z.strictObject(pageFields);
export const querySchemas = {
  health: empty, species: paged, regions: z.strictObject({ ...pageFields, species }), region: z.strictObject({ species }),
  structures: z.strictObject({ ...pageFields, ...structureFilters }), structure: empty,
  relations: z.strictObject({ ...pageFields, type: relationSchema.shape.type.optional() }),
  search: z.strictObject({ ...pageFields, ...structureFilters, q: z.string().trim().min(1).max(120).refine(v => /[\p{L}\p{N}]/u.test(v), 'Introducir un término alfanumérico') }),
  systems: paged, layers: z.strictObject({ ...pageFields, species, region }),
  models: z.strictObject({ ...pageFields, species, region }), model: empty, sources: paged, source: empty,
  taxonomy: empty, stats: empty,
};
export const apiStructureKinds = structureKinds;
