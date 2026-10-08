// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import structures from '../../data/anatomy/structures.json';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function api(items = structures.filter(item => item.canonicalLatinName === 'Scapula')) {
  return new Response(JSON.stringify({ data: items.map(structure => ({ structure, score: 300 })), meta: { apiVersion: 'v1', dataVersion: 'test', pagination: { page: 1, limit: 12, total: items.length, totalPages: items.length ? 1 : 0 } } }));
}
describe('Búsqueda global de catálogo', () => {
  it('consulta ambas especies, normaliza y evita consultas vacías o duplicadas', async () => {
    const fetch = vi.fn(async (path: string) => { expect(path.startsWith('/api/v1/search?')).toBe(true); return api(); }); vi.stubGlobal('fetch', fetch);
    render(<GlobalSearch onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '   ' } });
    await new Promise(resolve => setTimeout(resolve, 300)); expect(fetch).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: ' SCÁPULA ' } });
    await screen.findAllByRole('option');
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/v1/search?q=scapula&limit=12');
    expect(screen.getAllByRole('group').length).toBe(2);
    fireEvent.change(input, { target: { value: 'scapula' } });
    await new Promise(resolve => setTimeout(resolve, 300)); expect(fetch).toHaveBeenCalledOnce();
  });
  it('permite seleccionar con teclado, cerrar y elegir con puntero', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => api())); const select = vi.fn();
    render(<GlobalSearch onSelect={select} />);
    const input = screen.getByRole('combobox'); fireEvent.change(input, { target: { value: 'scapula' } });
    await screen.findAllByRole('option');
    fireEvent.keyDown(input, { key: 'ArrowDown' }); expect(input.getAttribute('aria-activedescendant')).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Enter' }); expect(select).toHaveBeenCalledOnce();
    fireEvent.focus(input); fireEvent.keyDown(input, { key: 'Escape' }); expect(input.getAttribute('aria-expanded')).toBe('false');
    fireEvent.focus(input); await screen.findAllByRole('option'); fireEvent.click(screen.getAllByRole('option')[1]); expect(select).toHaveBeenCalledTimes(2);
  });
  it('muestra vacío, respuesta inválida y aborta peticiones anteriores', async () => {
    const signals: AbortSignal[] = []; const fetch = vi.fn(async (_path: string, init: RequestInit) => { signals.push(init.signal!); return api([]); });
    vi.stubGlobal('fetch', fetch); render(<GlobalSearch onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox'); fireEvent.change(input, { target: { value: 'masetero' } });
    await screen.findByText('No hay estructuras coincidentes en el catálogo.');
    fetch.mockImplementation(async (_path: string, init: RequestInit) => { signals.push(init.signal!); return new Response('{}'); });
    fireEvent.change(input, { target: { value: 'scapula' } });
    await waitFor(() => expect(signals[0].aborted).toBe(true));
    await screen.findByText('Búsqueda no disponible. Inténtalo de nuevo.');
  });
});
