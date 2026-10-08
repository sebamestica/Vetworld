'use client';
import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { t, type Language } from '@/lib/ui/i18n';
import styles from './AppShell.module.css';
export function MobileOrientationNotice({ language }: { language: Language }) {
  const [portrait, setPortrait] = useState(false), [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 650px) and (orientation: portrait)');
    const update = () => setPortrait(query.matches);
    queueMicrotask(update); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  if (!portrait || dismissed) return null;
  return <div className={styles.orientation} data-testid="orientation-notice" role="dialog" aria-label={t(language, 'portraitTitle')} aria-modal="true"><div><RotateCw size={48} aria-hidden="true"/><h2>{t(language, 'portraitTitle')}</h2><p>{t(language, 'portraitMessage')}</p><button autoFocus onClick={() => setDismissed(true)}>{t(language, 'continuePortrait')}</button></div></div>;
}
