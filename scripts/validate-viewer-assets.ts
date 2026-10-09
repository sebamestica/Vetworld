import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { viewerAssets } from "../src/modules/viewer/assets";
import structures from "../data/anatomy/structures.json";
import { VIEWER_BUDGET } from "../src/modules/viewer/manifest";

for (const asset of viewerAssets) {
  if (asset.availability !== "available") { console.log(`${asset.id}: pendiente; no se publica ni valida como disponible.`); continue; }
  const bytes = await readFile(`public${asset.resourceUrl}`);
  if (bytes.length !== asset.byteSize || createHash("sha256").update(bytes).digest("hex") !== asset.sha256) throw new Error(`${asset.id}: tamaño/checksum inválido`);
  if (asset.format !== "glb") throw new Error("Este validador offline requiere GLB; glTF necesita auditoría de recursos externos");
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length || bytes.readUInt32LE(16) !== 0x4e4f534a) throw new Error("Cabecera GLB inválida");
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8")) as { nodes: { name?: string; mesh?: number }[]; meshes: { primitives: { indices?: number; attributes: { POSITION: number } }[] }[]; accessors: { count: number }[]; buffers: { byteLength: number; uri?: string }[]; images?: unknown[] };
  if (document.buffers.some((buffer) => buffer.uri) || (asset.purpose === "technical_demo" && document.images?.length)) throw new Error("Activo debe ser autocontenido; fixture sin imágenes");
  let triangles = 0;
  for (const mesh of document.meshes) for (const primitive of mesh.primitives) triangles += document.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
  const gpuBytes = document.buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  if (triangles !== asset.triangleCount || triangles > VIEWER_BUDGET.triangles || gpuBytes !== asset.estimatedGpuBytes || gpuBytes > VIEWER_BUDGET.gpuBytes) throw new Error("Presupuesto o métricas inválidas");
  for (const mapping of asset.meshMappings) {
    if (document.nodes.filter((node) => node.name === mapping.nodeId && node.mesh !== undefined).length !== 1) throw new Error(`Nodo ausente/duplicado: ${mapping.nodeId}`);
    if (!structures.some((structure) => structure.id === mapping.structureId && structure.speciesId === asset.speciesId)) throw new Error(`Estructura/especie inválida: ${mapping.structureId}`);
  }
  for (const node of asset.visualNodes ?? []) if (document.nodes.filter(entry => entry.name === node.nodeId && entry.mesh !== undefined).length !== 1) throw new Error(`Nodo visual ausente/ambiguo: ${node.nodeId}`);
  console.log(`${asset.id}: GLB ${bytes.length} bytes; ${triangles} triángulos; GPU estimada ${gpuBytes} bytes; ${asset.meshMappings.length} mappings válidos; revisión ${asset.reviewStatus}.`);
}
