'use client';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { responseSchemas } from '@/lib/api/contracts';
import { fetchApi } from '@/lib/client/api';
import { viewerAssets } from '@/modules/viewer/assets';
import type { Structure } from '@/modules/anatomy/schemas/catalog';
import type { ViewerLayers } from '@/modules/viewer/visibility';
import type { CutPlane, ViewPreset } from '@/modules/viewer/controls';

function useApi<T extends z.ZodType>(path: string, schema: T, retry: number) {
  const [result, setResult] = useState<{ path: string; retry: number; data?: z.output<T>; error?: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchApi(path, schema, controller.signal).then(data => { if (!controller.signal.aborted) setResult({ path, retry, data }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ path, retry, error: 'No se pudo consultar el catálogo.' }); });
    return () => controller.abort();
  }, [path, schema, retry]);
  return result?.path === path && result.retry === retry ? result : null;
}

export function useAnatomyWorkspace(technicalDemo = false) {
  const [speciesId, setSpecies] = useState(technicalDemo ? 'canine' : 'feline'), [regionId, setRegion] = useState(technicalDemo ? 'thoracic-limb' : 'all');
  const [retry, setRetry] = useState(0), [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false), [layers, setLayers] = useState<ViewerLayers>({});
  const [isolatedId, setIsolatedId] = useState<string | null>(null), [resetToken, setResetToken] = useState(0);
  const [viewPreset, setPreset] = useState<ViewPreset>('free'), [viewToken, setViewToken] = useState(0);
  const [zoomRequest, setZoomRequest] = useState({ token: 0, delta: 0 });
  const [cutPlane, setCutPlane] = useState<CutPlane>('none'), [clipOffset, setClipOffset] = useState(0);
  const [navigationError, setNavigationError] = useState('');
  const speciesQuery = useApi('/api/v1/species?limit=100', responseSchemas.species, retry);
  const regionQuery = useApi(`/api/v1/regions?species=${encodeURIComponent(speciesId)}&limit=100`, responseSchemas.regions, retry);
  const params = new URLSearchParams({ species: speciesId, limit: '100' });
  if (regionId !== 'all') params.set('region', regionId);
  const structureQuery = useApi(`/api/v1/structures?${params}`, responseSchemas.structures, retry);
  const modelQuery = useApi(`/api/v1/models?species=${encodeURIComponent(speciesId)}&limit=100`, responseSchemas.models, retry);
  const species = speciesQuery?.data?.data ?? [], regions = regionQuery?.data?.data ?? [], structures = structureQuery?.data?.data ?? [];
  const currentSpecies = species.find(s => s.id === speciesId), currentRegion = regions.find(r => r.id === regionId);
  const knownIds = new Set(currentRegion?.structureIds ?? structures.map(s => s.id));
  const baseAsset = technicalDemo
    ? viewerAssets.find(a => a.speciesId === speciesId && a.purpose === 'technical_demo' && a.meshMappings.some(m => knownIds.has(m.structureId)))
    : viewerAssets.find(a => a.speciesId === speciesId && a.scope === 'whole-body' && a.availability === 'available' && modelQuery?.data?.data.some(m => m.id === a.id && m.availability === 'available'));
  const asset = baseAsset ? (baseAsset.purpose === 'scientific' ? baseAsset : { ...baseAsset, meshMappings: baseAsset.meshMappings.filter(m => knownIds.has(m.structureId)) }) : null;
  const activeLayers: ViewerLayers = Object.fromEntries((asset?.layers ?? []).map(l => [l.id, layers[l.id] ?? { visible: true, opacity: 1 }]));
  function reset() {
    if (!technicalDemo) setRegion('all');
    setLayers({}); setIsolatedId(null); setSelectedId(null); setPanelOpen(false); setPreset('free'); setCutPlane('none'); setClipOffset(0); setResetToken(n => n + 1);
  }
  function changeSpecies(id: string) { if (id !== speciesId) { reset(); setSpecies(id); setRegion('all'); } }
  function changeRegion(id: string) { if (id !== regionId) { reset(); setRegion(id); } }
  function selectKnown(id: string) {
    const mapping = asset?.meshMappings.find(m => m.structureId === id);
    if (mapping) setLayers(current => ({ ...current, [mapping.layerId]: { visible: true, opacity: current[mapping.layerId]?.opacity || 1 } }));
    setSelectedId(id); setPanelOpen(true); setIsolatedId(current => current === id ? current : null);
  }
  function selectStructure(s: Structure) {
    if (s.speciesId !== speciesId || !knownIds.has(s.id)) { reset(); setSpecies(s.speciesId); setRegion(['shoulder', 'brachium'].includes(s.regionId) ? 'thoracic-limb' : s.regionId); }
    selectKnown(s.id);
  }
  async function selectId(id: string) {
    if (knownIds.has(id)) { selectKnown(id); return; }
    try { selectStructure((await fetchApi(`/api/v1/structures/${encodeURIComponent(id)}`, responseSchemas.structure)).data); }
    catch { setNavigationError('No se pudo abrir la estructura relacionada.'); }
  }
  function toggleLayer(id: string) {
    const current = activeLayers[id] ?? { visible: true, opacity: 1 };
    setLayers(values => ({ ...values, [id]: { ...current, visible: !current.visible } }));
    if (current.visible && asset?.meshMappings.some(m => m.layerId === id && m.structureId === selectedId)) { setSelectedId(null); setPanelOpen(false); setIsolatedId(null); }
  }
  function opacity(id: string, value: number) {
    const amount = Math.min(1, Math.max(0, value)); setLayers(current => ({ ...current, [id]: { visible: amount > 0, opacity: amount } }));
    if (amount === 0 && asset?.meshMappings.some(m => m.layerId === id && m.structureId === selectedId)) { setSelectedId(null); setPanelOpen(false); setIsolatedId(null); }
  }
  return { species, regions, speciesId, regionId, currentSpecies, currentRegion, structures, models: modelQuery?.data?.data ?? [], asset, activeLayers,
    selectedId, panelOpen, closePanel: () => setPanelOpen(false), selectId, selectStructure, changeSpecies, changeRegion, isolatedId, toggleIsolation: () => setIsolatedId(v => v ? null : selectedId), reset, resetToken, toggleLayer, opacity,
    viewPreset, viewToken, setViewPreset: (view: ViewPreset) => { setPreset(view); setViewToken(n => n + 1); }, zoomRequest, zoom: (delta: number) => setZoomRequest(v => ({ token: v.token + 1, delta })), cutPlane, setCutPlane, clipOffset, setClipOffset,
    loading: !structureQuery?.data || !modelQuery?.data, error: navigationError || speciesQuery?.error || regionQuery?.error || structureQuery?.error || modelQuery?.error,
    retry: () => { setNavigationError(''); setRetry(n => n + 1); },
  };
}
