"""Compone data/osteology/diagnostics/canine.json (sin geometría) a partir del diagnóstico privado.

Ejecutar después de diagnose-canine.py: python3 -I scripts/osteology/build-canine-diagnostics.py
Las propuestas de identificación se escriben aquí, a mano, con evidencia visual privada; son hipótesis
(reviewStatus=pending, side=unknown) y nunca «revisado». Validación: scripts/osteology/canine-diagnostics-schema.ts.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
full = json.loads((root / "workbench/processing/canine/diagnostics/canine-diagnostic-full.json").read_text(encoding="utf-8"))
target = root / "data/osteology/diagnostics/canine.json"
R = "canine:reference:"
IMG = "workbench/inspection/canine-oct31"


def lr(path):
    return [f"{R}{path.replace('{s}', side)}" for side in ("left", "right")]


def ev(*paths):
    return [{"kind": "render", "path": f"{IMG}/{path}"} for path in paths]


def sheet(piece, first, last):
    return f"sheets/{piece}-c{first:02d}-c{last:02d}.png"


P = []


def propose(piece, ranks, label, latin, refs, state, evidence, notes):
    P.append({"pieceId": piece, "componentRanks": list(ranks), "proposedLabel": label, "canonicalLatinName": latin,
              "candidateReferenceIds": refs, "admissionState": state, "side": "unknown", "serial": None,
              "evidence": evidence, "notes": notes, "reviewStatus": "pending"})


SUF, PAR, NON = "geometric_bone_sufficient_proposal", "partial_surface_identified", "unidentified_or_non_anatomical"

# Cráneo
propose("skull", [0], "Cráneo sin mandíbula, en una sola malla", "Cranium", [f"{R}head:midline:skull"], PAR,
        ev("pieces/skull-side-x.png", "pieces/skull-bottom-z.png", sheet("skull", 0, 7)),
        "Una malla cerrada reúne neurocráneo y esplacnocráneo: no hay límites entre huesos individuales. El extremo de menor Z es una cara plana (180 triángulos coplanares); en las capturas no se identifican cóndilos occipitales.")
propose("skull", [1], "Mandíbulas derecha e izquierda unidas en una malla", "Mandibula", lr("head:{s}:mandible"), PAR,
        ev("pieces/skull-side-x.png", sheet("skull", 0, 7)),
        "Ambas hemimandíbulas forman un único componente continuo. No se separan ni se asigna lado.")
propose("skull", [2, 3, 4, 5], "Coronas de dientes caninos (cuatro componentes cónicos mayores)", "Dens caninus",
        lr("head:{s}:maxillary-canine-1") + lr("head:{s}:mandibular-canine-1"), PAR,
        ev("pieces/skull-side-x.png", sheet("skull", 0, 7), "labels/skull-labels-side-x.png"),
        "Se reconocen por su forma y posición en la arcada. No se asignan a una arcada o lado, y no hay raíces modeladas.")
propose("skull", range(6, 32), "Dientes incisivos, premolares y molares (26 componentes)", "Dentes permanentes",
        [f"{R}head:midline:adult-teeth"], PAR,
        ev("pieces/skull-side-x.png", "pieces/skull-bottom-z.png", sheet("skull", 8, 15), sheet("skull", 16, 23), sheet("skull", 24, 31)),
        "Hay coronas a lo largo de las arcadas. Algunos componentes reúnen dos coronas (c06, c07: con aristas no variedad). No hay correspondencia 1:1 con las 42 posiciones de referencia ni asignación por diente.")

# Miembro torácico
propose("thoracic-limb", [0], "Escápula", "Scapula", lr("thoracic-limb:{s}:scapula"), SUF,
        ev(sheet("thoracic-limb", 0, 7), "pieces/thoracic-limb-side-x.png"),
        "Malla individual con espina y acromion visibles. Tiene 136 aristas no variedad. Es un modelo no escaneado y modificado para impresión, así que la forma no acredita exactitud.")
propose("thoracic-limb", [1], "Húmero", "Humerus", lr("thoracic-limb:{s}:humerus"), SUF,
        ev(sheet("thoracic-limb", 0, 7), "pieces/thoracic-limb-side-x.png"), "Malla individual. Tiene 83 aristas no variedad.")
propose("thoracic-limb", [2], "Cúbito", "Ulna", lr("thoracic-limb:{s}:ulna"), SUF,
        ev(sheet("thoracic-limb", 0, 7), "pieces/thoracic-limb-side-x.png"), "Malla cerrada con olécranon proximal y diáfisis que se afina en sentido distal.")
propose("thoracic-limb", [3], "Radio", "Radius", lr("thoracic-limb:{s}:radius"), SUF,
        ev(sheet("thoracic-limb", 0, 7), "pieces/thoracic-limb-side-x.png"), "Malla cerrada paralela al cúbito, con extremo distal ensanchado.")
propose("thoracic-limb", [9, 10, 11, 12], "Metacarpianos largos (cuatro)", "Os metacarpale",
        [x for n in (2, 3, 4, 5) for x in lr(f"thoracic-limb:{{s}}:metacarpal-{n}")], PAR,
        ev(sheet("thoracic-limb", 8, 15)), "Hay cuatro huesos largos de igual número de caras (560). No se asigna numeral II–V a cada componente.")
propose("thoracic-limb", [4, 5, 6, 7, 8], "Falanges distales (cinco, en forma de garra)", "Phalanx distalis",
        [x for n in (1, 2, 3, 4, 5) for x in lr(f"thoracic-limb:{{s}}:digit-{n}-distal")], PAR,
        ev(sheet("thoracic-limb", 0, 7), sheet("thoracic-limb", 8, 15)), "c04 es menor que las demás. No se asigna dedo.")
propose("thoracic-limb", range(14, 24), "Falanges proximales y medias (diez componentes)", "Phalanges",
        [x for n in (1, 2, 3, 4, 5) for x in lr(f"thoracic-limb:{{s}}:digit-{n}-proximal")], PAR,
        ev(sheet("thoracic-limb", 8, 15), sheet("thoracic-limb", 16, 23)),
        "Hay diez componentes de 416 caras. La referencia esperaría 9 falanges proximales y medias (I con dos falanges). La discrepancia queda sin resolver y no se asignan dedos.")
propose("thoracic-limb", [13, 24, 25, 26, 27, 28], "Huesos del carpo (seis componentes)", "Ossa carpi",
        [x for name in ("carpal-intermedioradial", "carpal-ulnar", "carpal-accessory", "carpal-1", "carpal-2", "carpal-3", "carpal-4") for x in lr(f"thoracic-limb:{{s}}:{name}")], PAR,
        ev(sheet("thoracic-limb", 8, 15), sheet("thoracic-limb", 24, 29)),
        "Son seis bloques en la región carpiana, frente a siete unidades de referencia. c24 tiene forma alargada con cintura, pero no se identifica individualmente.")
propose("thoracic-limb", [29], "Tetraedro aislado de 4 caras", None, [], NON, ev(sheet("thoracic-limb", 24, 29)),
        "Artefacto geométrico aislado (extensión 0,1×0,2×0,3) junto al borde de la escápula. No es anatomía.")

# Miembro pélvico
propose("pelvic-limb", [0], "Hueso coxal de un lado (ilion, isquion y pubis en una malla)", "Os coxae", lr("pelvic-limb:{s}:coxal"), SUF,
        ev(sheet("pelvic-limb", 0, 7), "pieces/pelvic-limb-side-x.png"),
        "Una malla con agujero obturado visible. Sus componentes (ilion, isquion y pubis) no se separan. Tiene 49 aristas no variedad.")
propose("pelvic-limb", [2], "Fémur", "Femur", lr("pelvic-limb:{s}:femur"), SUF, ev(sheet("pelvic-limb", 0, 7), "pieces/pelvic-limb-side-x.png"),
        "Malla cerrada con cabeza y cóndilos.")
propose("pelvic-limb", [1], "Tibia", "Tibia", lr("pelvic-limb:{s}:tibia"), SUF, ev(sheet("pelvic-limb", 0, 7), "pieces/pelvic-limb-side-x.png"),
        "Malla cerrada con cresta proximal.")
propose("pelvic-limb", [5], "Peroné", "Fibula", lr("pelvic-limb:{s}:fibula"), SUF, ev(sheet("pelvic-limb", 0, 7), "pieces/pelvic-limb-side-x.png"),
        "Hueso largo delgado paralelo a la tibia.")
propose("pelvic-limb", [27], "Rótula (candidata)", "Patella", lr("pelvic-limb:{s}:patella"), PAR, ev(sheet("pelvic-limb", 24, 27)),
        "Componente ovoide en la región femorotibial. Se identifica por su posición, sin superficie articular verificada.")
propose("pelvic-limb", [12, 13, 14, 15], "Metatarsianos largos (cuatro)", "Os metatarsale",
        [x for n in (2, 3, 4, 5) for x in lr(f"pelvic-limb:{{s}}:metatarsal-{n}")], PAR, ev(sheet("pelvic-limb", 8, 15)),
        "Cuatro huesos largos de 512 caras. No se asigna numeral.")
propose("pelvic-limb", [6, 7, 8, 9], "Falanges distales (cuatro)", "Phalanx distalis",
        [x for n in (2, 3, 4, 5) for x in lr(f"pelvic-limb:{{s}}:digit-{n}-distal")], PAR, ev(sheet("pelvic-limb", 0, 7), sheet("pelvic-limb", 8, 15)),
        "Cuatro garras. No se asigna dedo.")
propose("pelvic-limb", range(19, 27), "Falanges proximales y medias (ocho)", "Phalanges",
        [x for n in (2, 3, 4, 5) for part in ("proximal", "middle") for x in lr(f"pelvic-limb:{{s}}:digit-{n}-{part}")], PAR,
        ev(sheet("pelvic-limb", 16, 23), sheet("pelvic-limb", 24, 27)), "Ocho componentes de 416 caras. No se asigna dedo ni posición.")
propose("pelvic-limb", [3, 4, 10, 11, 17, 18], "Huesos del tarso (seis componentes)", "Ossa tarsi",
        [x for name in ("tarsal-talus", "tarsal-calcaneus", "tarsal-central", "tarsal-1", "tarsal-2", "tarsal-3", "tarsal-4") for x in lr(f"pelvic-limb:{{s}}:{name}")], PAR,
        ev(sheet("pelvic-limb", 0, 7), sheet("pelvic-limb", 8, 15), sheet("pelvic-limb", 16, 23)),
        "Seis bloques en la región tarsiana, frente a siete unidades de referencia. No se identifican individualmente (ni calcáneo ni talus).")
propose("pelvic-limb", [16], "Lámina sobre la cara del ilion", None, [], NON, ev(sheet("pelvic-limb", 16, 23), "pieces/pelvic-limb-side-x.png"),
        "Componente laminar de 428 caras apoyado en el ala del coxal. Su identidad no es defendible.")

# Columna (pieza «espina dorsal»): cortada por un plano en Z mínima
CUT = "El componente está cortado por el plano Z≈0 de la pieza (hemisección); solo hay media superficie."
propose("vertebral-column", [0], "Varias vértebras consecutivas fusionadas en una malla (región media y caudal del tronco)", "Columna vertebralis",
        [f"{R}axial:midline:thoracic-vertebrae", f"{R}axial:midline:lumbar-vertebrae", f"{R}axial:midline:sacral-region"], PAR,
        ev("labels/vertebral-column-labels-top-z.png", sheet("vertebral-column", 0, 7)),
        CUT + " Hay una única malla de 29.166 caras sin límites intervertebrales, así que el número y el tipo de vértebras no se determinan.")
propose("vertebral-column", [3, 4, 6, 7, 8, 12, 24, 32], "Vértebras del extremo craneal de la serie (ocho componentes, mitades)", "Vertebrae cervicales",
        [f"{R}axial:midline:cervical-vertebrae"], PAR,
        ev("labels/vertebral-column-labels-top-z.png", sheet("vertebral-column", 0, 7), sheet("vertebral-column", 8, 15), sheet("vertebral-column", 24, 31), sheet("vertebral-column", 32, 39)),
        CUT + " Están en el extremo opuesto a la cola. No se asigna atlas, axis ni numeral, y no se verifica el límite cervicotorácico.")
propose("vertebral-column", [25, 26, 27, 28, 29, 30, 31, 61], "Vértebras con apófisis espinosas junto a las costillas (ocho componentes, mitades)", "Vertebrae thoracicae",
        [f"{R}axial:midline:thoracic-vertebrae"], PAR,
        ev("labels/vertebral-column-labels-top-z.png", sheet("vertebral-column", 24, 31), sheet("vertebral-column", 56, 63)),
        CUT + " Se infiere por la vecindad con las costillas; no se asigna numeral.")
propose("vertebral-column", [5, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 35], "Vértebras caudales (16 componentes, mitades)", "Vertebrae caudales",
        [f"{R}axial:midline:caudal-series"], PAR,
        ev("labels/vertebral-column-labels-top-z.png", sheet("vertebral-column", 0, 7), sheet("vertebral-column", 8, 15), sheet("vertebral-column", 16, 23), sheet("vertebral-column", 32, 39)),
        CUT + " c05 reúne dos vértebras. c09, c10, c11 y c35 son mallas abiertas (aristas de borde). Es una serie variable, sin total universal.")
propose("vertebral-column", [33, 37, 39, 40, 42, 43, 47, 54, 55, 56, 57, 58, 59], "Segmentos dorsales de costilla de un solo lado (13)", "Costa",
        [f"{R}axial:midline:thorax"], PAR,
        ev("labels/vertebral-column-labels-top-z.png", "pieces/vertebral-column-front-y.png", sheet("vertebral-column", 32, 39), sheet("vertebral-column", 40, 47), sheet("vertebral-column", 48, 55), sheet("vertebral-column", 56, 63)),
        "No están cortadas por el plano Z≈0. Solo está representado un lado: el autor declara reflejo para completar el otro lado. No se asigna numeral ni lado; se enlaza solo al grupo del esqueleto torácico.")
propose("vertebral-column", [34, 38, 41, 44, 45, 46, 48, 49, 50, 51, 52, 53, 60, 68], "Segmentos ventrales de costilla (14 componentes)", None,
        [], NON, ev("labels/vertebral-column-labels-top-z.png", sheet("vertebral-column", 32, 39), sheet("vertebral-column", 40, 47), sheet("vertebral-column", 48, 55)),
        "Son segmentos continuos con los dorsales. La geometría no distingue cartílago costal de hueso. c44 y c45 tocan el plano Z≈0. No se identifican.")
propose("vertebral-column", [36, 62, 63, 64, 65, 66, 67], "Elementos medianos ventrales donde convergen las costillas (siete, mitades)", "Sternum",
        [f"{R}axial:midline:sternebra-{n}" for n in range(1, 9)], PAR,
        ev("labels/vertebral-column-labels-top-z.png", "pieces/vertebral-column-bottom-z.png", sheet("vertebral-column", 32, 39), sheet("vertebral-column", 56, 63), sheet("vertebral-column", 64, 71)),
        CUT + " Hay 7 componentes frente a 8 segmentos de referencia. No se asigna numeral.")
propose("vertebral-column", [1, 2], "Elipsoides lisos junto al extremo craneal", None, [], NON, ev(sheet("vertebral-column", 0, 7)),
        "c01 (4.816 caras, cortado) y c02 (4.816 caras) son superficies elipsoidales regulares sin rasgos óseos. Son probables auxiliares de impresión o volúmenes no anatómicos; no se interpretan.")
propose("vertebral-column", [69, 70, 71, 72, 73, 74, 75, 76, 77, 78], "Fragmentos pequeños adyacentes a la malla fusionada (diez)", None, [], NON,
        ev("labels/vertebral-column-labels-top-z.png", sheet("vertebral-column", 64, 71), sheet("vertebral-column", 72, 78)),
        "Su identidad no es defendible con la geometría disponible.")


def compact_component(component, cut_ranks):
    keys = ("rank", "faceCount", "boundsMin", "boundsMax", "extent", "surfaceArea", "signedVolume", "closed",
            "boundaryEdges", "nonManifoldEdges", "inconsistentlyOrientedManifoldEdges")
    return {**{key: component[key] for key in keys}, "touchesPlanarSection": component["rank"] in cut_ranks}


pieces = []
for piece in full["pieces"]:
    cut_ranks = {rank for section in piece["planarSectionsOnBoundingPlanes"]["sections"] if section["faceCount"] >= 100 for rank in section["componentRanks"]}
    proximity = piece["componentProximityTolerance0"]["pairs"]
    pieces.append({
        **{key: piece[key] for key in ("pieceId", "sourceFile", "sourceSha256", "bytes", "format", "headerAllZeroBytes", "nonZeroAttributeWords",
                                       "triangles", "uniqueVertexPositions", "boundsMin", "boundsMax", "extent", "units", "unitsEvidence",
                                       "defects", "connectivity", "totalSurfaceArea", "planarSectionsOnBoundingPlanes")},
        "componentProximity": {"maxDistanceNative": piece["componentProximityTolerance0"]["maxDistanceNative"],
                               "pairsWithin": len(proximity), "coincidentPairs": sum(1 for p in proximity if p["nearestVertexDistance"] == 0),
                               "minimumDistance": min((p["nearestVertexDistance"] for p in proximity), default=None)},
        "componentsTolerance0": [compact_component(c, cut_ranks) for c in piece["componentsTolerance0"]],
    })

report = {
    "assetId": "canine:3dexport-285869",
    "speciesId": "canine",
    "sourceProduct": {"url": "https://3dexport.com/3d-model-esqueleto-de-perro-dog-skeleton-285869", "author": "hidden.art8",
                      "declaredScan": False, "declaredModifiedForPrinting": True, "declaredMirroring": True},
    "privacy": {"webAvailable": False, "licenseStatus": "no_web_license", "publicDerivatives": 0,
                "note": "Resultado privado: sin licencia web. Nada en public/, data/viewer ni mappings."},
    "generatedBy": ["scripts/osteology/diagnose-canine.py", "scripts/osteology/build-canine-diagnostics.py"],
    "method": "STL binario leído sin importador (sin fusión ni limpieza). Componentes: unión de vértices por coordenadas coincidentes, exactas (0) o cuantizadas (1e-6, 1e-5 unidades fuente), y unión por triángulo, como en el diagnóstico felino.",
    "geometryModified": False,
    "reviewStatus": "pending",
    "totals": {"triangles": sum(p["triangles"] for p in pieces), "componentsTolerance0": sum(len(p["componentsTolerance0"]) for p in pieces)},
    "pieces": pieces,
    "interPiece": full["interPiece"],
    "registration": {
        "status": "not_registered", "transformsApplied": [],
        "reasons": [
            "Las cajas envolventes de las cuatro piezas están separadas entre 51,2 y 287,9 unidades fuente; no hay vértices de piezas distintas a menos de 1 unidad.",
            "Cada pieza apoya su mínimo Z en ≈0 con orientaciones distintas (columna tumbada sobre su plano de corte, cráneo sobre su cara plana caudal): es una disposición de impresión, no un animal articulado.",
            "El extremo caudal del cráneo es una cara plana y no se identifican cóndilos occipitales. El extremo craneal de la columna está seccionado por el plano Z≈0, así que no hay dos superficies articulares completas que comparar.",
            "Coxal y miembro torácico son de un solo lado, y la columna es una hemisección; un ajuste exigiría reflejar o inventar geometría (no permitido).",
            "Las unidades son desconocidas y no se comprobó que las cuatro piezas compartan escala.",
        ],
    },
    "identificationProposals": P,
}
target.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({"pieces": len(pieces), "proposals": len(P), "triangles": report["totals"]["triangles"], "components": report["totals"]["componentsTolerance0"]}))
