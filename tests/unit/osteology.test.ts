import { describe, expect, it } from 'vitest';
import canine from '../../data/osteology/reference/canine.json';
import feline from '../../data/osteology/reference/feline.json';
import { referenceInventorySchema, referenceCoverage } from '../../src/modules/anatomy/schemas/osteology';

describe('Inventarios de referencia separados de especímenes', () => {
  it.each([canine, feline])('valida jerarquía y fuentes de $speciesId', inventory => {
    const parsed = referenceInventorySchema.parse(inventory);
    const report = referenceCoverage(parsed);
    expect(report.expectedSpecimenBoneCount).toBeNull();
    expect(report.assembledBones).toBe(0);
    expect(report.admittedMeshes).toBe(0);
    expect(report.regions.reduce((sum, region) => sum + region.referenceEntries, 0)).toBe(parsed.structures.length);
  });
  it('rechaza IDs duplicados', () => {
    const invalid = structuredClone(canine);
    invalid.structures.push(invalid.structures[0]);
    expect(referenceInventorySchema.safeParse(invalid).success).toBe(false);
  });
  it('rechaza padres y bibliografía inexistentes', () => {
    const invalid = structuredClone(feline);
    invalid.structures[0].parentId = 'missing';
    invalid.structures[0].sourceIds = ['missing'];
    expect(referenceInventorySchema.safeParse(invalid).success).toBe(false);
  });
  it('rechaza ciclos', () => {
    const invalid = structuredClone(canine);
    invalid.structures[0].parentId = invalid.structures[0].id;
    expect(referenceInventorySchema.safeParse(invalid).success).toBe(false);
  });
  it('no permite declarar adquirida una plantilla', () => {
    expect(referenceInventorySchema.safeParse({ ...canine, profile: { ...canine.profile, isSpecimen: true } }).success).toBe(false);
  });
  it('no permite imponer una cantidad a la cola variable', () => {
    const invalid = structuredClone(canine);
    invalid.structures.find(entry => entry.kind === 'variable_series')!.expectedQuantity = 20;
    expect(referenceInventorySchema.safeParse(invalid).success).toBe(false);
  });
});
