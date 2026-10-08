'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, initialQuality, settingsSchema, type UISettings } from '@/lib/theme/settings';
import { themeColors } from '@/lib/theme/theme';

export function useThemeSettings() {
  const [settings, setSettings] = useState<UISettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const automatic = { ...DEFAULT_SETTINGS, quality: initialQuality({ cores: navigator.hardwareConcurrency || 8, coarse: window.matchMedia?.('(pointer: coarse)').matches ?? false, dpr: window.devicePixelRatio || 1 }) };
    let next = automatic;
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) { const parsed = settingsSchema.safeParse(JSON.parse(stored)); if (parsed.success) next = parsed.data; }
    } catch { /* Almacenamiento privado o dañado: usar preferencias seguras. */ }
    let mounted = true;
    queueMicrotask(() => { if (mounted) { setSettings(next); setReady(true); } });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); } catch { /* La personalización continúa sin persistencia. */ }
  }, [ready, settings]);
  const updateSettings = useCallback((partial: Partial<UISettings>) => {
    setSettings(current => { const parsed = settingsSchema.safeParse({ ...current, ...partial }); return parsed.success ? parsed.data : current; });
  }, []);
  const resetSettings = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), []);
  const palette = useMemo(() => themeColors(settings.color), [settings.color]);
  return { settings, updateSettings, resetSettings, ready, ...palette, variables: { ...palette.variables, '--fontScale': String(settings.fontScale) } };
}
