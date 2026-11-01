/** Conserva atributos, posiciones, UV/materiales; solo particiona índices de triángulos. */
export function partitionGlb(source: Buffer, groups: {nodeId: string; faceIndices: number[]}[]) {
  if (source.readUInt32LE(0) !== 0x46546c67 || source.readUInt32LE(4) !== 2 || source.readUInt32LE(8) !== source.length) throw new Error('GLB inválido');
  const jsonLength = source.readUInt32LE(12);
  const doc = JSON.parse(source.subarray(20, 20 + jsonLength).toString('utf8'));
  if (doc.meshes.length !== 1 || doc.meshes[0].primitives.length !== 1) throw new Error('Piloto requiere una malla y una primitiva');
  const primitive = doc.meshes[0].primitives[0];
  if (doc.animations?.length || doc.skins?.length || primitive.targets) throw new Error('Animación/skin/morph requiere un pipeline específico');
  if ((primitive.mode ?? 4) !== 4 || primitive.indices === undefined) throw new Error('Se requieren triángulos indexados');
  const accessor = doc.accessors[primitive.indices];
  if (accessor.sparse) throw new Error('Índices sparse no admitidos en este piloto');
  const view = doc.bufferViews[accessor.bufferView];
  const binOffset = 28 + jsonLength;
  if (source.readUInt32LE(24 + jsonLength) !== 0x004e4942 || doc.buffers.length !== 1 || doc.buffers[0].uri) throw new Error('GLB debe tener BIN autocontenido');
  const bin = source.subarray(binOffset, binOffset + doc.buffers[0].byteLength);
  const componentBytes = accessor.componentType === 5125 ? 4 : accessor.componentType === 5123 ? 2 : accessor.componentType === 5121 ? 1 : 0;
  if (!componentBytes || accessor.count % 3) throw new Error('Índices inválidos');
  const indexStart = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const stride = view.byteStride ?? componentBytes;
  const indexAt = (index: number) => componentBytes === 4 ? bin.readUInt32LE(indexStart + index * stride) : componentBytes === 2 ? bin.readUInt16LE(indexStart + index * stride) : bin.readUInt8(indexStart + index * stride);
  const faceCount = accessor.count / 3;
  const used = new Set<number>(), names = new Set<string>();
  for (const group of groups) {
    if (!group.nodeId || names.has(group.nodeId) || !group.faceIndices.length) throw new Error('Grupo vacío o nombre duplicado');
    names.add(group.nodeId);
    for (const face of group.faceIndices) {
      if (!Number.isInteger(face) || face < 0 || face >= faceCount || used.has(face)) throw new Error('Cara inválida o solapada');
      used.add(face);
    }
  }
  const partitions = [...groups, {nodeId: 'unidentified-remainder', faceIndices: Array.from({length: faceCount}, (_, index) => index).filter(face => !used.has(face))}].filter(group => group.faceIndices.length);
  if (names.has('unidentified-remainder')) throw new Error('Nombre reservado');
  const padding = Buffer.alloc((4 - bin.length % 4) % 4);
  const chunks = [bin, padding]; let offset = bin.length + padding.length;
  const sourceNode = doc.nodes.find((node: {mesh?: number}) => node.mesh === 0);
  if (!sourceNode) throw new Error('Nodo fuente inexistente');
  const sourceNodeIndex = doc.nodes.indexOf(sourceNode);
  if (sourceNode.children?.length || doc.nodes.some((node: {children?: number[]}) => node.children?.includes(sourceNodeIndex)) || doc.nodes.filter((node: {mesh?: number}) => node.mesh === 0).length !== 1) throw new Error('Jerarquía/instancias requieren registro explícito');
  doc.nodes = []; doc.meshes = [];
  for (const group of partitions) {
    const indices = Buffer.alloc(group.faceIndices.length * 12);
    group.faceIndices.forEach((face, index) => { for (let corner = 0; corner < 3; corner++) indices.writeUInt32LE(indexAt(face * 3 + corner), (index * 3 + corner) * 4); });
    const bufferView = doc.bufferViews.length;
    doc.bufferViews.push({buffer: 0, byteOffset: offset, byteLength: indices.length, target: 34963});
    const newAccessor = doc.accessors.length;
    doc.accessors.push({bufferView, componentType: 5125, count: group.faceIndices.length * 3, type: 'SCALAR'});
    doc.meshes.push({name: group.nodeId, primitives: [{...primitive, indices: newAccessor}]});
    const {mesh: originalMesh, ...transform} = sourceNode;
    void originalMesh;
    doc.nodes.push({...transform, name: group.nodeId, mesh: doc.meshes.length - 1});
    chunks.push(indices); offset += indices.length;
  }
  doc.scenes = [{nodes: doc.nodes.map((_: unknown, index: number) => index)}]; doc.scene = 0;
  doc.buffers = [{byteLength: offset}];
  const json = Buffer.from(JSON.stringify(doc));
  const jsonPad = Buffer.alloc((4 - json.length % 4) % 4, 32);
  const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + json.length + jsonPad.length + offset, 8); header.writeUInt32LE(json.length + jsonPad.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(offset, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, json, jsonPad, binHeader, ...chunks]);
}

