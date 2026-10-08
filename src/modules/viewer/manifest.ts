import { z } from "zod";

export const VIEWER_BUDGET = { bytes: 12 * 1024 * 1024, triangles: 250_000, gpuBytes: 100 * 1024 * 1024 } as const;
export const viewerAssetSchema = z.object({
  id: z.string().min(1), speciesId: z.enum(["canine", "feline"]), regionId: z.string().min(1),
  title: z.string().min(1), purpose: z.enum(["technical_demo", "scientific"]),
  format: z.enum(["glb", "gltf"]),
  resourceUrl: z.string().regex(/^\/(?:models|anatomy)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(glb|gltf)$/),
  unit: z.literal("m"), scaleToMeters: z.number().positive().finite(), orientation: z.string().min(1),
  byteSize: z.number().int().positive().max(VIEWER_BUDGET.bytes),
  triangleCount: z.number().int().positive().max(VIEWER_BUDGET.triangles),
  estimatedGpuBytes: z.number().int().positive().max(VIEWER_BUDGET.gpuBytes),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  license: z.object({ label: z.string().min(1), verified: z.boolean(), redistributionAllowed: z.boolean() }).strict(),
  reviewStatus: z.enum(["pending", "validated", "rejected"]), availability: z.enum(["available", "pending"]),
  meshMappings: z.array(z.object({ nodeId: z.string().min(1), structureId: z.string().min(1), layerId: z.string().min(1) }).strict()).min(1),
  layers: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) }).strict()).min(1),
  specimen: z.object({ breed: z.string().optional(), sex: z.string().optional(), age: z.string().optional() }).strict().nullable(),
}).strict().superRefine((asset, ctx) => {
  const nodes = new Set<string>();
  const layers = new Set(asset.layers.map((layer) => layer.id));
  for (const mapping of asset.meshMappings) {
    if (nodes.has(mapping.nodeId) || !layers.has(mapping.layerId) || !mapping.structureId.startsWith(`${asset.speciesId}:`)) ctx.addIssue({ code: "custom", message: "Mapping duplicado, capa ausente o especie incompatible" });
    nodes.add(mapping.nodeId);
  }
  if (asset.availability === "available" && (!asset.license.verified || !asset.license.redistributionAllowed)) ctx.addIssue({ code: "custom", message: "Activo disponible sin derechos verificados" });
  if (!asset.resourceUrl.endsWith(`.${asset.format}`)) ctx.addIssue({ code: "custom", message: "Formato y extensión incompatibles" });
});
export type ViewerAsset = z.infer<typeof viewerAssetSchema>;
