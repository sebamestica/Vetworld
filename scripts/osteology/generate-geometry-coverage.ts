import { readFile, writeFile } from 'node:fs/promises';
import { felineGeometryCoverageSchema } from './feline-geometry-coverage-schema';

/** Genera data/osteology/feline-geometry-coverage.json a partir del workbook (323 filas) y las propuestas privadas. */
const read = async (path: string) => (await readFile(path, 'utf8')).replace(/^﻿/, '');
const paths = {
  workbook: 'docs/phase3/feline-scientific-workbook.csv',
  proposals: 'data/osteology/proposals/feline/feline-surface-proposals-2026-10-31.json',
  bibliographicCoverage: 'data/osteology/feline-evidence-coverage.json',
  axes: 'data/osteology/diagnostics/feline-axes-2026-10-31.json',
};
const exportGlbSha256 = '06904650fb10da7089a3b123dec2ed4bc5746e5deb40f51613282b2af1514cea';

function parseCsv(source: string): Record<string, string>[] {
  const records: string[][] = [];
  let field = '', row: string[] = [], quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(value => value.length)) records.push(row);
      row = [];
    } else field += char;
  }
  if (field.length || row.length) { row.push(field); records.push(row); }
  const [header, ...body] = records;
  return body.map(values => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ''])));
}

type Proposal = {proposalId: string; proposedStructureId: string; canonicalLatinName: string; sceneHalf: 'yneg' | 'ypos' | 'both';
  faceCount: number; faceIndexSha256: string; admissionStatus: string};
const proposalData = JSON.parse(await read(paths.proposals)) as {sourceSha256: string; assignedFaces: number; remainderFaces: number; proposals: Proposal[]};
const bibliography = JSON.parse(await read(paths.bibliographicCoverage)) as {rows: {referenceId: string; bibliographicRecordId: string | null}[]};
const bibById = new Map(bibliography.rows.map(row => [row.referenceId, row.bibliographicRecordId]));
const rows = parseCsv(await read(paths.workbook));

const admission = {partial_surface_identified: 'superficie_identificada_parcial', sufficient_geometric_bone: 'hueso_geometrico_suficiente'} as const;
const proposals = proposalData.proposals.map(p => ({proposalId: p.proposalId, proposedStructureId: p.proposedStructureId,
  canonicalLatinName: p.canonicalLatinName, sceneHalf: p.sceneHalf, side: 'unknown' as const, faceCount: p.faceCount,
  faceIndexSha256: p.faceIndexSha256, admissionStatus: admission[p.admissionStatus as keyof typeof admission],
  reviewStatus: 'pending' as const, publicAvailable: false as const}));
const pair = (prefix: string) => ['yneg', 'ypos'].map(half => `${prefix}-${half}`);
const capture = (id: string) => `workbench/inspection/feline-oct31/proposals/${id}-*.png`;
const survey = ['workbench/inspection/feline-oct31/survey/full-from-neg-y.png', 'workbench/inspection/feline-oct31/survey-grid/'];

