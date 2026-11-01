import { z } from 'zod';

/**
 * Matriz geométrica felina (Tavernier), separada de la matriz bibliográfica
 * `data/osteology/feline-evidence-coverage.json`. «No visible» no equivale a «ausente».
 * El estado «revisado» no existe aquí: solo una persona cualificada puede registrarlo.
 */
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const text = z.string().trim().min(1);

export const visibilityStates = ['visible', 'oculta', 'no_identificable', 'no_representada'] as const;
export const geometryAdmissionStates = ['sin_registro', 'dato_bibliografico', 'superficie_identificada_parcial', 'hueso_geometrico_suficiente'] as const;

const proposalSchema = z.object({
  proposalId: text,
  proposedStructureId: z.string().startsWith('feline:'),
  canonicalLatinName: text,
  sceneHalf: z.enum(['yneg', 'ypos', 'both']),
  side: z.literal('unknown'),
  faceCount: z.number().int().positive(),
  faceIndexSha256: sha,
  admissionStatus: z.enum(['superficie_identificada_parcial', 'hueso_geometrico_suficiente']),
  reviewStatus: z.literal('pending'),
  publicAvailable: z.literal(false),
}).strict();

const rowSchema = z.object({
  referenceId: z.string().startsWith('feline:reference:'),
  latinName: text,
  kind: z.enum(['group', 'bone', 'tooth', 'anatomical_component', 'variable_series', 'conditional_bone']),
  referenceSide: z.enum(['left', 'right', 'midline']),
  region: text,
  subregion: text,
  visibility: z.enum(visibilityStates),
  surfaceIntegrity: z.enum(['superficie_parcial', 'no_evaluada']),
  admissionStatus: z.enum(geometryAdmissionStates),
  bibliographicRecordId: z.string().startsWith('feline:').nullable(),
  proposalId: text.nullable(),
  candidateProposalIds: z.array(text),
  sideAssignment: z.enum(['unresolved', 'not_applicable']),
  method: text,
  evidence: z.array(text),
  notes: text,
  reviewStatus: z.literal('pending'),
}).strict();

export const felineGeometryCoverageSchema = z.object({
  schemaVersion: z.literal(1),
  speciesId: z.literal('feline'),
  assetId: z.literal('feline:tavernier-skeleton'),
  sourceSha256: sha,
  triangleCount: z.literal(74235),
  generatedFrom: z.object({ workbook: text, proposals: text, bibliographicCoverage: text, axes: text }).strict(),
  proposalGlbSha256: sha,
  assignedFaces: z.number().int().nonnegative(),
  remainderFaces: z.number().int().nonnegative(),
  scale: z.literal('unknown'),
  lateralityFrame: z.literal('unknown'),
  expectedSpecimenBoneCount: z.null(),
  anatomicallyAcceptedBones: z.literal(0),
  reviewStatus: z.literal('pending'),
  proposals: z.array(proposalSchema),
  rows: z.array(rowSchema),
}).strict().superRefine((data, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  const proposals = new Map(data.proposals.map(proposal => [proposal.proposalId, proposal]));
  if (proposals.size !== data.proposals.length) issue('Propuestas duplicadas');
  const faces = data.proposals.reduce((sum, proposal) => sum + proposal.faceCount, 0);
  if (faces !== data.assignedFaces || data.assignedFaces + data.remainderFaces !== data.triangleCount) issue('Conteo de caras no conservado');
  if (new Set(data.rows.map(row => row.referenceId)).size !== data.rows.length) issue('referenceId duplicado');
  for (const row of data.rows) {
    const linked = [...(row.proposalId ? [row.proposalId] : []), ...row.candidateProposalIds];
    for (const id of linked) if (!proposals.has(id)) issue(`${row.referenceId}: propuesta inexistente ${id}`);
    if (row.proposalId && row.candidateProposalIds.includes(row.proposalId)) issue(`${row.referenceId}: propuesta repetida`);
    // Una fila lateral no puede recibir una propuesta concreta mientras el lado sea desconocido.
    if (row.referenceSide !== 'midline' && row.proposalId) issue(`${row.referenceId}: lado no acreditado`);
    if (row.referenceSide !== 'midline' && linked.length && row.sideAssignment !== 'unresolved') issue(`${row.referenceId}: asignación lateral debe quedar sin resolver`);
    if (row.visibility !== 'visible' && row.proposalId) issue(`${row.referenceId}: propuesta en fila no visible`);
    const partial = row.admissionStatus === 'superficie_identificada_parcial' || row.admissionStatus === 'hueso_geometrico_suficiente';
    if (partial && (!linked.length || row.visibility !== 'visible' || row.surfaceIntegrity !== 'superficie_parcial')) issue(`${row.referenceId}: admisión geométrica sin superficie visible asociada`);
    if (!partial && row.surfaceIntegrity === 'superficie_parcial') issue(`${row.referenceId}: integridad sin admisión geométrica`);
    if (row.admissionStatus === 'dato_bibliografico' && !row.bibliographicRecordId) issue(`${row.referenceId}: dato bibliográfico sin ficha`);
    if (row.admissionStatus === 'sin_registro' && row.bibliographicRecordId) issue(`${row.referenceId}: ficha registrada no reflejada`);
    if (row.admissionStatus === 'hueso_geometrico_suficiente' && linked.some(id => proposals.get(id)?.admissionStatus !== 'hueso_geometrico_suficiente')) issue(`${row.referenceId}: propuesta no suficiente`);
    if (row.visibility !== 'no_identificable' && row.visibility !== 'visible' && row.evidence.length === 0) issue(`${row.referenceId}: estado sin evidencia`);
  }
});

export type FelineGeometryCoverage = z.infer<typeof felineGeometryCoverageSchema>;
