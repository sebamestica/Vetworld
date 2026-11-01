import type { ViewerAsset } from "./manifest";

/**
 * Activo científico que la página principal muestra para una especie y región.
 * Prioridad: modelo corporal disponible (con piezas seleccionables antes que sin ellas); si no existe, modelo regional de la región
 * elegida; con «Todo el animal» y sin modelo corporal, el único regional disponible
 * de la especie (p. ej. cráneo canino), marcado como `partial` para avisar al usuario.
 * Solo se admiten activos que el catálogo de la API también declara disponibles.
 */
export type WorkspaceAssetChoice = { asset: ViewerAsset; coverage: "whole-body" | "region" | "partial" } | null;

export function workspaceAsset(assets: readonly ViewerAsset[], speciesId: string, regionId: string, availableModelIds: ReadonlySet<string>): WorkspaceAssetChoice {
  const usable = assets.filter(a => a.speciesId === speciesId && a.purpose === "scientific" && a.availability === "available" && availableModelIds.has(a.id));
  // Entre varios corporales (original y derivado particionado) se prefiere el que tiene piezas seleccionables.
  const wholeBody = usable.filter(a => a.scope === "whole-body").sort((a, b) => b.meshMappings.length - a.meshMappings.length)[0];
  if (wholeBody) return { asset: wholeBody, coverage: "whole-body" };
  const regional = usable.filter(a => a.scope === "regional");
  const exact = regional.find(a => a.regionId === regionId);
  if (exact) return { asset: exact, coverage: "region" };
  if (regionId === "all" && regional.length === 1) return { asset: regional[0], coverage: "partial" };
  return null;
}

/** Créditos visibles exigidos por la licencia del activo; null si no corresponde mostrarlos. */
export function assetCredit(asset: ViewerAsset | null | undefined) {
  if (!asset || asset.purpose !== "scientific" || !asset.credit || !asset.sourceUrl || !asset.licenseUrl) return null;
  return { label: `${asset.credit.work} · ${asset.credit.author}`, licenseName: asset.credit.licenseName, changes: asset.credit.changes ?? null, sourceUrl: asset.sourceUrl, licenseUrl: asset.licenseUrl };
}

/**
 * Nivel de admisión de la estructura seleccionada en el activo: `null` si no tiene malla o si su
 * mapping no declara admisión. Agrupa los nodos (p. ej. dos semiespacios de escena) que abren la
 * misma ficha; nunca deduce lado anatómico.
 */
export function structureAdmission(asset: ViewerAsset | null | undefined, structureId: string | null) {
  const mappings = asset && structureId ? asset.meshMappings.filter(m => m.structureId === structureId) : [];
  const admission = mappings.find(m => m.admission)?.admission;
  if (!admission) return null;
  return { admission, nodeCount: mappings.length, includesStructureIds: [...new Set(mappings.flatMap(m => m.includesStructureIds ?? []))] };
}

/** Estructuras seleccionables del activo, una por ficha aunque haya varios nodos. */
export function selectablePieces(asset: ViewerAsset | null | undefined) {
  const pieces = new Map<string, { structureId: string; layerId: string; nodeIds: string[]; admission: ViewerAsset["meshMappings"][number]["admission"] }>();
  for (const mapping of asset?.meshMappings ?? []) {
    const entry = pieces.get(mapping.structureId);
    if (entry) entry.nodeIds.push(mapping.nodeId);
    else pieces.set(mapping.structureId, { structureId: mapping.structureId, layerId: mapping.layerId, nodeIds: [mapping.nodeId], admission: mapping.admission });
  }
  return [...pieces.values()];
}

/** `true` si el activo tiene alguna superficie parcial seleccionable. */
export function hasPartialSurfaces(asset: ViewerAsset | null | undefined) {
  return !!asset?.meshMappings.some(m => m.admission === "partial-surface");
}
