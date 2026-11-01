// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import StructurePanel from '@/components/anatomy/StructurePanel';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { t } from '@/lib/ui/i18n';
import structures from '../../data/anatomy/structures.json';
import sources from '../../data/anatomy/sources.json';

const meta = { apiVersion: 'v1', dataVersion: 'test', pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } };
function respond(path: string) {
  if (path.includes('/relations') || path.includes('/references')) return { data: [], meta };
  if (path.includes('/sources')) return { data: sources, meta: { ...meta, pagination: { ...meta.pagination, total: sources.length, totalPages: 1 } } };
  return { data: structures.find(structure => path.endsWith(encodeURIComponent(structure.id))), meta: { apiVersion: 'v1', dataVersion: 'test' } };
}
const props = { structureId: 'canine:scapula', speciesName: 'Perro', regionName: 'Miembro torácico', onClose: vi.fn(), onSelectRelated: vi.fn() };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Accesibilidad de la ficha', () => {
  it('pestañas con roving tabindex y flechas, Inicio y Fin', async () => {
    vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(respond(path)))));
    render(<StructurePanel {...props} />);
    await screen.findByRole('heading', { name: 'Escápula' });
    const [detail, images, sources] = screen.getAllByRole('tab');
    expect([detail, images, sources].map(tab => tab.tabIndex)).toEqual([0, -1, -1]);
    fireEvent.keyDown(detail, { key: 'ArrowRight' });
    expect(images.getAttribute('aria-selected')).toBe('true'); expect(document.activeElement).toBe(images); expect(images.tabIndex).toBe(0);
    fireEvent.keyDown(images, { key: 'End' });
    expect(sources.getAttribute('aria-selected')).toBe('true'); expect(document.activeElement).toBe(sources);
    fireEvent.keyDown(sources, { key: 'ArrowRight' });
    expect(detail.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(detail, { key: 'ArrowLeft' });
    expect(sources.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(sources, { key: 'Home' });
    expect(detail.getAttribute('aria-selected')).toBe('true'); expect(document.activeElement).toBe(detail);
  });
  it('no crea un landmark complementario propio (lo aporta AppShell)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(respond(path)))));
    render(<StructurePanel {...props} />);
    await screen.findByRole('heading', { name: 'Escápula' });
    expect(screen.queryByRole('complementary')).toBeNull();
  });
  it('en inglés traduce etiquetas de interfaz y conserva nombre común y latino', async () => {
    vi.stubGlobal('fetch', vi.fn(async (path: string) => new Response(JSON.stringify(respond(path)))));
    render(<StructurePanel {...props} language="en" />);
    await screen.findByRole('heading', { name: 'Escápula' });
    expect(screen.getByText('Scapula')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Human review pending' })).toBeTruthy();
    expect(screen.getByText('Bone')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Sources' }));
    expect(screen.getByRole('heading', { name: 'Bibliographic sources' })).toBeTruthy();
  });
});

describe('Movimiento reducido e interpolación', () => {
  it('lee prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(true);
  });
  it('t() sustituye marcadores sin traducir el valor', () => {
    expect(t('es', 'selectedStructure', { name: 'Scapula' })).toBe('Estructura seleccionada: Scapula');
    expect(t('en', 'enlarge', { title: 'Título' })).toBe('Enlarge Título');
  });
});
