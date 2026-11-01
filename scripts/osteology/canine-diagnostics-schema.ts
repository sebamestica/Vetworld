import { z } from 'zod';

/**
 * Esquema del diagnóstico canino privado (3DExport 285869, sin licencia web).
 * El diagnóstico describe geometría; las identificaciones son propuestas con reviewStatus=pending.
 */
const id = z.string().min(1);
const vec3 = z.tuple([z.number(), z.number(), z.number()]);
const count = z.number().int().nonnegative();
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
export const caninePieceIds = ['skull', 'vertebral-column', 'thoracic-limb', 'pelvic-limb'] as const;
const pieceId = z.enum(caninePieceIds);

export const canineAdmissionStates = [
  'partial_surface_identified',
  'geometric_bone_sufficient_proposal',
  'unidentified_or_non_anatomical',
] as const;

const componentSchema = z.object({
  rank: count, faceCount: z.number().int().positive(), boundsMin: vec3, boundsMax: vec3, extent: vec3,
  surfaceArea: z.number().nonnegative(), signedVolume: z.number(), closed: z.boolean(),
  boundaryEdges: count, nonManifoldEdges: count, inconsistentlyOrientedManifoldEdges: count,
  touchesPlanarSection: z.boolean(),
}).strict();

const pieceSchema = z.object({
  pieceId,
  sourceFile: id.refine(value => value.startsWith('workbench/incoming/canine/originals/'), 'Fuente fuera de originales privados'),
  sourceSha256: sha256, bytes: z.number().int().positive(), format: z.literal('binary_stl'),
  headerAllZeroBytes: z.boolean(), nonZeroAttributeWords: count,
  triangles: z.number().int().positive(), uniqueVertexPositions: z.number().int().positive(),
  boundsMin: vec3, boundsMax: vec3, extent: vec3,
  // Sin evidencia de unidades (STL sin metadatos): solo se admite «unknown».
  units: z.literal('unknown'), unitsEvidence: id,
  defects: z.object({
    degenerateRepeatedVertex: count, degenerateZeroAreaDistinctVertices: count, duplicateTrianglePairs: count,
    storedNormalZero: count, storedNormalAgreesWithWinding: count, storedNormalOpposesWinding: count,
    edges: count, boundaryEdges: count, manifoldEdges: count, nonManifoldEdges: count, inconsistentlyOrientedManifoldEdges: count,
  }).strict(),
  connectivity: z.array(z.object({
    toleranceNative: z.number().nonnegative(), componentCount: z.number().int().positive(),
    largestFaceCounts: z.array(z.number().int().positive()).min(1),
  }).strict()).length(3),
  totalSurfaceArea: z.number().positive(),
  planarSectionsOnBoundingPlanes: z.object({
    distanceTolerance: z.number().positive(), normalAlignment: z.number().positive().max(1),
    sections: z.array(z.object({
      axis: z.enum(['x', 'y', 'z']), side: z.enum(['min', 'max']), planeValue: z.number(),
      faceCount: z.number().int().positive(), area: z.number().nonnegative(), componentRanks: z.array(count).min(1),
    }).strict()),
  }).strict(),
  componentProximity: z.object({
    maxDistanceNative: z.number().positive(), pairsWithin: count, coincidentPairs: count,
    minimumDistance: z.number().nonnegative().nullable(),
  }).strict(),
  componentsTolerance0: z.array(componentSchema).min(1),
}).strict().superRefine((piece, context) => {
  const fail = (message: string, path: (string | number)[] = []) => context.addIssue({ code: 'custom', path, message });
  const tolerances = piece.connectivity.map(entry => entry.toleranceNative);
  if (tolerances.join() !== [0, 1e-6, 1e-5].join()) fail('Tolerancias distintas de 0, 1e-6, 1e-5', ['connectivity']);
  if (piece.connectivity[0].componentCount !== piece.componentsTolerance0.length) fail('Conteo de componentes incoherente', ['connectivity']);
  const faces = piece.componentsTolerance0.reduce((sum, component) => sum + component.faceCount, 0);
  if (faces !== piece.triangles) fail(`Suma de caras ${faces} distinta de ${piece.triangles}`, ['componentsTolerance0']);
  piece.componentsTolerance0.forEach((component, index) => {
    if (component.rank !== index) fail('Rangos no contiguos', ['componentsTolerance0', index]);
  });
  if (piece.bytes !== 84 + 50 * piece.triangles) fail('Tamaño incompatible con STL binario', ['bytes']);
});

