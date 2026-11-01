// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import StructurePanel from '@/components/anatomy/StructurePanel';
import { viewerAssets } from '../../src/modules/viewer/assets';
import { viewerAssetSchema } from '../../src/modules/viewer/manifest';
import { meshPresentation } from '../../src/modules/viewer/visibility';
import { hasPartialSurfaces, selectablePieces, structureAdmission, workspaceAsset } from '../../src/modules/viewer/selection';
import { comparePartitionedGlb } from '../../src/modules/anatomy/services/partition-glb';
import { catalogService } from '../../src/modules/catalog/services/catalog-service';
import { modelSchema } from '../../src/modules/anatomy/schemas/catalog';
import structures from '../../data/anatomy/structures.json';
import sources from '../../data/anatomy/sources.json';

const ID = 'feline:tavernier-partial-surfaces';
const asset = viewerAssets.find(entry => entry.id === ID)!;
const original = viewerAssets.find(entry => entry.id === 'feline:tavernier-skeleton')!;
const nodesOf = (structureId: string) => asset.meshMappings.filter(m => m.structureId === structureId).map(m => m.nodeId).sort();

describe('Derivado felino de superficies parciales: manifiesto y mappings', () => {
  it('publica un derivado CC BY-NC-SA 4.0 con atribución, aviso de cambios y revisión pendiente', () => {
    expect(viewerAssetSchema.safeParse(asset).success).toBe(true);
    expect(asset).toMatchObject({ speciesId: 'feline', scope: 'whole-body', availability: 'available', reviewStatus: 'pending', unit: 'source-unverified', physicalScaleVerified: false, triangleCount: original.triangleCount, licenseUrl: original.licenseUrl, sourceUrl: original.sourceUrl });
    expect(asset.credit).toEqual({ work: 'Cat Skeleton', author: 'Tavernier Amaury', licenseName: 'CC BY-NC-SA 4.0', changes: 'Derivado: partición por caras en superficies parciales, sin geometría añadida' });
    expect(asset.attribution).toContain('sin geometría añadida');
    expect(asset.resourceUrl).not.toBe(original.resourceUrl);
  });
  it('mapea ambos semiespacios a la misma ficha, sin lado, y deja conjuntos y remanente no seleccionables', () => {
    expect(asset.meshMappings.every(m => m.admission === 'partial-surface' && m.layerId === 'skeleton')).toBe(true);
    for (const bone of ['scapula', 'humerus', 'femur', 'os-coxae']) expect(nodesOf(`feline:${bone}`)).toEqual([`proposal-${bone}-surface-yneg`, `proposal-${bone}-surface-ypos`]);
    expect(nodesOf('feline:skull')).toEqual(['proposal-head-skeleton-surface-midline']);
    expect(asset.meshMappings.find(m => m.structureId === 'feline:skull')?.includesStructureIds).toEqual(['feline:mandible']);
    expect(asset.meshMappings.some(m => /left|right|izq|der/i.test(m.structureId))).toBe(false);
    expect(asset.meshMappings.some(m => ['feline:radius', 'feline:ulna', 'feline:tibia', 'feline:fibula'].includes(m.structureId))).toBe(false);
    expect((asset.visualNodes ?? []).map(n => n.nodeId).sort()).toEqual(['proposal-antebrachium-radius-ulna-surface-yneg', 'proposal-antebrachium-radius-ulna-surface-ypos', 'proposal-crus-tibia-fibula-surface-yneg', 'proposal-crus-tibia-fibula-surface-ypos', 'unidentified-remainder']);
    expect(meshPresentation(asset, 'unidentified-remainder', {}, null)).toMatchObject({ visible: true, mapping: undefined });
    expect(meshPresentation(asset, 'proposal-crus-tibia-fibula-surface-ypos', {}, null).mapping).toBeUndefined();
  });
  it('el catálogo declara los mismos mappings y la reciprocidad con las fichas', () => {
    const model = catalogService.model(ID);
    expect(modelSchema.safeParse(model).success).toBe(true);
    expect(model.meshMappings).toEqual(asset.meshMappings);
    expect(model.review.status).toBe('pending');
    expect(model.fileEvidence).toMatchObject({ sha256: asset.sha256, byteSize: asset.byteSize });
    expect([...model.structureIds].sort()).toEqual([...new Set(asset.meshMappings.map(m => m.structureId))].sort());
    for (const id of model.structureIds) expect(catalogService.structure(id).modelIds).toContain(ID);
    expect(catalogService.structure('feline:mandible').modelIds).not.toContain(ID);
    expect(catalogService.model('feline:tavernier-skeleton').structureIds).toEqual([]);
  });
  it('rechaza superficies parciales validadas, inclusiones ajenas y nodos duplicados entre visual y seleccionable', () => {
    expect(viewerAssetSchema.safeParse({ ...asset, reviewStatus: 'validated' }).success).toBe(false);
    const skull = asset.meshMappings.find(m => m.structureId === 'feline:skull')!;
    const others = asset.meshMappings.filter(m => m !== skull);
    expect(viewerAssetSchema.safeParse({ ...asset, meshMappings: [...others, { ...skull, includesStructureIds: ['canine:mandible'] }] }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, meshMappings: [...others, { ...skull, includesStructureIds: ['feline:skull'] }] }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, meshMappings: [...others, { ...skull, admission: undefined }] }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, meshMappings: [...others, { ...skull, admission: 'bone' }] }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, visualNodes: [...(asset.visualNodes ?? []), { nodeId: skull.nodeId, layerId: 'skeleton' }] }).success).toBe(false);
  });
  it('la home felina prefiere el derivado seleccionable; vistas siguen solo para la fixture técnica', () => {
    const available = new Set(catalogService.models().filter(m => m.availability === 'available').map(m => m.id));
    expect(workspaceAsset(viewerAssets, 'feline', 'all', available)).toEqual({ asset, coverage: 'whole-body' });
    available.delete(ID);
    expect(workspaceAsset(viewerAssets, 'feline', 'all', available)?.asset.id).toBe('feline:tavernier-skeleton');
    expect(asset.purpose).toBe('scientific');
  });
});

