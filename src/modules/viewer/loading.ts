import { Mesh, Object3D, Box3 } from "three";
import { VIEWER_BUDGET, type ViewerAsset } from "./manifest";

export async function readBoundedBody(response: Response, expectedBytes: number): Promise<ArrayBuffer> {
  const advertised = response.headers.get("content-length");
  if (advertised && Number(advertised) > expectedBytes) throw new Error("Archivo excede el presupuesto");
  if (!response.body) throw new Error("Respuesta sin cuerpo");
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > expectedBytes) throw new Error("Archivo excede el presupuesto");
      chunks.push(value);
    }
    if (size !== expectedBytes) throw new Error("Tamaño de archivo inesperado");
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes.buffer;
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  finally { reader.releaseLock(); }
}
export function safeResourceUri(uri: string, origin: string): string {
  if (/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(uri) || /^data:application\/(?:octet-stream|gltf-buffer);base64,[a-zA-Z0-9+/=]+$/.test(uri)) return uri;
  if (uri.startsWith("blob:")) {
    const blobOrigin = new URL(uri.slice(5)).origin;
    if (blobOrigin === origin) return uri;
    throw new Error("Blob externo no autorizado");
  }
  const resolved = new URL(uri, origin);
  if (resolved.origin !== origin || !resolved.pathname.startsWith("/models/") || /%2e|%2f|%5c/i.test(resolved.pathname)) throw new Error("Recurso externo no autorizado");
  return resolved.href;
}
export function validateLoadedScene(scene: Object3D, asset: ViewerAsset) {
  let triangles = 0, gpuBytes = 0;
  const buffers = new Set<ArrayBufferLike>();
  const nodes = new Map<string, number>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    nodes.set(object.name, (nodes.get(object.name) ?? 0) + 1);
    const position = object.geometry.getAttribute("position");
    if (!position || !Number.isFinite(position.count)) throw new Error("Malla sin posiciones válidas");
    triangles += (object.geometry.index?.count ?? position.count) / 3;
    const attributes = [...Object.values(object.geometry.attributes), ...(object.geometry.index ? [object.geometry.index] : [])];
    for (const attribute of attributes) {
      const array = "array" in attribute ? attribute.array : attribute.data.array;
      if (!buffers.has(array.buffer)) { buffers.add(array.buffer); gpuBytes += array.buffer.byteLength; }
    }
    for (let i = 0; i < position.count; i++) if (![position.getX(i), position.getY(i), position.getZ(i)].every(Number.isFinite)) throw new Error("Posiciones no finitas");
  });
  if (triangles > VIEWER_BUDGET.triangles || triangles !== asset.triangleCount) throw new Error("Presupuesto real de triángulos inválido");
  if (gpuBytes > VIEWER_BUDGET.gpuBytes) throw new Error("Presupuesto real de buffers inválido");
  for (const mapping of asset.meshMappings) if (nodes.get(mapping.nodeId) !== 1) throw new Error("Mapping de nodo ausente o ambiguo");
  const bounds = new Box3().setFromObject(scene);
  if (bounds.isEmpty() || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) throw new Error("Límites espaciales inválidos");
}
