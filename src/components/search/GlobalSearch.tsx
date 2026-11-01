'use client';

import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { useAnatomySearch } from '@/hooks/useAnatomySearch';
import type { Structure } from '@/modules/anatomy/schemas/catalog';
import { t, type Language } from '@/lib/ui/i18n';
import { VoiceSearch } from './VoiceSearch';
import styles from './search.module.css';

export function GlobalSearch({ onSelect, language = 'es', speciesNames = {} }: { onSelect: (structure: Structure) => void; language?: Language; speciesNames?: Record<string, string> }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const { structures, status } = useAnatomySearch(query);
  const groups = [...new Set(structures.map(item => item.speciesId))];
  const ordered = groups.flatMap(species => structures.filter(item => item.speciesId === species));
  const expanded = open && !!query.trim();
  const current = active >= 0 ? ordered[active] : undefined;
  const speciesLabel = (species: string) => speciesNames[species] ?? (species === 'canine' ? t(language, 'dog') : species === 'feline' ? t(language, 'cat') : species);
  const select = (structure: Structure) => { onSelect(structure); setQuery(structure.spanishName); setOpen(false); setActive(-1); };
  return <div className={styles.area} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <div className={styles.bar}>
      <Search size={18} aria-hidden="true" />
      <input type="search" role="combobox" aria-label={t(language, 'searchLabel')} placeholder={t(language, 'searchPlaceholder')} value={query} maxLength={120} aria-autocomplete="list" aria-expanded={expanded} aria-controls={`${id}-list`} aria-activedescendant={expanded && current ? `${id}-${current.id}` : undefined}
        onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={event => {
          if (event.key === 'Escape') { setOpen(false); setActive(-1); }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault(); setOpen(true);
            if (ordered.length) setActive(index => event.key === 'ArrowDown' ? (index + 1) % ordered.length : (index <= 0 ? ordered.length - 1 : index - 1));
          }
          if (event.key === 'Enter' && expanded && current) { event.preventDefault(); select(current); }
        }} />
      <VoiceSearch language={language} onTranscript={text => { setQuery(text.slice(0, 120)); setOpen(true); setActive(-1); }} />
    </div>
    {expanded && <div className={styles.popover}>
      <div id={`${id}-list`} role="listbox" aria-label={t(language, 'searchResults')}>
        {groups.map(species => <div role="group" aria-label={speciesLabel(species)} key={species}>
          <div className={styles.heading} aria-hidden="true">{speciesLabel(species)}</div>
          {ordered.filter(item => item.speciesId === species).map(item => <button type="button" role="option" id={`${id}-${item.id}`} aria-selected={current?.id === item.id} tabIndex={-1} className={styles.option} key={item.id} onPointerDown={event => event.preventDefault()} onClick={() => select(item)}><strong>{item.spanishName}</strong><small>{item.canonicalLatinName}</small></button>)}
        </div>)}
      </div>
      {!structures.length && <p role="status" className={styles.message}>{t(language, status === 'loading' ? 'searching' : status === 'error' ? 'searchError' : 'noResults')}</p>}
    </div>}
  </div>;
}