describe('Selección, aviso de admisión y piezas', () => {
  it('agrupa nodos por ficha e informa admisión e inclusiones sin deducir lado', () => {
    expect(selectablePieces(asset).map(p => [p.structureId, p.nodeIds.length])).toEqual([['feline:scapula', 2], ['feline:humerus', 2], ['feline:femur', 2], ['feline:os-coxae', 2], ['feline:skull', 1]]);
    expect(structureAdmission(asset, 'feline:scapula')).toEqual({ admission: 'partial-surface', nodeCount: 2, includesStructureIds: [] });
    expect(structureAdmission(asset, 'feline:skull')).toEqual({ admission: 'partial-surface', nodeCount: 1, includesStructureIds: ['feline:mandible'] });
    expect(structureAdmission(asset, 'feline:radius')).toBeNull();
    expect(structureAdmission(asset, null)).toBeNull();
    expect(structureAdmission(viewerAssets.find(a => a.id === 'canine-technical-demo'), 'canine:scapula')).toBeNull();
    expect(hasPartialSurfaces(asset)).toBe(true);
    expect(hasPartialSurfaces(original)).toBe(false);
  });
  it('oculta, aísla y opaca por pieza: ambos semiespacios juntos, el resto intacto', () => {
    const pieces = { 'feline:femur': { visible: false, opacity: 1 }, 'feline:scapula': { visible: true, opacity: .5 } };
    expect(meshPresentation(asset, 'proposal-femur-surface-yneg', {}, null, pieces).visible).toBe(false);
    expect(meshPresentation(asset, 'proposal-femur-surface-ypos', {}, null, pieces).visible).toBe(false);
    expect(meshPresentation(asset, 'proposal-humerus-surface-yneg', {}, null, pieces).visible).toBe(true);
    expect(meshPresentation(asset, 'unidentified-remainder', {}, null, pieces).visible).toBe(true);
    expect(meshPresentation(asset, 'proposal-scapula-surface-ypos', { skeleton: { visible: true, opacity: .5 } }, null, pieces).opacity).toBe(.25);
    expect(meshPresentation(asset, 'proposal-scapula-surface-ypos', { skeleton: { visible: true, opacity: .2 } }, null, pieces).opacity).toBe(.15);
    expect(meshPresentation(asset, 'proposal-scapula-surface-yneg', {}, 'feline:scapula').visible).toBe(true);
    expect(meshPresentation(asset, 'unidentified-remainder', {}, 'feline:scapula').visible).toBe(false);
    expect(meshPresentation(asset, 'proposal-humerus-surface-yneg', { skeleton: { visible: false, opacity: 1 } }, null, {}).visible).toBe(false);
  });
});

