"""Diagnóstico privado de los 4 STL caninos (3DExport 285869), sin modificar geometría.

Ejecutar desde la raíz del repo: python3 -I scripts/osteology/diagnose-canine.py
Lee únicamente workbench/incoming/canine/originals (solo lectura) y escribe:
- workbench/processing/canine/diagnostics/*.json (listas de caras por componente, privadas)
- data/osteology/diagnostics/canine.json (resumen sin geometría)
Los componentes conectados son islas geométricas, no huesos identificados.
"""
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from canine_stl import EXPECTED_SHA256, PIECES, read_binary_stl, sha256  # noqa: E402

root = Path(__file__).resolve().parents[2]
originals = root / "workbench/incoming/canine/originals"
private = root / "workbench/processing/canine/diagnostics"
private.mkdir(parents=True, exist_ok=True)
summary_target = root / "data/osteology/diagnostics/canine.json"
TOLERANCES = (0, 1e-6, 1e-5)


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def key_of(point, tolerance):
    return point if tolerance == 0 else tuple(round(value / tolerance) for value in point)


def components_for(triangles, tolerance):
    parent = {}

    def find(item):
        parent.setdefault(item, item)
        while parent[item] != item:
            parent[item] = parent[parent[item]]
            item = parent[item]
        return item

    for triangle in triangles:
        keys = [key_of(point, tolerance) for point in triangle]
        first = find(keys[0])
        for other in keys[1:]:
            root_other = find(other)
            if root_other != first:
                parent[root_other] = first
    groups = defaultdict(list)
    for index, triangle in enumerate(triangles):
        groups[find(key_of(triangle[0], tolerance))].append(index)
    return sorted(groups.values(), key=lambda faces: (-len(faces), faces[0]))


def bounds(points):
    lower = [min(point[axis] for point in points) for axis in range(3)]
    upper = [max(point[axis] for point in points) for axis in range(3)]
    return lower, upper


def edge_stats(triangles, faces):
    """Aristas por coordenadas exactas: borde (1 cara), variedad (2), no variedad (>2) y orientación."""
    directed = defaultdict(int)
    undirected = defaultdict(int)
    for index in faces:
        a, b, c = triangles[index]
        for start, end in ((a, b), (b, c), (c, a)):
            if start == end:
                continue
            directed[(start, end)] += 1
            undirected[frozenset((start, end))] += 1
    boundary = sum(1 for count in undirected.values() if count == 1)
    manifold = sum(1 for count in undirected.values() if count == 2)
    non_manifold = sum(1 for count in undirected.values() if count > 2)
    inconsistent = 0
    for edge, count in undirected.items():
        if count == 2 and len(edge) == 2:
            start, end = tuple(edge)
            if directed.get((start, end), 0) != 1 or directed.get((end, start), 0) != 1:
                inconsistent += 1
    return {"edges": len(undirected), "boundaryEdges": boundary, "manifoldEdges": manifold, "nonManifoldEdges": non_manifold, "inconsistentlyOrientedManifoldEdges": inconsistent}


PLANE_TOLERANCE = 0.05
PLANE_NORMAL_ALIGNMENT = 0.99


def planar_sections(triangles, components, lower, upper):
    """Triángulos coplanares con un plano de la caja envolvente (posibles cortes o bases de impresión)."""
    owner = {}
    for rank, faces in enumerate(components):
        for index in faces:
            owner[index] = rank
    sections = []
    for axis in range(3):
        for label, value in (("min", lower[axis]), ("max", upper[axis])):
            faces, area = [], 0.0
            for index, triangle in enumerate(triangles):
                if all(abs(point[axis] - value) <= PLANE_TOLERANCE for point in triangle):
                    a, b, c = triangle
                    n = cross(sub(b, a), sub(c, a))
                    length = math.sqrt(dot(n, n))
                    if length > 0 and abs(n[axis]) / length > PLANE_NORMAL_ALIGNMENT:
                        faces.append(index)
                        area += length / 2
            if faces:
                sections.append({"axis": "xyz"[axis], "side": label, "planeValue": value, "faceCount": len(faces),
                                 "area": area, "componentRanks": sorted({owner[i] for i in faces})})
    return sections


