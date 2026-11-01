"""Derivado web medido del cráneo canino Zenodo 10327538 (agancz, CC BY 4.0).

Lee solo la copia de trabajo en workbench/processing/canine/zenodo-10327538/source/,
nunca workbench/incoming/. Une los fragmentos GLES (división por límite de vértices,
sin significado anatómico), suelda vértices duplicados, decima por colapso hasta un
objetivo de triángulos y mide la desviación superficial frente a la malla soldada
de origen. No cambia escala, orientación ni material; no genera ni separa anatomía.

Uso (desde la raíz del repo):
  blender.exe --background --factory-startup --python-exit-code 1 \
    --python scripts/anatomy/derive-zenodo-dog-skull.py -- --target 200000
"""
import bmesh
import bpy
import hashlib
import json
import sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

root = Path(__file__).resolve().parents[2]
base = root / "workbench/processing/canine/zenodo-10327538"
source = base / "source/ebb0f8bf169745b4a3757abac29694c0.glb"
SOURCE_SHA256 = "2fbe3164a2aa0734cee4ce6309a834575ae162e45532ecd0804fef5ee7163ea1"
NODE_NAME = "agancz_dog_skull_scan"
WELD_DISTANCE = 1e-6  # unidades fuente; solo duplicados prácticamente coincidentes

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
target = int(args[args.index("--target") + 1]) if "--target" in args else 200_000


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


if sha256(source) != SOURCE_SHA256:
    raise RuntimeError("La copia de trabajo no coincide con el original verificado")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source), merge_vertices=True)
meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if len(meshes) != 6:
    raise RuntimeError(f"Se esperaban 6 fragmentos GLES, hay {len(meshes)}")
source_tris = sum(len(p.vertices) - 2 for obj in meshes for p in obj.data.polygons)
if source_tris != 586_612:
    raise RuntimeError(f"Triángulos de origen inesperados: {source_tris}")
materials = {slot.material.name for obj in meshes for slot in obj.material_slots if slot.material}
if len(materials) != 1:
    raise RuntimeError(f"Se esperaba un solo material: {materials}")

bpy.ops.object.select_all(action="DESELECT")
for obj in meshes:
    obj.select_set(True)
active = meshes[0]
bpy.context.view_layer.objects.active = active
bpy.ops.object.join()
joined = bpy.context.view_layer.objects.active
joined.name = NODE_NAME
joined.data.name = NODE_NAME

bm = bmesh.new()
bm.from_mesh(joined.data)
before_weld = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=WELD_DISTANCE)
after_weld = len(bm.verts)
bm.to_mesh(joined.data)
bm.free()
joined.data.update()

# Componentes conexos: evidencia geométrica, no identificación anatómica.
bm = bmesh.new()
bm.from_mesh(joined.data)
bm.verts.ensure_lookup_table()
seen = set()
components = []
for start in bm.verts:
    if start.index in seen:
        continue
    stack = [start]
    seen.add(start.index)
    verts = []
    while stack:
        vert = stack.pop()
        verts.append(vert)
        for edge in vert.link_edges:
            other = edge.other_vert(vert)
            if other.index not in seen:
                seen.add(other.index)
                stack.append(other)
    faces = {face.index for vert in verts for face in vert.link_faces}
    lo = [min(v.co[i] for v in verts) for i in range(3)]
    hi = [max(v.co[i] for v in verts) for i in range(3)]
    components.append({"vertices": len(verts), "faces": len(faces), "min": lo, "max": hi})
components.sort(key=lambda c: -c["faces"])


def bvh_of(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    verts = [v.co.copy() for v in mesh.vertices]
    polys = [tuple(p.vertices) for p in mesh.polygons]
    tri_count = sum(len(p) - 2 for p in polys)
    evaluated.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys, all_triangles=False), verts, tri_count


bvh_source, verts_source, welded_tris = bvh_of(joined)
corners = [joined.matrix_world @ Vector(c) for c in joined.bound_box]
diag = (Vector([max(c[i] for c in corners) for i in range(3)]) - Vector([min(c[i] for c in corners) for i in range(3)])).length

modifier = joined.modifiers.new("decimate", "DECIMATE")
modifier.decimate_type = "COLLAPSE"
modifier.ratio = target / welded_tris
modifier.use_collapse_triangulate = True
bvh_derived, verts_derived, derived_tris = bvh_of(joined)


def stats(points, tree):
    distances = sorted(tree.find_nearest(p)[3] for p in points)
    n = len(distances)
    return {
        "samples": n,
        "mean": sum(distances) / n,
        "p95": distances[int(0.95 * (n - 1))],
        "p99": distances[int(0.99 * (n - 1))],
        "max": distances[-1],
    }


forward = stats(verts_derived, bvh_source)   # derivado -> superficie original
backward = stats(verts_source, bvh_derived)  # original -> superficie derivada

bpy.context.view_layer.objects.active = joined
bpy.ops.object.modifier_apply(modifier=modifier.name)
# Las normales personalizadas importadas no sobreviven de forma fiable al colapso:
# se eliminan y se usa sombreado suave calculado por Blender.
with bpy.context.temp_override(object=joined, active_object=joined, selected_objects=[joined]):
    if joined.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    bpy.ops.object.shade_smooth()

out = base / f"derived/agancz-dog-skull-{target}.glb"
if out.exists():
    raise RuntimeError(f"No se sobrescribe {out}")
bpy.ops.export_scene.gltf(
    filepath=str(out), export_format="GLB", export_image_format="AUTO",
    export_texcoords=True, export_normals=True, export_materials="EXPORT",
    export_extras=False, export_yup=True, export_apply=False, export_draco_mesh_compression_enable=False,
)

# Verificación por reapertura del GLB exportado.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(out))
reopened = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if len(reopened) != 1 or reopened[0].name != NODE_NAME:
    raise RuntimeError(f"Reapertura inesperada: {[o.name for o in reopened]}")
reopened_tris = sum(len(p.vertices) - 2 for p in reopened[0].data.polygons)

report = {
    "source": source.relative_to(root).as_posix(), "sourceSha256": SOURCE_SHA256,
    "blender": bpy.app.version_string, "target": target,
    "sourceTriangles": source_tris, "weldedTriangles": welded_tris,
    "verticesBeforeWeld": before_weld, "verticesAfterWeld": after_weld, "weldDistance": WELD_DISTANCE,
    "connectedComponents": len(components), "largestComponents": components[:8],
    "decimateRatio": target / welded_tris, "derivedTriangles": derived_tris, "reopenedTriangles": reopened_tris,
    "bboxDiagonalSourceUnits": diag,
    "deviationSourceUnits": {"derivedToSource": forward, "sourceToDerived": backward},
    "deviationRelativeToDiagonal": {
        "derivedToSource": {k: v / diag for k, v in forward.items() if k != "samples"},
        "sourceToDerived": {k: v / diag for k, v in backward.items() if k != "samples"},
    },
    "output": out.relative_to(root).as_posix(), "outputSha256": sha256(out), "outputBytes": out.stat().st_size,
    "reviewStatus": "pending",
}
(base / f"derived/agancz-dog-skull-{target}.report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({k: v for k, v in report.items() if k != "largestComponents"}, indent=2))