type GlbDocument = {
  nodes: {name?: string; mesh?: number; [key: string]: unknown}[];
  meshes: {name?: string; primitives: {attributes: Record<string, number>; indices?: number; material?: number; mode?: number}[]}[];
  accessors: {bufferView?: number; byteOffset?: number; componentType: number; count: number; type: string}[];
  bufferViews: {byteOffset?: number; byteLength: number}[];
  images?: {bufferView?: number}[]; materials?: unknown[]; textures?: unknown[]; samplers?: unknown[];
};
function readGlb(bytes: Uint8Array) {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length) throw new Error('GLB inválido');
  const jsonLength = buffer.readUInt32LE(12);
  const doc = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8')) as GlbDocument;
  const binLength = buffer.readUInt32LE(20 + jsonLength);
  if (buffer.readUInt32LE(24 + jsonLength) !== 0x004e4942) throw new Error('GLB sin BIN');
  const bin = buffer.subarray(28 + jsonLength, 28 + jsonLength + binLength);
  const view = (index: number) => { const entry = doc.bufferViews[index]; return bin.subarray(entry.byteOffset ?? 0, (entry.byteOffset ?? 0) + entry.byteLength); };
  return {doc, view};
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Compara un GLB particionado con su fuente sin confiar en metadatos: mismos accesores de
 * atributos (bytes), imágenes, materiales, texturas y muestreadores; transformación de nodo
 * igual a la del nodo fuente; y el multiconjunto de triángulos (tripletas de vértices) idéntico.
 * Solo acredita conservación geométrica; no dice nada sobre identidad anatómica.
 */
export function comparePartitionedGlb(original: Uint8Array, derived: Uint8Array) {
  const a = readGlb(original), b = readGlb(derived);
  const [sourcePrimitive] = a.doc.meshes[0].primitives;
  const sourceNode = a.doc.nodes.find(node => node.mesh === 0);
  if (a.doc.meshes.length !== 1 || a.doc.meshes[0].primitives.length !== 1 || !sourceNode || sourcePrimitive.indices === undefined) throw new Error('Fuente no admitida');
  const {mesh: sourceMesh, name: sourceName, ...sourceTransform} = sourceNode; void sourceMesh; void sourceName;
  const attributeBytes = (glb: typeof a, accessor: number) => glb.view(glb.doc.accessors[accessor].bufferView ?? -1);
  const issues: string[] = [];
  if (!same(a.doc.materials, b.doc.materials) || !same(a.doc.textures, b.doc.textures) || !same(a.doc.samplers, b.doc.samplers)) issues.push('materiales, texturas o muestreadores distintos');
  if ((a.doc.images ?? []).length !== (b.doc.images ?? []).length || (a.doc.images ?? []).some((image, index) => image.bufferView === undefined || !a.view(image.bufferView).equals(b.view(b.doc.images![index].bufferView ?? -1)))) issues.push('imágenes distintas');
  const triangleKey = (glb: typeof a, accessorIndex: number) => {
    const accessor = glb.doc.accessors[accessorIndex];
    const bytes = glb.view(accessor.bufferView ?? -1).subarray(accessor.byteOffset ?? 0);
    const size = accessor.componentType === 5125 ? 4 : accessor.componentType === 5123 ? 2 : 1;
    const read = (index: number) => size === 4 ? bytes.readUInt32LE(index * 4) : size === 2 ? bytes.readUInt16LE(index * 2) : bytes.readUInt8(index);
    const keys: string[] = [];
    for (let index = 0; index < accessor.count; index += 3) keys.push(`${read(index)},${read(index + 1)},${read(index + 2)}`);
    return keys;
  };
  const pending = new Map<string, number>();
  for (const key of triangleKey(a, sourcePrimitive.indices)) pending.set(key, (pending.get(key) ?? 0) + 1);
  const nodes: {name: string; triangles: number}[] = [];
  for (const node of b.doc.nodes) {
    if (node.mesh === undefined) { issues.push(`nodo sin malla ${node.name ?? '?'}`); continue; }
    const {mesh, name, ...transform} = node;
    if (!same(transform, sourceTransform)) issues.push(`transformación distinta en ${name}`);
    const primitives = b.doc.meshes[mesh].primitives;
    let triangles = 0;
    for (const primitive of primitives) {
      if (primitive.material !== sourcePrimitive.material || (primitive.mode ?? 4) !== (sourcePrimitive.mode ?? 4) || primitive.indices === undefined) issues.push(`primitiva distinta en ${name}`);
      for (const [attribute, accessor] of Object.entries(sourcePrimitive.attributes)) {
        const candidate = primitive.attributes[attribute];
        if (candidate === undefined || !same(a.doc.accessors[accessor], b.doc.accessors[candidate]) || !attributeBytes(a, accessor).equals(attributeBytes(b, candidate))) issues.push(`atributo ${attribute} distinto en ${name}`);
      }
      if (Object.keys(primitive.attributes).length !== Object.keys(sourcePrimitive.attributes).length) issues.push(`atributos añadidos en ${name}`);
      if (primitive.indices === undefined) continue;
      for (const key of triangleKey(b, primitive.indices)) {
        const count = pending.get(key) ?? 0;
        if (!count) issues.push(`triángulo añadido o duplicado en ${name}`); else pending.set(key, count - 1);
        triangles++;
      }
    }
    nodes.push({name: String(name), triangles});
  }
  const missing = [...pending.values()].reduce((sum, count) => sum + count, 0);
  if (missing) issues.push(`${missing} triángulos de la fuente ausentes`);
  return {nodes, triangles: nodes.reduce((sum, node) => sum + node.triangles, 0), issues: [...new Set(issues)]};
}
