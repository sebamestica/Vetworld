'use client';
import dynamic from 'next/dynamic';
import { useState, type CSSProperties } from 'react';
import { Menu, RotateCcw, RotateCw, Minus, Plus, Maximize2 } from 'lucide-react';
import { useAnatomyWorkspace } from '@/hooks/useAnatomyWorkspace';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { t } from '@/lib/ui/i18n';
import { assetCredit } from '@/modules/viewer/selection';
import { ToolsPanel, type ToolsTab } from '@/components/tools/ToolsPanel';
import { ALL_RECORDS, LAYER_ROWS, groupLayerIdsWithGeometry, matchesRecordFilter, type RecordFilter } from '@/lib/ui/tissue-filters';
import StructurePanel from '@/components/anatomy/StructurePanel';
import { Topbar } from './Topbar';
import { MobileOrientationNotice } from './MobileOrientationNotice';
import styles from './AppShell.module.css';
const AnatomyViewer = dynamic(() => import('@/components/viewer/AnatomyViewer'), { ssr: false, loading: () => <div className={styles.loading} role="status">{t('es', 'loading3d')}</div> });
// El marcador de carga de next/dynamic no recibe props: el texto queda en el idioma por defecto.

export default function AppShell({ technicalDemo = false }: {technicalDemo?: boolean}) {
  const data = useAnatomyWorkspace(technicalDemo), theme = useThemeSettings(), language = theme.settings.language;
  const [toolsOpen, setToolsOpen] = useState(false), [tab, setTab] = useState<ToolsTab>('layers');
  const [recordFilter, setRecordFilter] = useState<RecordFilter>(ALL_RECORDS);
  const idsFor = (group: string) => groupLayerIdsWithGeometry(group, data.asset);
  const layerGroups = LAYER_ROWS.map(g => { const ids = idsFor(g.id); return { id:g.id,label:t(language,g.id),available:!!ids.length,visible:ids.some(id => data.activeLayers[id]?.visible),opacity:ids.length ? data.activeLayers[ids[0]]?.opacity ?? 1 : 1 }; });
  const filteredStructures = data.structures.filter(s => matchesRecordFilter(s, recordFilter));
  const credit = assetCredit(data.asset);
  const structureNames = Object.fromEntries(data.structures.map(s => [s.id, { spanishName: s.spanishName, canonicalLatinName: s.canonicalLatinName }]));
  return <div className={styles.app} style={theme.variables as CSSProperties} lang={language} data-testid="app-shell">
    <Topbar species={data.species} regions={data.regions} speciesId={data.speciesId} regionId={data.regionId} onSpecies={id => { data.changeSpecies(id); setToolsOpen(false); }} onRegion={id => { data.changeRegion(id); setToolsOpen(false); }} onSelect={s => { data.selectStructure(s); setToolsOpen(false); }} language={language} recordFilter={recordFilter}/>
    <section className={styles.stage} aria-label={t(language,'anatomicalViewer')}>
      <div className={styles.animalTitle}>{data.currentSpecies?.id === 'canine' ? t(language,'dog') : data.currentSpecies?.id === 'feline' ? t(language,'cat') : data.currentSpecies?.spanishName}</div>
      <button className={styles.hamburger} aria-label={t(language,'openTools')} aria-expanded={toolsOpen} aria-controls="atlas-tools" onClick={() => setToolsOpen(v => !v)}><Menu size={22} aria-hidden="true"/></button>
      <ToolsPanel open={toolsOpen} onClose={() => setToolsOpen(false)} language={language} tab={tab} onTabChange={setTab} layers={layerGroups} onToggleLayer={g => idsFor(g).forEach(data.toggleLayer)} onOpacity={(g,v) => idsFor(g).forEach(id => data.opacity(id,v))} viewPreset={data.viewPreset} onViewPreset={data.setViewPreset} cutPlane={data.cutPlane} onCutPlane={data.setCutPlane} clipOffset={data.clipOffset} onClipOffset={data.setClipOffset} settings={theme.settings} onSettingsChange={theme.updateSettings} onResetSettings={theme.resetSettings} anatomicalViewsAvailable={data.asset?.purpose === 'technical_demo'} regionOptions={[{id:'all',label:t(language,'wholeAnimal')},...data.regions].map(r => ({ id:r.id,label:'spanishName' in r ? r.spanishName : r.label }))} regionId={data.regionId} onRegionChange={data.changeRegion} modelAvailable={!!data.asset} records={data.structures} recordFilter={recordFilter} onRecordFilter={setRecordFilter} onOpenRecord={id => { void data.selectId(id); setToolsOpen(false); }}/>
      <div className={`${styles.visual} ${data.panelOpen ? styles.withPanel : ''}`}>
        {data.error ? <div className={styles.loading} role="alert">{data.error}<button type="button" onClick={data.retry}>{t(language,'retry')}</button></div> : data.loading || !theme.ready ? <div className={styles.loading} role="status">{t(language,'loadingCatalogue')}</div> : <AnatomyViewer asset={data.asset} selectedId={data.selectedId} onSelect={data.selectId} layers={data.activeLayers} isolatedId={data.isolatedId} resetToken={data.resetToken} quality={theme.settings.quality} variant="immersive" language={language} backgroundColor={theme.stageColor} exposure={theme.exposure} viewPreset={data.viewPreset} viewToken={data.viewToken} zoomRequest={data.zoomRequest} cutPlane={data.cutPlane} clipOffset={data.clipOffset} structureNames={structureNames}/>}
      </div>
      <div className={styles.bottomBar} role="group" aria-label={t(language,'viewerControls')}>
        <button aria-label={t(language,'view')} disabled={data.asset?.purpose !== 'technical_demo'} onClick={() => data.setViewPreset(data.viewPreset === 'left' ? 'right' : 'left')}><RotateCw size={16} aria-hidden="true"/><span>{t(language,'view')}</span></button><i/>
        <button aria-label={t(language,'zoomOut')} onClick={() => data.zoom(-1)} disabled={!data.asset}><Minus size={18} aria-hidden="true"/></button><button aria-label={t(language,'zoomIn')} onClick={() => data.zoom(1)} disabled={!data.asset}><Plus size={18} aria-hidden="true"/></button><i/>
        <button aria-label={t(language,'isolate')} disabled={!data.asset?.meshMappings.some(m => m.structureId === data.selectedId)} aria-pressed={!!data.isolatedId} onClick={data.toggleIsolation}><Maximize2 size={16} aria-hidden="true"/><span>{t(language,'isolate')}</span></button>
        <button aria-label={t(language,'restore')} onClick={data.reset}><RotateCcw size={16} aria-hidden="true"/><span>{t(language,'restore')}</span></button>
      </div>
      {data.asset?.purpose === 'technical_demo' && <div className={styles.provisional}>{t(language,'provisionalGeometry')}</div>}
      {credit && <div className={styles.provisional} data-testid="asset-attribution"><a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">{credit.label}</a> · <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">{credit.licenseName}</a>{credit.changes && <><br/>{credit.changes}</>}<br/>{t(language,'scaleUnverified')}{data.coverage === 'whole-body' && data.regionId !== 'all' && <><br/>{t(language,'regionFilterNotice')}</>}{data.coverage === 'partial' && <><br/>{t(language,'partialCoverageNotice')}</>}</div>}
      {data.cutPlane !== 'none' && <div className={styles.cutNotice}>{t(language,'clippingNotice')}</div>}
      {!data.asset && !data.loading && <label className={styles.fallbackList}>{t(language,'openRecord')}<select aria-label={t(language,'openRecord')} value={data.selectedId ?? ''} onChange={e => data.selectId(e.target.value)}><option value="">—</option>{filteredStructures.map(s => <option key={s.id} value={s.id}>{s.spanishName}</option>)}</select></label>}
      {!data.asset && !data.loading && !data.structures.length && <p className={styles.emptyRegion}>{t(language,'emptyRegion')}</p>}
      {data.panelOpen && data.selectedId && <aside className={styles.panel} data-testid="detail-panel" aria-label={t(language,'anatomy')}><StructurePanel key={data.selectedId} structureId={data.selectedId} speciesName={data.currentSpecies?.spanishName ?? ''} scientificSpeciesName={data.currentSpecies?.scientificName} regionName={data.currentRegion?.spanishName ?? ''} regionNames={Object.fromEntries(data.regions.map(r => [r.id,r.spanishName]))} relatedNames={Object.fromEntries(data.structures.map(s => [s.id,s.spanishName]))} onClose={data.closePanel} onSelectRelated={data.selectId} language={language}/></aside>}
    </section><MobileOrientationNotice language={language}/>
  </div>;
}
