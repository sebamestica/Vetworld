'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Layers, Settings2, X } from 'lucide-react';
import type { CutPlane, ViewPreset } from '@/modules/viewer/controls';
import { THEME_PRESETS, type UISettings } from '@/lib/theme/settings';
import { t, type Language, type UiKey } from '@/lib/ui/i18n';
import styles from './ToolsPanel.module.css';

export type ToolsTab = 'layers' | 'views' | 'settings';
export interface ToolsPanelProps {
  open: boolean; onClose: () => void; language: Language; tab: ToolsTab; onTabChange: (tab: ToolsTab) => void;
  layers: { id: string; label: string; available: boolean; visible: boolean; opacity: number }[];
  onToggleLayer: (id: string) => void; onOpacity: (id: string, value: number) => void;
  viewPreset: ViewPreset; onViewPreset: (preset: ViewPreset) => void;
  cutPlane: CutPlane; onCutPlane: (plane: CutPlane) => void; clipOffset: number; onClipOffset: (value: number) => void;
  settings: UISettings; onSettingsChange: (settings: Partial<UISettings>) => void; onResetSettings: () => void;
  regionOptions?: { id: string; label: string }[]; regionId?: string; onRegionChange?: (id: string) => void;
  anatomicalViewsAvailable?: boolean;
}
const layerKeys = ['skin', 'muscles', 'tendons', 'ligaments', 'vessels', 'nerves', 'bones', 'organs'] as const;
const layerColors = ['#bd9e8e', '#bd7b72', '#ddccb3', '#ccb47b', '#ba6672', '#dab66d', '#e8dccc', '#ac667f'];
const views: ViewPreset[] = ['left', 'right', 'front', 'back', 'dorsal', 'ventral', 'free'];
const planes: CutPlane[] = ['none', 'sagittal', 'median', 'transverse', 'dorsal'];
const presetNames: UiKey[] = ['graphite', 'forest', 'violet', 'terracotta', 'sand', 'light'];

