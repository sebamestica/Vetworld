import { z } from 'zod';

const text = z.string().trim().min(1);
const point = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const evidence = z.object({ citation: text, locator: text }).strict();
export const segmentationReviewSchema = z.object({
  assetId: text, sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  triangleCount: z.number().int().positive(),
  status: z.enum(['draft', 'human-reviewed']),
  reviewer: z.object({ name: text, qualification: text, reviewedAt: z.iso.datetime(), evidenceRecord: text }).strict().nullable(),
  groups: z.array(z.object({
    proposalId: text, proposedStructureId: text, canonicalLatinName: text,
    regionId: text, side: z.enum(['left', 'right', 'midline', 'unknown']),
    faceIndices: z.array(z.number().int().nonnegative()).min(1),
    evidence: z.array(evidence).min(1), notes: text,
  }).strict()),
}).strict().superRefine((review, context) => {
  const proposals = new Set<string>(), used = new Set<number>();
  for (const group of review.groups) {
    if (proposals.has(group.proposalId)) context.addIssue({code: 'custom', message: 'Propuesta duplicada'});
    proposals.add(group.proposalId);
    if (!group.proposedStructureId.startsWith(`${review.assetId.split(':')[0]}:`)) context.addIssue({code: 'custom', message: 'Especie incompatible'});
    for (const face of group.faceIndices) {
      if (face >= review.triangleCount || used.has(face)) context.addIssue({code: 'custom', message: 'Cara fuera de rango, duplicada o solapada'});
      used.add(face);
    }
  }
  if (review.status === 'human-reviewed' && (!review.reviewer || !review.groups.length)) context.addIssue({code: 'custom', message: 'Revisión requiere responsable, registro y grupos'});
});

export const calibrationSchema = z.object({
  assetId: text, sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  specimenReference: text,
  measurements: z.array(z.object({
    landmarkA: text, landmarkB: text, pointA: point, pointB: point,
    realLengthMeters: z.number().positive().finite(), uncertaintyMeters: z.number().nonnegative().finite(),
    evidence, sameSpecimen: z.literal(true),
  }).strict()).min(2),
}).strict();

export function calculateCalibration(input: unknown) {
  const data = calibrationSchema.parse(input);
  const factors = data.measurements.map(measurement => {
    const distance = Math.hypot(...measurement.pointA.map((coordinate, index) => coordinate - measurement.pointB[index]));
    if (distance === 0) throw new Error('Puntos de calibración coincidentes');
    const factor = measurement.realLengthMeters / distance, uncertainty = measurement.uncertaintyMeters / distance;
    if (!Number.isFinite(distance) || !Number.isFinite(factor) || factor <= 0 || !Number.isFinite(uncertainty)) throw new Error('Conversión métrica no finita o inválida');
    return {factor, uncertainty};
  });
  const base = factors[0];
  for (const check of factors.slice(1)) {
    const numericalTolerance = Math.max(base.factor, check.factor) * 1e-9;
    if (Math.abs(check.factor - base.factor) > base.uncertainty + check.uncertainty + numericalTolerance) throw new Error('Medidas independientes incompatibles dentro de la incertidumbre declarada');
  }
  return {factorToMeters: base.factor, uncertainty: base.uncertainty, checks: factors.length,
    status: 'numerically_consistent_requires_source_and_landmark_review' as const};
}
