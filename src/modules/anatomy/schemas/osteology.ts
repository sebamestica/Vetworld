import { z } from 'zod';

const id = z.string().min(1);
export const osteologyStructureSchema = z.object({
  id, canonicalLatinName: id, spanishName: id, regionId: id, subregionId: id,
  parentId: id.nullable(),
  kind: z.enum(['group', 'bone', 'tooth', 'anatomical_component', 'variable_series', 'conditional_bone']),
  side: z.enum(['left', 'right', 'midline', 'unknown']), serial: z.number().int().positive().nullable(),
  required: z.enum(['typical_adult', 'specimen_dependent', 'sex_dependent', 'age_dependent']),
  condition: id.nullable(), expectedQuantity: z.number().int().positive().nullable(),
  fusionGroupId: id.nullable(), sourceIds: z.array(id).min(1), evidenceNotes: id,
  status: z.literal('not_located'), geometryMapping: z.array(z.never()), reviewStatus: z.literal('pending'),
}).strict();

export const referenceInventorySchema = z.object({
  speciesId: z.enum(['canine', 'feline']),
  profile: z.object({ id, isSpecimen: z.literal(false), sex: z.null(), ageClass: id, breed: z.null(), notes: id }).strict(),
  sources: z.array(z.object({ id, title: id, url: z.url().refine(value => value.startsWith('https://')), locator: id, verifiedAt: id, notes: id }).strict()).min(1),
  structures: z.array(osteologyStructureSchema).min(1),
}).strict().superRefine((inventory, context) => {
  const entries = new Map(inventory.structures.map(entry => [entry.id, entry]));
  const sources = new Set(inventory.sources.map(source => source.id));
  const seen = new Set<string>();
  inventory.structures.forEach((entry, index) => {
    const fail = (message: string) => context.addIssue({ code: 'custom', path: ['structures', index], message });
    if (seen.has(entry.id)) fail('ID duplicado');
    seen.add(entry.id);
    if (!entry.id.startsWith(`${inventory.speciesId}:reference:`)) fail('Especie incompatible');
    if (entry.parentId && entries.get(entry.parentId)?.kind !== 'group') fail('Padre inexistente o no agrupador');
    if (entry.fusionGroupId && !entries.has(entry.fusionGroupId)) fail('Grupo de fusión inexistente');
    if (entry.sourceIds.some(source => !sources.has(source))) fail('Fuente inexistente');
    if (entry.kind === 'variable_series' && entry.expectedQuantity !== null) fail('Serie variable con cantidad universal');
    const chain = new Set([entry.id]);
    let parent = entry.parentId;
    while (parent && entries.has(parent)) {
      if (chain.has(parent)) { fail('Ciclo jerárquico'); break; }
      chain.add(parent); parent = entries.get(parent)!.parentId;
    }
  });
});

export type ReferenceInventory = z.infer<typeof referenceInventorySchema>;

export function referenceCoverage(inventory: ReferenceInventory) {
  return {
    speciesId: inventory.speciesId, specimenId: null, expectedSpecimenBoneCount: null,
    referenceEntries: inventory.structures.length, admittedMeshes: 0, assembledBones: 0,
    anatomicallyValidatedBones: 0, status: 'blocked_missing_authorized_geometry' as const,
    regions: [...new Set(inventory.structures.map(entry => entry.regionId))].map(regionId => ({
      regionId, referenceEntries: inventory.structures.filter(entry => entry.regionId === regionId).length,
      admittedMeshes: 0, assembledBones: 0,
    })),
  };
}
