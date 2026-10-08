import { z } from 'zod';

export const settingsSchema = z.object({
  color: z.string().regex(/^#[\da-f]{6}$/i),
  fontScale: z.union([z.literal(0.9), z.literal(1), z.literal(1.15), z.literal(1.3)]),
  quality: z.enum(['high', 'balanced', 'low']),
  language: z.enum(['es', 'en']),
});
export type UISettings = z.infer<typeof settingsSchema>;
export const DEFAULT_SETTINGS: UISettings = { color: '#29303A', fontScale: 1, quality: 'high', language: 'es' };
export const SETTINGS_STORAGE_KEY = 'vetworld.ui.v2';
export const THEME_PRESETS = ['#29303A', '#214D4B', '#343055', '#664134', '#DFD8CB', '#F1F3F5'] as const;

export function initialQuality(device: { cores: number; coarse: boolean; dpr: number }): UISettings['quality'] {
  if (device.cores <= 2) return 'low';
  if (device.cores <= 4 || (device.coarse && device.dpr >= 2)) return 'balanced';
  return 'high';
}
