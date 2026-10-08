import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { BoxGeometry, ConeGeometry, SphereGeometry, TorusGeometry } from "three";

// Generación propia: formas geométricas, sin pretensión anatómica ni dimensiones biológicas.
const geometries = [new SphereGeometry(0.6, 32, 20), new BoxGeometry(1.05, 1.05, 1.05), new TorusGeometry(0.43, 0.17, 16, 40), new ConeGeometry(0.6, 1.2, 32)];
const names = ["demo-sphere", "demo-box", "demo-torus", "demo-cone"];
const positions = [[-1.25, 0.9, 0], [1.25, 0.9, 0], [-1.25, -0.9, 0], [1.25, -0.9, 0]];
const colors = [[0.66, 0.73, 0.77, 1], [0.55, 0.35, 0.29, 1], [0.79, 0.65, 0.28, 1], [0.31, 0.54, 0.56, 1]];
const chunks: Buffer[] = [];
const bufferViews: object[] = [];
const accessors: object[] = [];
let byteOffset = 0, triangles = 0;
function append(array: ArrayBufferView, componentType: number, type: string, count: number, bounds?: { min: number[]; max: number[] }) {
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4); bytes.copy(padded);
  const view = bufferViews.length; bufferViews.push({ buffer: 0, byteOffset, byteLength: bytes.length });
  chunks.push(padded); byteOffset += padded.length;
  const accessor = accessors.length; accessors.push({ bufferView: view, componentType, count, type, ...bounds }); return accessor;
}
const meshes = geometries.map((geometry, index) => {
  geometry.computeBoundingBox();
  const position = geometry.getAttribute("position"), normal = geometry.getAttribute("normal"), indices = geometry.index!;
  triangles += indices.count / 3;
  const p = append(position.array, 5126, "VEC3", position.count, { min: geometry.boundingBox!.min.toArray(), max: geometry.boundingBox!.max.toArray() });
  const n = append(normal.array, 5126, "VEC3", normal.count);
  const i = append(indices.array, indices.array instanceof Uint32Array ? 5125 : 5123, "SCALAR", indices.count);
  return { name: names[index], primitives: [{ attributes: { POSITION: p, NORMAL: n }, indices: i, material: index }] };
});
const document = { asset: { version: "2.0", generator: "Atlas Veterinario: fixture técnica propia" }, scene: 0, scenes: [{ nodes: [0, 1, 2, 3] }], nodes: names.map((name, mesh) => ({ name, mesh, translation: positions[mesh] })), meshes, materials: colors.map((color) => ({ pbrMetallicRoughness: { baseColorFactor: color, metallicFactor: 0, roughnessFactor: 0.8 } })), accessors, bufferViews, buffers: [{ byteLength: byteOffset }] };
const json = Buffer.from(JSON.stringify(document));
const jsonChunk = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(jsonChunk);
const bin = Buffer.concat(chunks), glb = Buffer.alloc(12 + 8 + jsonChunk.length + 8 + bin.length);
glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8);
glb.writeUInt32LE(jsonChunk.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); jsonChunk.copy(glb, 20);
const binHeader = 20 + jsonChunk.length; glb.writeUInt32LE(bin.length, binHeader); glb.writeUInt32LE(0x004e4942, binHeader + 4); bin.copy(glb, binHeader + 8);
await mkdir("public/models/technical", { recursive: true }); await mkdir("data/viewer", { recursive: true });
await writeFile("public/models/technical/interaction-demo.glb", glb);
const layerIds = ["skeleton", "muscles-unclassified", "nerves", "tendons"];
const structures = ["scapula", "biceps-brachii", "musculocutaneous-nerve", "biceps-origin-tendon"];
const manifests = ["canine", "feline"].map((speciesId) => ({ id: `${speciesId}-technical-demo`, speciesId, regionId: "thoracic-limb", title: "Demostración técnica — formas geométricas", purpose: "technical_demo", format: "glb", resourceUrl: "/models/technical/interaction-demo.glb", unit: "m", scaleToMeters: 1, orientation: "+Y arriba; +Z hacia cámara; colocación sin significado anatómico", byteSize: glb.length, triangleCount: triangles, estimatedGpuBytes: bin.length, sha256: createHash("sha256").update(glb).digest("hex"), license: { label: "Geometría original del proyecto; uso, modificación y redistribución autorizados para esta fixture técnica", verified: true, redistributionAllowed: true }, reviewStatus: "pending", availability: "available", meshMappings: names.map((nodeId, index) => ({ nodeId, structureId: `${speciesId}:${structures[index]}`, layerId: layerIds[index] })), layers: layerIds.map((id, i) => ({ id, label: ["Esqueleto", "Músculos sin profundidad asignada", "Nervios", "Tendones"][i] })), specimen: null }));
await writeFile("data/viewer/assets.json", `${JSON.stringify(manifests, null, 2)}\n`);
geometries.forEach((geometry) => geometry.dispose());
console.log(`Fixture técnica generada: ${glb.length} bytes, ${triangles} triángulos; sin anatomía.`);
