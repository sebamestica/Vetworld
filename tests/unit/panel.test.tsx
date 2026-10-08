// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StructurePanel from '@/components/anatomy/StructurePanel';
import structures from '../../data/anatomy/structures.json';
import sources from '../../data/anatomy/sources.json';

const meta = { apiVersion: 'v1', dataVersion: 'test', pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } };
function respond(path: string) {
  if (path.includes('/relations') || path.includes('/references')) return { data: [], meta };
  if (path.includes('/sources')) return { data: sources, meta: { ...meta, pagination: { ...meta.pagination, total: sources.length, totalPages: 1 } } };
  const item = structures.find(structure => path.endsWith(encodeURIComponent(structure.id)));
  return { data: item, meta: { apiVersion: 'v1', dataVersion: 'test' } };
}
const props = { structureId: 'canine:scapula', speciesName: 'Perro', regionName: 'Miembro torácico', onClose: vi.fn(), onSelectRelated: vi.fn() };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('Ficha anatómica desde API', () => {
  it('carga ficha, fuentes y galería; omite campos anatómicos ausentes', async () => {
    vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(respond(path)))));
    render(<StructurePanel {...props} />);
    await screen.findByRole('heading', { name: 'Escápula' });
    expect(screen.getByText('Scapula')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Revisión humana pendiente' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Referencias anatómicas reales' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Origen' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ficha' })); expect(props.onClose).toHaveBeenCalledOnce();
  });
  it('un error HTTP se muestra como error y no como ficha exitosa', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Error' } }), { status: 500 })));
    render(<StructurePanel {...props} />);
    expect((await screen.findByRole('alert')).textContent).toContain('500');
    expect(screen.queryByRole('heading', { name: 'Escápula' })).toBeNull();
  });
  it('aborta la selección anterior y elimina su contenido al cambiar especie', async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal('fetch', vi.fn(async (path: string, init: RequestInit) => { signals.push(init.signal!); if (path.includes('feline')) return new Promise<Response>(() => {}); return new Response(JSON.stringify(respond(path))); }));
    const view = render(<StructurePanel {...props} />); await screen.findByRole('heading', { name: 'Escápula' });
    view.rerender(<StructurePanel {...props} structureId="feline:scapula" speciesName="Gato" />);
    expect(screen.queryByText('Scapula')).toBeNull(); expect(screen.getByRole('status').textContent).toContain('Cargando');
    await waitFor(() => expect(signals[0].aborted).toBe(true));
  });
});
