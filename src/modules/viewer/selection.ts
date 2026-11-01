import type { ViewerAsset } from "./manifest";

/**
 * Activo científico que la página principal muestra para una especie y región.
 * Prioridad: modelo corporal disponible; si no existe, modelo regional de la región
 * elegida; con «Todo el animal» y sin modelo corporal, el único regional disponible
 * de la especie (p. ej. cráneo canino), marcado como `partial` para avisar al usuario.
 * Solo se admiten activos que el catálogo de la API también declara disponibles.
 */
export type WorkspaceAssetChoice = { asset: ViewerAsset; coverage: "whole-body" | "region" | "partial" } | null;

export function workspaceAsset(assets: readonly ViewerAsset[], speciesId: string, regionId: string, availableModelIds: ReadonlySet<string>): WorkspaceAssetChoice {
  const usable = assets.filter(a => a.speciesId === speciesId && a.purpose === "scientific" && a.availability === "available" && availableModelIds.has(a.id));
  const wholeBody = usable.find(a => a.scope === "whole-body");
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
