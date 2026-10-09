import type { ViewerAsset } from "./manifest";
export type ViewerLayers = Record<string, { visible: boolean; opacity: number }>;
export function meshPresentation(asset: ViewerAsset, nodeId: string, layers: ViewerLayers, isolatedId: string | null) {
  const mapping = asset.meshMappings.find((entry) => entry.nodeId === nodeId);
  const visual = asset.visualNodes?.find(entry => entry.nodeId === nodeId);
  const layerId = mapping?.layerId ?? visual?.layerId;
  const layer = layerId ? layers[layerId] : undefined;
  const opacity = Math.min(1, Math.max(0.15, layer?.opacity ?? 1));
  const visible = !!layerId && (layer?.visible ?? true) && (!isolatedId || mapping?.structureId === isolatedId);
  return { mapping, visible, opacity };
}
