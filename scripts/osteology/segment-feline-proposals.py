"""Propuestas privadas refinadas de superficies óseas felinas (Tavernier), 2026-10-31.

Método (documentado en docs/phase3/feline-segmentation-2026-10-31.md):
1. Conectividad virtual por posiciones idénticas y adyacencia por arista manifold.
2. Zonas articulares excluidas: esferas centradas en articulaciones localizadas en
   capturas con retícula (x,z) y profundidad y estimada como mediana de las caras del
   semiespacio cercanas. Esas caras quedan en el remanente: no se decide a qué hueso
   pertenece la superficie articular.
3. ROI de contención (caja) por pieza y semiespacio de escena (y<0 / y>=0).
4. La propuesta es el componente conexo que contiene la semilla dentro de ROI menos
   exclusiones. Se registra si el componente toca la caja (corte arbitrario activo),
   alineación con el eje articulación-articulación, ángulo diedro interior/borde.
Nada se genera, cierra o repara. Lado anatómico: unknown (ver ejes en el informe).
Solo lectura de la anotación; salidas en workbench/ y data/osteology/proposals/feline/.
"""
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np  # noqa: E402
import feline_seg_common as common  # noqa: E402

DATE = "2026-10-31"
WORK = common.ROOT / "workbench/segmentation/feline/refined-2026-10-31"
CAPTURES = common.ROOT / "workbench/inspection/feline-oct31/proposals"
DATA = common.ROOT / "data/osteology/proposals/feline/feline-surface-proposals-2026-10-31.json"
PILOT = common.ROOT / "workbench/segmentation/feline/pilot/surface-proposals.json"

world, tris = common.load_annotation()
topo = common.Topology(world, tris)
C = topo.centroid
HALF = {"yneg": C[:, 1] < 0, "ypos": C[:, 1] >= 0}


def locate(x, z, half, radius=0.12):
    near = HALF[half] & (np.hypot(C[:, 0] - x, C[:, 2] - z) < radius)
    if near.sum() < 5:
        raise RuntimeError(f"Sin caras cerca de ({x},{z}) en {half}")
    return np.array([x, float(np.median(C[near, 1])), z])


# Centros articulares (x,z) leídos en survey-grid/*.png; ver informe.
JOINTS = {
    "yneg": {"shoulder": (-3.05, 4.0), "elbow": (-1.8, 2.5), "carpus": (-2.8, 0.12),
             "hip": (3.86, 4.05), "stifle": (1.95, 3.15), "tarsus": (2.58, 0.62)},
    "ypos": {"shoulder": (-2.85, 4.23), "elbow": (-2.92, 2.35), "carpus": (-4.2, 0.0),
             "hip": (3.83, 4.22), "stifle": (2.79, 2.49), "tarsus": (5.38, 1.2)},
}
JOINT_RADIUS = {"shoulder": 0.22, "elbow": 0.22, "carpus": 0.2, "hip": 0.24, "stifle": 0.22, "tarsus": 0.25}
joint_centers = {h: {name: locate(x, z, h) for name, (x, z) in table.items()} for h, table in JOINTS.items()}


def sphere_mask(center, radius):
    return np.linalg.norm(C - center, axis=1) < radius


RADIAL_LIMIT = 0.32


def cylinder_coords(a, b):
    axis = (b - a) / np.linalg.norm(b - a)
    rel = C - a
    t = rel @ axis
    radial = np.linalg.norm(rel - np.outer(t, axis), axis=1)
    return t, radial, float(np.linalg.norm(b - a))


def distal_widening(a, b, half, start=0.4, bins=28, factor=1.4):
    """Primer ensanchamiento distal del perfil (n.º de caras por tramo) tras `start`·L."""
    t, radial, length = cylinder_coords(a, b)
    m = HALF[half] & (radial < 0.35) & (t > 0) & (t < length)
    counts = np.array([int((m & (t >= k * length / bins) & (t < (k + 1) * length / bins)).sum()) for k in range(bins)])
    reference = float(np.median(counts[int(.15 * bins):int(.55 * bins)]))
    for k in range(int(start * bins), bins):
        if counts[k] > factor * reference:
            return (k - 1) / bins, counts.tolist(), reference
    raise RuntimeError("Sin ensanchamiento distal detectable")


