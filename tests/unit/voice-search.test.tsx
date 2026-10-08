// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VoiceSearch } from '@/components/search/VoiceSearch';

class SyntheticRecognition {
  static current: SyntheticRecognition;
  lang = ''; interimResults = false; maxAlternatives = 1;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn(); stop = vi.fn(); abort = vi.fn();
  constructor() { SyntheticRecognition.current = this; }
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('Voz con API sintética: sin micrófono real', () => {
  it('requiere aviso y acción explícita, devuelve texto y aborta al desmontar', () => {
    const Constructor = vi.fn(SyntheticRecognition); vi.stubGlobal('SpeechRecognition', Constructor); vi.stubGlobal('isSecureContext', true);
    const transcript = vi.fn(); const view = render(<VoiceSearch onTranscript={transcript} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buscar por voz' })); expect(Constructor).not.toHaveBeenCalled();
    expect(screen.getByText(/puede enviar audio/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar escucha' })); expect(SyntheticRecognition.current.start).toHaveBeenCalledOnce();
    act(() => SyntheticRecognition.current.onresult?.({ results: [[{ transcript: 'escápula' }]] })); expect(transcript).toHaveBeenCalledWith('escápula');
    view.unmount(); expect(SyntheticRecognition.current.abort).toHaveBeenCalledOnce();
  });
  it('explica permiso rechazado y conserva alternativa escrita', () => {
    vi.stubGlobal('SpeechRecognition', SyntheticRecognition); vi.stubGlobal('isSecureContext', true);
    render(<VoiceSearch onTranscript={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buscar por voz' })); fireEvent.click(screen.getByRole('button', { name: 'Iniciar escucha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Detener escucha' })); expect(SyntheticRecognition.current.stop).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar por voz' })); fireEvent.click(screen.getByRole('button', { name: 'Iniciar escucha' }));
    act(() => SyntheticRecognition.current.onerror?.({ error: 'not-allowed' }));
    expect(screen.getByRole('status').textContent).toContain('Permiso de micrófono rechazado');
  });
  it('maneja ausencia de soporte', () => {
    vi.stubGlobal('SpeechRecognition', undefined); vi.stubGlobal('webkitSpeechRecognition', undefined); vi.stubGlobal('isSecureContext', true);
    render(<VoiceSearch onTranscript={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Buscar por voz' })); fireEvent.click(screen.getByRole('button', { name: 'Iniciar escucha' }));
    expect(screen.getByRole('status').textContent).toContain('no está disponible');
  });
  it('admite la API webkit en inglés y bloquea contexto inseguro', () => {
    vi.stubGlobal('SpeechRecognition', undefined); vi.stubGlobal('webkitSpeechRecognition', SyntheticRecognition); vi.stubGlobal('isSecureContext', true);
    const view = render(<VoiceSearch language="en" onTranscript={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Search by voice' })); fireEvent.click(screen.getByRole('button', { name: 'Start listening' }));
    expect(SyntheticRecognition.current.lang).toBe('en-US'); view.unmount();
    const Constructor = vi.fn(SyntheticRecognition); vi.stubGlobal('webkitSpeechRecognition', Constructor); vi.stubGlobal('isSecureContext', false);
    render(<VoiceSearch language="en" onTranscript={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Search by voice' })); fireEvent.click(screen.getByRole('button', { name: 'Start listening' }));
    expect(Constructor).not.toHaveBeenCalled(); expect(screen.getByRole('status').textContent).toContain('secure connection');
  });
});
