'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { responseSchemas } from '@/lib/api/contracts';
import { fetchApi } from '@/lib/client/api';
import { normalizeTerm } from '@/modules/search/normalize';
import { viewerAssets } from '@/modules/viewer/assets';
import type { ViewerAsset } from '@/modules/viewer/manifest';
import type { Species, Region, Structure, Model } from '@/modules/anatomy/schemas/catalog';
import StructurePanel from '@/components/anatomy/StructurePanel';
import styles from './AtlasWorkspace.module.css';

const AnatomyViewer = dynamic(() => import('@/components/viewer/AnatomyViewer'), { ssr: false, loading: () => <div className={styles.empty} role="status">Preparando el visor 3D…</div> });
const kindNames: Record<string, string> = { bone: 'Hueso', muscle: 'Músculo', tendon: 'Tendón', ligament: 'Ligamento', nerve: 'Nervio', fascia: 'Fascia', joint: 'Articulación', artery: 'Arteria', vein: 'Vena', cartilage: 'Cartílago', organ: 'Órgano' };
type LayerState = Record<string, { visible: boolean; opacity: number }>;

export default function AtlasWorkspace() {
  const [catalog, setCatalog] = useState<{ species: Species[]; regions: Region[] } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [species, setSpecies] = useState('canine');
  const [region, setRegion] = useState('thoracic-limb');
  const [initialSelectionId, setInitialSelectionId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetchApi('/api/v1/species?limit=100', responseSchemas.species, controller.signal),
      fetchApi('/api/v1/regions?limit=100', responseSchemas.regions, controller.signal),
    ]).then(([species, regions]) => {
      if (!controller.signal.aborted) { setCatalog({ species: species.data, regions: regions.data }); setError(''); }
    }).catch(() => { if (!controller.signal.aborted) setError('No se pudo consultar el catálogo. Comprueba la conexión e inténtalo de nuevo.'); });
    return () => controller.abort();
  }, [retry]);
  return <div className={styles.app}>
    <a className={styles.skipLink} href="#viewer-section">Ir al visor</a>
    <header className={styles.header}>
      <div className={styles.brandMark} aria-hidden="true">AV</div>
      <div><h1>Atlas Veterinario <span>3D</span></h1><p>Anatomía comparada · Estación de estudio</p></div>
      <a className={styles.aboutLink} href="#scientific-note">Estado científico</a>
    </header>
    {!catalog ? <div className={styles.empty} role={error ? 'alert' : 'status'}>{error || 'Consultando especies y regiones…'}{error && <button onClick={() => setRetry(v => v + 1)}>Reintentar</button>}</div> : <>
      <nav className={styles.navigation} aria-label="Especie y región">
        <fieldset className={styles.species}><legend>Especie</legend>{catalog.species.map(item => <button key={item.id} aria-pressed={species === item.id} onClick={() => { setInitialSelectionId(null); setSpecies(item.id); }}><strong>{item.spanishName}</strong><span>{item.scientificName}</span></button>)}</fieldset>
        <label className={styles.region}>Región anatómica<select aria-label="Región anatómica" value={region} onChange={event => { setInitialSelectionId(null); setRegion(event.target.value); }}>{catalog.regions.map(item => <option key={item.id} value={item.id}>{item.parentId ? '  ↳ ' : ''}{item.spanishName}</option>)}</select></label>
        <p className={styles.catalogNote}>Fichas documentadas.<br/>Revisión veterinaria pendiente.</p>
      </nav>
      {error && <p role="alert">{error}</p>}
      <RegionWorkspace key={`${species}:${region}`} species={catalog.species.find(s => s.id === species)!} region={catalog.regions.find(r => r.id === region)!} initialSelectionId={initialSelectionId} regionNames={Object.fromEntries(catalog.regions.map(r => [r.id, r.spanishName]))} onNavigateRelated={async id => {
        try {
          const detail = await fetchApi(`/api/v1/structures/${encodeURIComponent(id)}`, responseSchemas.structure);
          setInitialSelectionId(id); setSpecies(detail.data.speciesId); setRegion(detail.data.regionId);
        } catch { setError('No se pudo abrir la estructura relacionada.'); }
      }}/>
    </>}
    <footer id="scientific-note" className={styles.footer}><strong>Precisión y procedencia.</strong> Las fichas de esta edición son parciales y requieren revisión humana. La geometría temporal es una demostración técnica; no reproduce un espécimen ni sus relaciones espaciales.</footer>
  </div>;
}

