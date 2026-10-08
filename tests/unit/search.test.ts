import { describe, expect, it } from 'vitest';
import { normalizeTerm, scoreTerm } from '@/modules/search/normalize';
import { catalogService } from '@/modules/catalog/services/catalog-service';

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
  it('tolera errores acotados en palabras y nombres latinos sin inventar términos', () => {
    expect(scoreTerm('bicepz', ['Bíceps braquial'])).toBe(50);
    expect(scoreTerm('scapulla', ['Scapula'])).toBe(50);
    expect(scoreTerm('huemrus', ['Humerus'])).toBe(40);
    expect(scoreTerm('masetero', ['Scapula', 'Humerus', 'Bíceps braquial'])).toBe(0);
    expect(scoreTerm('scp', ['Scapula'])).toBe(0);
    expect(scoreTerm('un nombre excesivamente largo', ['Scapula'])).toBe(0);
  });
  it('busca errores en el catálogo real de ambas especies y excluye masetero ausente', () => {
    const hits = catalogService.search({ q: 'scapulla' });
    expect(hits.map(hit => hit.structure.speciesId).sort()).toEqual(['canine', 'feline']);
    expect(catalogService.search({ q: 'masetero' })).toEqual([]);
  });
});
