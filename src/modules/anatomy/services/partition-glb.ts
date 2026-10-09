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
