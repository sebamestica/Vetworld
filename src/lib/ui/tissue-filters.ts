import layers from '../../../data/anatomy/layers.json';
import systems from '../../../data/anatomy/systems.json';
import type { StructureKind } from '@/modules/anatomy/schemas/catalog';
import type { UiKey } from './i18n';

/**
 * Grupos de tejido del menú de capas (UI V2). Cada grupo reúne capas del visor (`layerIds`) y
 * los tipos de ficha (`kinds`) declarados para esas capas en `data/anatomy/layers.json`.
 * `muscles-unclassified` y `skin` no figuran en layers.json: la primera solo existe en la fixture
 * técnica y la segunda no tiene capa ni tipo de ficha registrados, por lo que su filtro queda vacío.
 * `row: false` indica un grupo filtrable en fichas sin fila de capa en el diseño V2 (fascias).
 */
export type TissueGroupId = 'skin' | 'muscles' | 'tendons' | 'ligaments' | 'vessels' | 'nerves' | 'bones' | 'organs' | 'fascias';
const groupLayers: { id: TissueGroupId; layerIds: string[]; row: boolean }[] = [
  { id: 'skin', layerIds: ['skin'], row: true },
  { id: 'muscles', layerIds: ['muscles-unclassified', 'superficial-muscles', 'deep-muscles'], row: true },
  { id: 'tendons', layerIds: ['tendons'], row: true },
  { id: 'ligaments', layerIds: ['ligaments'], row: true },
  { id: 'vessels', layerIds: ['vessels'], row: true },
  { id: 'nerves', layerIds: ['nerves'], row: true },
  { id: 'bones', layerIds: ['skeleton'], row: true },
  { id: 'organs', layerIds: ['organs'], row: true },
  { id: 'fascias', layerIds: ['fascias'], row: false },
];
const kindsByLayer = new Map<string, readonly string[]>(layers.map(layer => [layer.id, layer.kinds]));
export const TISSUE_GROUPS = groupLayers.map(group => ({ ...group, kinds: group.layerIds.flatMap(id => kindsByLayer.get(id) ?? []) as StructureKind[] }));
export const LAYER_ROWS = TISSUE_GROUPS.filter(group => group.row);

export const SYSTEM_IDS = systems.map(system => system.id);
const systemKeys: Record<string, UiKey> = { skeletal: 'systemSkeletal', muscular: 'systemMuscular', nervous: 'systemNervous', cardiovascular: 'systemCardiovascular', visceral: 'systemVisceral' };
/** Clave de interfaz del sistema; `undefined` si systems.json incorpora un sistema aún no traducido. */
export function systemKey(id: string): UiKey | undefined { return systemKeys[id]; }

export interface RecordFilter { system: string; tissue: TissueGroupId | 'all' }
export const ALL_RECORDS: RecordFilter = { system: 'all', tissue: 'all' };
type Filterable = { kind: StructureKind; systemId: string };

/** Filtra fichas por sistema y tejido a partir de `systemId`/`kind`, con independencia de que tengan malla. */
export function matchesRecordFilter(structure: Filterable, filter: RecordFilter): boolean {
  if (filter.system !== 'all' && structure.systemId !== filter.system) return false;
  if (filter.tissue === 'all') return true;
  return TISSUE_GROUPS.find(group => group.id === filter.tissue)?.kinds.includes(structure.kind) ?? false;
}
export function isFiltering(filter: RecordFilter) { return filter.system !== 'all' || filter.tissue !== 'all'; }

/** Capas del grupo con geometría real en el modelo cargado (mappings seleccionables o nodos solo visuales). */
export function groupLayerIdsWithGeometry(group: string, asset: { meshMappings: { layerId: string }[]; visualNodes?: { layerId: string }[] } | null | undefined): string[] {
  const ids = TISSUE_GROUPS.find(g => g.id === group)?.layerIds ?? [];
  if (!asset) return [];
  return ids.filter(id => asset.meshMappings.some(m => m.layerId === id) || !!asset.visualNodes?.some(m => m.layerId === id));
}
