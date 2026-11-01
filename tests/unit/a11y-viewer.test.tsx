// @vitest-environment happy-dom
// Fixture técnica sintética: nombres y nodos inventados para la prueba; no es catálogo científico.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { ViewerAsset } from '@/modules/viewer/manifest';

vi.mock('@react-three/fiber', () => ({ Canvas: () => <div data-testid="canvas-mock" />, useFrame: () => undefined, useThree: () => ({}) }));
vi.mock('@react-three/drei', () => ({ OrbitControls: () => null }));
vi.mock('@/modules/viewer/manifest', () => ({ viewerAssetSchema: { parse: (value: unknown) => value } }));
vi.mock('@/modules/viewer/loading', () => ({ readBoundedBody: async () => new Uint8Array([1, 2, 3]).buffer, safeResourceUri: (uri: string) => uri, validateLoadedScene: () => undefined }));
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class { async parseAsync() { const scene = new Group(); for (const name of ['fixture_a', 'fixture_b']) { const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial()); mesh.name = name; scene.add(mesh); } return { scene }; } },
}));
const { default: AnatomyViewer } = await import('@/components/viewer/AnatomyViewer');

const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array([1, 2, 3]))), byte => byte.toString(16).padStart(2, '0')).join('');
function asset(mappings: ViewerAsset['meshMappings']): ViewerAsset {
  return { id: 'fixture', speciesId: 'feline', regionId: 'all', title: 'Fixture técnica', purpose: 'scientific', format: 'glb', resourceUrl: '/models/fixture.glb', unit: 'm', scaleToMeters: 1, orientation: 'fixture', byteSize: 3, triangleCount: 24, estimatedGpuBytes: 1, sha256: digest, license: { label: 'fixture', verified: true, redistributionAllowed: true }, reviewStatus: 'pending', availability: 'available', meshMappings: mappings, layers: [{ id: 'skeleton', label: 'Esqueleto' }] } as unknown as ViewerAsset;
}
const mappings = [{ nodeId: 'fixture_a', structureId: 'feline:fixture-a', layerId: 'skeleton' }, { nodeId: 'fixture_b', structureId: 'feline:fixture-b', layerId: 'skeleton' }];
const names = { 'feline:fixture-a': { spanishName: 'Pieza sintética A', canonicalLatinName: 'Pars synthetica A' } };
const base = { selectedId: null, onSelect: vi.fn(), layers: { skeleton: { visible: true, opacity: 1 } }, isolatedId: null, resetToken: 0, quality: 'low' as const, variant: 'immersive' as const, structureNames: names };

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('Alternativa textual del canvas', () => {
  it('agrupa las piezas y usa el nombre del catálogo en vez del nodeId', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))));
    const view = render(<AnatomyViewer {...base} asset={asset(mappings)} />);
    const group = await screen.findByRole('group', { name: 'Piezas seleccionables del modelo' });
    expect(group.querySelectorAll('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Pieza sintética A' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'fixture_b' })).toBeTruthy();
    view.rerender(<AnatomyViewer {...base} language="en" asset={asset(mappings)} selectedId="feline:fixture-a" />);
    expect(screen.getByRole('group', { name: 'Selectable model parts' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pars synthetica A' }).getAttribute('aria-pressed')).toBe('true');
    const live = screen.getByTestId('viewer-selection');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Selected structure: Pars synthetica A');
  });
  it('sin mappings informa que no hay piezas seleccionables y no inventa botones', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))));
    render(<AnatomyViewer {...base} asset={asset([])} />);
    const group = await screen.findByRole('group', { name: 'Piezas seleccionables del modelo' });
    expect(group.querySelectorAll('button')).toHaveLength(0);
    expect(group.textContent).toContain('no tiene piezas científicas seleccionables');
  });
  it('traduce el estado sin modelo y lo expone como región polite', async () => {
    const view = render(<AnatomyViewer {...base} asset={null} />);
    const status = screen.getByTestId('viewer-status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(await screen.findByText('Modelo 3D no disponible')).toBeTruthy();
    view.rerender(<AnatomyViewer {...base} asset={null} language="en" />);
    expect(status.textContent).toBe('3D model unavailable');
    expect(screen.getByRole('region', { name: 'Three-dimensional viewer' })).toBeTruthy();
  });
});
