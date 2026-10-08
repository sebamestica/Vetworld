import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, THEME_PRESETS, initialQuality, settingsSchema } from '@/lib/theme/settings';
import { contrastRatio, themeColors } from '@/lib/theme/theme';

describe('Preferencias y contraste del tema', () => {
  it('valida preferencias sin aceptar colores ni escalas inválidas', () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
    expect(settingsSchema.safeParse({ ...DEFAULT_SETTINGS, color: '#FFF' }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...DEFAULT_SETTINGS, fontScale: 7 }).success).toBe(false);
  });
  it('calcula contraste blanco/negro y adapta colores extremos y presets', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBe(21);
    for (const color of [...THEME_PRESETS, '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF']) {
      const { variables: v } = themeColors(color);
      for (const text of ['--text', '--muted', '--subtle']) for (const bg of ['--bg', '--top', '--surface', '--surface-hover']) expect(contrastRatio(v[text], v[bg])).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(v['--accent'], v['--accent-ink'])).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('elige calidad inicial por capacidades y respeta escenarios modestos', () => {
    expect(initialQuality({ cores: 2, coarse: false, dpr: 1 })).toBe('low');
    expect(initialQuality({ cores: 8, coarse: true, dpr: 3 })).toBe('balanced');
    expect(initialQuality({ cores: 8, coarse: false, dpr: 2 })).toBe('high');
  });
});
