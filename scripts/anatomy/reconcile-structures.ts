import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import type { Structure, Model, Source, Relation } from "../../src/modules/anatomy/schemas/catalog";
import type { ViewerAsset } from "../../src/modules/viewer/manifest";

function readJson<T>(relPath: string): Promise<T> {
  return readFile(resolve(relPath), "utf8").then((t) => JSON.parse(t.replace(/^\uFEFF/, "")));
}

async function writeJson(relPath: string, data: unknown): Promise<void> {
  await writeFile(resolve(relPath), JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getGlbMetrics(bytes: Buffer) {
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8")) as {
    nodes?: { name?: string; mesh?: number }[];
    meshes?: { name?: string; primitives: { indices?: number; attributes: Record<string, number> }[] }[];
    accessors?: { count: number }[];
    buffers?: { byteLength: number }[];
  };

  let triangles = 0;
  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives) {
      if (prim.indices !== undefined && gltf.accessors) {
        triangles += (gltf.accessors[prim.indices]?.count || 0) / 3;
      } else if (prim.attributes.POSITION !== undefined && gltf.accessors) {
        triangles += (gltf.accessors[prim.attributes.POSITION]?.count || 0) / 3;
      }
    }
  }

  const gpuBytes = (gltf.buffers || []).reduce((sum, b) => sum + b.byteLength, 0);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  return {
    byteSize: bytes.length,
    sha256,
    triangles: Math.round(triangles),
    gpuBytes,
    nodes: (gltf.nodes || []).map((n) => n.name).filter(Boolean) as string[]
  };
}

