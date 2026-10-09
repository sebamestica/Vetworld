'use client';
import { ChevronDown, Dog, Layers } from 'lucide-react';
import type { Species, Structure } from '@/modules/anatomy/schemas/catalog';
import { t, type Language } from '@/lib/ui/i18n';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import styles from './AppShell.module.css';

export function Topbar({ species, regions, speciesId, regionId, onSpecies, onRegion, onSelect, language }: {
  species: Species[]; regions: { id: string; spanishName: string }[]; speciesId: string; regionId: string;
  onSpecies: (id: string) => void; onRegion: (id: string) => void; onSelect: (s: Structure) => void; language: Language;
}) {
  const label = (s: Species) => s.id === 'canine' ? t(language, 'dog') : s.id === 'feline' ? t(language, 'cat') : s.spanishName;
  return <header className={styles.topbar}>
    <div className={styles.logo} aria-label="Atlas Veterinario"><Dog size={25} strokeWidth={1.65} aria-hidden="true"/></div>
    <div className={styles.selectors}>
      <label className={styles.pill}><Layers size={15} aria-hidden="true"/><select aria-label={t(language, 'species')} value={speciesId} onChange={e => onSpecies(e.target.value)} disabled={!species.length}>{species.map(s => <option value={s.id} key={s.id}>{label(s)}</option>)}</select><ChevronDown size={15} aria-hidden="true"/></label>
      <label className={`${styles.pill} ${styles.regionPill}`}><select aria-label={t(language, 'region')} value={regionId} onChange={e => onRegion(e.target.value)} disabled={!regions.length}><option value="all">{language === 'en' ? 'Whole animal' : 'Todo el animal'}</option>{regions.map(r => <option key={r.id} value={r.id}>{r.spanishName}</option>)}</select><ChevronDown size={15} aria-hidden="true"/></label>
    </div>
    <GlobalSearch onSelect={onSelect} language={language} speciesNames={Object.fromEntries(species.map(s => [s.id, label(s)]))}/>
    <div className={styles.topStatus}><i/>{t(language, 'status')}</div>
  </header>;
}