def long_bone(pid, structure, latin, region, half, proximal, distal, admission, notes, distal_point=None):
    a = joint_centers[half][proximal]
    b = joint_centers[half][distal] if distal_point is None else locate(*distal_point, half, 0.25)
    t, radial, length = cylinder_coords(a, b)
    t_min = JOINT_RADIUS[proximal]
    profile = None
    if distal_point is None:
        t_max = length - JOINT_RADIUS[distal]
    else:
        fraction, counts, reference = distal_widening(a, b, half)
        t_max = fraction * length
        profile = {"line": "codo -> contacto distal del miembro", "bins": len(counts), "facesPerBin": counts,
                   "shaftReferenceMedian": reference, "widening": "primer tramo > 1,4 x mediana tras 0,4 L",
                   "cutFractionOfLine": round(fraction, 4)}
    cyl = (t >= t_min) & (t <= t_max) & (radial < RADIAL_LIMIT)
    mid = a + (b - a) / np.linalg.norm(b - a) * (t_min + t_max) / 2
    seed = locate(mid[0], mid[2], half, 0.2)
    lo = np.minimum(a, b) - 0.4
    hi = np.maximum(a, b) + 0.4
    return dict(pid=pid, structure=structure, latin=latin, region=region, half=half, lo=lo, hi=hi, seed=seed,
                exclusions=[("sphere", proximal, a, JOINT_RADIUS[proximal])] + ([("sphere", distal, b, JOINT_RADIUS[distal])] if distal_point is None else []),
                extra=cyl, cylinder={"a": a, "b": b, "tMin": t_min, "tMax": t_max, "radialLimit": RADIAL_LIMIT, "profile": profile},
                axis=(a, b), admission=admission, notes=notes, kind="long")


def plate(pid, structure, latin, region, half, lo, hi, seed_xz, exclusions, admission, notes, lateral=0.22, medial=0.08, fit_radius=0.45, max_dihedral=None):
    """Hueso plano: ROI restringida a una banda alrededor del plano de mejor ajuste cerca de la semilla."""
    seed = locate(*seed_xz, half)
    roi = common.box_mask(C, lo, hi) & HALF[half]
    near = roi & (np.linalg.norm(C - seed, axis=1) < fit_radius)
    center, _, _ = common.principal_axis(C[near], topo.area[near])
    cov = np.cov((C[near] - center).T, aweights=topo.area[near])
    normal = np.linalg.eigh(cov)[1][:, 0]
    outward = 1.0 if half == "ypos" else -1.0  # lado lateral = alejado del plano medio de escena
    if normal[1] * outward < 0:
        normal = -normal
    distance = (C - center) @ normal
    band = (distance <= lateral) & (distance >= -medial)
    return dict(pid=pid, structure=structure, latin=latin, region=region, half=half, lo=np.array(lo), hi=np.array(hi), seed=seed,
                exclusions=exclusions, extra=band, plane={"center": center, "normal": normal, "lateral": lateral, "medial": medial, "fitRadius": fit_radius},
                admission=admission, notes=notes, kind="flat", max_dihedral=max_dihedral)


# Punto de contacto distal del miembro torácico con el suelo (capturas survey-grid).
GROUND = {"yneg": (-2.85, -0.15), "ypos": (-4.25, -0.15)}
SPECS = []
for half in ("yneg", "ypos"):
    SPECS += [
        long_bone(f"humerus-surface-{half}", "feline:humerus", "Humerus", "brachium", half, "shoulder", "elbow",
                  "partial_surface_identified",
                  "Superficie entre zonas escapulohumeral y del codo excluidas; identidad por posición en la cadena del miembro torácico (estilopodio)."),
        long_bone(f"antebrachium-radius-ulna-surface-{half}", "feline:radius", "Radius et ulna", "antebrachium", half, "elbow", "carpus",
                  "partial_surface_identified",
                  "Conjunto radio+cúbito: la malla no muestra separación defendible entre ambos; NO es radio aislado. Se usa feline:radius solo como ficha de referencia más próxima; revisar ID conjunto. Límite distal: primer ensanchamiento del perfil (compatible con extremo distal/carpo, no delimitado); ese tramo y el autopodio quedan en el remanente.", distal_point=GROUND[half]),
        long_bone(f"femur-surface-{half}", "feline:femur", "Os femoris", "pelvic-limb", half, "hip", "stifle",
                  "partial_surface_identified",
                  "Superficie entre zonas coxofemoral y de la rodilla excluidas; identidad por posición en la cadena del miembro pelviano (estilopodio)."),
        long_bone(f"crus-tibia-fibula-surface-{half}", "feline:tibia", "Tibia et fibula", "crus", half, "stifle", "tarsus",
                  "partial_surface_identified",
                  "Superficie crural conjunta (tibia ± fíbula): en un lado una tira delgada paralela compatible con fíbula queda conectada e incluida; en el otro hay una superficie paralela no conectada que queda en el remanente. No se puede asignar cada superficie a tibia o fíbula; NO es tibia aislada. feline:tibia es solo la ficha de referencia más próxima."),
    ]

