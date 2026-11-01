import { describe, expect, it } from 'vitest';
import { mergeBatches, type Batch } from '../../scripts/anatomy/merge-batches';

const base = () => ({
  structures: [{ id: 'feline:femur', speciesId: 'feline', reviewStatus: 'pending', spanishName: 'Fémur' }],
  relations: [],
  sources: [{ id: 'nav-6th-edition' }],
});

describe('mergeBatches (fixture técnica)', () => {
  it('agrega y actualiza por id en orden determinista', () => {
    const batches: Batch[] = [
      { batchId: 'b', speciesId: 'feline', structures: [{ id: 'feline:patella', speciesId: 'feline', reviewStatus: 'pending' }] },
      { batchId: 'a', speciesId: 'feline', structures: [{ id: 'feline:femur', speciesId: 'feline', reviewStatus: 'pending', spanishName: 'Fémur felino' }] },
    ];
    const { result, report } = mergeBatches(base(), batches);
    expect(result.structures.map((s) => s.id)).toEqual(['feline:femur', 'feline:patella']);
    expect(result.structures[0].spanishName).toBe('Fémur felino');
    expect(report[0]).toMatch(/^a: actualiza/);
  });

  it('rechaza especies mezcladas, prefijos erróneos y revisión distinta de pending', () => {
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'canine', structures: [{ id: 'feline:tibia', speciesId: 'feline', reviewStatus: 'pending' }] }])).toThrow(/especie/);
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'canine', structures: [{ id: 'feline:tibia', speciesId: 'canine', reviewStatus: 'pending' }] }])).toThrow(/prefijo/);
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'feline', structures: [{ id: 'feline:tibia', speciesId: 'feline', reviewStatus: 'approved' }] }])).toThrow(/pending/);
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'feline', relations: [{ id: 'r', fromId: 'feline:femur', toId: 'canine:femur' }] }])).toThrow(/mezcla/);
  });

  it('rechaza ids duplicados y reclamados por dos lotes', () => {
    const s = { id: 'feline:tibia', speciesId: 'feline', reviewStatus: 'pending' };
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'feline', structures: [s, s] }])).toThrow(/duplicado/);
    expect(() => mergeBatches(base(), [
      { batchId: 'x', speciesId: 'feline', structures: [s] },
      { batchId: 'y', speciesId: 'feline', structures: [s] },
    ])).toThrow(/reclamado/);
  });
});
