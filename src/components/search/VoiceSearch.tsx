'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { t, type Language } from '@/lib/ui/i18n';
import styles from './search.module.css';

interface Recognition {
  lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function VoiceSearch({ onTranscript, language = 'es' }: { onTranscript: (text: string) => void; language?: Language }) {
  const en = language === 'en';
  const tx = (key: Parameters<typeof t>[1]) => t(language, key);
  const [notice, setNotice] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');
  const recognition = useRef<Recognition | null>(null);
  useEffect(() => () => {
    const current = recognition.current;
    if (current) { current.onend = null; current.onerror = null; current.onresult = null; current.abort(); }
  }, []);
  function start() {
    setNotice(false); setMessage('');
    const previous = recognition.current;
    if (previous) { previous.onend = null; previous.onerror = null; previous.onresult = null; previous.abort(); recognition.current = null; }
    const Constructor = (window as VoiceWindow).SpeechRecognition ?? (window as VoiceWindow).webkitSpeechRecognition;
    if (!Constructor || !window.isSecureContext) {
      setMessage(tx('voiceUnavailable'));
      return;
    }
    const current = new Constructor();
    recognition.current = current;
    current.lang = en ? 'en-US' : 'es-CL'; current.interimResults = false; current.maxAlternatives = 1;
    current.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    current.onerror = event => {
      setListening(false);
      setMessage(event.error === 'not-allowed'
        ? tx('micDenied') : tx('voiceFailed'));
    };
    current.onend = () => { recognition.current = null; setListening(false); };
    try { current.start(); setListening(true); } catch { recognition.current = null; setListening(false); setMessage(tx('micStartFailed')); }
  }
  return <div className={styles.voice}>
    <button type="button" className={styles.mic} aria-label={tx(listening ? 'stopListening' : 'searchVoice')} aria-pressed={listening} onClick={() => {
      if (listening) { recognition.current?.stop(); setListening(false); } else { setNotice(value => !value); setMessage(''); }
    }}>{listening ? <Square size={17} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}</button>
    {notice && <div className={styles.voiceNotice}>
      <p>{tx('voicePrivacy')}</p>
      <button type="button" onClick={start}>{tx('startListening')}</button>
      <button type="button" onClick={() => setNotice(false)}>{tx('cancel')}</button>
    </div>}
    {(message || listening) && <div className={styles.voiceMessage} role="status">{message || tx('listeningReview')}</div>}
  </div>;
}