def piece_report(piece_id, file):
    digest = sha256(file)
    if digest != EXPECTED_SHA256[file.name]:
        raise RuntimeError(f"SHA-256 distinto del recibo para {file.name}: {digest}")
    stl = read_binary_stl(file)
    triangles, normals = stl["triangles"], stl["normals"]
    degenerate_repeated, degenerate_zero_area = [], []
    seen, duplicates = {}, []
    stored_zero = agree = disagree = 0
    areas = []
    for index, (triangle, stored) in enumerate(zip(triangles, normals)):
        a, b, c = triangle
        n = cross(sub(b, a), sub(c, a))
        length = math.sqrt(dot(n, n))
        areas.append(length / 2)
        if a == b or b == c or a == c:
            degenerate_repeated.append(index)
        elif length == 0:
            degenerate_zero_area.append(index)
        signature = tuple(sorted(triangle))
        if signature in seen:
            duplicates.append([seen[signature], index])
        else:
            seen[signature] = index
        if stored == (0.0, 0.0, 0.0):
            stored_zero += 1
        elif length > 0:
            if dot(n, stored) > 0:
                agree += 1
            else:
                disagree += 1
    unique_vertices = {point for triangle in triangles for point in triangle}
    lower, upper = bounds(unique_vertices)
    reports = []
    tol0 = None
    for tolerance in TOLERANCES:
        groups = components_for(triangles, tolerance)
        entries = []
        for rank, faces in enumerate(groups):
            points = [point for index in faces for point in triangles[index]]
            c_lower, c_upper = bounds(points)
            entry = {"rank": rank, "faceCount": len(faces), "boundsMin": c_lower, "boundsMax": c_upper,
                     "extent": [c_upper[axis] - c_lower[axis] for axis in range(3)]}
            if tolerance == 0:
                stats = edge_stats(triangles, faces)
                volume = sum(dot(triangles[i][0], cross(triangles[i][1], triangles[i][2])) for i in faces) / 6
                entry.update({
                    "surfaceArea": sum(areas[i] for i in faces), "signedVolume": volume,
                    "closed": stats["boundaryEdges"] == 0 and stats["nonManifoldEdges"] == 0,
                    **stats,
                })
            entries.append((entry, faces))
        (private / f"{piece_id}-components-tol-{tolerance}.json").write_text(json.dumps({
            "piece": piece_id, "sourceFile": file.relative_to(root).as_posix(), "sourceSha256": digest,
            "toleranceNative": tolerance, "componentCount": len(entries),
            "components": [{**entry, "faceIndices": faces} for entry, faces in entries],
        }), encoding="utf-8")
        reports.append({"toleranceNative": tolerance, "componentCount": len(entries),
                        "largestFaceCounts": [entry["faceCount"] for entry, _ in entries[:20]]})
        if tolerance == 0:
            tol0 = entries
    totals = edge_stats(triangles, range(len(triangles)))
    sections = planar_sections(triangles, [faces for _, faces in tol0], lower, upper)
    return {
        "pieceId": piece_id,
        "sourceFile": file.relative_to(root).as_posix(),
        "sourceSha256": digest,
        "bytes": file.stat().st_size,
        "format": "binary_stl",
        "headerAllZeroBytes": stl["header"] == bytes(80),
        "nonZeroAttributeWords": sum(1 for value in stl["attributes"] if value != 0),
        "triangles": stl["count"],
        "uniqueVertexPositions": len(unique_vertices),
        "boundsMin": lower, "boundsMax": upper,
        "extent": [upper[axis] - lower[axis] for axis in range(3)],
        "units": "unknown",
        "unitsEvidence": "STL binario sin unidades en el formato; cabecera de 80 bytes en cero; la página del producto no declara unidades (registro 2026-10-08).",
        "defects": {
            "degenerateRepeatedVertex": len(degenerate_repeated),
            "degenerateZeroAreaDistinctVertices": len(degenerate_zero_area),
            "duplicateTrianglePairs": len(duplicates),
            "storedNormalZero": stored_zero,
            "storedNormalAgreesWithWinding": agree,
            "storedNormalOpposesWinding": disagree,
            **totals,
        },
        "degenerateFaceIndices": degenerate_repeated + degenerate_zero_area,
        "duplicateFacePairs": duplicates,
        "connectivity": reports,
        "totalSurfaceArea": sum(areas),
        "planarSectionsOnBoundingPlanes": {"distanceTolerance": PLANE_TOLERANCE, "normalAlignment": PLANE_NORMAL_ALIGNMENT, "sections": sections},
        "componentsTolerance0": [entry for entry, _ in tol0],
        "_tol0Faces": [faces for _, faces in tol0],
    }


