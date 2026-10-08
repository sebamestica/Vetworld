import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectGlbAsset } from "./inspect-assets";
import type { Structure, Model } from "../../src/modules/anatomy/schemas/catalog";
import type { ViewerAsset } from "../../src/modules/viewer/manifest";

async function readJson<T>(relPath: string): Promise<T> {
  const content = await readFile(resolve(relPath), "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

export async function runComprehensiveAssetValidation(): Promise<{
  passed: boolean;
  modelCount: number;
  totalTriangles: number;
  totalGpuBytes: number;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const models: Model[] = await readJson("data/anatomy/models.json");
  const structures: Structure[] = await readJson("data/anatomy/structures.json");
  const viewerAssets: ViewerAsset[] = await readJson("data/viewer/assets.json");

  const structMap = new Map(structures.map((s) => [s.id, s]));
  let totalTriangles = 0;
  let totalGpuBytes = 0;

  // 1. Validar modelos en catálogo
  for (const model of models) {
    if (model.availability === "available") {
      if (!model.resourceUrl) {
        errors.push(`${model.id}: Modelo disponible sin resourceUrl`);
        continue;
      }
      const localPath = resolve("public", "." + model.resourceUrl);
      const exists = await stat(localPath).catch(() => null);
      if (!exists) {
        errors.push(`${model.id}: Archivo físico inexistente en ${localPath}`);
        continue;
      }

      const inspection = await inspectGlbAsset(localPath);
      if (!inspection.isGlb2) {
        errors.push(`${model.id}: Archivo no es GLB 2.0 válido (${inspection.warnings.join(", ")})`);
      }

      if (model.fileEvidence) {
        if (inspection.byteSize !== model.fileEvidence.byteSize) {
          errors.push(`${model.id}: Tamaño en bytes no coincide (${inspection.byteSize} vs ${model.fileEvidence.byteSize})`);
        }
        if (inspection.sha256 !== model.fileEvidence.sha256) {
          errors.push(`${model.id}: SHA-256 no coincide`);
        }
      } else {
        errors.push(`${model.id}: Falta evidencia de archivo (fileEvidence)`);
      }

      if (inspection.triangleCount === 0) {
        errors.push(`${model.id}: Modelo contiene 0 triángulos`);
      }

      totalTriangles += inspection.triangleCount;
      totalGpuBytes += inspection.estimatedGpuBytes;

      // Validar mapeos de mallas
      const nodeSet = new Set(inspection.nodeNames);
      for (const mapping of model.meshMappings) {
        if (!nodeSet.has(mapping.nodeId)) {
          errors.push(`${model.id}: Malla declarada '${mapping.nodeId}' no existe en el archivo GLB`);
        }
        const struct = structMap.get(mapping.structureId);
        if (!struct) {
          errors.push(`${model.id}: Malla '${mapping.nodeId}' referencia estructura inexistente '${mapping.structureId}'`);
        } else if (struct.speciesId !== model.speciesId) {
          errors.push(`${model.id}: Incompatibilidad de especie para '${mapping.structureId}'`);
        }
      }

      // Validar licencias y procedencia
      if (!model.license.verified || !model.license.redistributionAllowed) {
        errors.push(`${model.id}: Modelo disponible sin licencia verificada o sin redistribución permitida`);
      }
      if (model.sourceIds.length === 0) {
        errors.push(`${model.id}: Modelo sin fuentes documentadas`);
      }
    } else {
      warnings.push(`${model.id}: Modelo pendiente/no disponible (${model.notes})`);
    }
  }

  // 2. Validar consistencia con viewerAssets
  for (const asset of viewerAssets) {
    if (asset.availability === "available") {
      const localPath = resolve("public", "." + asset.resourceUrl);
      const exists = await stat(localPath).catch(() => null);
      if (!exists) {
        errors.push(`viewerAsset ${asset.id}: Recurso inexistente ${asset.resourceUrl}`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    modelCount: models.filter((m) => m.availability === "available").length,
    totalTriangles,
    totalGpuBytes,
    errors,
    warnings
  };
}

if (process.argv[1]?.endsWith("validate-assets.ts")) {
  runComprehensiveAssetValidation()
    .then((res) => {
      console.log("=== VALIDACIÓN DE ACTIVOS Y GEOMETRÍA ANATÓMICA ===");
      console.log(`Estado: ${res.passed ? "APROBADO" : "FALLIDO"}`);
      console.log(`Modelos disponibles verificados: ${res.modelCount}`);
      console.log(`Triángulos totales en atlas: ${res.totalTriangles.toLocaleString()}`);
      console.log(`Memoria GPU estimada: ${(res.totalGpuBytes / 1024 / 1024).toFixed(2)} MB`);
      if (res.errors.length) {
        console.error("\nErrores:");
        res.errors.forEach((e) => console.error("  -", e));
      }
      if (res.warnings.length) {
        console.log(`\nAdvertencias controladas (${res.warnings.length}):`);
        res.warnings.slice(0, 5).forEach((w) => console.log("  -", w));
        if (res.warnings.length > 5) console.log(`  ... y ${res.warnings.length - 5} más.`);
      }
      if (!res.passed) process.exitCode = 1;
    })
    .catch((err) => {
      console.error("Fallo inesperado al validar activos:", err);
      process.exitCode = 1;
    });
}
