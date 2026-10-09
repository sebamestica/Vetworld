import { describe, expect, it } from 'vitest';
import { calculateCalibration, segmentationReviewSchema } from '../../src/modules/anatomy/schemas/asset-review';
import { partitionGlb } from '../../src/modules/anatomy/services/partition-glb';

const evidence = {citation: 'Fixture sintética, no referencia científica', locator: 'test'};
const calibration = {assetId: 'feline:synthetic', sourceSha256: '0'.repeat(64), specimenReference: 'SYNTHETIC-TEST', measurements: [
  {landmarkA: 'a', landmarkB: 'b', pointA: [0,0,0], pointB: [2,0,0], realLengthMeters: .2, uncertaintyMeters: .001, evidence, sameSpecimen: true},
  {landmarkA: 'c', landmarkB: 'd', pointA: [0,0,0], pointB: [0,3,0], realLengthMeters: .3, uncertaintyMeters: .001, evidence, sameSpecimen: true},
]};
const draft = {assetId: 'feline:synthetic', sourceSha256: '0'.repeat(64), triangleCount: 3, status: 'draft', reviewer: null,
  groups: [{proposalId: 'test', proposedStructureId: 'feline:synthetic-only', canonicalLatinName: 'SYNTHETIC', regionId: 'test', side: 'unknown', faceIndices: [0], evidence: [evidence], notes: 'Solo fixture de prueba'}]};

function syntheticGlb() {
  const bin = Buffer.alloc(120);
  for (let index=0;index<9;index++) bin.writeFloatLE(index / 10, index * 12);
  for (let index=0;index<9;index++) bin.writeUInt8(index, 108 + index);
  const doc = {asset:{version:'2.0'}, scene:0, scenes:[{nodes:[0]}], nodes:[{name:'synthetic',mesh:0,translation:[1,2,3]}],
    meshes:[{primitives:[{attributes:{POSITION:0},indices:1}]}], buffers:[{byteLength:120}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:108},{buffer:0,byteOffset:108,byteLength:9}],
    accessors:[{bufferView:0,componentType:5126,count:9,type:'VEC3'},{bufferView:1,componentType:5121,count:9,type:'SCALAR'}]};
  const json = Buffer.from(JSON.stringify(doc)); const padding=Buffer.alloc((4-json.length%4)%4,32);
  const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+padding.length+bin.length,8);header.writeUInt32LE(json.length+padding.length,12);header.writeUInt32LE(0x4e4f534a,16);
  const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(bin.length);binHeader.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([header,json,padding,binHeader,bin]);
}

describe('Revisión y calibración sin aprobación científica automática', () => {
  it('calcula conversión uniforme con dos medidas consistentes', () => expect(calculateCalibration(calibration).factorToMeters).toBeCloseTo(.1));
  it('rechaza medidas incompatibles y puntos coincidentes', () => {
    const wrong=structuredClone(calibration); wrong.measurements[1].realLengthMeters=.9;
    expect(()=>calculateCalibration(wrong)).toThrow('incompatibles');
    wrong.measurements[0].pointB=[0,0,0]; expect(()=>calculateCalibration(wrong)).toThrow('coincidentes');
  });
  it('no acepta escala basada en otro espécimen', () => {
    const wrong=structuredClone(calibration); wrong.measurements[0].sameSpecimen=false;
    expect(()=>calculateCalibration(wrong)).toThrow();
  });
  it('rechaza desbordamiento numérico de coordenadas finitas', () => {
    const wrong=structuredClone(calibration); wrong.measurements[0].pointA=[-1e308,0,0];wrong.measurements[0].pointB=[1e308,0,0];
    expect(()=>calculateCalibration(wrong)).toThrow('no finita');
  });
  it('valida anotaciones pero exige responsable para revisión humana', () => {
    expect(segmentationReviewSchema.safeParse(draft).success).toBe(true);
    expect(segmentationReviewSchema.safeParse({...draft,status:'human-reviewed'}).success).toBe(false);
  });
  it('rechaza caras solapadas, fuera de rango y especie mezclada', () => {
    for(const faceIndices of [[0,0],[3]]) expect(segmentationReviewSchema.safeParse({...draft,groups:[{...draft.groups[0],faceIndices}]}).success).toBe(false);
    expect(segmentationReviewSchema.safeParse({...draft,groups:[{...draft.groups[0],proposedStructureId:'canine:test'}]}).success).toBe(false);
  });
  it('particiona fixture conservando todos los triángulos, coordenadas y transformaciones', () => {
    const source=syntheticGlb(), result=partitionGlb(source,[{nodeId:'proposal-test',faceIndices:[0]}]);
    const jsonLength=result.readUInt32LE(12), doc=JSON.parse(result.subarray(20,20+jsonLength).toString());
    expect(doc.meshes).toHaveLength(2);
    expect(doc.nodes.every((node: {translation: number[]})=>node.translation.join(',')==='1,2,3')).toBe(true);
    expect(doc.meshes.reduce((sum: number, mesh: {primitives: {indices: number}[]})=>sum+doc.accessors[mesh.primitives[0].indices].count,0)).toBe(9);
    const oldBinOffset=28+source.readUInt32LE(12);
    expect(result.subarray(28+jsonLength,28+jsonLength+120)).toEqual(source.subarray(oldBinOffset,oldBinOffset+120));
  });
  it('el particionador rechaza solapamiento y archivo corrupto', () => {
    expect(()=>partitionGlb(syntheticGlb(),[{nodeId:'a',faceIndices:[0]},{nodeId:'b',faceIndices:[0]}])).toThrow('solapada');
    const source=syntheticGlb();source.writeUInt32LE(0,0);expect(()=>partitionGlb(source,[])).toThrow('GLB');
  });
});
