"""Connectivity diagnostic on unchanged source geometry, including UV seam duplicates."""
import bpy
import json
from collections import defaultdict
from pathlib import Path

root = Path(__file__).resolve().parents[2]
folder = root / "workbench/segmentation/feline"
folder.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / "workbench/masters/candidates/feline_master.blend"))
mesh = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
vertices = [tuple(vertex.co) for vertex in mesh.data.vertices]
faces = [tuple(face.vertices) for face in mesh.data.polygons]
reports = []
for tolerance in (0, 1e-7, 1e-6, 1e-5):
    parent = list(range(len(vertices)))
    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index
    lookup = {}
    for index, point in enumerate(vertices):
        key = point if tolerance == 0 else tuple(round(value / tolerance) for value in point)
        if key in lookup:
            parent[find(index)] = find(lookup[key])
        else:
            lookup[key] = index
    for face in faces:
        first = find(face[0])
        for index in face[1:]:
            parent[find(index)] = first
    components = defaultdict(list)
    for index, face in enumerate(faces):
        components[find(face[0])].append(index)
    entries = []
    for indices in sorted(components.values(), key=len, reverse=True):
        points = [vertices[index] for face_index in indices for index in faces[face_index]]
        lower = [min(point[axis] for point in points) for axis in range(3)]
        upper = [max(point[axis] for point in points) for axis in range(3)]
        entries.append({"faceCount": len(indices), "boundsMin": lower, "boundsMax": upper, "faceIndices": indices})
    report = {"toleranceNative": tolerance, "componentCount": len(entries), "components": entries}
    (folder / f"connectivity-{tolerance}.json").write_text(json.dumps(report), encoding="utf-8")
    summary = {"toleranceNative": tolerance, "componentCount": len(entries), "largestFaceCounts": [entry["faceCount"] for entry in entries[:20]]}
    reports.append(summary)
    print(json.dumps(summary))
(folder / "diagnostic-summary.json").write_text(json.dumps({"source": "Tavernier GLB", "faces": len(faces), "vertices": len(vertices), "geometryModified": False, "reports": reports}, indent=2) + "\n", encoding="utf-8")
