'use client';
import dynamic from 'next/dynamic';
import { useState, type CSSProperties } from 'react';
import { Menu, RotateCcw, RotateCw, Minus, Plus, Maximize2 } from 'lucide-react';
import { useAnatomyWorkspace } from '@/hooks/useAnatomyWorkspace';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { t, type UiKey } from '@/lib/ui/i18n';
import { ToolsPanel, type ToolsTab } from '@/components/tools/ToolsPanel';
import StructurePanel from '@/components/anatomy/StructurePanel';
import { Topbar } from './Topbar';
import { MobileOrientationNotice } from './MobileOrientationNotice';
import styles from './AppShell.module.css';
const AnatomyViewer = dynamic(() => import('@/components/viewer/AnatomyViewer'), { ssr: false, loading: () => <div className={styles.loading} role="status">Cargando 3D…</div> });
const groups: { id: UiKey; layers: string[] }[] = [{ id:'skin',layers:['skin'] },{ id:'muscles',layers:['muscles-unclassified','superficial-muscles','deep-muscles'] },{ id:'tendons',layers:['tendons'] },{ id:'ligaments',layers:['ligaments'] },{ id:'vessels',layers:['vessels'] },{ id:'nerves',layers:['nerves'] },{ id:'bones',layers:['skeleton'] },{ id:'organs',layers:['organs'] }];

