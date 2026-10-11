import { z } from 'zod';

export const evidenceCoverageSchema = z.object({
  speciesId: z.literal('feline'), assetId: z.literal('feline:tavernier-skeleton'), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  expectedSpecimenBoneCount: z.null(), anatomicallyAcceptedBones: z.literal(0), referenceEntryCount: z.number().int().positive(),
  rows: z.array(z.object({referenceId: z.string(), kind: z.enum(['group','bone','tooth','anatomical_component','variable_series','conditional_bone']), side: z.enum(['left','right','midline','unknown']),
    bibliographicRecordId: z.string().nullable(), evidenceStatus: z.enum(['curated_partial','not_curated']),
    geometryStatus: z.literal('not_identified'), reviewStatus: z.literal('pending'),
  }).strict()),
  pilot: z.array(z.object({proposalId: z.string(), proposedStructureId: z.string(), sourceFaces: z.number().int().positive(),
    side: z.literal('unknown'), status: z.literal('private_roi_requires_review'), publicAvailable: z.literal(false),
  }).strict()),
}).strict().superRefine((data, context) => {
  if (data.rows.length !== data.referenceEntryCount || new Set(data.rows.map(row => row.referenceId)).size !== data.rows.length) context.addIssue({code:'custom',message:'Filas/IDs de referencia inconsistentes'});
  for (const row of data.rows) if (!row.referenceId.startsWith('feline:reference:') || (row.evidenceStatus === 'curated_partial') !== Boolean(row.bibliographicRecordId)) context.addIssue({code:'custom',message:'Especie o evidencia bibliográfica incompatible'});
});