# Escápulas: placa con espina visible en ambas vistas laterales (survey-grid / shoulder-*).
SPECS += [
    plate("scapula-surface-yneg", "feline:scapula", "Scapula", "thoracic-girdle", "yneg", [-3.25, -0.75, joint_centers["yneg"]["shoulder"][2]], [-1.9, -0.02, 5.35], (-2.75, 4.7),
          [("sphere", "shoulder", joint_centers["yneg"]["shoulder"], JOINT_RADIUS["shoulder"])], "partial_surface_identified",
          "Placa con espina escapular visible; zona escapulohumeral excluida y nada por debajo de la altura (z) de su centro; banda asimétrica alrededor del plano ajustado de la placa (+0,22 lateral / -0,08 medial) para separar costillas/columna en contacto."),
    plate("scapula-surface-ypos", "feline:scapula", "Scapula", "thoracic-girdle", "ypos", [-3.0, 0.5, joint_centers["ypos"]["shoulder"][2]], [-1.4, 1.2, 5.35], (-2.3, 4.75),
          [("sphere", "shoulder", joint_centers["ypos"]["shoulder"], JOINT_RADIUS["shoulder"])], "partial_surface_identified",
          "Placa con espina escapular visible; zona escapulohumeral excluida y nada por debajo de la altura (z) de su centro; banda asimétrica alrededor del plano ajustado de la placa (+0,22 lateral / -0,08 medial) para separar costillas/columna en contacto. Además, crecimiento sin cruzar aristas con diedro > 60° para no seguir costillas en contacto. Persiste un pequeño fragmento ventral compatible con costilla bajo el borde de la placa (ver captura lateral): revisar y, si procede, retirar manualmente.", max_dihedral=60),
]
# Coxales: franja sagital media excluida (sacroilíaca y sínfisis no delimitables) + zona coxofemoral.
SPECS += [
    dict(pid="os-coxae-surface-yneg", structure="feline:os-coxae", latin="Os coxae", region="pelvic-girdle", half="yneg",
         lo=np.array([2.85, -1.1, 3.45]), hi=np.array([4.85, -0.38, 5.3]), seed=locate(3.35, 4.75, "yneg"),
         exclusions=[("sphere", "hip", joint_centers["yneg"]["hip"], JOINT_RADIUS["hip"])], kind="flat",
         admission="partial_surface_identified",
         notes="Cuerpo del ilion y anillo isquiopúbico con agujero obturado visibles; límites sacroilíaco/sinfisario reemplazados por corte de caja en y (no articulares). Sin ficha bibliográfica feline:os-coxae en el catálogo."),
    dict(pid="os-coxae-surface-ypos", structure="feline:os-coxae", latin="Os coxae", region="pelvic-girdle", half="ypos",
         lo=np.array([2.85, 0.12, 3.55]), hi=np.array([4.65, 0.9, 5.3]), seed=locate(3.4, 4.75, "ypos"),
         exclusions=[("sphere", "hip", joint_centers["ypos"]["hip"], JOINT_RADIUS["hip"])], kind="flat",
         admission="partial_surface_identified",
         notes="Barra iliaca-isquiática; el agujero obturado no es legible en este lado. Límites sacroilíaco/sinfisario reemplazados por corte de caja en y. Sin ficha bibliográfica feline:os-coxae."),
]

# Cabeza ósea: corte en la sección mínima entre cráneo y atlas.
neck = (C[:, 0] > -4.95) & (C[:, 0] < -4.2) & (C[:, 2] > 4.0)
slabs = np.arange(-4.95, -4.2, 0.05)
extent = []
for s in slabs:
    m = neck & (C[:, 0] >= s) & (C[:, 0] < s + 0.05)
    extent.append(float(np.ptp(C[m, 1]) * np.ptp(C[m, 2])) if m.sum() > 3 else float("inf"))