function RegionWorkspace({ species, region, initialSelectionId, regionNames, onNavigateRelated }: { species: Species; region: Region; initialSelectionId: string | null; regionNames: Record<string, string>; onNavigateRelated: (id: string) => void }) {
  const [content, setContent] = useState<{ structures: Structure[]; models: Model[] } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectionId);
  const [search, setSearch] = useState('');
  const [layers, setLayers] = useState<LayerState>({});
  const [isolatedId, setIsolatedId] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [quality, setQuality] = useState<'balanced' | 'low' | 'high'>('balanced');
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [panelShown, setPanelShown] = useState(Boolean(initialSelectionId));
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ species: species.id, region: region.id, limit: '100' });
    Promise.all([
      fetchApi(`/api/v1/structures?${params}`, responseSchemas.structures, controller.signal),
      fetchApi(`/api/v1/models?${params}`, responseSchemas.models, controller.signal),
    ]).then(([structures, models]) => { if (!controller.signal.aborted) setContent({ structures: structures.data, models: models.data }); })
      .catch(() => { if (!controller.signal.aborted) setError('No se pudieron cargar las fichas de esta región.'); });
    return () => controller.abort();
  }, [species.id, region.id, retry]);

  const structureIds = new Set(content?.structures.map(s => s.id));
  const eligibleAssets = viewerAssets.filter(asset => asset.speciesId === species.id && asset.availability === 'available' && asset.meshMappings.some(mapping => structureIds.has(mapping.structureId)) && (asset.purpose === 'technical_demo' || content?.models.some(model => model.id === asset.id && model.availability === 'available')));
  const [chosenAssetId, setChosenAssetId] = useState<string | null>(null);
  const baseAsset = eligibleAssets.find(asset => asset.id === chosenAssetId) ?? eligibleAssets[0] ?? null;
  const asset: ViewerAsset | null = baseAsset ? { ...baseAsset, meshMappings: baseAsset.meshMappings.filter(mapping => structureIds.has(mapping.structureId)) } : null;
  const activeLayers: LayerState = Object.fromEntries((asset?.layers ?? []).map(layer => [layer.id, layers[layer.id] ?? { visible: true, opacity: 1 }]));
  const select = (id: string) => {
    if (!structureIds.has(id)) return;
    const mapping = asset?.meshMappings.find(m => m.structureId === id);
    if (mapping) setLayers(current => ({ ...current, [mapping.layerId]: { ...(current[mapping.layerId] ?? { opacity: 1 }), visible: true } }));
    setIsolatedId(current => current && current !== id ? null : current);
    setSelectedId(id); setPanelExpanded(false); setPanelShown(true);
    panelRef.current?.scrollTo({ top: 0 });
  };
  const toggleLayer = (id: string) => {
    const visible = !(activeLayers[id]?.visible ?? true);
    setLayers(current => ({ ...current, [id]: { opacity: activeLayers[id]?.opacity ?? 1, visible } }));
    if (!visible && asset?.meshMappings.some(m => m.layerId === id && m.structureId === selectedId)) { setSelectedId(null); setIsolatedId(null); setPanelShown(false); }
  };
  const reset = () => { setLayers({}); setIsolatedId(null); setSelectedId(null); setResetToken(v => v + 1); setPanelExpanded(false); setPanelShown(false); };
  const filtered = (content?.structures ?? []).filter(s => normalizeTerm([s.spanishName, s.canonicalLatinName, ...s.aliases].join(' ')).includes(normalizeTerm(search)));
  return <div className={styles.workspace}>
    <aside className={styles.catalogSidebar} aria-label="Estructuras de la región">
      <div className={styles.sidebarHeading}><h2>{region.spanishName}</h2><p>{species.spanishName} · {content?.structures.length ?? '…'} fichas</p></div>
      <label className={styles.searchLabel}>Buscar en esta región<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o sinónimo" maxLength={120}/></label>
      {!content ? <p role={error ? 'alert' : 'status'}>{error || 'Cargando fichas…'}{error && <button onClick={() => { setError(''); setRetry(v => v + 1); }}>Reintentar</button>}</p> : <ul className={styles.structureList}>{filtered.map(structure => <li key={structure.id}><button id={`select-${structure.id}`} aria-pressed={selectedId === structure.id} onClick={() => select(structure.id)}><span className={styles.kindDot} data-kind={structure.kind}/><span><strong>{structure.spanishName}</strong><small>{kindNames[structure.kind]} · {structure.completeness === 'partial' ? 'Ficha parcial' : 'Ficha documentada'}</small></span></button></li>)}</ul>}
      {content && !filtered.length && <p className={styles.noRecords}>{content.structures.length ? 'No se encontraron coincidencias.' : 'Todavía no hay fichas registradas en esta región.'}</p>}
      <div className={styles.sidebarFooter}>Selecciona una malla o una ficha para consultar su evidencia.</div>
    </aside>
    <section id="viewer-section" className={styles.viewerSection} aria-label="Visor anatómico">
      <div className={styles.viewerHeading}><div><h2>{region.spanishName}</h2><p>{species.scientificName}</p></div><span className={styles.modeBadge}>{asset?.purpose === 'scientific' ? 'Modelo científico' : asset ? 'Demostración técnica' : 'Sin geometría disponible'}</span></div>
      {eligibleAssets.length > 1 && <label className={styles.assetSelect}>Modelo<select value={baseAsset?.id ?? ''} onChange={e => { setChosenAssetId(e.target.value); reset(); }}>{eligibleAssets.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>}
      <div className={styles.stage}>
        {!content ? <div className={styles.empty} role="status">Preparando la región…</div> : <AnatomyViewer asset={asset} selectedId={selectedId} onSelect={select} layers={activeLayers} isolatedId={isolatedId} resetToken={resetToken} quality={quality}/>}
      </div>
      {asset?.purpose === 'technical_demo' && <p className={styles.demoNotice}><strong>Geometría temporal, no anatómica.</strong> Las formas comprueban selección y capas; cada una abre una ficha real del catálogo. No representan huesos, músculos ni su disposición.</p>}
      <div className={styles.toolbar} aria-label="Herramientas del visor">
        <button onClick={reset}>Restablecer vista</button>
        <button disabled={!selectedId || !asset} aria-pressed={!!isolatedId} onClick={() => setIsolatedId(current => current ? null : selectedId)}>Aislar selección</button>
        <label>Calidad<select value={quality} onChange={e => setQuality(e.target.value as typeof quality)}><option value="low">Ligera</option><option value="balanced">Equilibrada</option><option value="high">Alta</option></select></label>
      </div>
      {!!asset && <details className={styles.layerControls} open><summary>Capas y transparencia</summary><div>{asset.layers.map(layer => <div className={styles.layerRow} key={layer.id}><label><input type="checkbox" checked={activeLayers[layer.id]?.visible ?? true} onChange={() => toggleLayer(layer.id)}/>{layer.label}</label><label className={styles.opacity}>Opacidad<span>{Math.round((activeLayers[layer.id]?.opacity ?? 1) * 100)}%</span><input aria-label={`Opacidad ${layer.label}`} type="range" min="0.2" max="1" step="0.1" value={activeLayers[layer.id]?.opacity ?? 1} disabled={!activeLayers[layer.id]?.visible} onChange={e => setLayers(current => ({ ...current, [layer.id]: { visible: activeLayers[layer.id]?.visible ?? true, opacity: Number(e.target.value) } }))}/></label></div>)}</div></details>}
      {!!content?.models.length && <p className={styles.pendingModels}>Activos anatómicos registrados: {content.models.map(m => `${m.authors.join(', ')} (${m.availability === 'pending' ? 'pendiente de archivo y permisos' : m.availability})`).join('; ')}. No se cargan archivos no verificados.</p>}
    </section>
    <aside ref={panelRef} className={`${styles.detailPanel} ${selectedId && panelShown ? styles.panelOpen : ''} ${panelExpanded ? styles.panelExpanded : ''}`} aria-label="Ficha anatómica" data-testid="detail-panel">
      {selectedId && panelShown && <button className={styles.expandPanel} aria-expanded={panelExpanded} onClick={() => setPanelExpanded(value => !value)}>{panelExpanded ? 'Reducir ficha' : 'Ampliar ficha'}</button>}
      <StructurePanel key={selectedId ?? 'empty'} structureId={panelShown ? selectedId : null} speciesName={species.spanishName} scientificSpeciesName={species.scientificName} regionName={region.spanishName} regionNames={regionNames} relatedNames={Object.fromEntries((content?.structures ?? []).map(s => [s.id, s.spanishName]))} onClose={() => { const id = selectedId; setPanelShown(false); setPanelExpanded(false); if (id) document.getElementById(`select-${id}`)?.focus({ preventScroll: true }); }} onSelectRelated={id => structureIds.has(id) ? select(id) : onNavigateRelated(id)}/>
    </aside>
  </div>;
}
