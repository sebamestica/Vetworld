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
});
