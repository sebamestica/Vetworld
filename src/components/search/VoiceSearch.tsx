'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import styles from './search.module.css';

interface Recognition {
  lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function VoiceSearch({ onTranscript, language = 'es' }: { onTranscript: (text: string) => void; language?: 'es' | 'en' }) {
  const en = language === 'en';
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
      setMessage(en ? 'Voice search is unavailable. Use the text field; a supported browser and secure connection are required.' : 'La búsqueda por voz no está disponible. Usa el campo escrito; requiere un navegador compatible y conexión segura.');
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
        ? (en ? 'Microphone permission denied. You can type your search.' : 'Permiso de micrófono rechazado. Puedes escribir tu búsqueda.')
        : (en ? 'Voice recognition failed. You can type your search.' : 'No se pudo reconocer la voz. Puedes escribir tu búsqueda.'));
    };
    current.onend = () => { recognition.current = null; setListening(false); };
    try { current.start(); setListening(true); } catch { recognition.current = null; setListening(false); setMessage(en ? 'Unable to start the microphone.' : 'No se pudo iniciar el micrófono.'); }
  }
  return <div className={styles.voice}>
    <button type="button" className={styles.mic} aria-label={listening ? (en ? 'Stop listening' : 'Detener escucha') : (en ? 'Search by voice' : 'Buscar por voz')} aria-pressed={listening} onClick={() => {
      if (listening) { recognition.current?.stop(); setListening(false); } else { setNotice(value => !value); setMessage(''); }
    }}>{listening ? <Square size={17} /> : <Mic size={18} />}</button>
    {notice && <div className={styles.voiceNotice}>
      <p>{en ? 'Your browser may send audio to its voice recognition service. This atlas does not record or store audio. You can also type your search.' : 'Tu navegador puede enviar audio a su servicio de reconocimiento de voz. Este atlas no graba ni almacena audio. También puedes escribir tu búsqueda.'}</p>
      <button type="button" onClick={start}>{en ? 'Start listening' : 'Iniciar escucha'}</button>
      <button type="button" onClick={() => setNotice(false)}>{en ? 'Cancel' : 'Cancelar'}</button>
    </div>}
    {(message || listening) && <div className={styles.voiceMessage} role="status">{message || (en ? 'Listening… Review the transcript before choosing a result.' : 'Escuchando… Revisa la transcripción antes de elegir un resultado.')}</div>}
  </div>;
}