export function ToolsPanel(p: ToolsPanelProps) {
  const tx = (key: UiKey) => t(p.language, key);
  const [draft, setHexDraft] = useState<string | null>(null);
  const hexDraft = draft ?? p.settings.color;
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!p.open) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [p.open]);
  const invalidHex = !/^#[\da-f]{6}$/i.test(hexDraft);
  const tabIcons = { layers: Layers, views: Eye, settings: Settings2 };
  return <aside id="atlas-tools" className={`${styles.drawer} ${p.open ? styles.open : ''}`} aria-label={tx('tools')} aria-hidden={!p.open} inert={!p.open} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); p.onClose(); } }}>
    <div className={styles.head}><h2>{tx('tools')}</h2><button ref={closeRef} className={styles.close} type="button" onClick={p.onClose} aria-label={tx('closeTools')}><X size={15} aria-hidden="true" /></button></div>
    <div className={styles.tabs} role="tablist" aria-label={tx('tools')}>{(['layers', 'views', 'settings'] as const).map(tab => { const Icon = tabIcons[tab]; return <button key={tab} type="button" id={`tools-tab-${tab}`} role="tab" aria-selected={p.tab === tab} aria-controls={`tools-page-${tab}`} tabIndex={p.tab === tab ? 0 : -1} className={p.tab === tab ? styles.active : ''} onClick={() => p.onTabChange(tab)} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const tabs: ToolsTab[] = ['layers', 'views', 'settings']; const index = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3; p.onTabChange(tabs[index]); (e.currentTarget.parentElement?.children[index] as HTMLElement)?.focus(); } }}><Icon size={15} aria-hidden="true" />{tx(tab)}</button>; })}</div>
    <div className={styles.body}>
      <section role="tabpanel" id="tools-page-layers" aria-labelledby="tools-tab-layers" hidden={p.tab !== 'layers'}>
        <p className={styles.label}>{tx('section')}</p>
        {layerKeys.map((key, index) => { const layer = p.layers.find(l => l.id === key); const available = layer?.available ?? false; return <div key={key}><label className={`${styles.toggleRow} ${!available ? styles.unavailable : ''}`} title={!available ? tx('unavailable') : undefined}><span className={styles.toggleLabel}><i style={{ background: layerColors[index] }} />{tx(key)}</span><span className={styles.toggle}><input type="checkbox" checked={layer?.visible ?? false} disabled={!available} onChange={() => p.onToggleLayer(key)} /><span className={styles.switch} /></span></label>{available && layer?.visible && <label className={styles.range}>{tx('opacity')}<input aria-label={`${tx('opacity')} · ${tx(key)}`} type="range" min="0" max="1" step="0.05" value={layer.opacity} onChange={e => p.onOpacity(key, Number(e.target.value))} /><output>{Math.round(layer.opacity * 100)}%</output></label>}</div>; })}
        <div className={styles.rule} /><p className={styles.help}>{tx('layerNotice')}</p>
        {p.regionOptions && p.onRegionChange && <label className={styles.box}>{tx('region')}<select aria-label={tx('region')} value={p.regionId} onChange={e => p.onRegionChange?.(e.target.value)}>{p.regionOptions.map(region => <option key={region.id} value={region.id}>{region.label}</option>)}</select></label>}
      </section>
      <section role="tabpanel" id="tools-page-views" aria-labelledby="tools-tab-views" hidden={p.tab !== 'views'}>
        <p className={styles.label}>{tx('perspective')}</p><div className={styles.segment}>{views.map(view => <button key={view} type="button" disabled={p.anatomicalViewsAvailable === false && view !== 'free'} aria-pressed={p.viewPreset === view} className={p.viewPreset === view ? styles.active : ''} onClick={() => p.onViewPreset(view)}>{tx(view)}</button>)}</div>
        <p className={`${styles.label} ${styles.heading}`}>{tx('anatomicalPlanes')}</p><div className={styles.segment}>{planes.map(plane => <button key={plane} type="button" disabled={p.anatomicalViewsAvailable === false && plane !== 'none'} aria-pressed={p.cutPlane === plane} className={p.cutPlane === plane ? styles.active : ''} onClick={() => p.onCutPlane(plane)}>{tx(plane)}</button>)}</div>
        {p.cutPlane !== 'none' && <label className={styles.range}>{tx('clipOffset')}<input type="range" aria-label={tx('clipOffset')} min="-1" max="1" step="0.05" value={p.clipOffset} onChange={e => p.onClipOffset(Number(e.target.value))} /></label>}<p className={styles.note}>{tx('clippingNotice')}</p>
      </section>
      <section role="tabpanel" id="tools-page-settings" aria-labelledby="tools-tab-settings" hidden={p.tab !== 'settings'}>
        <p className={styles.label}>{tx('customization')}</p>
        <label className={styles.box}><span><strong>{tx('language')}</strong><small>{tx('interface')}</small></span><select aria-label={tx('language')} value={p.settings.language} onChange={e => p.onSettingsChange({ language: e.target.value as Language })}><option value="es">Español</option><option value="en">English</option></select></label>
        <label className={styles.box}><span><strong>{tx('fontSize')}</strong><small>{tx('reading')}</small></span><select aria-label={tx('fontSize')} value={p.settings.fontScale} onChange={e => p.onSettingsChange({ fontScale: Number(e.target.value) as UISettings['fontScale'] })}>{([.9, 1, 1.15, 1.3] as const).map((scale, i) => <option key={scale} value={scale}>{tx((['compact', 'normal', 'large', 'extraLarge'] as const)[i])}</option>)}</select></label>
        <p className={`${styles.label} ${styles.heading}`}>{tx('quality')}</p><div className={styles.segment}>{(['high', 'balanced', 'low'] as const).map(quality => <button key={quality} type="button" aria-pressed={p.settings.quality === quality} className={p.settings.quality === quality ? styles.active : ''} onClick={() => p.onSettingsChange({ quality })}>{tx(quality)}</button>)}</div><p className={styles.help}>{tx('qualityNotice')}</p>
        <p className={`${styles.label} ${styles.heading}`}>{tx('colors')}</p><div className={styles.colorControls}><input className={styles.colorPicker} type="color" aria-label={tx('chooseColor')} value={p.settings.color} onChange={e => p.onSettingsChange({ color: e.target.value.toUpperCase() })} /><input className={styles.hex} aria-label={tx('hexColor')} aria-invalid={invalidHex} aria-describedby={invalidHex ? 'theme-color-error' : undefined} spellCheck={false} maxLength={7} value={hexDraft} onChange={e => { const value = e.target.value; setHexDraft(value); if (/^#[\da-f]{6}$/i.test(value)) { p.onSettingsChange({ color: value.toUpperCase() }); setHexDraft(null); } }} onBlur={() => { setHexDraft(null); }} /></div>
        {invalidHex && <p id="theme-color-error" className={styles.help}>{tx('invalidColor')}</p>}<div className={styles.presets}>{THEME_PRESETS.map((color, i) => <button key={color} className={styles.preset} type="button" style={{ background: color }} title={tx(presetNames[i])} aria-label={tx(presetNames[i])} aria-pressed={p.settings.color.toUpperCase() === color} onClick={() => p.onSettingsChange({ color })} />)}</div>
        <p className={styles.note}>{tx('themeNotice')}</p><button className={styles.reset} type="button" onClick={p.onResetSettings}>{tx('resetSettings')}</button>
      </section>
    </div>
  </aside>;
}