def nearest_between(points_a, points_b, cell):
    grid = defaultdict(list)
    for point in points_b:
        grid[tuple(math.floor(value / cell) for value in point)].append(point)
    best = math.inf
    for point in points_a:
        base = tuple(math.floor(value / cell) for value in point)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    for other in grid.get((base[0] + dx, base[1] + dy, base[2] + dz), ()):
                        distance = math.dist(point, other)
                        if distance < best:
                            best = distance
    return best


def box_gap(a, b):
    gaps = [max(0.0, max(a["boundsMin"][axis], b["boundsMin"][axis]) - min(a["boundsMax"][axis], b["boundsMax"][axis])) for axis in range(3)]
    return math.sqrt(sum(value * value for value in gaps))


def main():
    pieces = []
    triangles_by_piece = {}
    for piece_id, name in PIECES:
        file = originals / name
        report = piece_report(piece_id, file)
        triangles_by_piece[piece_id] = read_binary_stl(file)["triangles"]
        pieces.append(report)
        print(json.dumps({"piece": piece_id, "triangles": report["triangles"], "components": [r["componentCount"] for r in report["connectivity"]]}))
    # Distancias entre piezas: caja envolvente y vértice más cercano (búsqueda por rejilla de 1 unidad fuente).
    pairs = []
    for i in range(len(pieces)):
        for j in range(i + 1, len(pieces)):
            a, b = pieces[i], pieces[j]
            gap = box_gap(a, b)
            points_a = {p for t in triangles_by_piece[a["pieceId"]] for p in t}
            points_b = {p for t in triangles_by_piece[b["pieceId"]] for p in t}
            near = nearest_between(points_a, points_b, 1.0) if gap < 1.0 else None
            pairs.append({"pieceA": a["pieceId"], "pieceB": b["pieceId"], "boundingBoxGap": gap,
                          "nearestVertexDistanceWithin1Unit": near if near != math.inf else None,
                          "coincidentVertices": None if near is None else int(near == 0)})
    # Contactos entre componentes de la misma pieza (tolerancia 0): pares con vértices a <= 0,5 unidades fuente.
    for report in pieces:
        triangles = triangles_by_piece[report["pieceId"]]
        cell = 0.5
        owner = {}
        grid = defaultdict(list)
        for rank, faces in enumerate(report["_tol0Faces"]):
            for index in faces:
                for point in triangles[index]:
                    if point not in owner:
                        owner[point] = rank
                        grid[tuple(math.floor(value / cell) for value in point)].append(point)
        contacts = {}
        for point, rank in owner.items():
            base = tuple(math.floor(value / cell) for value in point)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for dz in (-1, 0, 1):
                        for other in grid.get((base[0] + dx, base[1] + dy, base[2] + dz), ()):
                            other_rank = owner[other]
                            if other_rank <= rank:
                                continue
                            distance = math.dist(point, other)
                            if distance <= cell:
                                pair = (rank, other_rank)
                                if distance < contacts.get(pair, math.inf):
                                    contacts[pair] = distance
        report["componentProximityTolerance0"] = {
            "maxDistanceNative": cell,
            "pairs": [{"a": a, "b": b, "nearestVertexDistance": d} for (a, b), d in sorted(contacts.items())],
        }
        del report["_tol0Faces"]
    full = {"generatedBy": "scripts/osteology/diagnose-canine.py", "pieces": pieces, "interPiece": pairs}
    (private / "canine-diagnostic-full.json").write_text(json.dumps(full, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(pairs, indent=1))


if __name__ == "__main__":
    main()
