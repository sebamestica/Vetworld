import { describe, expect, it } from 'vitest';
import coverage from '../../data/osteology/feline-evidence-coverage.json';
import { evidenceCoverageSchema } from '../../src/modules/anatomy/schemas/evidence-coverage';

describe('Cobertura científica y geométrica separadas', () => {
  it('no convierte fichas o propuestas en huesos modelados', () => {
    const parsed = evidenceCoverageSchema.parse(coverage);
    expect(parsed.rows).toHaveLength(323);
    expect(parsed.expectedSpecimenBoneCount).toBeNull();
    expect(parsed.anatomicallyAcceptedBones).toBe(0);
    expect(parsed.rows.filter(row=>row.evidenceStatus==='curated_partial')).toHaveLength(8);
    expect(parsed.pilot.every(proposal=>proposal.publicAvailable===false)).toBe(true);
  });
  it('rechaza IDs duplicados o falsas admisiones científicas', () => {
    expect(evidenceCoverageSchema.safeParse({...coverage,rows:[coverage.rows[0],...coverage.rows.slice(1,322),coverage.rows[0]]}).success).toBe(false);
    expect(evidenceCoverageSchema.safeParse({...coverage,anatomicallyAcceptedBones:323}).success).toBe(false);
  });
});
