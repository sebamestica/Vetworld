if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    result: ArrayBuffer | null = null;
    onload: ((event: unknown) => void) | null = null;
    onloadend: ((event: unknown) => void) | null = null;
    onerror: ((err: unknown) => void) | null = null;
    async readAsArrayBuffer(blob: Blob) {
      try {
        this.result = await blob.arrayBuffer();
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      } catch (err) {
        this.onerror?.(err);
      }
    }
  } as unknown as typeof FileReader;
}

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

async function fetchOrCache(url: string, destination: string): Promise<Buffer> {
  const destPath = resolve(destination);
  if (existsSync(destPath)) {
    console.log(`[Cache] Usando archivo local: ${destination}`);
    return readFile(destPath);
  }
  console.log(`[Descarga] Obteniendo de ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fallo al descargar ${url}: HTTP ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  await writeFile(destPath, buf);
  console.log(`[Guardado] Guardado en ${destination} (${buf.length.toLocaleString()} bytes)`);
  return buf;
}

async function exportSceneToGlb(scene: THREE.Object3D): Promise<Buffer> {
  const exporter = new GLTFExporter();
  const arrayBuf = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result as ArrayBuffer),
      reject,
      { binary: true }
    );
  });
  return Buffer.from(arrayBuf);
}

export interface ConvertedModelInfo {
  id: string;
  speciesId: "canine" | "feline";
  regionId: string;
  outputPath: string;
  mirrorPath: string;
  byteSize: number;
  sha256: string;
  triangleCount: number;
  estimatedGpuBytes: number;
  meshNodes: string[];
}

export async function convertCanineThoracicLimb(): Promise<ConvertedModelInfo> {
  console.log("\n--- Procesando Miembro Torácico Canino ---");
  await mkdir("assets-source/canine", { recursive: true });
  await mkdir("public/anatomy/canine/skeleton", { recursive: true });
  await mkdir("public/models/canine", { recursive: true });

  const url = "https://raw.githubusercontent.com/TomasArguello/InNervateVR/main/Assets/Models/CanineLeg/thoracicLimb_bonesSeparated.fbx";
  const fbxBuffer = await fetchOrCache(url, "assets-source/canine/thoracicLimb_bonesSeparated.fbx");

  const loader = new FBXLoader();
  const fbxScene = loader.parse(fbxBuffer.buffer.slice(fbxBuffer.byteOffset, fbxBuffer.byteOffset + fbxBuffer.byteLength) as ArrayBuffer, "");

  // Escalado a metros (1 unidad = 1 cm -> 0.01 m)
  fbxScene.scale.set(0.01, 0.01, 0.01);
  fbxScene.updateMatrixWorld(true);

  const boneNames = new Set(["scaplula_bne", "ulna_bne", "humerus_bne", "manus_bne", "radius_bne"]);
  const nerveNames = new Set([
    "L_AxillaryNerve", "L_SubscapularNerve", "L_SuprascapularNerve",
    "L_RadialNerve", "L_MedianUlnarNerve", "L_MusculocutaneousNerve"
  ]);

  const meshNodes: string[] = [];
  let triangleCount = 0;

  fbxScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      meshNodes.push(mesh.name);

      const pos = mesh.geometry.attributes.position;
      const index = mesh.geometry.index;
      triangleCount += index ? index.count / 3 : (pos ? pos.count / 3 : 0);

      // Materiales PBR anatómicos mates
      let color = 0xdcd6cd; // Hueso
      if (nerveNames.has(mesh.name)) {
        color = 0xd9b343; // Nervio
      } else if (!boneNames.has(mesh.name)) {
        color = 0x9e5348; // Músculo
      }

      mesh.material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
        metalness: 0.05
      });
    }
  });

  const glbBuffer = await exportSceneToGlb(fbxScene);
  const sha256 = createHash("sha256").update(glbBuffer).digest("hex");

  const out1 = "public/anatomy/canine/skeleton/thoracic-limb.glb";
  const out2 = "public/models/canine/thoracic-limb.glb";
  await writeFile(out1, glbBuffer);
  await writeFile(out2, glbBuffer);

  // Estimación de buffers GPU
  const jsonLen = glbBuffer.readUInt32LE(12);
  const binLen = glbBuffer.readUInt32LE(20 + jsonLen);

  console.log(`[Canino] Exportado con éxito: ${glbBuffer.length.toLocaleString()} bytes; ${Math.round(triangleCount)} triángulos; ${meshNodes.length} mallas.`);
  return {
    id: "canine:thoracic-limb-model",
    speciesId: "canine",
    regionId: "thoracic-limb",
    outputPath: "/anatomy/canine/skeleton/thoracic-limb.glb",
    mirrorPath: "/models/canine/thoracic-limb.glb",
    byteSize: glbBuffer.length,
    sha256,
    triangleCount: Math.round(triangleCount),
    estimatedGpuBytes: binLen,
    meshNodes
  };
}

export async function convertFelineThoracicLimb(): Promise<ConvertedModelInfo> {
  console.log("\n--- Procesando Miembro Torácico Felino ---");
  await mkdir("assets-source/feline", { recursive: true });
  await mkdir("public/anatomy/feline/skeleton", { recursive: true });
  await mkdir("public/models/feline", { recursive: true });

  const boneFiles: { file: string; nodeName: string }[] = [
    { file: "scapula1.glb", nodeName: "feline_scapula" },
    { file: "humerus1.glb", nodeName: "feline_humerus" },
    { file: "radius1.glb", nodeName: "feline_radius" },
    { file: "ulna1.glb", nodeName: "feline_ulna" },
    { file: "carpus1.glb", nodeName: "feline_carpus" },
    { file: "metacarpus1.glb", nodeName: "feline_metacarpus" },
    { file: "phalanges1.glb", nodeName: "feline_phalanges" }
  ];

  const gltfLoader = new GLTFLoader();
  const assembledScene = new THREE.Scene();
  assembledScene.name = "Feline_Thoracic_Limb";

  const meshNodes: string[] = [];
  let triangleCount = 0;

  for (const item of boneFiles) {
    const url = `https://raw.githubusercontent.com/ezrahmae/3D-Cat-Anatomy/main/static/glb/${encodeURIComponent(item.file)}`;
    const buf = await fetchOrCache(url, `assets-source/feline/${item.file}`);

    await new Promise<void>((resolve, reject) => {
      gltfLoader.parse(
        buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
        "",
        (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.name = item.nodeName;
              meshNodes.push(item.nodeName);

              const pos = mesh.geometry.attributes.position;
              const index = mesh.geometry.index;
              triangleCount += index ? index.count / 3 : (pos ? pos.count / 3 : 0);

              mesh.material = new THREE.MeshStandardMaterial({
                color: 0xe6dfd5,
                roughness: 0.7,
                metalness: 0.05
              });
              assembledScene.add(mesh.clone());
            }
          });
          resolve();
        },
        reject
      );
    });
  }

  const glbBuffer = await exportSceneToGlb(assembledScene);
  const sha256 = createHash("sha256").update(glbBuffer).digest("hex");

  const out1 = "public/anatomy/feline/skeleton/thoracic-limb.glb";
  const out2 = "public/models/feline/thoracic-limb.glb";
  await writeFile(out1, glbBuffer);
  await writeFile(out2, glbBuffer);

  const jsonLen = glbBuffer.readUInt32LE(12);
  const binLen = glbBuffer.readUInt32LE(20 + jsonLen);

  console.log(`[Felino Miembro] Exportado con éxito: ${glbBuffer.length.toLocaleString()} bytes; ${Math.round(triangleCount)} triángulos; ${meshNodes.length} mallas.`);
  return {
    id: "feline:thoracic-limb-model",
    speciesId: "feline",
    regionId: "thoracic-limb",
    outputPath: "/anatomy/feline/skeleton/thoracic-limb.glb",
    mirrorPath: "/models/feline/thoracic-limb.glb",
    byteSize: glbBuffer.length,
    sha256,
    triangleCount: Math.round(triangleCount),
    estimatedGpuBytes: binLen,
    meshNodes
  };
}