cut = float(slabs[int(np.argmin(extent))] + 0.025)
SPECS.append(dict(pid="head-skeleton-surface-midline", structure="feline:skull", latin="Cranium", region="head", half=None,
                  lo=np.array([-6.6, -2.0, 3.0]), hi=np.array([cut - 0.05, 2.0, 6.2]), seed=locate(-5.6, 5.3, "ypos"),
                  exclusions=[("slab-x", "atlanto-occipital", np.array([cut, 0, 0]), 0.05)], kind="head",
                  admission="partial_surface_identified",
                  notes="Cráneo y, si existe, mandíbula como superficie conjunta: no hay límite defendible entre mandíbula y cráneo ni entre huesos craneales. Corte en sección mínima cabeza-cuello (no articulación delimitada). Representa la fila de grupo Cranium, no huesos craneales individuales.",
                  neckProfile={"slabsX": [round(float(s), 3) for s in slabs], "yzExtent": [None if e == float("inf") else round(e, 4) for e in extent], "cutX": round(cut, 4)}))

claimed = np.zeros(len(tris), dtype=bool)
results = []
for spec in SPECS:
    roi = common.box_mask(C, spec["lo"], spec["hi"])
    if spec["half"]:
        roi &= HALF[spec["half"]]
    for kind, _, center, radius in spec["exclusions"]:
        roi &= ~(sphere_mask(center, radius) if kind == "sphere" else (np.abs(C[:, 0] - center[0]) < radius))
    if "extra" in spec:
        roi &= spec["extra"]
    available = roi & ~claimed
    region, seed_distance = topo.component_of(available, spec["seed"], spec.get("max_dihedral"))
    overlap_prevented = int((region & claimed).sum())
    faces = np.flatnonzero(region)
    if len(faces) < 30:
        raise RuntimeError(f"{spec['pid']}: componente demasiado pequeño ({len(faces)})")
    claimed |= region
    pts = C[faces]
    margin = 0.03
    touches = (np.abs(pts - spec["lo"]) < margin) | (np.abs(pts - spec["hi"]) < margin)
    box_contact = int(touches.any(1).sum())
    center, axis, eigen = common.principal_axis(pts, topo.area[faces])
    metrics = {"faces": int(len(faces)), "areaSceneUnits2": round(float(topo.area[faces].sum()), 4),
               "seedDistance": round(seed_distance, 4), "boxContactFaces": box_contact,
               "roiFacesAvailable": int(available.sum()), "componentShareOfRoi": round(len(faces) / max(int(available.sum()), 1), 4),
               "principalEigenRatio": round(float(eigen[0] / max(eigen[1], 1e-12)), 2),
               "dihedralDegrees": topo.boundary_dihedral(region),
               "bboxMin": pts.min(0).round(3).tolist(), "bboxMax": pts.max(0).round(3).tolist()}
    if spec["kind"] == "long":
        a, b = spec["axis"]
        joint_axis = (b - a) / np.linalg.norm(b - a)
        t = (pts - a) @ joint_axis
        metrics.update({"jointDistance": round(float(np.linalg.norm(b - a)), 4),
                        "axisAlignmentAbsCos": round(float(abs(axis @ joint_axis)), 4),
                        "projectedSpan": [round(float(t.min()), 3), round(float(t.max()), 3)]})
    results.append((spec, faces, metrics))
    print(spec["pid"], metrics["faces"], "box", box_contact, "align", metrics.get("axisAlignmentAbsCos"))

assigned = int(claimed.sum())
remainder = len(tris) - assigned
total = sum(len(f) for _, f, _ in results) + remainder
assert total == common.TRIANGLES, total
all_faces = np.concatenate([f for _, f, _ in results])
assert len(np.unique(all_faces)) == len(all_faces), "caras duplicadas entre propuestas"

