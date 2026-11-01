import { z } from 'zod';
import { idSchema } from '@/modules/anatomy/schemas/catalog';
import { safeLocalImagePath } from './safety';

/**
 * Procedencia de cada imagen local de la galería (data/anatomy/media-provenance.json).
 * No forma parte del contrato público de la API: lo verifican scripts/validate-media.ts
 * y las pruebas. Solo se admiten licencias que permiten redistribución y modificación,
 * incluido el uso comercial (sin variantes NC ni ND).
 */
const text = z.string().trim().min(1);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
export const redistributableLicenses = {
  'CC0 1.0': { url: 'https://creativecommons.org/publicdomain/zero/1.0/', attributionRequired: false, shareAlike: false },
  'CC BY 4.0': { url: 'https://creativecommons.org/licenses/by/4.0/', attributionRequired: true, shareAlike: false },
  'CC BY-SA 3.0': { url: 'https://creativecommons.org/licenses/by-sa/3.0/', attributionRequired: true, shareAlike: true },
  'CC BY-SA 4.0': { url: 'https://creativecommons.org/licenses/by-sa/4.0/', attributionRequired: true, shareAlike: true },
} as const;
export type RedistributableLicense = keyof typeof redistributableLicenses;
const licenseNames = Object.keys(redistributableLicenses) as [RedistributableLicense, ...RedistributableLicense[]];

const derivedFile = z.strictObject({ path: z.string().refine(safeLocalImagePath, 'Ruta local insegura'), sha256, byteSize: z.number().int().positive(), width: z.number().int().positive(), height: z.number().int().positive() });
const commonsFilePage = z.string().regex(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:[^\s?#]+$/);

export const mediaProvenanceSchema = z.strictObject({
  referenceId: idSchema,
  speciesId: z.enum(['canine', 'feline']),
  repository: z.literal('Wikimedia Commons'),
  commonsTitle: z.string().regex(/^File:.+\.(?:jpe?g|png)$/i),
  filePageUrl: commonsFilePage,
  apiUrl: z.string().startsWith('https://commons.wikimedia.org/w/api.php?'),
  originalUrl: z.string().regex(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/[^\s?#]+$/),
  author: text,
  attribution: text,
  license: z.strictObject({
    shortName: z.enum(licenseNames), url: z.url(), attributionRequired: z.boolean(), shareAlike: z.boolean(),
    redistributionAllowed: z.literal(true), modificationAllowed: z.literal(true), commercialUseAllowed: z.literal(true),
    evidence: text,
  }),
  permission: text.optional(),
  speciesEvidence: text,
  depictedStructureIds: z.array(idSchema).min(1),
  verifiedAt: z.iso.date(),
  original: z.strictObject({ path: z.string().regex(/^workbench\/incoming\/media\/[a-z0-9-]+\/original-[A-Za-z0-9_.()-]+$/), commonsSha1: z.string().regex(/^[a-f0-9]{40}$/), sha256, byteSize: z.number().int().positive(), width: z.number().int().positive(), height: z.number().int().positive() }),
  published: derivedFile,
  thumbnail: derivedFile,
  transformation: text,
}).superRefine((entry, context) => {
  const expected = redistributableLicenses[entry.license.shortName];
  if (entry.license.url !== expected.url) context.addIssue({ code: 'custom', message: `URL de licencia distinta de ${expected.url}` });
  if (entry.license.attributionRequired !== expected.attributionRequired || entry.license.shareAlike !== expected.shareAlike) context.addIssue({ code: 'custom', message: 'Condiciones de licencia incoherentes' });
  if (!entry.original.path.startsWith(`workbench/incoming/media/${entry.referenceId}/`)) context.addIssue({ code: 'custom', message: 'El original debe conservarse en workbench/incoming/media/<id>/' });
  for (const file of [entry.published, entry.thumbnail]) if (!file.path.startsWith(`/media/${entry.speciesId}/`)) context.addIssue({ code: 'custom', message: 'La copia publicable debe estar en /media/<especie>/' });
  if (entry.thumbnail.width > entry.published.width) context.addIssue({ code: 'custom', message: 'La miniatura supera a la copia publicable' });
});
export type MediaProvenance = z.infer<typeof mediaProvenanceSchema>;
