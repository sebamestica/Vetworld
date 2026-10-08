// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/lib/theme/settings';
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
describe('Persistencia local segura', () => {
  it('recupera preferencias y persiste cambios validados', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, language: 'en', quality: 'low' }));
    const { result } = renderHook(useThemeSettings);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.settings.language).toBe('en');
    expect(result.current.settings.quality).toBe('low');
    act(() => result.current.updateSettings({ fontScale: 1.3 }));
    expect(result.current.variables['--fontScale']).toBe('1.3');
    await waitFor(() => expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!).fontScale).toBe(1.3));
    act(() => result.current.resetSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });
  it('tolera JSON corrupto y almacenamiento privado', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{');
    const first = renderHook(useThemeSettings);
    await waitFor(() => expect(first.result.current.ready).toBe(true));
    expect(first.result.current.settings.color).toBe(DEFAULT_SETTINGS.color);
    first.unmount();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('privado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('privado'); });
    const second = renderHook(useThemeSettings);
    await waitFor(() => expect(second.result.current.ready).toBe(true));
    act(() => second.result.current.updateSettings({ color: '#214D4B' }));
    expect(second.result.current.settings.color).toBe('#214D4B');
  });
});
