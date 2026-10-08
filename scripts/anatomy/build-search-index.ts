import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { normalizeTerm } from "../../src/modules/search/normalize";
import type { Structure, Species, Region, Model } from "../../src/modules/anatomy/schemas/catalog";

export interface SearchIndexEntry {
  id: string;
  speciesId: string;
  speciesSpanish: string;
  regionId: string;
  regionSpanish: string;
  kind: string;
  canonicalLatinName: string;
  spanishName: string;
  aliases: string[];
  summary: string;
  has3DModel: boolean;
  modelIds: string[];
  searchTokens: string[];
}

export async function buildSearchIndex(): Promise<SearchIndexEntry[]> {
  const read = async <T>(name: string): Promise<T> => {
    const raw = await readFile(resolve("data/anatomy", `${name}.json`), "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  };

  const structures: Structure[] = await read("structures");
  const speciesList: Species[] = await read("species");
  const regions: Region[] = await read("regions");
  const models: Model[] = await read("models");

  const speciesMap = new Map(speciesList.map((s) => [s.id, s.spanishName]));
  const regionMap = new Map(regions.map((r) => [r.id, r.spanishName]));

  const availableModels = new Set(
    models.filter((m) => m.availability === "available").map((m) => m.id)
  );

  const index: SearchIndexEntry[] = [];
  const seenIds = new Set<string>();

  for (const s of structures) {
    if (seenIds.has(s.id)) continue;
    seenIds.add(s.id);

    const has3D = s.modelIds.some((id) => availableModels.has(id));
    const tokenSet = new Set<string>();

    const addTokens = (text: string) => {
      const norm = normalizeTerm(text);
      if (!norm) return;
      tokenSet.add(norm);
      norm.split(/\s+/).forEach((w) => {
        if (w.length > 2) tokenSet.add(w);
      });
    };

    addTokens(s.canonicalLatinName);
    addTokens(s.spanishName);
    s.aliases.forEach(addTokens);

    index.push({
      id: s.id,
      speciesId: s.speciesId,
      speciesSpanish: speciesMap.get(s.speciesId) || s.speciesId,
      regionId: s.regionId,
      regionSpanish: regionMap.get(s.regionId) || s.regionId,
      kind: s.kind,
      canonicalLatinName: s.canonicalLatinName,
      spanishName: s.spanishName,
      aliases: [...s.aliases].sort(),
      summary: s.summary,
      has3DModel: has3D,
      modelIds: [...s.modelIds].sort(),
      searchTokens: Array.from(tokenSet).sort()
    });
  }

  // Orden determinista para garantizar reproducibilidad idéntica
  index.sort((a, b) => a.id.localeCompare(b.id));

  const targetFile = resolve("data/anatomy/search-index.json");
  await writeFile(targetFile, JSON.stringify(index, null, 2) + "\n", "utf8");

  return index;
}

if (process.argv[1]?.endsWith("build-search-index.ts")) {
  buildSearchIndex()
    .then((idx) => {
      const canineCount = idx.filter((e) => e.speciesId === "canine").length;
      const felineCount = idx.filter((e) => e.speciesId === "feline").length;
      const with3D = idx.filter((e) => e.has3DModel).length;

      console.log("=== ÍNDICE DE BÚSQUEDA ANATÓMICO RECONSTRUIDO ===");
      console.log(`Total de entradas: ${idx.length}`);
      console.log(`  - Caninas: ${canineCount}`);
      console.log(`  - Felinas: ${felineCount}`);
      console.log(`  - Con modelos 3D disponibles: ${with3D}`);
      console.log(`Archivo generado: data/anatomy/search-index.json`);
    })
    .catch((err) => {
      console.error("Fallo al construir índice:", err);
      process.exitCode = 1;
    });
}
