'use client';

import { useRef, useState } from 'react';
import type { Language } from '@/lib/ui/i18n';
import type { VisualReference } from '@/modules/media/schemas';
import { isSafeExternalUrl, safeLocalImagePath } from '@/modules/media/safety';
import styles from './ReferenceGallery.module.css';

const labels: Record<VisualReference['kind'], string> = { dissection_photo: 'Fotografía de disección', ct: 'Tomografía computarizada', mri: 'Resonancia magnética', illustration: 'Ilustración', dissection_video: 'Vídeo de disección', academic_reference: 'Referencia académica' };

function ReferenceCard({ reference, speciesName, regionNames, language }: { language: Language; reference: VisualReference; speciesName: string; regionNames?: Record<string, string> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const internal = reference.displayMode === 'internal' && reference.license.verified && reference.license.redistributionAllowed && reference.imagePath !== null && reference.thumbnailPath !== null && safeLocalImagePath(reference.imagePath) && safeLocalImagePath(reference.thumbnailPath);
  const safeLink = isSafeExternalUrl(reference.sourceUrl);
  return <article className={styles.card}>
    <span className={styles.kind}>{labels[reference.kind]}</span>
    <h4>{reference.title}</h4>
    <p className={styles.credit}>{speciesName} · {regionNames?.[reference.regionId] ?? reference.regionId}</p>
    {internal && !failed && <button className={styles.thumbnail} onClick={() => dialog.current?.showModal()} aria-label={`${language === 'en' ? 'Enlarge' : 'Ampliar'} ${reference.title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reference.thumbnailPath!} alt={reference.title} onError={() => setFailed(true)} />
    </button>}
    {failed && <p role="status">Imagen no disponible. Consulte la fuente original.</p>}
    {reference.caption && <p>{reference.caption}</p>}
    <p className={styles.credit}>{reference.authors.join('; ')} · {reference.license.label}</p>
    <p className={styles.credit}>{reference.license.verified ? 'Licencia verificada' : 'Permisos de reproducción pendientes'} · {reference.review.status === 'pending' ? 'Revisión humana pendiente' : 'Revisión documentada'}</p>
    {safeLink ? <a href={reference.sourceUrl} target="_blank" rel="noopener noreferrer">{language === 'en' ? 'View academic source ↗' : 'Consultar fuente académica ↗'}</a> : <p>Enlace no disponible.</p>}
    {internal && !failed && <dialog ref={dialog} className={styles.dialog} aria-label={reference.title}>
      <button autoFocus onClick={() => dialog.current?.close()}>{language === 'en' ? 'Close enlargement' : 'Cerrar ampliación'}</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reference.imagePath!} alt={reference.title} onError={() => { setFailed(true); dialog.current?.close(); }} />
      <p>{reference.authors.join('; ')} · {reference.license.label}</p>
    </dialog>}
  </article>;
}

export default function ReferenceGallery({ references, speciesName, scientificName, scientificSpeciesName, regionNames, language = 'es' }: { language?: Language; references: VisualReference[]; speciesName: string; scientificName?: string; scientificSpeciesName?: string; regionNames?: Record<string, string> }) {
  return <section className={styles.gallery} aria-label={language === 'en' ? 'Real anatomical references' : 'Referencias anatómicas reales'}>
    <h3>{language === 'en' ? 'Real anatomical references' : 'Referencias anatómicas reales'}</h3>
    <p className={styles.intro}>Fuentes curadas para {speciesName}. Las referencias externas se consultan en su sitio de origen.</p>
    {!references.length && <p>No hay referencias visuales curadas para esta estructura. No hay fotografías aprobadas para mostrar.</p>}
    {references.length > 0 && !references.some(reference => reference.displayMode === 'internal' && reference.kind === 'dissection_photo' && reference.license.verified && reference.license.redistributionAllowed && reference.imagePath && reference.thumbnailPath && safeLocalImagePath(reference.imagePath) && safeLocalImagePath(reference.thumbnailPath)) && <p>Aún no hay fotografías autorizadas para mostrar.</p>}
    {references.map(reference => <ReferenceCard key={reference.id} reference={reference} language={language} speciesName={speciesName} regionNames={regionNames} />)}
    {scientificName && <a className={styles.search} href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${scientificName} ${scientificSpeciesName ?? speciesName} anatomía veterinaria`)}`} target="_blank" rel="noopener noreferrer">{language === 'en' ? 'Search more external images ↗' : 'Buscar más imágenes externas ↗'}</a>}
    {scientificName && <p className={styles.credit}>La búsqueda externa no verifica exactitud anatómica ni derechos de reproducción.</p>}
  </section>;
}
