import type { ViewerAsset } from "./manifest";
export type ViewerLayers = Record<string, { visible: boolean; opacity: number }>;
export function meshPresentation(asset: ViewerAsset, nodeId: string, layers: ViewerLayers, isolatedId: string | null) {
  const mapping = asset.meshMappings.find((entry) => entry.nodeId === nodeId);
  const layer = mapping ? layers[mapping.layerId] : undefined;
  const opacity = Math.min(1, Math.max(0.15, layer?.opacity ?? 1));
  const visible = !!mapping && (layer?.visible ?? true) && (!isolatedId || mapping.structureId === isolatedId);
  return { mapping, visible, opacity };
}
