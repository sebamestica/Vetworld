'use client';

import { useRef, useState } from 'react';
import { t, type Language, type UiKey } from '@/lib/ui/i18n';
import type { VisualReference } from '@/modules/media/schemas';
import { isSafeExternalUrl, safeLocalImagePath } from '@/modules/media/safety';
import styles from './ReferenceGallery.module.css';

const labels: Record<VisualReference['kind'], UiKey> = { dissection_photo: 'refDissectionPhoto', ct: 'refCt', mri: 'refMri', illustration: 'refIllustration', dissection_video: 'refDissectionVideo', academic_reference: 'refAcademic' };

function ReferenceCard({ reference, speciesName, regionNames, language }: { language: Language; reference: VisualReference; speciesName: string; regionNames?: Record<string, string> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const internal = reference.displayMode === 'internal' && reference.license.verified && reference.license.redistributionAllowed && reference.imagePath !== null && reference.thumbnailPath !== null && safeLocalImagePath(reference.imagePath) && safeLocalImagePath(reference.thumbnailPath);
  const safeLink = isSafeExternalUrl(reference.sourceUrl);
  return <article className={styles.card}>
    <span className={styles.kind}>{t(language, labels[reference.kind])}</span>
    <h4>{reference.title}</h4>
    <p className={styles.credit}>{speciesName} · {regionNames?.[reference.regionId] ?? reference.regionId}</p>
    {internal && !failed && <button className={styles.thumbnail} onClick={() => dialog.current?.showModal()} aria-label={t(language, 'enlarge', { title: reference.title })}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reference.thumbnailPath!} alt={reference.title} onError={() => setFailed(true)} />
    </button>}
    {failed && <p role="status">{t(language, 'imageUnavailable')}</p>}
    {reference.caption && <p>{reference.caption}</p>}
    <p className={styles.credit}>{reference.authors.join('; ')} · {reference.license.label}</p>
    <p className={styles.credit}>{t(language, reference.license.verified ? 'licenseVerified' : 'licensePending')} · {t(language, reference.review.status === 'pending' ? 'reviewPending' : 'reviewDocumentedShort')}</p>
    {safeLink ? <a href={reference.sourceUrl} target="_blank" rel="noopener noreferrer">{t(language, 'viewAcademicSource')}</a> : <p>{t(language, 'linkUnavailable')}</p>}
    {internal && !failed && <dialog ref={dialog} className={styles.dialog} aria-label={reference.title}>
      <button autoFocus onClick={() => dialog.current?.close()}>{t(language, 'closeEnlargement')}</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reference.imagePath!} alt={reference.title} onError={() => { setFailed(true); dialog.current?.close(); }} />
      <p>{reference.authors.join('; ')} · {reference.license.label}</p>
    </dialog>}
  </article>;
}

export default function ReferenceGallery({ references, speciesName, scientificName, scientificSpeciesName, regionNames, language = 'es' }: { language?: Language; references: VisualReference[]; speciesName: string; scientificName?: string; scientificSpeciesName?: string; regionNames?: Record<string, string> }) {
  return <section className={styles.gallery} aria-label={t(language, 'realReferences')}>
    <h3>{t(language, 'realReferences')}</h3>
    <p className={styles.intro}>{t(language, 'galleryIntro', { species: speciesName })}</p>
    {!references.length && <p>{t(language, 'noReferences')}</p>}
    {references.length > 0 && !references.some(reference => reference.displayMode === 'internal' && reference.kind === 'dissection_photo' && reference.license.verified && reference.license.redistributionAllowed && reference.imagePath && reference.thumbnailPath && safeLocalImagePath(reference.imagePath) && safeLocalImagePath(reference.thumbnailPath)) && <p>{t(language, 'noAuthorizedPhotos')}</p>}
    {references.map(reference => <ReferenceCard key={reference.id} reference={reference} language={language} speciesName={speciesName} regionNames={regionNames} />)}
    {scientificName && <a className={styles.search} href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${scientificName} ${scientificSpeciesName ?? speciesName} anatomía veterinaria`)}`} target="_blank" rel="noopener noreferrer">{t(language, 'searchExternalImages')}</a>}
    {scientificName && <p className={styles.credit}>{t(language, 'externalSearchDisclaimer')}</p>}
  </section>;
}