describe('Archivo derivado publicado', () => {
  it('conserva atributos, textura y triángulos del original (13 superficies + remanente = 74.235)', () => {
    const source = readFileSync('public/models/feline/tavernier-skeleton.glb'), derived = readFileSync(`public${asset.resourceUrl}`);
    expect(createHash('sha256').update(source).digest('hex')).toBe(original.sha256);
    expect(createHash('sha256').update(derived).digest('hex')).toBe(asset.sha256);
    expect(derived.length).toBe(asset.byteSize);
    const report = comparePartitionedGlb(source, derived);
    expect(report.issues).toEqual([]);
    expect(report.triangles).toBe(74_235);
    expect(report.nodes).toHaveLength(14);
    expect(report.nodes.find(n => n.name === 'unidentified-remainder')?.triangles).toBe(45_977);
    const declared = new Set([...asset.meshMappings.map(m => m.nodeId), ...(asset.visualNodes ?? []).map(n => n.nodeId)]);
    expect(new Set(report.nodes.map(n => n.name))).toEqual(declared);
  });
  it('detecta un triángulo alterado', () => {
    const source = readFileSync('public/models/feline/tavernier-skeleton.glb');
    const derived = Buffer.from(readFileSync(`public${asset.resourceUrl}`));
    derived.writeUInt32LE(derived.readUInt32LE(derived.length - 12) + 1, derived.length - 12);
    expect(comparePartitionedGlb(source, derived).issues.length).toBeGreaterThan(0);
  });
});

const meta = { apiVersion: 'v1', dataVersion: 'test', pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } };
function respond(path: string) {
  if (path.includes('/relations') || path.includes('/references')) return { data: [], meta };
  if (path.includes('/sources')) return { data: sources, meta: { ...meta, pagination: { ...meta.pagination, total: sources.length, totalPages: 1 } } };
  return { data: structures.find(structure => path.endsWith(encodeURIComponent(structure.id))), meta: { apiVersion: 'v1', dataVersion: 'test' } };
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('Aviso de superficie parcial en la ficha', () => {
  const base = { speciesName: 'Felino', regionName: 'Todo el animal', onClose: vi.fn(), onSelectRelated: vi.fn() };
  it('muestra el aviso, la inclusión y la ausencia de lado en español', async () => {
    vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(respond(path)))));
    render(<StructurePanel {...base} structureId="feline:skull" admission={{ level: 'partial-surface', sides: null, includes: ['Mandíbula'] }} />);
    const notice = await screen.findByTestId('partial-surface-notice');
    expect(notice.textContent).toContain('Superficie parcial identificada · límites aproximados · revisión pendiente');
    expect(notice.textContent).toContain('Incluye Mandíbula sin separar.');
    expect(notice.textContent).not.toContain('lado');
  });
  it('traduce el aviso al inglés y explica los semiespacios sin asignar lado', async () => {
    vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(respond(path)))));
    render(<StructurePanel {...base} language="en" structureId="feline:scapula" admission={{ level: 'partial-surface', sides: 2, includes: [] }} />);
    const notice = await screen.findByTestId('partial-surface-notice');
    expect(notice.textContent).toContain('Partial surface identified · approximate boundaries · review pending');
    expect(notice.textContent).toContain('no left or right side is assigned');
  });
  it('sin admisión no hay aviso', async () => {
    vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(respond(path)))));
    render(<StructurePanel {...base} structureId="feline:radius" />);
    await screen.findByRole('heading', { name: 'Radio' });
    expect(screen.queryByTestId('partial-surface-notice')).toBeNull();
  });
});
