'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/client/api';
import { responseSchemas } from '@/lib/api/contracts';
import type { Structure, Relation, Source } from '@/modules/anatomy/schemas/catalog';
import { referencesResponseSchema, type VisualReference } from '@/modules/media/schemas';
import { isSafeExternalUrl } from '@/modules/media/safety';
import ReferenceGallery from '@/components/media/ReferenceGallery';
import styles from './StructurePanel.module.css';

export interface StructurePanelProps { structureId: string | null; speciesName: string; regionName: string; scientificSpeciesName?: string; regionNames?: Record<string, string>; onClose: () => void; onSelectRelated: (id: string) => void; relatedNames?: Record<string, string> }
type PanelData = { structure: Structure; relations: Relation[]; sources: Source[]; references: VisualReference[] };
const fields = { detailedDescription: 'Descripción detallada', morphology: 'Morfología', location: 'Localización', origin: 'Origen', insertion: 'Inserción', action: 'Acción', function: 'Función', innervation: 'Inervación', vascularSupply: 'Irrigación', attachments: 'Inserciones y fijaciones', landmarks: 'Referencias anatómicas', speciesDifferences: 'Diferencias entre especies' } as const;
const kindLabels = { bone: 'Hueso', muscle: 'Músculo', tendon: 'Tendón', ligament: 'Ligamento', joint: 'Articulación', nerve: 'Nervio', artery: 'Arteria', vein: 'Vena', fascia: 'Fascia', cartilage: 'Cartílago', organ: 'Órgano' };
const relationLabels = { origin: ['Se origina en', 'Origen de'], insertion: ['Se inserta en', 'Inserción de'], innervated_by: ['Inervado por', 'Inerva'], associated_tendon: ['Tendón asociado', 'Músculo asociado'], adjacent_to: ['Estructura próxima', 'Estructura próxima'], articulates_with: ['Articula con', 'Articula con'] };

export default function StructurePanel(props: StructurePanelProps) {
  return <SelectedStructurePanel key={props.structureId ?? 'no-selection'} {...props} />;
}

function SelectedStructurePanel({ structureId, speciesName, regionName, scientificSpeciesName, regionNames, onClose, onSelectRelated, relatedNames }: StructurePanelProps) {
  const [result, setResult] = useState<{ id: string; data?: PanelData; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
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
      if (detail.data.id !== structureId) throw new Error('La respuesta no corresponde a la estructura seleccionada.');
      if (!controller.signal.aborted) setResult({ id: structureId, data: { structure: detail.data, relations: relations.data, sources: sources.data.filter(source => detail.data.sourceIds.includes(source.id)), references: references.data } });
    }).catch((error: unknown) => { if (!controller.signal.aborted) setResult({ id: structureId, error: error instanceof Error ? error.message : 'No se pudo consultar la ficha.' }); });
    return () => controller.abort();
  }, [structureId, retry]);
  const current = result?.id === structureId ? result : null;
  const data = current?.data;
  const structure = data?.structure;
  return <aside className={styles.panel} aria-label="Ficha anatómica" aria-busy={Boolean(structureId && !current)}>
    <header className={styles.header}><span>Ficha anatómica</span><button onClick={onClose} aria-label="Cerrar ficha">Cerrar ×</button></header>
    <div className={styles.content}>
      {!structureId && <p>Seleccione una estructura para consultar su ficha y sus referencias.</p>}
      {structureId && !current && <p role="status">Cargando ficha anatómica…</p>}
      {current?.error && <div role="alert"><p>{current.error}</p><button className={styles.retry} onClick={() => { setResult(null); setRetry(value => value + 1); }}>Reintentar</button></div>}
      {structure && data && <>
        <p className={styles.context}>{speciesName} · {regionNames?.[structure.regionId] ?? regionName} · {kindLabels[structure.kind]}</p>
        <h2>{structure.spanishName}</h2><p className={styles.latin}>{structure.canonicalLatinName}</p>
        {structure.aliases.length > 0 && <p className={styles.aliases}>Sinónimos: {structure.aliases.join(', ')}</p>}
        <p className={styles.summary}>{structure.summary}</p>
        {Object.entries(fields).map(([key, label]) => { const value = structure[key as keyof typeof fields]; if (!value || (Array.isArray(value) && !value.length)) return null; return <section className={styles.field} key={key}><h3>{label}</h3>{Array.isArray(value) ? <ul>{value.map(text => <li key={text}>{text}</li>)}</ul> : <p>{value}</p>}</section>; })}
        <section className={styles.review}><h3>{structure.review.status === 'pending' ? 'Revisión humana pendiente' : structure.review.status === 'validated' ? 'Validación humana documentada' : 'Revisión humana documentada'}</h3>{structure.review.notes && <p>{structure.review.notes}</p>}{structure.review.reviewer && <p>Responsable: {structure.review.reviewer}</p>}{structure.review.reviewedAt && <p>Fecha: {structure.review.reviewedAt}</p>}{structure.missingFields.length > 0 && <><p>Campos pendientes de documentación:</p><ul>{structure.missingFields.map(key => <li key={key}>{fields[key as keyof typeof fields] ?? key}</li>)}</ul></>}</section>
        {data.relations.length > 0 && <section className={styles.field}><h3>Estructuras relacionadas</h3><ul className={styles.relations}>{data.relations.map(relation => { const outgoing = relation.fromId === structure.id; const other = outgoing ? relation.toId : relation.fromId; return <li key={relation.id}><button onClick={() => onSelectRelated(other)}>{relatedNames?.[other] ?? other}<span>{relationLabels[relation.type][outgoing ? 0 : 1]}</span></button></li>; })}</ul></section>}
        <section className={styles.field}><h3>Fuentes bibliográficas</h3>{data.sources.map(source => <article key={source.id} className={styles.source}>{source.url && isSafeExternalUrl(source.url) ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a> : <p>{source.title}</p>}<p>{source.authors.join('; ')}{source.year ? ` · ${source.year}` : ''}</p><p>{source.license.label}</p></article>)}</section>
        <ReferenceGallery references={data.references} speciesName={speciesName} scientificSpeciesName={scientificSpeciesName} regionNames={regionNames} scientificName={structure.canonicalLatinName} />
      </>}
    </div>
  </aside>;
}
