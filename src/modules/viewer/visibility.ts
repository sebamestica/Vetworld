import type { ViewerAsset } from "./manifest";
export type ViewerLayers = Record<string, { visible: boolean; opacity: number }>;
/** Visibilidad y opacidad por pieza, indexadas por `structureId` (todas las mallas de la misma ficha a la vez). */
export type ViewerPieces = Record<string, { visible: boolean; opacity: number }>;
export function meshPresentation(asset: ViewerAsset, nodeId: string, layers: ViewerLayers, isolatedId: string | null, pieces: ViewerPieces = {}) {
  const mapping = asset.meshMappings.find((entry) => entry.nodeId === nodeId);
  const visual = asset.visualNodes?.find(entry => entry.nodeId === nodeId);
  const layerId = mapping?.layerId ?? visual?.layerId;
  const layer = layerId ? layers[layerId] : undefined;
  const piece = mapping ? pieces[mapping.structureId] : undefined;
  const opacity = Math.min(1, Math.max(0.15, (layer?.opacity ?? 1) * (piece?.opacity ?? 1)));
  const visible = !!layerId && (layer?.visible ?? true) && (piece?.visible ?? true) && (!isolatedId || mapping?.structureId === isolatedId);
  return { mapping, visible, opacity };
}
