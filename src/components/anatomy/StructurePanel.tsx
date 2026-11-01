'use client';

import { useEffect, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { t, type Language, type UiKey } from '@/lib/ui/i18n';
import { fetchApi } from '@/lib/client/api';
import { responseSchemas } from '@/lib/api/contracts';
import type { Structure, Relation, Source } from '@/modules/anatomy/schemas/catalog';
import { referencesResponseSchema, type VisualReference } from '@/modules/media/schemas';
import { isSafeExternalUrl } from '@/modules/media/safety';
import ReferenceGallery from '@/components/media/ReferenceGallery';
import styles from './StructurePanel.module.css';

export interface StructurePanelProps { language?: Language; structureId: string | null; speciesName: string; regionName: string; scientificSpeciesName?: string; regionNames?: Record<string, string>; onClose: () => void; onSelectRelated: (id: string) => void; relatedNames?: Record<string, string> }
type PanelData = { structure: Structure; relations: Relation[]; sources: Source[]; references: VisualReference[] };
const fields = { detailedDescription: 'fieldDetailedDescription', morphology: 'fieldMorphology', location: 'fieldLocation', origin: 'fieldOrigin', insertion: 'fieldInsertion', action: 'fieldAction', function: 'fieldFunction', innervation: 'fieldInnervation', vascularSupply: 'fieldVascularSupply', attachments: 'fieldAttachments', landmarks: 'fieldLandmarks', speciesDifferences: 'fieldSpeciesDifferences' } as const satisfies Record<string, UiKey>;
const evidenceLabels: Record<string, UiKey> = { canonicalLatinName: 'fieldCanonicalLatinName', spanishName: 'fieldSpanishName', aliases: 'fieldAliases', summary: 'fieldSummary', ...fields };
const kindLabels = { bone: 'kindBone', muscle: 'kindMuscle', tendon: 'kindTendon', ligament: 'kindLigament', joint: 'kindJoint', nerve: 'kindNerve', artery: 'kindArtery', vein: 'kindVein', fascia: 'kindFascia', cartilage: 'kindCartilage', organ: 'kindOrgan' } as const satisfies Record<Structure['kind'], UiKey>;
const relationLabels = { origin: ['relOriginOut', 'relOriginIn'], insertion: ['relInsertionOut', 'relInsertionIn'], innervated_by: ['relInnervatedOut', 'relInnervatedIn'], associated_tendon: ['relTendonOut', 'relTendonIn'], adjacent_to: ['relAdjacent', 'relAdjacent'], articulates_with: ['relArticulates', 'relArticulates'] } as const satisfies Record<Relation['type'], readonly [UiKey, UiKey]>;
const tabs = ['detail', 'images', 'sources'] as const;
type Tab = typeof tabs[number];

export default function StructurePanel(props: StructurePanelProps) {
  return <SelectedStructurePanel key={props.structureId ?? 'no-selection'} {...props} />;
}

function SelectedStructurePanel({ structureId, speciesName, regionName, scientificSpeciesName, regionNames, onClose, onSelectRelated, relatedNames, language = 'es' }: StructurePanelProps) {
  const [result, setResult] = useState<{ id: string; data?: PanelData; error?: string; errorKey?: UiKey } | null>(null);
  const tx = (key: UiKey) => t(language, key);
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState<Tab>('detail');
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (tabs.indexOf(current) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    setTab(tabs[index]);
    (event.currentTarget.parentElement?.children[index] as HTMLElement | undefined)?.focus();
  }
  useEffect(() => {
    if (!structureId) return;
    const controller = new AbortController();
    const id = encodeURIComponent(structureId);
    Promise.all([
      fetchApi(`/api/v1/structures/${id}`, responseSchemas.structure, controller.signal),
      fetchApi(`/api/v1/structures/${id}/relations?limit=100`, responseSchemas.relations, controller.signal),
      fetchApi('/api/v1/sources?limit=100', responseSchemas.sources, controller.signal),
      fetchApi(`/api/v1/references?structure=${id}&limit=100`, referencesResponseSchema, controller.signal),
    ]).then(([detail, relations, sources, references]) => {
      if (detail.data.id !== structureId) throw new MismatchError();
      if (!controller.signal.aborted) setResult({ id: structureId, data: { structure: detail.data, relations: relations.data, sources: sources.data.filter(source => detail.data.sourceIds.includes(source.id)), references: references.data } });
    }).catch((error: unknown) => { if (!controller.signal.aborted) setResult(error instanceof MismatchError ? { id: structureId, errorKey: 'recordMismatch' } : error instanceof Error ? { id: structureId, error: error.message } : { id: structureId, errorKey: 'recordError' }); });
    return () => controller.abort();
  }, [structureId, retry]);
  const current = result?.id === structureId ? result : null;
  const data = current?.data;
  const structure = data?.structure;
  // Sin landmark propio: el contenedor <aside> de AppShell es el único complementario de la ficha.
  return <div className={styles.panel} aria-busy={Boolean(structureId && !current)}>
    <div className={styles.head}>
      <div className={styles.heading}><span className={styles.tag}><i />{structure?.review.status === 'pending' ? tx('reviewPending') : tx('anatomy')}</span><button type="button" className={styles.close} onClick={onClose} aria-label={tx('closePanel')}><X size={15} aria-hidden="true" /></button></div>
      {structure && <><h2>{structure.spanishName}</h2><p className={styles.latin}>{structure.canonicalLatinName}</p><div className={styles.chips}><span>{speciesName}</span><span>{regionNames?.[structure.regionId] ?? regionName}</span><span>{tx(kindLabels[structure.kind])}</span></div></>}
    </div>
    {structure && <div className={styles.tabs} role="tablist" aria-label={tx('anatomy')}>{tabs.map(value => <button type="button" key={value} role="tab" id={`structure-tab-${value}`} aria-selected={tab === value} aria-controls={`structure-page-${value}`} tabIndex={tab === value ? 0 : -1} className={tab === value ? styles.active : ''} onClick={() => setTab(value)} onKeyDown={event => onTabKey(event, value)}>{tx(value)}</button>)}</div>}
    <div className={styles.content}>
      {!structureId && <p>{tx('selectPrompt')}</p>}
      {structureId && !current && <p role="status">{tx('loadingRecord')}</p>}
      {current && !current.data && <div role="alert"><p>{current.errorKey ? tx(current.errorKey) : current.error}</p><button type="button" className={styles.retry} onClick={() => { setResult(null); setRetry(value => value + 1); }}>{tx('retry')}</button></div>}
      {structure && data && <>
        {language === 'en' && <p className={styles.notice}>{tx('translationNotice')}</p>}
        <section role="tabpanel" id="structure-page-detail" aria-labelledby="structure-tab-detail" hidden={tab !== 'detail'}>
        {structure.aliases.length > 0 && <p className={styles.aliases}>{tx('synonyms')}: {structure.aliases.join(', ')}</p>}
        <p className={styles.summary}>{structure.summary}</p>
        {Object.entries(fields).map(([key, label]) => { const value = structure[key as keyof typeof fields]; if (!value || (Array.isArray(value) && !value.length)) return null; return <section className={styles.field} key={key}><h3>{tx(label)}</h3>{Array.isArray(value) ? <ul>{value.map(text => <li key={text}>{text}</li>)}</ul> : <p>{value}</p>}</section>; })}
        <section className={styles.review}><h3>{tx(structure.review.status === 'pending' ? 'reviewPending' : structure.review.status === 'validated' ? 'reviewValidated' : 'reviewDocumented')}</h3>{structure.review.notes && <p>{structure.review.notes}</p>}{structure.review.reviewer && <p>{tx('reviewer')}: {structure.review.reviewer}</p>}{structure.review.reviewedAt && <p>{tx('reviewDate')}: {structure.review.reviewedAt}</p>}{structure.missingFields.length > 0 && <><p>{tx('missingFields')}</p><ul>{structure.missingFields.map(key => <li key={key}>{Object.hasOwn(fields, key) ? tx(fields[key as keyof typeof fields]) : key}</li>)}</ul></>}</section>
        {data.relations.length > 0 && <section className={styles.field}><h3>{tx('relatedStructures')}</h3><ul className={styles.relations}>{data.relations.map(relation => { const outgoing = relation.fromId === structure.id; const other = outgoing ? relation.toId : relation.fromId; return <li key={relation.id}><button type="button" onClick={() => onSelectRelated(other)}>{relatedNames?.[other] ?? other}<span>{tx(relationLabels[relation.type][outgoing ? 0 : 1])}</span></button></li>; })}</ul></section>}
        </section>
        <section role="tabpanel" id="structure-page-sources" aria-labelledby="structure-tab-sources" hidden={tab !== 'sources'} className={styles.field}><h3>{tx('bibliographicSources')}</h3>{data.sources.map(source => <article key={source.id} className={styles.source}>{source.url && isSafeExternalUrl(source.url) ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a> : <p>{source.title}</p>}<p>{source.authors.join('; ')}{source.year ? ` · ${source.year}` : ''}</p><p>{source.license.label}</p></article>)}{Boolean(structure.fieldEvidence?.length) && <section data-testid="field-evidence"><h3>{tx('fieldEvidence')}</h3>{structure.fieldEvidence?.map((entry, index) => <article key={index} className={styles.source}><strong>{Object.hasOwn(evidenceLabels, entry.field) ? tx(evidenceLabels[entry.field]) : entry.field}</strong><p>{entry.claim}</p><p>{data.sources.find(source => source.id === entry.sourceId)?.title} · {entry.locator}</p></article>)}</section>}</section>
        <section role="tabpanel" id="structure-page-images" aria-labelledby="structure-tab-images" hidden={tab !== 'images'}><ReferenceGallery language={language} references={data.references} speciesName={speciesName} scientificSpeciesName={scientificSpeciesName} regionNames={regionNames} scientificName={structure.canonicalLatinName} /></section>
      </>}
    </div>
  </div>;
}

class MismatchError extends Error {}
