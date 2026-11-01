import { z } from "zod";

export const VIEWER_BUDGET = { bytes: 12 * 1024 * 1024, triangles: 250_000, gpuBytes: 100 * 1024 * 1024 } as const;
const provenanceUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Referencia debe usar HTTPS sin credenciales');
/** Estados de admisión por pieza; hoy solo «superficie identificada parcial». Ver docs/phase3/feline-partial-selection-2026-10-31.md. */
export const meshAdmissionSchema = z.enum(["partial-surface"]);
export type MeshAdmission = z.infer<typeof meshAdmissionSchema>;
export const viewerAssetSchema = z.object({
  id: z.string().min(1), speciesId: z.enum(["canine", "feline"]), regionId: z.string().min(1),
  title: z.string().min(1), purpose: z.enum(["technical_demo", "scientific"]),
  format: z.enum(["glb", "gltf"]),
  resourceUrl: z.string().regex(/^\/(?:models|anatomy)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(glb|gltf)$/),
  unit: z.enum(["m", "source-unverified"]), scaleToMeters: z.number().positive().finite(), orientation: z.string().min(1),
  scope: z.enum(["regional", "whole-body"]).optional(),
  physicalScaleVerified: z.boolean().optional(),
  attribution: z.string().optional(), sourceUrl: provenanceUrl.optional(), licenseUrl: provenanceUrl.optional(),
  credit: z.object({ work: z.string().min(1), author: z.string().min(1), licenseName: z.string().min(1), changes: z.string().min(1).optional() }).strict().optional(),
  visualNodes: z.array(z.object({ nodeId: z.string().min(1), layerId: z.string().min(1) }).strict()).optional(),
  byteSize: z.number().int().positive().max(VIEWER_BUDGET.bytes),
  triangleCount: z.number().int().positive().max(VIEWER_BUDGET.triangles),
  estimatedGpuBytes: z.number().int().positive().max(VIEWER_BUDGET.gpuBytes),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  license: z.object({ label: z.string().min(1), verified: z.boolean(), redistributionAllowed: z.boolean() }).strict(),
  reviewStatus: z.enum(["pending", "validated", "rejected"]), availability: z.enum(["available", "pending"]),
  meshMappings: z.array(z.object({
    nodeId: z.string().min(1), structureId: z.string().min(1), layerId: z.string().min(1),
    /** Nivel de admisión explícito. Ausente: semántica previa (nodo = estructura). `partial-surface`: superficie parcial identificada, límites aproximados. */
    admission: meshAdmissionSchema.optional(),
    /** Estructuras incluidas en la misma superficie sin separación geométrica (p. ej. mandíbula en la cabeza). */
    includesStructureIds: z.array(z.string().min(1)).min(1).optional(),
  }).strict()),
  layers: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) }).strict()).min(1),
  specimen: z.object({ breed: z.string().optional(), sex: z.string().optional(), age: z.string().optional() }).strict().nullable(),
}).strict().superRefine((asset, ctx) => {
  const nodes = new Set<string>();
  const layers = new Set(asset.layers.map((layer) => layer.id));
  const visual = new Set<string>();
  for (const node of asset.visualNodes ?? []) {
    if (visual.has(node.nodeId) || !layers.has(node.layerId)) ctx.addIssue({ code: "custom", message: "Nodo visual duplicado o capa ausente" });
    visual.add(node.nodeId);
  }
  if (!asset.meshMappings.length && !visual.size) ctx.addIssue({ code: "custom", message: "Activo sin nodos declarados" });
  if (asset.unit === "source-unverified" && (asset.scaleToMeters !== 1 || asset.physicalScaleVerified !== false)) ctx.addIssue({ code: "custom", message: "Escala desconocida no admite conversión física" });
  for (const mapping of asset.meshMappings) {
    if (nodes.has(mapping.nodeId) || !layers.has(mapping.layerId) || !mapping.structureId.startsWith(`${asset.speciesId}:`)) ctx.addIssue({ code: "custom", message: "Mapping duplicado, capa ausente o especie incompatible" });
    nodes.add(mapping.nodeId);
    if (visual.has(mapping.nodeId)) ctx.addIssue({ code: "custom", message: "Nodo a la vez seleccionable y visual" });
    if (mapping.includesStructureIds?.some(id => id === mapping.structureId || !id.startsWith(`${asset.speciesId}:`)) || new Set(mapping.includesStructureIds).size !== (mapping.includesStructureIds?.length ?? 0)) ctx.addIssue({ code: "custom", message: "Estructuras incluidas inválidas" });
    if (mapping.includesStructureIds && mapping.admission !== "partial-surface") ctx.addIssue({ code: "custom", message: "Estructuras incluidas solo en superficies parciales" });
    if (mapping.admission === "partial-surface" && asset.reviewStatus !== "pending") ctx.addIssue({ code: "custom", message: "Una superficie parcial no admite revisión validada en el manifiesto" });
  }
  if (asset.availability === "available" && (!asset.license.verified || !asset.license.redistributionAllowed)) ctx.addIssue({ code: "custom", message: "Activo disponible sin derechos verificados" });
  if (asset.purpose === "scientific" && asset.availability === "available" && (!asset.attribution || !asset.sourceUrl || !asset.licenseUrl || !asset.credit)) ctx.addIssue({ code: "custom", message: "Activo científico disponible sin atribución completa" });
  if (!asset.resourceUrl.endsWith(`.${asset.format}`)) ctx.addIssue({ code: "custom", message: "Formato y extensión incompatibles" });
});
export type ViewerAsset = z.infer<typeof viewerAssetSchema>;
