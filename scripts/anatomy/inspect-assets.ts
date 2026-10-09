import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

export interface AssetInspectionResult {
  filePath: string;
  byteSize: number;
  sha256: string;
  format: string;
  isGlb2: boolean;
  triangleCount: number;
  vertexCount: number;
  meshCount: number;
  nodeNames: string[];
  estimatedGpuBytes: number;
  hasImages: boolean;
  hasUris: boolean;
  warnings: string[];
}

export async function inspectGlbAsset(targetPath: string): Promise<AssetInspectionResult> {
  const fullPath = resolve(targetPath);
  const bytes = await readFile(fullPath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const warnings: string[] = [];

  const isGlb = bytes.length >= 20 &&
    bytes.readUInt32LE(0) === 0x46546c67 && // 'glTF'
    bytes.readUInt32LE(4) === 2 &&           // version 2
    bytes.readUInt32LE(8) === bytes.length &&
    bytes.readUInt32LE(16) === 0x4e4f534a;   // 'JSON'

  if (!isGlb) {
    return {
      filePath: targetPath,
      byteSize: bytes.length,
      sha256,
      format: "unknown_or_corrupt",
      isGlb2: false,
      triangleCount: 0,
      vertexCount: 0,
      meshCount: 0,
      nodeNames: [],
      estimatedGpuBytes: 0,
      hasImages: false,
      hasUris: false,
      warnings: ["No es un binario GLB 2.0 válido o cabecera dañada"]
    };
  }

  const jsonLength = bytes.readUInt32LE(12);
  const jsonString = bytes.subarray(20, 20 + jsonLength).toString("utf8");
  const gltf = JSON.parse(jsonString) as {
    nodes?: { name?: string; mesh?: number }[];
    meshes?: { name?: string; primitives: { indices?: number; attributes: Record<string, number> }[] }[];
    accessors?: { count: number }[];
    buffers?: { byteLength: number; uri?: string }[];
    images?: unknown[];
  };

  const nodeNames = (gltf.nodes || []).map((n, i) => n.name || `Node_${i}`);
  let triangleCount = 0;
  let vertexCount = 0;

  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives) {
      if (prim.attributes.POSITION !== undefined && gltf.accessors) {
        vertexCount += gltf.accessors[prim.attributes.POSITION]?.count || 0;
      }
      if (prim.indices !== undefined && gltf.accessors) {
        triangleCount += (gltf.accessors[prim.indices]?.count || 0) / 3;
      } else if (prim.attributes.POSITION !== undefined && gltf.accessors) {
        triangleCount += (gltf.accessors[prim.attributes.POSITION]?.count || 0) / 3;
      }
    }
  }

  const estimatedGpuBytes = (gltf.buffers || []).reduce((sum, b) => sum + b.byteLength, 0);
  const hasImages = (gltf.images?.length || 0) > 0;
  const hasUris = (gltf.buffers || []).some((b) => Boolean(b.uri));

  if (hasUris) warnings.push("Contiene buffers externos (no autocontenido)");
  if (triangleCount === 0) warnings.push("No contiene triángulos o geometría vacía");

  return {
    filePath: targetPath,
    byteSize: bytes.length,
    sha256,
    format: "glb",
    isGlb2: true,
    triangleCount: Math.round(triangleCount),
    vertexCount,
    meshCount: gltf.meshes?.length || 0,
    nodeNames,
    estimatedGpuBytes,
    hasImages,
    hasUris,
    warnings
  };
}

// Ejecución directa por CLI
if (process.argv[1]?.endsWith("inspect-assets.ts")) {
  async function main() {
    const args = process.argv.slice(2);
    const paths = args.length > 0 ? args : [
      "public/models/technical/interaction-demo.glb",
      "public/anatomy/canine/skeleton/thoracic-limb.glb",
      "public/anatomy/feline/skeleton/thoracic-limb.glb",
      "public/anatomy/feline/skeleton/skull.glb"
    ];

    console.log("=== INSPECCIÓN DE ACTIVOS 3D VETWORLD ===");
    for (const p of paths) {
      try {
        const stats = await stat(p).catch(() => null);
        if (!stats) {
          console.log(`\n[-] Archivo no existe aún: ${p}`);
          continue;
        }
        const res = await inspectGlbAsset(p);
        console.log(`\n[+] Activo: ${res.filePath}`);
        console.log(`    Tamaño: ${res.byteSize.toLocaleString()} bytes (${(res.byteSize / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`    SHA-256: ${res.sha256}`);
        console.log(`    Triángulos: ${res.triangleCount.toLocaleString()}`);
        console.log(`    Vértices: ${res.vertexCount.toLocaleString()}`);
        console.log(`    Mallas: ${res.meshCount}`);
        console.log(`    GPU estimada: ${(res.estimatedGpuBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Nodos (${res.nodeNames.length}): ${res.nodeNames.slice(0, 10).join(", ")}${res.nodeNames.length > 10 ? "..." : ""}`);
        if (res.warnings.length) {
          console.log(`    Avisos: ${res.warnings.join("; ")}`);
        }
      } catch (e) {
        console.error(`    Error al inspeccionar ${p}:`, e instanceof Error ? e.message : e);
      }
    }
  }
  main().catch(console.error);
}