/** Superficies propuestas y cómo se vinculan con cada fila (por segmento final del referenceId). */
const linked: Record<string, {candidates: string[]; partial: boolean; note: string}> = {
  scapula: {candidates: pair('scapula-surface'), partial: true, note: 'Dos placas escapulares visibles; no se sabe cuál es izquierda o derecha.'},
  humerus: {candidates: pair('humerus-surface'), partial: true, note: 'Superficie diafisaria-metafisaria entre zonas articulares excluidas; extremos en remanente.'},
  femur: {candidates: pair('femur-surface'), partial: true, note: 'Superficie entre zonas coxofemoral y femorotibial excluidas; extremos en remanente.'},
  coxal: {candidates: pair('os-coxae-surface'), partial: true, note: 'Ilion e isquion visibles en ambos lados; límites sacroilíaco y sinfisario sustituidos por cortes de caja; anillo obturado solo legible en un semiespacio.'},
  radius: {candidates: pair('antebrachium-radius-ulna-surface'), partial: true, note: 'Visible solo como superficie conjunta radio+cúbito; no hay límite defendible entre ambos.'},
  ulna: {candidates: pair('antebrachium-radius-ulna-surface'), partial: true, note: 'Visible solo como superficie conjunta radio+cúbito; no hay límite defendible entre ambos.'},
  tibia: {candidates: pair('crus-tibia-fibula-surface'), partial: true, note: 'Visible solo como superficie crural conjunta (tibia ± fíbula).'},
  skull: {candidates: [], partial: true, note: 'Superficie conjunta de la cabeza ósea (cráneo + mandíbula si existe), cortada en la sección mínima cabeza-cuello.'},
};
const groupsVisible: Record<string, string> = {
  'thoracic-limb:left:thoracic': 'Miembro torácico visible en un semiespacio; lado no acreditado.',
  'thoracic-limb:right:thoracic': 'Miembro torácico visible en un semiespacio; lado no acreditado.',
  'pelvic-limb:left:pelvic': 'Miembro pelviano visible en un semiespacio; lado no acreditado.',
  'pelvic-limb:right:pelvic': 'Miembro pelviano visible en un semiespacio; lado no acreditado.',
  'axial:midline:cervical-vertebrae': 'Segmento cervical visible entre cabeza y tórax; vértebras no individualizadas.',
  'axial:midline:thoracic-vertebrae': 'Columna visible a lo largo de la caja torácica; vértebras no individualizadas.',
  'axial:midline:lumbar-vertebrae': 'Columna visible entre tórax y pelvis; vértebras no individualizadas.',
  'axial:midline:thorax': 'Caja torácica visible con tiras costales irregulares; costillas sin ordinal verificado.',
  'axial:midline:tail': 'Cola visible colgando caudalmente; número de vértebras no determinado.',
};
const limbGroupCandidates: Record<string, string[]> = {
  thoracic: [...pair('scapula-surface'), ...pair('humerus-surface'), ...pair('antebrachium-radius-ulna-surface')],
  pelvic: [...pair('os-coxae-surface'), ...pair('femur-surface'), ...pair('crus-tibia-fibula-surface')],
};