# Comparación con el piloto de 2026-10-10.
pilot = json.loads(PILOT.read_text(encoding="utf-8-sig"))
labels_all = topo.components(np.ones(len(tris), dtype=bool))
comparison = []
for group in pilot["groups"]:
    old = np.array(group["faceIndices"])
    halves = {h: int(HALF[h][old].sum()) for h in HALF}
    old_mask = np.zeros(len(tris), dtype=bool); old_mask[old] = True
    sub = topo.components(old_mask)
    comps = np.unique(sub[old_mask], return_counts=True)[1]
    best = None
    for spec, faces, _ in results:
        if spec["structure"] == group["proposedStructureId"]:
            inter = int(np.isin(old, faces).sum())
            if best is None or inter > best[1]:
                best = (spec["pid"], inter, len(faces))
    comparison.append({"pilotProposalId": group["proposalId"], "pilotFaces": int(len(old)), "pilotFacesBySceneHalf": halves,
                       "pilotConnectedPiecesInsideRoi": int(len(comps)), "pilotPieceSizes": sorted(comps.tolist(), reverse=True)[:6],
                       "refinedProposalId": best[0] if best else None, "pilotFacesRetainedInRefined": best[1] if best else 0,
                       "refinedFaces": best[2] if best else 0})

# Fíbula candidata (no propuesta): componentes del zeugopodio pelviano no reclamados.
fibula_candidates = []
for half in HALF:
    a, b = joint_centers[half]["stifle"], joint_centers[half]["tarsus"]
    lo, hi = np.minimum(a, b) - 0.35, np.maximum(a, b) + 0.35
    lo[1], hi[1] = (a[1] + b[1]) / 2 - 0.55, (a[1] + b[1]) / 2 + 0.55
    m = common.box_mask(C, lo, hi) & HALF[half] & ~claimed
    m &= ~sphere_mask(a, JOINT_RADIUS["stifle"]) & ~sphere_mask(b, JOINT_RADIUS["tarsus"])
    lab = topo.components(m)
    ids, counts = np.unique(lab[m], return_counts=True)
    for i, n in sorted(zip(ids, counts), key=lambda p: -p[1])[:3]:
        pts = C[lab == i]
        fibula_candidates.append({"sceneHalf": half, "faces": int(n), "bboxMin": pts.min(0).round(3).tolist(), "bboxMax": pts.max(0).round(3).tolist()})


def ranges(values):
    values = np.sort(values)
    out, start, prev = [], int(values[0]), int(values[0])
    for v in values[1:]:
        v = int(v)
        if v != prev + 1:
            out.append([start, prev]); start = v
        prev = v
    out.append([start, prev])
    return out


review = {"assetId": "feline:tavernier-skeleton", "sourceSha256": common.SOURCE_SHA256, "triangleCount": common.TRIANGLES,
          "status": "draft", "reviewer": None, "groups": []}
records = []
for spec, faces, metrics in results:
    review["groups"].append({"proposalId": spec["pid"], "proposedStructureId": spec["structure"], "canonicalLatinName": spec["latin"],
        "regionId": spec["region"], "side": "unknown", "faceIndices": sorted(int(f) for f in faces),
        "evidence": [{"citation": "Tavernier GLB c570679a… + capturas privadas con retícula", "locator": f"workbench/inspection/feline-oct31/proposals/{spec['pid']}-*.png; survey-grid/*.png"}],
        "notes": spec["notes"] + " Lado anatómico unknown: semiespacio de escena " + (spec["half"] or "ambos") + ", no lateralidad. Propuesta privada sin revisión humana."})
    face_list = np.sort(faces)
    records.append({"proposalId": spec["pid"], "proposedStructureId": spec["structure"], "canonicalLatinName": spec["latin"],
        "regionId": spec["region"], "side": "unknown", "sceneHalf": spec["half"] or "both", "admissionStatus": spec["admission"],
        "reviewStatus": "pending", "faceCount": int(len(faces)),
        "faceIndexSha256": hashlib.sha256(",".join(map(str, face_list.tolist())).encode()).hexdigest(),
        "faceIndexRanges": ranges(face_list),
        "method": {"kind": spec["kind"], "roiBoxMin": np.round(spec["lo"], 4).tolist(), "roiBoxMax": np.round(spec["hi"], 4).tolist(),
                   "seed": np.round(spec["seed"], 4).tolist(),
                   "exclusions": [{"type": k, "label": lab, "center": np.round(c, 4).tolist(), "radius": r} for k, lab, c, r in spec["exclusions"]],
                   **({"neckProfile": spec["neckProfile"]} if "neckProfile" in spec else {}),
                   **({"cylinder": {"a": np.round(spec["cylinder"]["a"], 4).tolist(), "b": np.round(spec["cylinder"]["b"], 4).tolist(),
                                    "tMin": round(float(spec["cylinder"]["tMin"]), 4), "tMax": round(float(spec["cylinder"]["tMax"]), 4),
                                    "radialLimit": spec["cylinder"]["radialLimit"], "distalProfile": spec["cylinder"]["profile"]}} if "cylinder" in spec else {}),
                   **({"plate": {"center": np.round(spec["plane"]["center"], 4).tolist(), "normal": np.round(spec["plane"]["normal"], 4).tolist(),
                                 "lateralBand": spec["plane"]["lateral"], "medialBand": spec["plane"]["medial"], "fitRadius": spec["plane"]["fitRadius"]}} if "plane" in spec else {})},
        "metrics": metrics, "notes": spec["notes"], "publicAvailable": False})