export async function convertFelineSkull(): Promise<ConvertedModelInfo> {
  console.log("\n--- Procesando Cráneo Felino ---");
  await mkdir("assets-source/feline", { recursive: true });
  await mkdir("public/anatomy/feline/skeleton", { recursive: true });
  await mkdir("public/models/feline", { recursive: true });

  const skullFiles: { file: string; nodeName: string }[] = [
    { file: "skull.glb", nodeName: "feline_skull" },
    { file: "mandible.glb", nodeName: "feline_mandible" },
    { file: "teeth.glb", nodeName: "feline_teeth" }
  ];

  const gltfLoader = new GLTFLoader();
  const assembledScene = new THREE.Scene();
  assembledScene.name = "Feline_Skull_Complex";

  const meshNodes: string[] = [];
  let triangleCount = 0;

  for (const item of skullFiles) {
    const url = `https://raw.githubusercontent.com/ezrahmae/3D-Cat-Anatomy/main/static/glb/${encodeURIComponent(item.file)}`;
    const buf = await fetchOrCache(url, `assets-source/feline/${item.file}`);

    await new Promise<void>((resolve, reject) => {
      gltfLoader.parse(
        buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
        "",
        (gltf) => {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.name = item.nodeName;
              meshNodes.push(item.nodeName);

              const pos = mesh.geometry.attributes.position;
              const index = mesh.geometry.index;
              triangleCount += index ? index.count / 3 : (pos ? pos.count / 3 : 0);

              mesh.material = new THREE.MeshStandardMaterial({
                color: item.nodeName === "feline_teeth" ? 0xf7f5f0 : 0xe6dfd5,
                roughness: 0.65,
                metalness: 0.05
              });
              assembledScene.add(mesh.clone());
            }
          });
          resolve();
        },
        reject
      );
    });
  }

  const glbBuffer = await exportSceneToGlb(assembledScene);
  const sha256 = createHash("sha256").update(glbBuffer).digest("hex");

  const out1 = "public/anatomy/feline/skeleton/skull.glb";
  const out2 = "public/models/feline/skull.glb";
  await writeFile(out1, glbBuffer);
  await writeFile(out2, glbBuffer);

  const jsonLen = glbBuffer.readUInt32LE(12);
  const binLen = glbBuffer.readUInt32LE(20 + jsonLen);

  console.log(`[Felino Cráneo] Exportado con éxito: ${glbBuffer.length.toLocaleString()} bytes; ${Math.round(triangleCount)} triángulos; ${meshNodes.length} mallas.`);
  return {
    id: "feline:skull-model",
    speciesId: "feline",
    regionId: "head",
    outputPath: "/anatomy/feline/skeleton/skull.glb",
    mirrorPath: "/models/feline/skull.glb",
    byteSize: glbBuffer.length,
    sha256,
    triangleCount: Math.round(triangleCount),
    estimatedGpuBytes: binLen,
    meshNodes
  };
}

export async function runAllConversions(): Promise<ConvertedModelInfo[]> {
  const canine = await convertCanineThoracicLimb();
  const felineThoracic = await convertFelineThoracicLimb();
  const felineSkull = await convertFelineSkull();
  return [canine, felineThoracic, felineSkull];
}

if (process.argv[1]?.endsWith("convert-assets.ts")) {
  runAllConversions()
    .then((results) => {
      console.log("\n=== MODELOS ANATÓMICOS CONVERTIDOS Y DISPONIBLES ===");
      console.table(results.map(r => ({
        id: r.id,
        especie: r.speciesId,
        región: r.regionId,
        mallas: r.meshNodes.length,
        triángulos: r.triangleCount,
        bytes: r.byteSize,
        sha256: r.sha256.slice(0, 16) + "..."
      })));
    })
    .catch((err) => {
      console.error("Error en pipeline de conversión:", err);
      process.exitCode = 1;
    });
}