const output = rows.map(row => {
  const id = row.referenceId, key = id.split(':').at(-1) ?? '', tail = id.replace('feline:reference:', '');
  const bibliographicRecordId = bibById.get(id) ?? null;
  const base = {referenceId: id, latinName: row.latinName, kind: row.kind as 'bone', referenceSide: row.side as 'left' | 'right' | 'midline',
    region: row.region, subregion: row.subregion, bibliographicRecordId, reviewStatus: 'pending' as const};
  const bibliographic = bibliographicRecordId ? 'dato_bibliografico' as const : 'sin_registro' as const;
  const link = linked[key];
  if (link) {
    const midline = row.side === 'midline';
    return {...base, visibility: 'visible' as const, surfaceIntegrity: 'superficie_parcial' as const, admissionStatus: 'superficie_identificada_parcial' as const,
      proposalId: midline ? 'head-skeleton-surface-midline' : null, candidateProposalIds: midline ? [] : link.candidates,
      sideAssignment: midline ? 'not_applicable' as const : 'unresolved' as const,
      method: 'Conectividad por posiciones idénticas + exclusión de zonas articulares + ROI/cilindro o plano de placa (scripts/osteology/segment-feline-proposals.py); inspección en capturas ortogonales.',
      evidence: (midline ? ['head-skeleton-surface-midline'] : link.candidates).map(capture), notes: link.note + ' Revisión humana pendiente.'};
  }
  const group = groupsVisible[tail];
  if (group) {
    const limb = tail.endsWith(':thoracic') ? 'thoracic' : tail.endsWith(':pelvic') ? 'pelvic' : null;
    return {...base, visibility: 'visible' as const, surfaceIntegrity: 'no_evaluada' as const, admissionStatus: bibliographic,
      proposalId: null, candidateProposalIds: limb ? limbGroupCandidates[limb] : [], sideAssignment: limb ? 'unresolved' as const : 'not_applicable' as const,
      method: 'Inspección visual de capturas ortogonales con retícula; sin propuesta de caras para el grupo.', evidence: survey, notes: group};
  }
  let visibility: 'oculta' | 'no_identificable' = 'no_identificable', note: string, candidates: string[] = [];
  if (row.subregion === 'middle-ear') { visibility = 'oculta'; note = 'Estructura interna del cráneo; una superficie exterior no la muestra. No visible ≠ ausente.'; }
  else if (row.subregion === 'skull') { note = 'Incluida, si existe, en la superficie conjunta de la cabeza; sin límites defendibles entre huesos/componentes craneales.'; candidates = ['head-skeleton-surface-midline']; }
  else if (key === 'mandible') { note = 'Sin límite defendible respecto del cráneo en la malla; posible inclusión en la superficie conjunta de la cabeza.'; candidates = ['head-skeleton-surface-midline']; }
  else if (row.subregion === 'dentition') note = 'Resolución y superficie de la cabeza no permiten individualizar dientes; no se cuentan desde capturas.';
  else if (row.subregion === 'hyoid') note = 'No localizado en capturas; estructura fina posiblemente no capturada o no legible. No visible ≠ ausente.';
  else if (key === 'fibula') { note = 'Tira delgada compatible con fíbula conectada a la superficie crural de un semiespacio y superficie paralela no conectada en el otro; identidad no acreditada.'; candidates = pair('crus-tibia-fibula-surface'); }
  else if (['ilium', 'ischium', 'pubis'].includes(key)) { note = 'Componente fusionado del coxal: sin límite geométrico propio; la superficie coxal se propone en conjunto.'; candidates = pair('os-coxae-surface'); }
  else if (row.region === 'axial') note = 'Serie visible en conjunto, pero sin individualizar elementos ni verificar ordinales.';
  else if (['carpus', 'metacarpus', 'tarsus', 'metatarsus', 'digits', 'sesamoids'].includes(row.subregion)) note = 'Autopodio de superficie irregular y baja resolución; elementos no delimitables.';
  else if (key === 'clavicle' || key === 'patella') note = 'No localizada de forma defendible en capturas; no se infiere ausencia.';
  else note = 'No identificable en la superficie disponible; presencia en el espécimen desconocida.';
  return {...base, visibility, surfaceIntegrity: 'no_evaluada' as const, admissionStatus: bibliographic, proposalId: null, candidateProposalIds: candidates,
    sideAssignment: candidates.length && row.side !== 'midline' ? 'unresolved' as const : 'not_applicable' as const,
    method: 'Inspección visual de capturas ortogonales; sin delimitación de caras.', evidence: visibility === 'oculta' ? ['workbench/inspection/feline-oct31/proposals/head-skeleton-surface-midline-*.png'] : [], notes: note};
});

const coverage = felineGeometryCoverageSchema.parse({schemaVersion: 1, speciesId: 'feline', assetId: 'feline:tavernier-skeleton',
  sourceSha256: proposalData.sourceSha256, triangleCount: 74235, generatedFrom: paths, proposalGlbSha256: exportGlbSha256,
  assignedFaces: proposalData.assignedFaces, remainderFaces: proposalData.remainderFaces, scale: 'unknown', lateralityFrame: 'unknown',
  expectedSpecimenBoneCount: null, anatomicallyAcceptedBones: 0, reviewStatus: 'pending', proposals, rows: output});
await writeFile('data/osteology/feline-geometry-coverage.json', JSON.stringify(coverage, null, 2) + '\n');
const count = (state: string) => coverage.rows.filter(row => row.visibility === state).length;
console.log(`${coverage.rows.length} filas: visible ${count('visible')}, oculta ${count('oculta')}, no_identificable ${count('no_identificable')}, no_representada ${count('no_representada')}; ` +
  `superficie parcial ${coverage.rows.filter(row => row.admissionStatus === 'superficie_identificada_parcial').length}; propuestas ${coverage.proposals.length}; caras ${coverage.assignedFaces}+${coverage.remainderFaces}.`);
