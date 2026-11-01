// @vitest-environment happy-dom
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToolsPanel, type ToolsPanelProps } from '@/components/tools/ToolsPanel';
import { DEFAULT_SETTINGS } from '@/lib/theme/settings';
afterEach(cleanup);
function props(overrides: Partial<ToolsPanelProps> = {}): ToolsPanelProps {
  return { open: true, onClose: vi.fn(), language: 'es', tab: 'layers', onTabChange: vi.fn(), layers: [{ id: 'muscles', label: 'Músculos', available: true, visible: true, opacity: 1 }], onToggleLayer: vi.fn(), onOpacity: vi.fn(), viewPreset: 'left', onViewPreset: vi.fn(), cutPlane: 'none', onCutPlane: vi.fn(), clipOffset: 0, onClipOffset: vi.fn(), settings: DEFAULT_SETTINGS, onSettingsChange: vi.fn(), onResetSettings: vi.fn(), ...overrides };
}
describe('Herramientas accesibles', () => {
  it('deshabilita capas sin geometría y conecta capas, opacidad y cierre', () => {
    const p = props(); render(createElement(ToolsPanel, p));
    expect((screen.getByRole('checkbox', { name: 'Piel' }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Músculos' })); expect(p.onToggleLayer).toHaveBeenCalledWith('muscles');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '.5' } }); expect(p.onOpacity).toHaveBeenCalledWith('muscles', .5);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar herramientas' })); expect(p.onClose).toHaveBeenCalled();
  });
  it('oculta el menú y conecta navegación de pestañas', () => {
    const p = props({ open: false }); const rendered = render(createElement(ToolsPanel, p));
    expect(screen.queryByRole('complementary')).toBeNull();
    rendered.rerender(createElement(ToolsPanel, { ...p, open: true }));
    fireEvent.click(screen.getByRole('tab', { name: 'Vistas' })); expect(p.onTabChange).toHaveBeenCalledWith('views');
  });
  it('conecta cámara y corte', () => {
    const p = props({ tab: 'views' }); render(createElement(ToolsPanel, p));
    fireEvent.click(screen.getByRole('button', { name: 'Derecha' })); expect(p.onViewPreset).toHaveBeenCalledWith('right');
    fireEvent.click(screen.getByRole('button', { name: 'Sagital' })); expect(p.onCutPlane).toHaveBeenCalledWith('sagittal');
  });
  it('valida colores y comunica idioma, fuente y calidad', () => {
    const p = props({ tab: 'settings' }); render(createElement(ToolsPanel, p));
    fireEvent.change(screen.getByLabelText('Código hexadecimal del tema'), { target: { value: '#FF' } }); expect(p.onSettingsChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Código hexadecimal del tema'), { target: { value: '#abcdef' } }); expect(p.onSettingsChange).toHaveBeenCalledWith({ color: '#ABCDEF' });
    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } }); expect(p.onSettingsChange).toHaveBeenCalledWith({ language: 'en' });
    fireEvent.change(screen.getByLabelText('Tamaño de letra'), { target: { value: '1.3' } }); expect(p.onSettingsChange).toHaveBeenCalledWith({ fontScale: 1.3 });
    fireEvent.click(screen.getByRole('button', { name: 'Baja' })); expect(p.onSettingsChange).toHaveBeenCalledWith({ quality: 'low' });
  });
  it('expone el motivo de las capas sin geometría y filtra fichas aun sin malla', () => {
    const onRecordFilter = vi.fn(), onOpenRecord = vi.fn();
    const records = [
      { id: 'feline-scapula', spanishName: 'Escápula', canonicalLatinName: 'Scapula', kind: 'bone' as const, systemId: 'skeletal' },
      { id: 'feline-n-radialis', spanishName: 'Nervio radial', canonicalLatinName: 'Nervus radialis', kind: 'nerve' as const, systemId: 'nervous' },
    ];
    const p = props({ records, recordFilter: { system: 'all', tissue: 'nerves' }, onRecordFilter, onOpenRecord });
    render(createElement(ToolsPanel, p));
    const skin = screen.getByRole('checkbox', { name: 'Piel' });
    expect(skin.getAttribute('aria-describedby')).toBe('layer-reason-skin');
    expect(document.getElementById('layer-reason-skin')?.textContent).toBe('Sin geometría en este modelo');
    expect(screen.getByRole('checkbox', { name: 'Músculos' }).getAttribute('aria-describedby')).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(8);
    expect(screen.queryByRole('button', { name: /Escápula/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Nervio radial/ })); expect(onOpenRecord).toHaveBeenCalledWith('feline-n-radialis');
    expect(screen.getByText('Fichas de la región (1)')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Tejido o capa'), { target: { value: 'bones' } }); expect(onRecordFilter).toHaveBeenCalledWith({ system: 'all', tissue: 'bones' });
    fireEvent.change(screen.getByLabelText('Sistema'), { target: { value: 'skeletal' } }); expect(onRecordFilter).toHaveBeenCalledWith({ system: 'skeletal', tissue: 'nerves' });
    expect((screen.getByRole('option', { name: 'Vasos (0)' }) as HTMLOptionElement)).toBeTruthy();
  });
  it('indica «Modelo 3D no disponible» cuando no hay modelo y avisa si el filtro vacía la lista', () => {
    render(createElement(ToolsPanel, props({ layers: [], modelAvailable: false, records: [], recordFilter: { system: 'all', tissue: 'all' }, onRecordFilter: vi.fn() })));
    expect(document.getElementById('layer-reason-bones')?.textContent).toBe('Modelo 3D no disponible');
    expect(screen.getByRole('status').textContent).toBe('Ninguna ficha registrada coincide con el filtro.');
  });
});
