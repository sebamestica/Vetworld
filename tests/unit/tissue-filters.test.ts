import { describe, expect, it } from 'vitest';
import structures from '../../data/anatomy/structures.json';
import systems from '../../data/anatomy/systems.json';
import { structureSchema } from '@/modules/anatomy/schemas/catalog';
import { viewerAssets } from '@/modules/viewer/assets';
import { ALL_RECORDS, LAYER_ROWS, SYSTEM_IDS, TISSUE_GROUPS, groupLayerIdsWithGeometry, isFiltering, matchesRecordFilter, systemKey } from '@/lib/ui/tissue-filters';
import { adaptiveDpr, MIN_INTERACTIVE_DPR } from '@/modules/viewer/rendering';
import { t } from '@/lib/ui/i18n';

const catalog = structures.map(item => structureSchema.parse(item));

describe('filtros de sistema y tejido', () => {
  it('conserva las ocho filas de capas del diseño V2 y deriva tipos de layers.json', () => {
    expect(LAYER_ROWS.map(g => g.id)).toEqual(['skin', 'muscles', 'tendons', 'ligaments', 'vessels', 'nerves', 'bones', 'organs']);
    const kinds = Object.fromEntries(TISSUE_GROUPS.map(g => [g.id, g.kinds]));
    expect(kinds.bones).toEqual(['bone', 'joint', 'cartilage']);
    expect(kinds.vessels).toEqual(['artery', 'vein']);
    expect(kinds.tendons).toEqual(['tendon']);
    expect(kinds.ligaments).toEqual(['ligament']);
    expect(kinds.nerves).toEqual(['nerve']);
    expect(kinds.skin).toEqual([]);
  });
  it('cada ficha del catálogo cae en exactamente un grupo de tejido', () => {
    for (const s of catalog) expect(TISSUE_GROUPS.filter(g => g.kinds.includes(s.kind)).map(g => g.id)).toHaveLength(1);
  });
  it('filtra fichas por sistema y tejido sin requerir malla', () => {
    const felineBones = catalog.filter(s => s.speciesId === 'feline' && matchesRecordFilter(s, { system: 'all', tissue: 'bones' }));
    expect(felineBones.length).toBeGreaterThan(0);
    expect(felineBones.every(s => s.kind === 'bone')).toBe(true);
    const nervous = catalog.filter(s => matchesRecordFilter(s, { system: 'nervous', tissue: 'all' }));
    expect(nervous.every(s => s.systemId === 'nervous')).toBe(true);
    expect(catalog.filter(s => matchesRecordFilter(s, { system: 'muscular', tissue: 'tendons' })).every(s => s.kind === 'tendon')).toBe(true);
    expect(catalog.filter(s => matchesRecordFilter(s, { system: 'all', tissue: 'vessels' }))).toEqual([]);
    expect(catalog.filter(s => matchesRecordFilter(s, ALL_RECORDS))).toHaveLength(catalog.length);
    expect(isFiltering(ALL_RECORDS)).toBe(false);
    expect(isFiltering({ system: 'skeletal', tissue: 'all' })).toBe(true);
  });
  it('traduce todos los sistemas de systems.json', () => {
    expect(SYSTEM_IDS).toEqual(systems.map(s => s.id));
    for (const id of SYSTEM_IDS) { const key = systemKey(id); expect(key).toBeDefined(); expect(t('en', key!)).not.toBe(''); expect(t('es', key!)).toBe(systems.find(s => s.id === id)!.spanishName); }
  });
  it('habilita capas solo con geometría del modelo cargado', () => {
    const tavernier = viewerAssets.find(a => a.id === 'feline:tavernier-skeleton')!;
    expect(LAYER_ROWS.filter(g => groupLayerIdsWithGeometry(g.id, tavernier).length).map(g => g.id)).toEqual(['bones']);
    const demo = viewerAssets.find(a => a.id === 'canine-technical-demo')!;
    expect(LAYER_ROWS.filter(g => groupLayerIdsWithGeometry(g.id, demo).length).map(g => g.id)).toEqual(['muscles', 'tendons', 'nerves', 'bones']);
    expect(groupLayerIdsWithGeometry('bones', null)).toEqual([]);
  });
});

describe('DPR adaptativo', () => {
  it('acota por calidad, por ~4 MP y por el factor de rendimiento', () => {
    expect(adaptiveDpr({ devicePixelRatio: 3, quality: 'high', width: 800, height: 600 })).toBe(2);
    expect(adaptiveDpr({ devicePixelRatio: 3, quality: 'balanced', width: 800, height: 600 })).toBe(1.5);
    expect(adaptiveDpr({ devicePixelRatio: 3, quality: 'low', width: 800, height: 600 })).toBe(1);
    expect(adaptiveDpr({ devicePixelRatio: 2, quality: 'high', width: 2560, height: 1440 })).toBe(1.04);
    expect(adaptiveDpr({ devicePixelRatio: 2, quality: 'high', width: 800, height: 600, performance: 0.5 })).toBe(1);
    expect(adaptiveDpr({ devicePixelRatio: 1, quality: 'low', width: 800, height: 600, performance: 0.5 })).toBe(MIN_INTERACTIVE_DPR);
    expect(adaptiveDpr({ devicePixelRatio: Number.NaN, quality: 'balanced', width: 0, height: 0 })).toBe(1);
  });
});
