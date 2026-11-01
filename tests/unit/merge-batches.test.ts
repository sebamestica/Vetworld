import { describe, expect, it } from 'vitest';
import { mergeBatches, type Batch } from '../../scripts/anatomy/merge-batches';

const base = () => ({
  structures: [{ id: 'feline:femur', speciesId: 'feline', review: { status: 'pending' }, spanishName: 'Fémur' }],
  relations: [],
  sources: [{ id: 'nav-6th-edition' }],
});

describe('mergeBatches (fixture técnica)', () => {
  it('agrega y actualiza por id en orden determinista', () => {
    const batches: Batch[] = [
      { batchId: 'b', speciesId: 'feline', structures: [{ id: 'feline:patella', speciesId: 'feline', review: { status: 'pending' } }] },
      { batchId: 'a', speciesId: 'feline', structures: [{ id: 'feline:femur', speciesId: 'feline', review: { status: 'pending' }, spanishName: 'Fémur felino' }] },
    ];
    const { result, report } = mergeBatches(base(), batches);
    expect(result.structures.map((s) => s.id)).toEqual(['feline:femur', 'feline:patella']);
    expect(result.structures[0].spanishName).toBe('Fémur felino');
    expect(report[0]).toMatch(/^a: actualiza/);
  });

  it('rechaza especies mezcladas, prefijos erróneos y revisión distinta de pending', () => {
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'canine', structures: [{ id: 'feline:tibia', speciesId: 'feline', review: { status: 'pending' } }] }])).toThrow(/especie/);
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'canine', structures: [{ id: 'feline:tibia', speciesId: 'canine', review: { status: 'pending' } }] }])).toThrow(/prefijo/);
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'feline', structures: [{ id: 'feline:tibia', speciesId: 'feline', review: { status: 'approved' } }] }])).toThrow(/review.status/);
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'feline', relations: [{ id: 'r', fromId: 'feline:femur', toId: 'canine:femur' }] }])).toThrow(/mezcla/);
  });

  it('recalcula supportedStructureIds de forma recíproca', () => {
    const input = { structures: [{ id: 'feline:femur', speciesId: 'feline', review: { status: 'pending' }, sourceIds: ['nav'] }], relations: [], sources: [{ id: 'nav', supportedStructureIds: ['feline:femur', 'feline:gone'] }] };
    const { result } = mergeBatches(input, [{ batchId: 'x', speciesId: 'feline', structures: [{ id: 'feline:tibia', speciesId: 'feline', review: { status: 'pending' }, sourceIds: ['nav'] }] }]);
    expect(result.sources[0].supportedStructureIds).toEqual(['feline:femur', 'feline:tibia']);
  });

  it('conserva modelIds y photoRefs del catálogo en estructuras existentes', () => {
    const input = { structures: [{ id: 'feline:femur', speciesId: 'feline', review: { status: 'pending' }, modelIds: ['m1'], photoRefs: ['p1'] }], relations: [], sources: [] };
    const { result } = mergeBatches(input, [{ batchId: 'x', speciesId: 'feline', structures: [{ id: 'feline:femur', speciesId: 'feline', review: { status: 'pending' }, modelIds: [], photoRefs: [], summary: 'nuevo' }] }]);
    expect(result.structures[0]).toMatchObject({ modelIds: ['m1'], photoRefs: ['p1'], summary: 'nuevo' });
  });

  it('rechaza ids duplicados y reclamados por dos lotes', () => {
    const s = { id: 'feline:tibia', speciesId: 'feline', review: { status: 'pending' } };
    expect(() => mergeBatches(base(), [{ batchId: 'x', speciesId: 'feline', structures: [s, s] }])).toThrow(/duplicado/);
    expect(() => mergeBatches(base(), [
      { batchId: 'x', speciesId: 'feline', structures: [s] },
      { batchId: 'y', speciesId: 'feline', structures: [s] },
    ])).toThrow(/reclamado/);
  });
});