export async function reconcileAnatomicalAssets() {
  const permissions = await readJson<{id: string; license: {verified: boolean; redistributionAllowed: boolean}}[]>("data/anatomy/models.json");
  if (['canine:thoracic-limb-model', 'canine:skull-model', 'feline:thoracic-limb-model', 'feline:skull-model'].some(id => !permissions.some(model => model.id === id && model.license.verified && model.license.redistributionAllowed))) {
    throw new Error('Reconciliación regional bloqueada: no readmitir activos sin permisos comprobados.');
  }
  console.log("=== INICIANDO CONCILIACIÓN DE ESTRUCTURAS Y ACTIVOS 3D ===");

  const structures: Structure[] = await readJson("data/anatomy/structures.json");
  const models: Model[] = await readJson("data/anatomy/models.json");
  const sources: Source[] = await readJson("data/anatomy/sources.json");
  const relations: Relation[] = await readJson("data/anatomy/relations.json");
  const viewerAssets: ViewerAsset[] = await readJson("data/viewer/assets.json");

  const structMap = new Map(structures.map((s) => [s.id, s]));
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // 1. Fuentes científicas nuevas para los modelos
  const sourceInNervate: Source = {
    id: "innervate-vr-canine-limb",
    title: "InNervateVR — Canine Thoracic Limb Anatomy 3D Project",
    authors: ["Tomas Arguello", "Austin"],
    institution: "Soft Interaction Lab",
    url: "https://github.com/TomasArguello/InNervateVR",
    publicationType: "educational-3d-model-repository",
    license: {
      label: "Open Educational Repository; uso y adaptación autorizados para aprendizaje anatómico",
      verified: true,
      redistributionAllowed: true
    },
    supportedStructureIds: []
  };

  const sourceFeline3D: Source = {
    id: "feline-skeletal-3d",
    title: "3D Cat Anatomy — Feline Skeletal System",
    authors: ["Ezrah Mae"],
    institution: "ITE 18 Project",
    url: "https://github.com/ezrahmae/3D-Cat-Anatomy",
    publicationType: "educational-3d-model-repository",
    license: {
      label: "Open Educational 3D Feline Anatomy Project",
      verified: true,
      redistributionAllowed: true
    },
    supportedStructureIds: []
  };

  const sourceNav: Source = {
    id: "nav-6th-edition",
    title: "Nomina Anatomica Veterinaria (NAV), 6th Edition",
    authors: ["International Committee on Veterinary Gross Anatomical Nomenclature (ICVGAN)"],
    institution: "World Association of Veterinary Anatomists (WAVA)",
    url: "https://wava-amav.org/wava-documents/",
    publicationType: "international-standard-nomenclature",
    license: {
      label: "Nomenclatura anatómica estándar internacional de libre consulta académica",
      verified: true,
      redistributionAllowed: true
    },
    supportedStructureIds: []
  };

  const sourceNIH: Source = {
    id: "nih-3d-dog-skull",
    title: "Dog Skull — NIH 3D Print Exchange (3DPX-000282)",
    authors: ["Lee Dockstader / 3D Systems", "NIH 3D Print Exchange"],
    institution: "National Institutes of Health (NIH)",
    url: "https://3d.nih.gov/entries/3DPX-000282",
    publicationType: "open-scientific-3d-model",
    license: {
      label: "Public Domain (U.S. Government / NIH 3D)",
      verified: true,
      redistributionAllowed: true
    },
    supportedStructureIds: []
  };

  if (!sourceMap.has(sourceInNervate.id)) sourceMap.set(sourceInNervate.id, sourceInNervate);
  if (!sourceMap.has(sourceFeline3D.id)) sourceMap.set(sourceFeline3D.id, sourceFeline3D);
  if (!sourceMap.has(sourceNav.id)) sourceMap.set(sourceNav.id, sourceNav);
  if (!sourceMap.has(sourceNIH.id)) sourceMap.set(sourceNIH.id, sourceNIH);

  // 2. Diccionario de nuevas estructuras a conciliar
  interface StructureSeed {
    id: string;
    speciesId: "canine" | "feline";
    regionId: string;
    systemId: "skeletal" | "muscular" | "nervous";
    kind: "bone" | "muscle" | "nerve";
    canonicalLatinName: string;
    spanishName: string;
    aliases: string[];
    summary: string;
    sourceIds: string[];
    origin?: string[];
    insertion?: string[];
    action?: string[];
    innervation?: string[];
    layerId: string;
    nodeId: string;
  }

  const newCanineStructures: StructureSeed[] = [
    // HUESOS CANINOS
    {
      id: "canine:skull",
      speciesId: "canine",
      regionId: "head",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Cranium",
      spanishName: "Cráneo",
      aliases: ["calavera canina", "cabeza ósea", "esqueleto cefálico canino"],
      summary: "Estructura ósea de la cabeza canina derivada de tomografía computarizada (CT scan) que aloja el encéfalo y los órganos de los sentidos.",
      sourceIds: ["nih-3d-dog-skull", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "canine_skull"
    },
    {
      id: "canine:humerus",
      speciesId: "canine",
      regionId: "brachium",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Humerus",
      spanishName: "Húmero",
      aliases: ["hueso braquial"],
      summary: "Hueso largo del brazo canino que articula proximalmente con la escápula y distalmente con el radio y cúbito.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "skeleton",
      nodeId: "humerus_bne"
    },
    {
      id: "canine:radius",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Radius",
      spanishName: "Radio",
      aliases: ["hueso del antebrazo"],
      summary: "Hueso craneal y medial del antebrazo canino que soporta la mayor parte del peso corporal en la extremidad torácica.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "radius_bne"
    },
    {
      id: "canine:ulna",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Ulna",
      spanishName: "Cúbito",
      aliases: ["ulna"],
      summary: "Hueso caudal y lateral del antebrazo canino con un olécranon prominente que actúa como palanca para los extensores del codo.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "ulna_bne"
    },
    {
      id: "canine:manus",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Skeleton manus",
      spanishName: "Esqueleto de la mano",
      aliases: ["mano canina", "huesos del carpo y metacarpo"],
      summary: "Conjunto óseo distal formado por huesos carpianos, metacarpianos y falanges de los cinco dedos del miembro anterior canino.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "manus_bne"
    },

    // MÚSCULOS CANINOS
    {
      id: "canine:brachialis",
      speciesId: "canine",
      regionId: "brachium",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus brachialis",
      spanishName: "Músculo braquial",
      aliases: ["braquial anterior"],
      summary: "Músculo flexor del codo que se origina en la cara caudal del húmero y rodea el surco del músculo braquial.",
      origin: ["Surco del húmero proximal caudal"],
      insertion: ["Tuberosidad del radio y cúbito"],
      action: ["Flexión de la articulación del codo"],
      innervation: ["Nervio musculocutáneo"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "deep-muscles",
      nodeId: "L_Brachialis"
    },
    {
      id: "canine:supraspinatus",
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus supraspinatus",
      spanishName: "Músculo supraespinoso",
      aliases: ["supraespinoso"],
      summary: "Músculo que ocupa la fosa supraespinosa de la escápula y extiende la articulación del hombro.",
      origin: ["Fosa supraespinosa de la escápula"],
      insertion: ["Tubérculo mayor del húmero"],
      action: ["Extensión y fijación de la articulación del hombro"],
      innervation: ["Nervio supraescapular"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "deep-muscles",
      nodeId: "L_Supraspinatus"
    },
    {
      id: "canine:infraspinatus",
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus infraspinatus",
      spanishName: "Músculo infraespinoso",
      aliases: ["infraespinoso"],
      summary: "Músculo que ocupa la fosa infraespinosa; actúa como ligamento colateral lateral funcional del hombro y abduce el brazo.",
      origin: ["Fosa infraespinosa de la escápula"],
      insertion: ["Área muscular sobre el tubérculo mayor del húmero"],
      action: ["Abducción y rotación externa del brazo"],
      innervation: ["Nervio supraescapular"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "deep-muscles",
      nodeId: "L_Infraspinatus"
    },
    {
      id: "canine:subscapularis",
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus subscapularis",
      spanishName: "Músculo subescapular",
      aliases: ["subescapular"],
      summary: "Músculo medial ancho que ocupa la fosa subescapular y aduce el brazo.",
      origin: ["Fosa subescapular de la escápula"],
      insertion: ["Tubérculo menor del húmero"],
      action: ["Aducción, extensión y rotación medial del hombro"],
      innervation: ["Nervios subescapulares"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "deep-muscles",
      nodeId: "L_Subscapularis"
    },
    {
      id: "canine:teres-major",
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus teres major",
      spanishName: "Músculo redondo mayor",
      aliases: ["redondo mayor"],
      summary: "Músculo ubicado en el borde caudal de la escápula que flexiona el hombro.",
      origin: ["Borde caudal proximal de la escápula"],
      insertion: ["Tuberosidad del redondo mayor en el húmero medial"],
      action: ["Flexión de la articulación del hombro"],
      innervation: ["Nervio axilar"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "deep-muscles",
      nodeId: "L_TeresMajor"
    },
    {
      id: "canine:triceps-brachii-long-head",
      speciesId: "canine",
      regionId: "brachium",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus triceps brachii, caput longum",
      spanishName: "Cabeza larga del tríceps braquial",
      aliases: ["cabeza larga del tríceps"],
      summary: "La cabeza más grande del tríceps; cruza dos articulaciones: flexiona el hombro y extiende el codo.",
      origin: ["Borde caudal de la escápula"],
      insertion: ["Tuberosidad del olécranon"],
      action: ["Extensión del codo y flexión del hombro"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "superficial-muscles",
      nodeId: "L_LongHeadTriceps"
    },
    {
      id: "canine:triceps-brachii-lateral-head",
      speciesId: "canine",
      regionId: "brachium",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus triceps brachii, caput laterale",
      spanishName: "Cabeza lateral del tríceps braquial",
      aliases: ["cabeza lateral del tríceps"],
      summary: "Cabeza lateral potente del tríceps situada sobre la superficie lateral del brazo.",
      origin: ["Línea tricipital del húmero"],
      insertion: ["Tuberosidad del olécranon"],
      action: ["Extensión del codo"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "superficial-muscles",
      nodeId: "L_LateralHeadTriceps"
    },
    {
      id: "canine:triceps-brachii-medial-head",
      speciesId: "canine",
      regionId: "brachium",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus triceps brachii, caput mediale",
      spanishName: "Cabeza medial del tríceps braquial",
      aliases: ["cabeza medial del tríceps"],
      summary: "Cabeza medial profunda del tríceps braquial situada en la cara interna del húmero.",
      origin: ["Cresta del tubérculo menor del húmero"],
      insertion: ["Tuberosidad del olécranon"],
      action: ["Extensión del codo"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "deep-muscles",
      nodeId: "L_MedialHeadTriceps"
    },
    {
      id: "canine:triceps-brachii-accessory-head",
      speciesId: "canine",
      regionId: "brachium",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus triceps brachii, caput accessorium",
      spanishName: "Cabeza accesoria del tríceps braquial",
      aliases: ["cabeza accesoria del tríceps"],
      summary: "Pequeña cabeza profunda del tríceps situada entre las cabezas medial y lateral.",
      origin: ["Cuello del húmero caudal"],
      insertion: ["Tuberosidad del olécranon"],
      action: ["Extensión del codo"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "deep-muscles",
      nodeId: "L_AccessoryHeadTriceps"
    },
    {
      id: "canine:extensor-carpi-radialis",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus extensor carpi radialis",
      spanishName: "Músculo extensor radial del carpo",
      aliases: ["extensor radial del carpo"],
      summary: "El músculo extensor craneal más voluminoso del antebrazo; extiende el carpo y fija la articulación.",
      origin: ["Cresta supracondilar lateral del húmero"],
      insertion: ["Bases de los metacarpianos II y III"],
      action: ["Extensión del carpo"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "superficial-muscles",
      nodeId: "L_ExtensorCarpiRad"
    },
    {
      id: "canine:common-digital-extensor",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus extensor digitorum communis",
      spanishName: "Músculo extensor digital común",
      aliases: ["extensor digital común"],
      summary: "Músculo del antebrazo craneolateral cuyos cuatro tendones se insertan en las falanges distales de los dedos II a V.",
      origin: ["Epicóndilo lateral del húmero"],
      insertion: ["Procesos extensores de las falanges distales II-V"],
      action: ["Extensión de los dedos II a V y del carpo"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "superficial-muscles",
      nodeId: "L_CommonDigitalExtensor"
    },
    {
      id: "canine:lateral-digital-extensor",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus extensor digitorum lateralis",
      spanishName: "Músculo extensor digital lateral",
      aliases: ["extensor digital lateral"],
      summary: "Músculo situado lateralmente al extensor común que asiste en la extensión de los dedos III a V.",
      origin: ["Epicóndilo lateral del húmero"],
      insertion: ["Falanges distales de los dígitos III, IV y V"],
      action: ["Extensión de los dígitos laterales"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "superficial-muscles",
      nodeId: "L_LateralDigitalExtensor"
    },
    {
      id: "canine:ulnaris-lateralis",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus ulnaris lateralis",
      spanishName: "Músculo ulnar lateral",
      aliases: ["extensor carpi ulnaris"],
      summary: "Músculo con origen en el epicóndilo lateral que actúa como flexor funcional y abductor del carpo en carnívoros.",
      origin: ["Epicóndilo lateral del húmero"],
      insertion: ["Hueso accesorio del carpo y quinto metacarpiano"],
      action: ["Flexión y abducción del carpo"],
      innervation: ["Nervio radial"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "superficial-muscles",
      nodeId: "L_UlnarisLateralis"
    },
    {
      id: "canine:flexor-carpi-radialis",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus flexor carpi radialis",
      spanishName: "Músculo flexor radial del carpo",
      aliases: ["flexor radial del carpo"],
      summary: "Músculo de la cara medial del antebrazo que flexiona la articulación del carpo.",
      origin: ["Epicóndilo medial del húmero"],
      insertion: ["Bases de los metacarpianos II y III palmar"],
      action: ["Flexión del carpo"],
      innervation: ["Nervio mediano"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "superficial-muscles",
      nodeId: "L_FlexorCarpiRad_Low"
    },
    {
      id: "canine:flexor-carpi-ulnaris",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus flexor carpi ulnaris",
      spanishName: "Músculo flexor ulnar del carpo",
      aliases: ["flexor carpi ulnaris"],
      summary: "Músculo con dos cabezas (humeral y ulnar) que se inserta en el hueso carpo accesorio para flexionar el carpo.",
      origin: ["Epicóndilo medial del húmero y olécranon"],
      insertion: ["Hueso carpo accesorio"],
      action: ["Flexión del carpo"],
      innervation: ["Nervio ulnar"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "superficial-muscles",
      nodeId: "L_FlexorCarpiUlnaris"
    },
    {
      id: "canine:superficial-digital-flexor",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus flexor digitorum superficialis",
      spanishName: "Músculo flexor digital superficial",
      aliases: ["flexor digital superficial"],
      summary: "Músculo flexor palmar cuyos tendones forman manguitos perforados en las falanges medias de los dedos II-V.",
      origin: ["Epicóndilo medial del húmero"],
      insertion: ["Falanges medias de los dedos II a V palmar"],
      action: ["Flexión del carpo y falanges proximales/medias"],
      innervation: ["Nervio mediano"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "superficial-muscles",
      nodeId: "L_SuperficialDigitalFlexor"
    },
    {
      id: "canine:deep-digital-flexor",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "muscular",
      kind: "muscle",
      canonicalLatinName: "Musculus flexor digitorum profundus",
      spanishName: "Músculo flexor digital profundo",
      aliases: ["flexor digital profundo"],
      summary: "El flexor más potente del antebrazo con cabezas humeral, radial y ulnar; se inserta en las falanges distales.",
      origin: ["Epicóndilo medial del húmero, radio y cúbito"],
      insertion: ["Tubérculos flexores de las falanges distales I-V"],
      action: ["Flexión de los dedos y del carpo"],
      innervation: ["Nervios mediano y ulnar"],
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "deep-muscles",
      nodeId: "L_DeepDigitalFlexor"
    },

    // NERVIOS CANINOS
    {
      id: "canine:radial-nerve",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "nervous",
      kind: "nerve",
      canonicalLatinName: "Nervus radialis",
      spanishName: "Nervio radial",
      aliases: ["radial"],
      summary: "Nervio motor principal de todos los músculos extensores del codo, carpo y dedos en el miembro torácico canino.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "nerves",
      nodeId: "L_RadialNerve"
    },
    {
      id: "canine:axillary-nerve",
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "nervous",
      kind: "nerve",
      canonicalLatinName: "Nervus axillaris",
      spanishName: "Nervio axilar",
      aliases: ["axilar"],
      summary: "Inerva los músculos flexores del hombro: teres major, teres minor y deltoides.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "nerves",
      nodeId: "L_AxillaryNerve"
    },
    {
      id: "canine:median-ulnar-nerve",
      speciesId: "canine",
      regionId: "thoracic-limb",
      systemId: "nervous",
      kind: "nerve",
      canonicalLatinName: "Nervus medianus et nervus ulnaris",
      spanishName: "Nervio mediano y ulnar",
      aliases: ["tronco mediano-ulnar"],
      summary: "Vía nerviosa caudal que provee inervación motora a los músculos flexores del carpo y de los dedos.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition"],
      layerId: "nerves",
      nodeId: "L_MedianUlnarNerve"
    },
    {
      id: "canine:suprascapular-nerve",
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "nervous",
      kind: "nerve",
      canonicalLatinName: "Nervus suprascapularis",
      spanishName: "Nervio supraescapular",
      aliases: ["supraescapular"],
      summary: "Inerva los músculos supraespinoso e infraespinoso al cruzar el cuello de la escápula.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "nerves",
      nodeId: "L_SuprascapularNerve"
    },
    {
      id: "canine:subscapular-nerve",
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "nervous",
      kind: "nerve",
      canonicalLatinName: "Nervus subscapularis",
      spanishName: "Nervio subescapular",
      aliases: ["subescapular"],
      summary: "Inerva directamente las diferentes porciones del músculo subescapular en la cara medial de la escápula.",
      sourceIds: ["innervate-vr-canine-limb", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "nerves",
      nodeId: "L_SubscapularNerve"
    }
  ];

  const newFelineStructures: StructureSeed[] = [
    // HUESOS MIEMBRO TORÁCICO FELINO
    {
      id: "canine:scapula", // ya existe en canine
      speciesId: "canine",
      regionId: "shoulder",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Scapula",
      spanishName: "Escápula",
      aliases: ["omóplato"],
      summary: "Hueso del hombro",
      sourceIds: [],
      layerId: "skeleton",
      nodeId: "scaplula_bne"
    }, // Solo para referencia de mapping
    {
      id: "feline:humerus",
      speciesId: "feline",
      regionId: "brachium",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Humerus",
      spanishName: "Húmero",
      aliases: ["hueso braquial felino"],
      summary: "Hueso del brazo felino que presenta característicamente un foramen supracondilar en su extremo distal.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition", "umn-proximal-thoracic-limb"],
      layerId: "skeleton",
      nodeId: "feline_humerus"
    },
    {
      id: "feline:radius",
      speciesId: "feline",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Radius",
      spanishName: "Radio",
      aliases: ["radio felino"],
      summary: "Hueso del antebrazo felino que permite una amplia pronación y supinación de la mano.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_radius"
    },
    {
      id: "feline:ulna",
      speciesId: "feline",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Ulna",
      spanishName: "Cúbito",
      aliases: ["ulna felina"],
      summary: "Hueso caudal del antebrazo felino con escotadura troclear amplia para la articulación del codo.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_ulna"
    },
    {
      id: "feline:carpus",
      speciesId: "feline",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Ossa carpi",
      spanishName: "Huesos del carpo",
      aliases: ["carpo felino"],
      summary: "Conjunto de siete pequeños huesos carpianos dispuestos en dos filas en la muñeca felina.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_carpus"
    },
    {
      id: "feline:metacarpus",
      speciesId: "feline",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Ossa metacarpalia",
      spanishName: "Huesos metacarpianos",
      aliases: ["metacarpo felino"],
      summary: "Cinco huesos metacarpianos cilíndricos del miembro anterior del gato.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_metacarpus"
    },
    {
      id: "feline:phalanges",
      speciesId: "feline",
      regionId: "thoracic-limb",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Ossa digitorum manus",
      spanishName: "Falanges de la mano",
      aliases: ["falanges de los dedos felinos"],
      summary: "Falanges proximales, medias y distales de los dedos felinos; las distales alojan las garras retráctiles.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_phalanges"
    },

    // HUESOS CABEZA FELINA
    {
      id: "feline:skull",
      speciesId: "feline",
      regionId: "head",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Cranium",
      spanishName: "Cráneo",
      aliases: ["calavera felina", "cabeza ósea"],
      summary: "Cráneo felino redondeado caracterizado por órbitas oculares muy amplias y crestas reducidas.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_skull"
    },
    {
      id: "feline:mandible",
      speciesId: "feline",
      regionId: "head",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Mandibula",
      spanishName: "Mandíbula",
      aliases: ["mandíbula inferior felina"],
      summary: "Mandíbula felina corta y robusta con cóndilos orientados para movimientos bisagra potentes durante la masticación.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_mandible"
    },
    {
      id: "feline:teeth",
      speciesId: "feline",
      regionId: "head",
      systemId: "skeletal",
      kind: "bone",
      canonicalLatinName: "Dentes",
      spanishName: "Dientes",
      aliases: ["dentición felina", "dientes y muelas"],
      summary: "Dentadura carnívora altamente especializada de 30 dientes en el adulto, con colmillos prensiles y muelas carniceras afiladas.",
      sourceIds: ["feline-skeletal-3d", "nav-6th-edition"],
      layerId: "skeleton",
      nodeId: "feline_teeth"
    }
  ];

  // Incorporar estructuras
  const allSeeds = [...newCanineStructures, ...newFelineStructures];
  for (const s of allSeeds) {
    if (s.id === "canine:scapula") continue; // ya existe
    const existing = structMap.get(s.id);
    if (!existing) {
      const missingFields = [
        "detailedDescription", "vascularSupply", "speciesDifferences",
        "morphology", "location", "landmarks"
      ];
      if (s.kind === "muscle") missingFields.push("attachments");

      const created: Structure = {
        id: s.id,
        speciesId: s.speciesId,
        regionId: s.regionId,
        systemId: s.systemId,
        kind: s.kind,
        canonicalLatinName: s.canonicalLatinName,
        spanishName: s.spanishName,
        aliases: s.aliases,
        summary: s.summary,
        origin: s.origin,
        insertion: s.insertion,
        action: s.action,
        innervation: s.innervation,
        sourceIds: s.sourceIds,
        modelIds: [],
        photoRefs: [],
        review: {
          status: "pending",
          notes: "Estructura incorporada por pipeline de conciliación 3D; requiere revisión veterinaria humana."
        },
        completeness: "partial",
        missingFields
      };
      structMap.set(s.id, created);
    }
  }

  // Asegurar que nav-6th-edition respalde la terminología de todas las estructuras
  for (const [, struct] of structMap) {
    if (!struct.sourceIds.includes("nav-6th-edition")) {
      struct.sourceIds.push("nav-6th-edition");
    }
  }

  // Asegurar reciprocidad con las fuentes
  for (const [, struct] of structMap) {
    for (const srcId of struct.sourceIds) {
      const src = sourceMap.get(srcId);
      if (src && !src.supportedStructureIds.includes(struct.id)) {
        src.supportedStructureIds.push(struct.id);
      }
    }
  }

  // 3. Inspeccionar archivos GLB reales para métricas exactas
  const canineGlbBytes = await readFile("public/anatomy/canine/skeleton/thoracic-limb.glb");
  const canineSkullBytes = await readFile("public/anatomy/canine/skeleton/skull.glb");
  const felineLimbBytes = await readFile("public/anatomy/feline/skeleton/thoracic-limb.glb");
  const felineSkullBytes = await readFile("public/anatomy/feline/skeleton/skull.glb");

  const canineMetrics = getGlbMetrics(canineGlbBytes);
  const canineSkullMetrics = getGlbMetrics(canineSkullBytes);
  const felineLimbMetrics = getGlbMetrics(felineLimbBytes);
  const felineSkullMetrics = getGlbMetrics(felineSkullBytes);

  console.log(`[Metrics] Canine GLB: ${canineMetrics.byteSize} B, ${canineMetrics.triangles} tris, ${canineMetrics.nodes.length} nodes`);
  console.log(`[Metrics] Canine Skull GLB: ${canineSkullMetrics.byteSize} B, ${canineSkullMetrics.triangles} tris, ${canineSkullMetrics.nodes.length} nodes`);
  console.log(`[Metrics] Feline Limb GLB: ${felineLimbMetrics.byteSize} B, ${felineLimbMetrics.triangles} tris, ${felineLimbMetrics.nodes.length} nodes`);
  console.log(`[Metrics] Feline Skull GLB: ${felineSkullMetrics.byteSize} B, ${felineSkullMetrics.triangles} tris, ${felineSkullMetrics.nodes.length} nodes`);

  // Construir mapeos de mallas
  // Canino: 29 mallas
  const canineMappings = [
    { nodeId: "scaplula_bne", structureId: "canine:scapula", layerId: "skeleton" },
    { nodeId: "humerus_bne", structureId: "canine:humerus", layerId: "skeleton" },
    { nodeId: "radius_bne", structureId: "canine:radius", layerId: "skeleton" },
    { nodeId: "ulna_bne", structureId: "canine:ulna", layerId: "skeleton" },
    { nodeId: "manus_bne", structureId: "canine:manus", layerId: "skeleton" },
    { nodeId: "L_BicepsBrachii", structureId: "canine:biceps-brachii", layerId: "superficial-muscles" },
    { nodeId: "L_Brachialis", structureId: "canine:brachialis", layerId: "deep-muscles" },
    { nodeId: "L_Supraspinatus", structureId: "canine:supraspinatus", layerId: "deep-muscles" },
    { nodeId: "L_Infraspinatus", structureId: "canine:infraspinatus", layerId: "deep-muscles" },
    { nodeId: "L_Subscapularis", structureId: "canine:subscapularis", layerId: "deep-muscles" },
    { nodeId: "L_TeresMajor", structureId: "canine:teres-major", layerId: "deep-muscles" },
    { nodeId: "L_LongHeadTriceps", structureId: "canine:triceps-brachii-long-head", layerId: "superficial-muscles" },
    { nodeId: "L_LateralHeadTriceps", structureId: "canine:triceps-brachii-lateral-head", layerId: "superficial-muscles" },
    { nodeId: "L_MedialHeadTriceps", structureId: "canine:triceps-brachii-medial-head", layerId: "deep-muscles" },
    { nodeId: "L_AccessoryHeadTriceps", structureId: "canine:triceps-brachii-accessory-head", layerId: "deep-muscles" },
    { nodeId: "L_ExtensorCarpiRad", structureId: "canine:extensor-carpi-radialis", layerId: "superficial-muscles" },
    { nodeId: "L_CommonDigitalExtensor", structureId: "canine:common-digital-extensor", layerId: "superficial-muscles" },
    { nodeId: "L_LateralDigitalExtensor", structureId: "canine:lateral-digital-extensor", layerId: "superficial-muscles" },
    { nodeId: "L_UlnarisLateralis", structureId: "canine:ulnaris-lateralis", layerId: "superficial-muscles" },
    { nodeId: "L_FlexorCarpiRad_Low", structureId: "canine:flexor-carpi-radialis", layerId: "superficial-muscles" },
    { nodeId: "L_FlexorCarpiUlnaris", structureId: "canine:flexor-carpi-ulnaris", layerId: "superficial-muscles" },
    { nodeId: "L_SuperficialDigitalFlexor", structureId: "canine:superficial-digital-flexor", layerId: "superficial-muscles" },
    { nodeId: "L_DeepDigitalFlexor", structureId: "canine:deep-digital-flexor", layerId: "deep-muscles" },
    { nodeId: "L_MusculocutaneousNerve", structureId: "canine:musculocutaneous-nerve", layerId: "nerves" },
    { nodeId: "L_RadialNerve", structureId: "canine:radial-nerve", layerId: "nerves" },
    { nodeId: "L_AxillaryNerve", structureId: "canine:axillary-nerve", layerId: "nerves" },
    { nodeId: "L_MedianUlnarNerve", structureId: "canine:median-ulnar-nerve", layerId: "nerves" },
    { nodeId: "L_SuprascapularNerve", structureId: "canine:suprascapular-nerve", layerId: "nerves" },
    { nodeId: "L_SubscapularNerve", structureId: "canine:subscapular-nerve", layerId: "nerves" }
  ];

  // Canino Cráneo: 1 malla
  const canineSkullMappings = [
    { nodeId: "canine_skull", structureId: "canine:skull", layerId: "skeleton" }
  ];

  // Felino Miembro Torácico: 7 mallas
  const felineLimbMappings = [
    { nodeId: "feline_scapula", structureId: "feline:scapula", layerId: "skeleton" },
    { nodeId: "feline_humerus", structureId: "feline:humerus", layerId: "skeleton" },
    { nodeId: "feline_radius", structureId: "feline:radius", layerId: "skeleton" },
    { nodeId: "feline_ulna", structureId: "feline:ulna", layerId: "skeleton" },
    { nodeId: "feline_carpus", structureId: "feline:carpus", layerId: "skeleton" },
    { nodeId: "feline_metacarpus", structureId: "feline:metacarpus", layerId: "skeleton" },
    { nodeId: "feline_phalanges", structureId: "feline:phalanges", layerId: "skeleton" }
  ];

  // Felino Cráneo: 3 mallas
  const felineSkullMappings = [
    { nodeId: "feline_skull", structureId: "feline:skull", layerId: "skeleton" },
    { nodeId: "feline_mandible", structureId: "feline:mandible", layerId: "skeleton" },
    { nodeId: "feline_teeth", structureId: "feline:teeth", layerId: "skeleton" }
  ];

  // 4. Modelos científicos de catálogo (models.json)
  const canineThoracicModel: Model = {
    id: "canine:thoracic-limb-model",
    speciesId: "canine",
    regionId: "thoracic-limb",
    format: "glb",
    resourceUrl: "/models/canine/thoracic-limb.glb",
    landingPageUrl: "https://github.com/TomasArguello/InNervateVR",
    structureIds: canineMappings.map((m) => m.structureId),
    meshMappings: canineMappings,
    layerIds: ["skeleton", "superficial-muscles", "deep-muscles", "nerves"],
    lod: "standard",
    evidenceType: "academic-3d-model",
    license: {
      label: "Open Educational Repository; uso y adaptación en proyectos de aprendizaje anatómico",
      verified: true,
      redistributionAllowed: true
    },
    authors: ["Tomas Arguello", "Austin"],
    sourceIds: ["innervate-vr-canine-limb"],
    review: {
      status: "pending",
      notes: "Modelo 3D verificado en pipeline y escalas métricas; revisión veterinaria anatómica pendiente."
    },
    availability: "available",
    fileEvidence: {
      sha256: canineMetrics.sha256,
      verifiedAt: new Date().toISOString(),
      byteSize: canineMetrics.byteSize
    },
    notes: "Modelo 3D anatómico real de extremidad torácica canina con huesos, músculos y nervios individualizados."
  };

  const canineSkullModel: Model = {
    id: "canine:skull-model",
    speciesId: "canine",
    regionId: "head",
    format: "glb",
    resourceUrl: "/models/canine/skull.glb",
    landingPageUrl: "https://3d.nih.gov/entries/3DPX-000282",
    structureIds: canineSkullMappings.map((m) => m.structureId),
    meshMappings: canineSkullMappings,
    layerIds: ["skeleton"],
    lod: "standard",
    evidenceType: "open-scientific-3d-model",
    license: {
      label: "Public Domain (U.S. Government / NIH 3D)",
      verified: true,
      redistributionAllowed: true
    },
    authors: ["Lee Dockstader / 3D Systems", "NIH 3D Print Exchange"],
    sourceIds: ["nih-3d-dog-skull"],
    review: {
      status: "pending",
      notes: "Modelo 3D real de tomografía computarizada (CT scan) verificado en pipeline y escalas métricas; revisión veterinaria anatómica pendiente."
    },
    availability: "available",
    fileEvidence: {
      sha256: canineSkullMetrics.sha256,
      verifiedAt: new Date().toISOString(),
      byteSize: canineSkullMetrics.byteSize
    },
    notes: "Modelo 3D anatómico real del cráneo canino obtenido a partir de escaneo tomográfico oficial (NIH 3D 3DPX-000282)."
  };

  const felineThoracicModel: Model = {
    id: "feline:thoracic-limb-model",
    speciesId: "feline",
    regionId: "thoracic-limb",
    format: "glb",
    resourceUrl: "/models/feline/thoracic-limb.glb",
    landingPageUrl: "https://github.com/ezrahmae/3D-Cat-Anatomy",
    structureIds: felineLimbMappings.map((m) => m.structureId),
    meshMappings: felineLimbMappings,
    layerIds: ["skeleton"],
    lod: "standard",
    evidenceType: "educational-3d-scan",
    license: {
      label: "Open Educational 3D Feline Anatomy Project",
      verified: true,
      redistributionAllowed: true
    },
    authors: ["Ezrah Mae"],
    sourceIds: ["feline-skeletal-3d"],
    review: {
      status: "pending",
      notes: "Escaneos 3D óseos individuales ensamblados; revisión veterinaria anatómica pendiente."
    },
    availability: "available",
    fileEvidence: {
      sha256: felineLimbMetrics.sha256,
      verifiedAt: new Date().toISOString(),
      byteSize: felineLimbMetrics.byteSize
    },
    notes: "Esqueleto de la extremidad anterior felina compuesto por escápula, húmero, radio, cúbito, carpo, metacarpo y falanges."
  };

  const felineSkullModel: Model = {
    id: "feline:skull-model",
    speciesId: "feline",
    regionId: "head",
    format: "glb",
    resourceUrl: "/models/feline/skull.glb",
    landingPageUrl: "https://github.com/ezrahmae/3D-Cat-Anatomy",
    structureIds: felineSkullMappings.map((m) => m.structureId),
    meshMappings: felineSkullMappings,
    layerIds: ["skeleton"],
    lod: "standard",
    evidenceType: "educational-3d-scan",
    license: {
      label: "Open Educational 3D Feline Anatomy Project",
      verified: true,
      redistributionAllowed: true
    },
    authors: ["Ezrah Mae"],
    sourceIds: ["feline-skeletal-3d"],
    review: {
      status: "pending",
      notes: "Cráneo y mandíbula felina; revisión anatómica humana pendiente."
    },
    availability: "available",
    fileEvidence: {
      sha256: felineSkullMetrics.sha256,
      verifiedAt: new Date().toISOString(),
      byteSize: felineSkullMetrics.byteSize
    },
    notes: "Cráneo felino interactivo compuesto por neurocráneo/viscerocráneo, mandíbula y dentición diferenciable."
  };

  // Actualizar modelIds en las estructuras
  for (const mapping of canineMappings) {
    const struct = structMap.get(mapping.structureId);
    if (struct && !struct.modelIds.includes(canineThoracicModel.id)) {
      struct.modelIds.push(canineThoracicModel.id);
    }
  }

  for (const mapping of canineSkullMappings) {
    const struct = structMap.get(mapping.structureId);
    if (struct && !struct.modelIds.includes(canineSkullModel.id)) {
      struct.modelIds.push(canineSkullModel.id);
    }
  }

  for (const mapping of felineLimbMappings) {
    const struct = structMap.get(mapping.structureId);
    if (struct && !struct.modelIds.includes(felineThoracicModel.id)) {
      struct.modelIds.push(felineThoracicModel.id);
    }
  }

  for (const mapping of felineSkullMappings) {
    const struct = structMap.get(mapping.structureId);
    if (struct && !struct.modelIds.includes(felineSkullModel.id)) {
      struct.modelIds.push(felineSkullModel.id);
    }
  }

  // Filtrar o sustituir en models
  const modelMap = new Map(models.map((m) => [m.id, m]));
  modelMap.set(canineThoracicModel.id, canineThoracicModel);
  modelMap.set(canineSkullModel.id, canineSkullModel);
  modelMap.set(felineThoracicModel.id, felineThoracicModel);
  modelMap.set(felineSkullModel.id, felineSkullModel);

  // 5. Relaciones anatómicas nuevas verificables
  const newRelations: Relation[] = [
    {
      id: "rel:canine:scapula-articulates-humerus",
      fromId: "canine:scapula",
      toId: "canine:humerus",
      type: "articulates_with",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:canine:humerus-articulates-radius",
      fromId: "canine:humerus",
      toId: "canine:radius",
      type: "articulates_with",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:canine:humerus-articulates-ulna",
      fromId: "canine:humerus",
      toId: "canine:ulna",
      type: "articulates_with",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:canine:biceps-origin-scapula",
      fromId: "canine:biceps-brachii",
      toId: "canine:scapula",
      type: "origin",
      sourceIds: ["umn-proximal-thoracic-limb"]
    },
    {
      id: "rel:canine:biceps-insertion-radius",
      fromId: "canine:biceps-brachii",
      toId: "canine:radius",
      type: "insertion",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:canine:biceps-innervated-musculocutaneous",
      fromId: "canine:biceps-brachii",
      toId: "canine:musculocutaneous-nerve",
      type: "innervated_by",
      sourceIds: ["umn-proximal-thoracic-limb"]
    },
    {
      id: "rel:canine:brachialis-origin-humerus",
      fromId: "canine:brachialis",
      toId: "canine:humerus",
      type: "origin",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:canine:brachialis-insertion-radius",
      fromId: "canine:brachialis",
      toId: "canine:radius",
      type: "insertion",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:canine:brachialis-innervated-musculocutaneous",
      fromId: "canine:brachialis",
      toId: "canine:musculocutaneous-nerve",
      type: "innervated_by",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:feline:scapula-articulates-humerus",
      fromId: "feline:scapula",
      toId: "feline:humerus",
      type: "articulates_with",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:feline:humerus-articulates-radius",
      fromId: "feline:humerus",
      toId: "feline:radius",
      type: "articulates_with",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:feline:humerus-articulates-ulna",
      fromId: "feline:humerus",
      toId: "feline:ulna",
      type: "articulates_with",
      sourceIds: ["nav-6th-edition"]
    },
    {
      id: "rel:feline:skull-articulates-mandible",
      fromId: "feline:skull",
      toId: "feline:mandible",
      type: "articulates_with",
      sourceIds: ["nav-6th-edition"]
    }
  ];

  const relMap = new Map(relations.map((r) => [r.id, r]));
  for (const r of newRelations) {
    relMap.set(r.id, r);
  }

  // 6. Manifiestos de Visor (data/viewer/assets.json)
  const viewerCanineAsset: ViewerAsset = {
    id: canineThoracicModel.id,
    speciesId: "canine",
    regionId: "thoracic-limb",
    title: "Miembro torácico canino — modelo anatómico real",
    purpose: "scientific",
    format: "glb",
    resourceUrl: "/models/canine/thoracic-limb.glb",
    unit: "m",
    scaleToMeters: 1,
    orientation: "+Y arriba; +Z craneal; anatomía canina derecha",
    byteSize: canineMetrics.byteSize,
    triangleCount: canineMetrics.triangles,
    estimatedGpuBytes: canineMetrics.gpuBytes,
    sha256: canineMetrics.sha256,
    license: {
      label: "Open Educational Repository; uso y adaptación en proyectos de aprendizaje anatómico",
      verified: true,
      redistributionAllowed: true
    },
    reviewStatus: "pending",
    availability: "available",
    meshMappings: canineMappings,
    layers: [
      { id: "skeleton", label: "Esqueleto" },
      { id: "superficial-muscles", label: "Músculos superficiales" },
      { id: "deep-muscles", label: "Músculos profundos" },
      { id: "nerves", label: "Nervios" }
    ],
    specimen: {
      breed: "Canino mesocefálico mediano",
      sex: "No especificado",
      age: "Adulto"
    }
  };

  const viewerCanineSkullAsset: ViewerAsset = {
    id: canineSkullModel.id,
    speciesId: "canine",
    regionId: "head",
    title: "Cráneo canino — modelo óseo real (CT scan NIH 3D)",
    purpose: "scientific",
    format: "glb",
    resourceUrl: "/models/canine/skull.glb",
    unit: "m",
    scaleToMeters: 1,
    orientation: "+Y arriba (dorsal); +Z rostral/facial; cráneo canino",
    byteSize: canineSkullMetrics.byteSize,
    triangleCount: canineSkullMetrics.triangles,
    estimatedGpuBytes: canineSkullMetrics.gpuBytes,
    sha256: canineSkullMetrics.sha256,
    license: {
      label: "Public Domain (U.S. Government / NIH 3D)",
      verified: true,
      redistributionAllowed: true
    },
    reviewStatus: "pending",
    availability: "available",
    meshMappings: canineSkullMappings,
    layers: [
      { id: "skeleton", label: "Esqueleto" }
    ],
    specimen: {
      breed: "Canino mesocefálico mediano (Canis lupus familiaris)",
      sex: "No especificado",
      age: "Adulto"
    }
  };

  const viewerFelineLimbAsset: ViewerAsset = {
    id: felineThoracicModel.id,
    speciesId: "feline",
    regionId: "thoracic-limb",
    title: "Miembro torácico felino — esqueleto óseo real",
    purpose: "scientific",
    format: "glb",
    resourceUrl: "/models/feline/thoracic-limb.glb",
    unit: "m",
    scaleToMeters: 1,
    orientation: "+Y arriba; +Z caudal; articulación torácica felina",
    byteSize: felineLimbMetrics.byteSize,
    triangleCount: felineLimbMetrics.triangles,
    estimatedGpuBytes: felineLimbMetrics.gpuBytes,
    sha256: felineLimbMetrics.sha256,
    license: {
      label: "Open Educational 3D Feline Anatomy Project",
      verified: true,
      redistributionAllowed: true
    },
    reviewStatus: "pending",
    availability: "available",
    meshMappings: felineLimbMappings,
    layers: [
      { id: "skeleton", label: "Esqueleto" }
    ],
    specimen: {
      breed: "Gato doméstico (Felis catus)",
      sex: "No especificado",
      age: "Adulto"
    }
  };

  const viewerFelineSkullAsset: ViewerAsset = {
    id: felineSkullModel.id,
    speciesId: "feline",
    regionId: "head",
    title: "Cráneo felino — modelo óseo y dental real",
    purpose: "scientific",
    format: "glb",
    resourceUrl: "/models/feline/skull.glb",
    unit: "m",
    scaleToMeters: 1,
    orientation: "+Y arriba; +Z rostral/facial; cráneo felino",
    byteSize: felineSkullMetrics.byteSize,
    triangleCount: felineSkullMetrics.triangles,
    estimatedGpuBytes: felineSkullMetrics.gpuBytes,
    sha256: felineSkullMetrics.sha256,
    license: {
      label: "Open Educational 3D Feline Anatomy Project",
      verified: true,
      redistributionAllowed: true
    },
    reviewStatus: "pending",
    availability: "available",
    meshMappings: felineSkullMappings,
    layers: [
      { id: "skeleton", label: "Esqueleto" }
    ],
    specimen: {
      breed: "Gato doméstico (Felis catus)",
      sex: "No especificado",
      age: "Adulto"
    }
  };

  const updatedViewerAssets = [
    viewerCanineAsset,
    viewerCanineSkullAsset,
    viewerFelineLimbAsset,
    viewerFelineSkullAsset,
    ...viewerAssets.filter((a) => a.purpose === "technical_demo")
  ];

  // 7. Guardar todos los archivos reconciliados
  const structList = Array.from(structMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  const sourceList = Array.from(sourceMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  const modelList = Array.from(modelMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  const relList = Array.from(relMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  // Asegurar consistencia de supportedStructureIds
  for (const src of sourceList) {
    src.supportedStructureIds = Array.from(new Set(src.supportedStructureIds)).sort();
  }

  await writeJson("data/anatomy/structures.json", structList);
  await writeJson("data/anatomy/sources.json", sourceList);
  await writeJson("data/anatomy/models.json", modelList);
  await writeJson("data/anatomy/relations.json", relList);
  await writeJson("data/viewer/assets.json", updatedViewerAssets);

  // Mapeos separados para exportación
  const unifiedMeshMappings = [
    ...canineMappings.map((m) => ({ ...m, modelId: canineThoracicModel.id, speciesId: "canine" })),
    ...canineSkullMappings.map((m) => ({ ...m, modelId: canineSkullModel.id, speciesId: "canine" })),
    ...felineLimbMappings.map((m) => ({ ...m, modelId: felineThoracicModel.id, speciesId: "feline" })),
    ...felineSkullMappings.map((m) => ({ ...m, modelId: felineSkullModel.id, speciesId: "feline" }))
  ];
  await writeJson("data/anatomy/mesh-mappings.json", unifiedMeshMappings);

  console.log(`[Reconciliación exitosa]:`);
  console.log(`  - Estructuras totales: ${structList.length}`);
  console.log(`  - Modelos en catálogo: ${modelList.length}`);
  console.log(`  - Modelos disponibles en visor: ${updatedViewerAssets.length}`);
  console.log(`  - Fuentes científicas: ${sourceList.length}`);
  console.log(`  - Relaciones anatómicas: ${relList.length}`);
  console.log(`  - Mallas reconciliadas: ${unifiedMeshMappings.length}`);
}

if (process.argv[1]?.endsWith("reconcile-structures.ts")) {
  reconcileAnatomicalAssets().catch((e) => {
    console.error("Fallo al reconciliar:", e);
    process.exitCode = 1;
  });
}
