"""Utilidades compartidas para la segmentación felina privada (Blender 4.5, numpy embebido).

Reglas: solo lectura de `feline_annotation.blend` y del GLB fuente; cualquier malla
creada aquí vive en memoria para renderizar o exportar a `workbench/`. No genera,
cierra ni repara superficies. Las coordenadas son de escena Blender tras importar el
glTF (conversión (x, -z, y) + transformación del nodo `chat`), no ejes anatómicos.
"""
import bpy
import hashlib
import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
ANNOTATION = ROOT / "workbench/segmentation/feline/feline_annotation.blend"
SOURCE = ROOT / "workbench/processing/feline/cat-skeleton/source/Chat.glb"
SOURCE_SHA256 = "c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783"
TRIANGLES = 74235


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def rel(path):
    return Path(path).resolve().relative_to(ROOT).as_posix()


def load_annotation():
    """Devuelve posiciones mundo (V,3) y triángulos (F,3) ordenados por source_face_index."""
    if sha256(SOURCE) != SOURCE_SHA256:
        raise RuntimeError("GLB fuente alterado o distinto")
    bpy.ops.wm.open_mainfile(filepath=str(ANNOTATION))
    obj = next(o for o in bpy.context.scene.objects if o.type == "MESH")
    if obj.get("sourceSha256") != SOURCE_SHA256:
        raise RuntimeError("Anotación de otra versión del archivo")
    mesh = obj.data
    nv, nf = len(mesh.vertices), len(mesh.polygons)
    if nf != TRIANGLES:
        raise RuntimeError(f"Conteo inesperado {nf}")
    co = np.empty(nv * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    matrix = np.array(obj.matrix_world, dtype=np.float64)
    world = co @ matrix[:3, :3].T + matrix[:3, 3]
    totals = np.empty(nf, dtype=np.int32)
    starts = np.empty(nf, dtype=np.int32)
    mesh.polygons.foreach_get("loop_total", totals)
    mesh.polygons.foreach_get("loop_start", starts)
    if not (totals == 3).all():
        raise RuntimeError("Se esperaban solo triángulos")
    loops = np.empty(len(mesh.loops), dtype=np.int32)
    mesh.loops.foreach_get("vertex_index", loops)
    tris = np.stack([loops[starts], loops[starts + 1], loops[starts + 2]], axis=1)
    source_index = np.empty(nf, dtype=np.int32)
    mesh.attributes["source_face_index"].data.foreach_get("value", source_index)
    if not np.array_equal(np.sort(source_index), np.arange(nf)):
        raise RuntimeError("source_face_index no es una permutación completa")
    order = np.argsort(source_index)
    return world, tris[order]


class Topology:
    """Conectividad virtual por posiciones idénticas (sin editar geometría)."""

    def __init__(self, world, tris):
        self.world, self.tris = world, tris
        _, welded = np.unique(world, axis=0, return_inverse=True)
        welded = welded.reshape(-1)
        self.welded = welded
        wt = welded[tris]
        v0, v1, v2 = world[tris[:, 0]], world[tris[:, 1]], world[tris[:, 2]]
        cross = np.cross(v1 - v0, v2 - v0)
        norm = np.linalg.norm(cross, axis=1)
        self.area = norm / 2
        self.normal = cross / np.where(norm > 0, norm, 1)[:, None]
        self.centroid = (v0 + v1 + v2) / 3
        nf = len(tris)
        edges = np.concatenate([wt[:, [0, 1]], wt[:, [1, 2]], wt[:, [2, 0]]])
        edges.sort(axis=1)
        faces = np.concatenate([np.arange(nf)] * 3)
        key = edges[:, 0].astype(np.int64) * (welded.max() + 1) + edges[:, 1]
        order = np.argsort(key, kind="stable")
        key, faces = key[order], faces[order]
        unique, start, counts = np.unique(key, return_index=True, return_counts=True)
        two = counts == 2
        self.pairs = np.stack([faces[start[two]], faces[start[two] + 1]], axis=1)
        self.nonmanifold_edges = int((counts > 2).sum())
        self.boundary_edges = int((counts == 1).sum())
        cosine = np.clip((self.normal[self.pairs[:, 0]] * self.normal[self.pairs[:, 1]]).sum(1), -1, 1)
        self.dihedral = np.degrees(np.arccos(cosine))
        # Curvatura discreta aproximada: media del ángulo diedro de las aristas de la cara.
        acc = np.zeros(nf)
        cnt = np.zeros(nf)
        np.add.at(acc, self.pairs[:, 0], self.dihedral)
        np.add.at(acc, self.pairs[:, 1], self.dihedral)
        np.add.at(cnt, self.pairs[:, 0], 1)
        np.add.at(cnt, self.pairs[:, 1], 1)
        self.face_dihedral = np.where(cnt > 0, acc / np.maximum(cnt, 1), 0)

    def components(self, mask, max_dihedral=None):
        """Etiquetas de componentes conectados restringidos a `mask` (-1 fuera)."""
        nf = len(self.tris)
        pairs = self.pairs[mask[self.pairs[:, 0]] & mask[self.pairs[:, 1]]]
        if max_dihedral is not None:
            keep = self.dihedral[mask[self.pairs[:, 0]] & mask[self.pairs[:, 1]]] <= max_dihedral
            pairs = pairs[keep]
        labels = np.arange(nf)
        while True:
            lo = np.minimum(labels[pairs[:, 0]], labels[pairs[:, 1]])
            before = labels.copy()
            np.minimum.at(labels, pairs[:, 0], lo)
            np.minimum.at(labels, pairs[:, 1], lo)
            labels = labels[labels]
            if np.array_equal(before, labels):
                break
        return np.where(mask, labels, -1)

    def component_of(self, mask, seed, max_dihedral=None):
        labels = self.components(mask, max_dihedral)
        candidates = np.flatnonzero(mask)
        if not len(candidates):
            raise RuntimeError("ROI vacía")
        distance = np.linalg.norm(self.centroid[candidates] - np.asarray(seed), axis=1)
        nearest = candidates[np.argmin(distance)]
        return labels == labels[nearest], float(distance.min())

    def boundary_dihedral(self, region):
        """Ángulos diedros en aristas internas y en el borde de una región."""
        a, b = region[self.pairs[:, 0]], region[self.pairs[:, 1]]
        inner = self.dihedral[a & b]
        border = self.dihedral[a ^ b]
        stat = lambda v: None if not len(v) else {"n": int(len(v)), "median": round(float(np.median(v)), 2), "p90": round(float(np.percentile(v, 90)), 2)}
        return {"inner": stat(inner), "border": stat(border)}


def box_mask(centroid, lo, hi):
    lo, hi = np.asarray(lo, dtype=float), np.asarray(hi, dtype=float)
    return np.all((centroid >= lo) & (centroid <= hi), axis=1)


def principal_axis(points, weights):
    center = np.average(points, axis=0, weights=weights)
    cov = np.cov((points - center).T, aweights=weights)
    values, vectors = np.linalg.eigh(cov)
    axis = vectors[:, -1]
    return center, axis / np.linalg.norm(axis), values[::-1]


def section_profile(topo, region, bins=24):
    """Perfil de radio a lo largo del eje principal (diagnóstico de diáfisis/ensanchamiento)."""
    idx = np.flatnonzero(region)
    pts = topo.centroid[idx]
    center, axis, values = principal_axis(pts, topo.area[idx])
    t = (pts - center) @ axis
    radial = np.linalg.norm((pts - center) - np.outer(t, axis), axis=1)
    edges = np.linspace(t.min(), t.max(), bins + 1)
    which = np.clip(np.digitize(t, edges) - 1, 0, bins - 1)
    radius = [float(np.median(radial[which == k])) if (which == k).any() else None for k in range(bins)]
    return {"center": center, "axis": axis, "t": t, "edges": edges, "radius": radius, "index": idx, "eigen": values}


# ---------- Escena de render (solo memoria) ----------

def fresh_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "BOTH"
    scene.display.shading.background_type = "WORLD"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("inspection-world")
    scene.world.color = (.08, .08, .08)
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene["scientificReview"] = "pending"
    return scene


def mesh_from_faces(name, world, tris, faces, color):
    faces = np.asarray(faces)
    used, inverse = np.unique(tris[faces].reshape(-1), return_inverse=True)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(world[used].tolist(), [], inverse.reshape(-1, 3).tolist())
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    material = bpy.data.materials.new(name + "-inspection")
    material.diffuse_color = color
    mesh.materials.append(material)
    return obj


# Rotaciones de cámara explícitas; los ejes de pantalla se registran en cada informe.
VIEWS = {
    "from-neg-y": (math.radians(90), 0, 0),
    "from-pos-y": (math.radians(90), 0, math.radians(180)),
    "from-pos-z": (0, 0, 0),
    "from-neg-z": (math.radians(180), 0, 0),
    "from-neg-x": (math.radians(90), 0, math.radians(-90)),
    "from-pos-x": (math.radians(90), 0, math.radians(90)),
}


def render_views(scene, folder, prefix, center, scale, views):
    folder.mkdir(parents=True, exist_ok=True)
    camera = scene.camera
    if camera is None:
        data = bpy.data.cameras.new("inspection-camera")
        camera = bpy.data.objects.new("inspection-camera", data)
        scene.collection.objects.link(camera)
        scene.camera = camera
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = scale
    camera.data.clip_start = 0.01
    camera.data.clip_end = 200
    records = []
    for view in views:
        camera.rotation_euler = VIEWS[view]
        bpy.context.view_layer.update()
        rotation = camera.matrix_world.to_3x3()
        right, up, back = rotation.col[0], rotation.col[1], rotation.col[2]
        camera.location = tuple(np.asarray(center) + np.array(back) * 40)
        bpy.context.view_layer.update()
        path = folder / f"{prefix}-{view}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        records.append({"file": rel(path), "view": view, "center": [round(float(c), 4) for c in center],
                        "orthoScale": scale, "pixels": [scene.render.resolution_x, scene.render.resolution_y],
                        "screenRight": [round(float(c), 4) for c in right], "screenUp": [round(float(c), 4) for c in up]})
    return records


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def add_grid(plane, depth, lo, hi, step=0.5, label_size=0.09):
    """Retícula de referencia SOLO para render (objetos separados, no parte de la malla).

    plane: "xz" (vistas laterales), "xy" (dorsal/ventral) o "yz" (craneal/caudal).
    depth: coordenada del eje restante donde se coloca la retícula (detrás de la malla).
    """
    material = bpy.data.materials.new("grid-reference")
    material.diffuse_color = (.95, .85, .2, 1)
    axes = {"xz": (0, 2, 1), "xy": (0, 1, 2), "yz": (1, 2, 0)}[plane]
    a, b, c = axes
    names = "xyz"
    thickness = step * 0.012
    def bar(p0, p1):
        center = [(p0[i] + p1[i]) / 2 for i in range(3)]
        size = [max(abs(p1[i] - p0[i]), thickness) for i in range(3)]
        size[c] = thickness
        bpy.ops.mesh.primitive_cube_add(size=1, location=center)
        obj = bpy.context.object
        obj.scale = [s for s in size]
        obj.data.materials.append(material)
        obj["renderOnlyReference"] = True
    va = np.arange(np.floor(lo[a] / step) * step, hi[a] + 1e-9, step)
    vb = np.arange(np.floor(lo[b] / step) * step, hi[b] + 1e-9, step)
    for value in va:
        p0 = [0, 0, 0]; p1 = [0, 0, 0]
        p0[a] = p1[a] = value; p0[b] = vb[0]; p1[b] = vb[-1]; p0[c] = p1[c] = depth
        bar(p0, p1)
        text_at({a: value, b: vb[0] - step * 0.35, c: depth}, f"{names[a]}={value:g}", label_size, material, plane)
    for value in vb:
        p0 = [0, 0, 0]; p1 = [0, 0, 0]
        p0[b] = p1[b] = value; p0[a] = va[0]; p1[a] = va[-1]; p0[c] = p1[c] = depth
        bar(p0, p1)
        text_at({a: va[0] - step * 0.9, b: value, c: depth}, f"{names[b]}={value:g}", label_size, material, plane)


def text_at(coords, body, size, material, plane):
    curve = bpy.data.curves.new("label", type="FONT")
    curve.body = body
    curve.size = size
    obj = bpy.data.objects.new("label", curve)
    obj.location = (coords[0], coords[1], coords[2])
    obj.rotation_euler = {"xz": (math.radians(90), 0, 0), "xy": (0, 0, 0), "yz": (math.radians(90), 0, math.radians(90))}[plane]
    curve.materials.append(material)
    obj["renderOnlyReference"] = True
    bpy.context.scene.collection.objects.link(obj)


def clear_references():
    for obj in list(bpy.context.scene.objects):
        if obj.get("renderOnlyReference"):
            bpy.data.objects.remove(obj, do_unlink=True)