const proposalSchema = z.object({
  pieceId, componentRanks: z.array(count).min(1), proposedLabel: id, canonicalLatinName: id.nullable(),
  candidateReferenceIds: z.array(id.refine(value => value.startsWith('canine:reference:'), 'Referencia no canina')),
  admissionState: z.enum(canineAdmissionStates),
  // Sin ejes anatómicos acreditados no se declara lado ni serial.
  side: z.literal('unknown'), serial: z.null(),
  evidence: z.array(z.object({
    kind: z.literal('render'),
    path: id.refine(value => value.startsWith('workbench/inspection/canine-oct31/') && value.endsWith('.png'), 'Evidencia fuera del directorio privado'),
  }).strict()).min(1),
  notes: id, reviewStatus: z.literal('pending'),
}).strict().superRefine((proposal, context) => {
  if (proposal.admissionState !== 'unidentified_or_non_anatomical' && (proposal.candidateReferenceIds.length === 0 || !proposal.canonicalLatinName)) {
    context.addIssue({ code: 'custom', message: 'Identificación sin referencia ni nombre latino' });
  }
  if (proposal.admissionState === 'unidentified_or_non_anatomical' && (proposal.candidateReferenceIds.length > 0 || proposal.canonicalLatinName)) {
    context.addIssue({ code: 'custom', message: 'Un componente no identificado no puede llevar identidad' });
  }
});

export const canineDiagnosticsSchema = z.object({
  assetId: z.literal('canine:3dexport-285869'),
  speciesId: z.literal('canine'),
  sourceProduct: z.object({
    url: z.url().refine(value => value.startsWith('https://3dexport.com/')), author: id,
    declaredScan: z.literal(false), declaredModifiedForPrinting: z.boolean(), declaredMirroring: z.boolean(),
  }).strict(),
  privacy: z.object({
    webAvailable: z.literal(false), licenseStatus: z.literal('no_web_license'), publicDerivatives: z.literal(0), note: id,
  }).strict(),
  generatedBy: z.array(id).min(1),
  method: id,
  geometryModified: z.literal(false),
  reviewStatus: z.literal('pending'),
  totals: z.object({ triangles: z.number().int().positive(), componentsTolerance0: z.number().int().positive() }).strict(),
  pieces: z.array(pieceSchema).length(4),
  interPiece: z.array(z.object({
    pieceA: pieceId, pieceB: pieceId, boundingBoxGap: z.number().nonnegative(),
    nearestVertexDistanceWithin1Unit: z.number().nonnegative().nullable(), coincidentVertices: count.nullable(),
  }).strict()).length(6),
  registration: z.discriminatedUnion('status', [
    z.object({ status: z.literal('not_registered'), transformsApplied: z.array(z.never()).length(0), reasons: z.array(id).min(1) }).strict(),
  ]),
  identificationProposals: z.array(proposalSchema),
}).strict().superRefine((report, context) => {
  const fail = (message: string, path: (string | number)[]) => context.addIssue({ code: 'custom', path, message });
  const ids = report.pieces.map(piece => piece.pieceId);
  if (new Set(ids).size !== ids.length) fail('Piezas duplicadas', ['pieces']);
  const triangles = report.pieces.reduce((sum, piece) => sum + piece.triangles, 0);
  if (triangles !== report.totals.triangles) fail('Total de triángulos incoherente', ['totals']);
  const components = report.pieces.reduce((sum, piece) => sum + piece.componentsTolerance0.length, 0);
  if (components !== report.totals.componentsTolerance0) fail('Total de componentes incoherente', ['totals']);
  const claimed = new Map<string, number>();
  report.identificationProposals.forEach((proposal, index) => {
    const piece = report.pieces.find(entry => entry.pieceId === proposal.pieceId)!;
    proposal.componentRanks.forEach(rank => {
      if (rank >= piece.componentsTolerance0.length) fail(`Componente inexistente c${rank}`, ['identificationProposals', index]);
      const key = `${proposal.pieceId}:${rank}`;
      if (claimed.has(key)) fail(`Componente ${key} en dos propuestas`, ['identificationProposals', index]);
      claimed.set(key, index);
    });
  });
});

export type CanineDiagnostics = z.infer<typeof canineDiagnosticsSchema>;
