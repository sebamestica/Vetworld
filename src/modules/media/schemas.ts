import { z } from 'zod';
import { idSchema, licenseSchema, reviewSchema } from '@/modules/anatomy/schemas/catalog';
import { paginationSchema } from '@/lib/api/contracts';
import { isSafeExternalUrl, safeLocalImagePath } from './safety';

const text = z.string().trim().min(1);
const imagePath = z.string().refine(safeLocalImagePath).nullable();
export const visualReferenceSchema = z.strictObject({
  id: idSchema, title: text,
  kind: z.enum(['dissection_photo', 'ct', 'mri', 'illustration', 'dissection_video', 'academic_reference']),
  speciesId: idSchema, regionId: idSchema, structureIds: z.array(idSchema).min(1), sourceId: idSchema,
  authors: z.array(text).min(1), sourceUrl: z.string().refine(isSafeExternalUrl), license: licenseSchema,
  displayMode: z.enum(['external', 'internal']), imagePath, thumbnailPath: imagePath,
  review: reviewSchema, caption: text.optional(), verifiedAt: z.iso.date(),
}).superRefine((item, context) => {
  if (item.displayMode === 'internal' && (!item.license.verified || !item.license.redistributionAllowed || !item.imagePath || !item.thumbnailPath)) {
    context.addIssue({ code: 'custom', message: 'Los medios internos requieren derechos verificados y ambos archivos locales' });
  }
  if (item.displayMode === 'external' && (item.imagePath !== null || item.thumbnailPath !== null)) {
    context.addIssue({ code: 'custom', message: 'Las referencias externas no incorporan imágenes ni miniaturas' });
  }
});
export type VisualReference = z.infer<typeof visualReferenceSchema>;
const meta = z.strictObject({ apiVersion: z.literal('v1'), dataVersion: text });
export const referencesResponseSchema = z.strictObject({ data: z.array(visualReferenceSchema), meta: meta.extend({ pagination: paginationSchema }) });
export const referenceResponseSchema = z.strictObject({ data: visualReferenceSchema, meta });