common.write_json(WORK / "proposals.json", review)
summary = {"date": DATE, "assetId": "feline:tavernier-skeleton", "sourceSha256": common.SOURCE_SHA256, "triangleCount": common.TRIANGLES,
           "script": "scripts/osteology/segment-feline-proposals.py", "reviewStatus": "pending", "anatomicallyAcceptedBones": 0,
           "connectivity": {"rule": "posiciones idénticas + arista manifold (2 caras)", "manifoldAdjacencies": int(len(topo.pairs)),
                            "nonManifoldEdgesIgnored": topo.nonmanifold_edges, "boundaryEdges": topo.boundary_edges},
           "joints": {h: {k: np.round(v, 4).tolist() for k, v in d.items()} for h, d in joint_centers.items()},
           "jointRadius": JOINT_RADIUS, "assignedFaces": assigned, "remainderFaces": remainder, "sumCheck": total,
           "proposals": records, "pilotComparison": comparison, "unproposedZeugopodCandidates": fibula_candidates,
           "notProposed": {"mandible": "Sin límite defendible respecto del cráneo en la malla; incluida en la superficie conjunta de la cabeza.",
                           "radiusUlnaSeparately": "Sin separación geométrica visible; propuesta como conjunto.",
                           "fibula": "Componentes no reclamados del zeugopodio registrados sin identidad (pueden ser fíbula, cola u otros); no propuestos."}}
common.write_json(DATA, summary)

# Capturas: pieza coloreada sobre contexto gris, tres vistas ortogonales por pieza.
palette = [(.15, .45, .85, 1), (.9, .45, .1, 1), (.2, .75, .4, 1), (.8, .2, .5, 1), (.6, .4, .9, 1), (.95, .8, .15, 1), (.1, .7, .75, 1)]
scene = common.fresh_scene()
common.mesh_from_faces("remainder", world, tris, np.flatnonzero(~claimed), (.62, .62, .62, 1))
objects = []
for i, (spec, faces, _) in enumerate(results):
    objects.append(common.mesh_from_faces(spec["pid"], world, tris, faces, palette[i % len(palette)]))
lo, hi = world.min(0), world.max(0)
renders = common.render_views(scene, CAPTURES, "all-proposals", (lo + hi) / 2, float((hi - lo).max() * 1.08), list(common.VIEWS))
for spec, faces, metrics in results:
    piece_mask = np.zeros(len(tris), dtype=bool); piece_mask[faces] = True
    scene = common.fresh_scene()
    near = common.box_mask(C, spec["lo"] - 0.6, spec["hi"] + 0.6)
    if spec["half"]:
        near &= HALF[spec["half"]]
    common.mesh_from_faces("context", world, tris, np.flatnonzero(near & ~piece_mask), (.62, .62, .62, 1))
    common.mesh_from_faces(spec["pid"], world, tris, faces, (.9, .35, .1, 1))
    pts = C[faces]
    c = (pts.min(0) + pts.max(0)) / 2
    scale = float(np.ptp(pts, axis=0).max() * 1.6 + 0.4)
    lateral = "from-pos-y" if spec["half"] == "ypos" else "from-neg-y"
    renders += common.render_views(scene, CAPTURES, spec["pid"], c, scale, [lateral, "from-neg-x", "from-pos-z"])
common.write_json(CAPTURES / "renders.json", {"note": "Capturas privadas; la pieza en naranja, contexto del mismo semiespacio en gris. No validan anatomía.", "renders": renders})
print(json.dumps({"assigned": assigned, "remainder": remainder, "sum": total, "pilot": comparison, "fibula": fibula_candidates}, indent=1))