export default function AppShell({ technicalDemo = false }: {technicalDemo?: boolean}) {
  const data = useAnatomyWorkspace(technicalDemo), theme = useThemeSettings(), language = theme.settings.language;
  const [toolsOpen, setToolsOpen] = useState(false), [tab, setTab] = useState<ToolsTab>('layers');
  const hasLayer = (id: string) => data.asset?.meshMappings.some(m => m.layerId === id) || data.asset?.visualNodes?.some(m => m.layerId === id);
  const layerGroups = groups.map(g => { const ids = g.layers.filter(hasLayer); return { id:g.id,label:t(language,g.id),available:!!ids.length,visible:ids.some(id => data.activeLayers[id]?.visible),opacity:ids.length ? data.activeLayers[ids[0]]?.opacity ?? 1 : 1 }; });
  const idsFor = (group: string) => groups.find(g => g.id === group)?.layers.filter(hasLayer) ?? [];
  return <div className={styles.app} style={theme.variables as CSSProperties} lang={language} data-testid="app-shell">
    <Topbar species={data.species} regions={data.regions} speciesId={data.speciesId} regionId={data.regionId} onSpecies={id => { data.changeSpecies(id); setToolsOpen(false); }} onRegion={id => { data.changeRegion(id); setToolsOpen(false); }} onSelect={s => { data.selectStructure(s); setToolsOpen(false); }} language={language}/>
    <section className={styles.stage} aria-label={language === 'en' ? 'Anatomical viewer' : 'Visor anatómico'}>
      <div className={styles.animalTitle}>{data.currentSpecies?.id === 'canine' ? t(language,'dog') : data.currentSpecies?.id === 'feline' ? t(language,'cat') : data.currentSpecies?.spanishName}</div>
      <button className={styles.hamburger} aria-label={t(language,'openTools')} aria-expanded={toolsOpen} aria-controls="atlas-tools" onClick={() => setToolsOpen(v => !v)}><Menu size={22} aria-hidden="true"/></button>
      <ToolsPanel open={toolsOpen} onClose={() => setToolsOpen(false)} language={language} tab={tab} onTabChange={setTab} layers={layerGroups} onToggleLayer={g => idsFor(g).forEach(data.toggleLayer)} onOpacity={(g,v) => idsFor(g).forEach(id => data.opacity(id,v))} viewPreset={data.viewPreset} onViewPreset={data.setViewPreset} cutPlane={data.cutPlane} onCutPlane={data.setCutPlane} clipOffset={data.clipOffset} onClipOffset={data.setClipOffset} settings={theme.settings} onSettingsChange={theme.updateSettings} onResetSettings={theme.resetSettings} anatomicalViewsAvailable={data.asset?.purpose === 'technical_demo'} regionOptions={[{id:'all',label:language === 'en' ? 'Whole animal' : 'Todo el animal'},...data.regions].map(r => ({ id:r.id,label:'spanishName' in r ? r.spanishName : r.label }))} regionId={data.regionId} onRegionChange={data.changeRegion}/>
      <div className={`${styles.visual} ${data.panelOpen ? styles.withPanel : ''}`}>
        {data.error ? <div className={styles.loading} role="alert">{data.error}<button onClick={data.retry}>Reintentar</button></div> : data.loading || !theme.ready ? <div className={styles.loading} role="status">{language === 'en' ? 'Loading catalogue…' : 'Consultando catálogo…'}</div> : <AnatomyViewer asset={data.asset} selectedId={data.selectedId} onSelect={data.selectId} layers={data.activeLayers} isolatedId={data.isolatedId} resetToken={data.resetToken} quality={theme.settings.quality} variant="immersive" language={language} backgroundColor={theme.stageColor} exposure={theme.exposure} viewPreset={data.viewPreset} viewToken={data.viewToken} zoomRequest={data.zoomRequest} cutPlane={data.cutPlane} clipOffset={data.clipOffset}/>}
      </div>
      <div className={styles.bottomBar} aria-label={language === 'en' ? 'Viewer controls' : 'Controles del visor'}>
        <button aria-label={t(language,'view')} disabled={data.asset?.purpose !== 'technical_demo'} onClick={() => data.setViewPreset(data.viewPreset === 'left' ? 'right' : 'left')}><RotateCw size={16} aria-hidden="true"/><span>{t(language,'view')}</span></button><i/>
        <button aria-label={t(language,'zoomOut')} onClick={() => data.zoom(-1)} disabled={!data.asset}><Minus size={18} aria-hidden="true"/></button><button aria-label={t(language,'zoomIn')} onClick={() => data.zoom(1)} disabled={!data.asset}><Plus size={18} aria-hidden="true"/></button><i/>
        <button aria-label={t(language,'isolate')} disabled={!data.asset?.meshMappings.some(m => m.structureId === data.selectedId)} aria-pressed={!!data.isolatedId} onClick={data.toggleIsolation}><Maximize2 size={16} aria-hidden="true"/><span>{t(language,'isolate')}</span></button>
        <button aria-label={t(language,'restore')} onClick={data.reset}><RotateCcw size={16} aria-hidden="true"/><span>{t(language,'restore')}</span></button>
      </div>
      {data.asset?.purpose === 'technical_demo' && <div className={styles.provisional}>{language === 'en' ? 'Provisional geometry · not anatomical' : 'Geometría provisional · no anatómica'}</div>}
      {data.asset?.scope === 'whole-body' && <div className={styles.provisional} data-testid="asset-attribution"><a href={data.asset.sourceUrl} target="_blank" rel="noopener noreferrer">Cat Skeleton · Tavernier Amaury</a> · <a href={data.asset.licenseUrl} target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a><br/>{language === 'en' ? 'Scale and anatomical coverage unverified · bone selection pending' : 'Escala y cobertura sin verificar · selección ósea pendiente'}{data.regionId !== 'all' && <><br/>{language === 'en' ? 'Region filters records; unsegmented model remains visible.' : 'La región filtra fichas; el modelo sin segmentar permanece visible.'}</>}</div>}
      {data.cutPlane !== 'none' && <div className={styles.cutNotice}>{t(language,'clippingNotice')}</div>}
      {!data.asset && !data.loading && <label className={styles.fallbackList}>{language === 'en' ? 'Open anatomical record' : 'Consultar estructura'}<select aria-label={language === 'en' ? 'Open anatomical record' : 'Consultar estructura'} value={data.selectedId ?? ''} onChange={e => data.selectId(e.target.value)}><option value="">—</option>{data.structures.map(s => <option key={s.id} value={s.id}>{s.spanishName}</option>)}</select></label>}
      {!data.asset && !data.loading && !data.structures.length && <p className={styles.emptyRegion}>{language === 'en' ? 'No anatomical records registered in this region yet.' : 'Todavía no hay fichas registradas en esta región.'}</p>}
      {data.panelOpen && data.selectedId && <aside className={styles.panel} data-testid="detail-panel"><StructurePanel key={data.selectedId} structureId={data.selectedId} speciesName={data.currentSpecies?.spanishName ?? ''} scientificSpeciesName={data.currentSpecies?.scientificName} regionName={data.currentRegion?.spanishName ?? ''} regionNames={Object.fromEntries(data.regions.map(r => [r.id,r.spanishName]))} relatedNames={Object.fromEntries(data.structures.map(s => [s.id,s.spanishName]))} onClose={data.closePanel} onSelectRelated={data.selectId} language={language}/></aside>}
    </section><MobileOrientationNotice language={language}/>
  </div>;
}
