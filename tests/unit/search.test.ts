import { describe, expect, it } from 'vitest';
import { normalizeTerm, scoreTerm } from '@/modules/search/normalize';

describe('Normalización y relevancia de búsqueda', () => {
  it('normaliza acentos, mayúsculas y espacios sin cambiar la entrada', () => {
    expect(normalizeTerm('  BÍCEPS   Braquial ')).toBe('biceps braquial');
  });
  it('prioriza coincidencia exacta, prefijo y fragmento; admite sinónimos', () => {
    expect(scoreTerm('omoplato', ['Scapula', 'Omóplato'])).toBe(300);
    expect(scoreTerm('biceps', ['Bíceps braquial'])).toBe(200);
    expect(scoreTerm('braquial', ['Bíceps braquial'])).toBe(100);
    expect(scoreTerm('', ['Scapula'])).toBe(0);
    expect(scoreTerm('ausente', ['Scapula'])).toBe(0);
  });
});
