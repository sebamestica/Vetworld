"""Escena privada canina por componentes y renders de inspección (sin editar geometría fuente).

Ejecutar desde la raíz del repo:
  blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/build-canine-private-scene.py
Construye una malla por componente conectado (tolerancia 0, coordenadas exactas del STL) con el atributo
de cara `source_face_index` (índice del triángulo en el STL). No aplica escala, rotación ni traslación.
Guarda y reabre workbench/masters/candidates/canine/canine_private_components.blend.
Renders en workbench/inspection/canine-oct31/. Todo es privado (sin licencia web).
"""
import bpy
import colorsys
import json
import sys
from pathlib import Path
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from canine_stl import EXPECTED_SHA256, PIECES, read_binary_stl, sha256  # noqa: E402

root = Path(__file__).resolve().parents[2]
originals = root / "workbench/incoming/canine/originals"
diagnostics = root / "workbench/processing/canine/diagnostics"
target = root / "workbench/masters/candidates/canine/canine_private_components.blend"
renders = root / "workbench/inspection/canine-oct31"
for folder in (target.parent, renders / "pieces", renders / "components", renders / "sheets"):
    folder.mkdir(parents=True, exist_ok=True)
RENDERS_ONLY = "--renders-only" in sys.argv
if target.exists() and not RENDERS_ONLY:
    raise RuntimeError(f"Escena existente preservada: {target} (usar -- --renders-only para solo renderizar)")
if RENDERS_ONLY and not target.exists():
    raise RuntimeError("--renders-only requiere la escena guardada")


def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene["speciesDeclared"] = "canine"
    scene["assemblyStatus"] = "components_native_coordinates_not_registered"
    scene["anatomicalIdentity"] = "pending"
    scene["reviewStatus"] = "pending"
    scene["physicalScaleStatus"] = "unknown_no_conversion_applied"
    scene["orientationStatus"] = "source_print_layout_unverified"
    scene["licenseStatus"] = "private_no_web_license_3dexport_285869"
    scene["webAvailable"] = False
    expected_faces = {}

    for piece_id, name in PIECES:
        file = originals / name
        digest = sha256(file)
        if digest != EXPECTED_SHA256[name]:
            raise RuntimeError(f"Hash distinto: {name}")
        triangles = read_binary_stl(file)["triangles"]
        components = json.loads((diagnostics / f"{piece_id}-components-tol-0.json").read_text(encoding="utf-8"))
        if components["sourceSha256"] != digest:
            raise RuntimeError("Diagnóstico y fuente no coinciden")
        collection = bpy.data.collections.new(f"source:{piece_id}")
        scene.collection.children.link(collection)
        total = 0
        count = len(components["components"])
        for component in components["components"]:
            rank = component["rank"]
            vertices, lookup, faces = [], {}, []
            for face_index in component["faceIndices"]:
                triangle = triangles[face_index]
                degenerate = len(set(triangle)) < 3
                loop = []
                for point in triangle:
                    if degenerate or point not in lookup:
                        vertices.append(point)
                        if not degenerate:
                            lookup[point] = len(vertices) - 1
                        loop.append(len(vertices) - 1)
                    else:
                        loop.append(lookup[point])
                faces.append(loop)
            mesh = bpy.data.meshes.new(f"canine-{piece_id}-c{rank:02d}")
            mesh.from_pydata(vertices, [], faces)
            if len(mesh.polygons) != len(faces):
                raise RuntimeError(f"Caras perdidas en {mesh.name}: {len(mesh.polygons)} != {len(faces)}")
            attribute = mesh.attributes.new("source_face_index", "INT", "FACE")
            attribute.data.foreach_set("value", component["faceIndices"])
            obj = bpy.data.objects.new(mesh.name, mesh)
            collection.objects.link(obj)
            obj["sourceFile"] = file.relative_to(root).as_posix()
            obj["sourceSha256"] = digest
            obj["pieceId"] = piece_id
            obj["componentRank"] = rank
            obj["componentTolerance"] = 0
            obj["anatomicalIdentity"] = "pending"
            obj["side"] = "unknown"
            obj["reviewStatus"] = "pending"
            hue = (rank * 0.618034) % 1
            obj.color = (*colorsys.hsv_to_rgb(hue, 0.55, 0.95), 1)
            total += len(faces)
        expected_faces[piece_id] = (count, total)
        print(json.dumps({"piece": piece_id, "components": count, "faces": total}))

    bpy.ops.wm.save_as_mainfile(filepath=str(target))
    bpy.ops.wm.open_mainfile(filepath=str(target))
    scene = bpy.context.scene
    for piece_id, (count, total) in expected_faces.items():
        objects = [obj for obj in scene.objects if obj.get("pieceId") == piece_id]
        assert len(objects) == count, piece_id
        assert sum(len(obj.data.polygons) for obj in objects) == total, piece_id
        assert all(len(obj.data.attributes["source_face_index"].data) == len(obj.data.polygons) for obj in objects)
    print(json.dumps({"savedAndReopened": target.relative_to(root).as_posix(), "pieces": expected_faces}))



if RENDERS_ONLY:
    bpy.ops.wm.open_mainfile(filepath=str(target))
    scene = bpy.context.scene
    print(json.dumps({"reopenedForRenders": target.relative_to(root).as_posix(),
                      "meshes": sum(obj.type == "MESH" for obj in scene.objects),
                      "faces": sum(len(obj.data.polygons) for obj in scene.objects if obj.type == "MESH")}))
else:
    build_scene()
    scene = bpy.context.scene

# Renders (no se guardan en el .blend: la escena reabierta queda sin cámara añadida).
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "OBJECT"
scene.display.shading.show_cavity = True
if scene.world is None:
    scene.world = bpy.data.worlds.new("inspection-world")
scene.world.color = (0.08, 0.08, 0.08)
scene.render.resolution_percentage = 100
scene.render.use_stamp = True
scene.render.use_stamp_note = True
for flag in ("use_stamp_date", "use_stamp_time", "use_stamp_render_time", "use_stamp_frame", "use_stamp_scene",
             "use_stamp_camera", "use_stamp_filename", "use_stamp_memory", "use_stamp_hostname", "use_stamp_lens"):
    setattr(scene.render, flag, False)
scene.render.stamp_font_size = 14
camera_data = bpy.data.cameras.new("inspection-camera")
camera_data.type = "ORTHO"
camera = bpy.data.objects.new("inspection-camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
# Vistas en ejes de la fuente (no anatómicos): +Z de la fuente es la normal de la cama de impresión observada.
# Cada vista: dirección de la cámara desde el centro, eje horizontal y vertical de la imagen (índices x=0,y=1,z=2).
VIEWS = {"top-z": (Vector((0, 0, 1)), 0, 1), "front-y": (Vector((0, -1, 0)), 0, 2), "side-x": (Vector((1, 0, 0)), 1, 2)}
PIECE_VIEWS = dict(VIEWS, **{"bottom-z": (Vector((0, 0, -1)), 0, 1)})


def world_bounds(objects):
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    lower = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    upper = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return lower, upper


def shoot(objects, view, path, note, size=(720, 720)):
    lower, upper = world_bounds(objects)
    center, extent = (lower + upper) / 2, upper - lower
    direction, horizontal, vertical = PIECE_VIEWS[view]
    width, height = size
    h, v = abs(extent[horizontal]), abs(extent[vertical])
    span = max(h, v * width / height) if width >= height else max(h * height / width, v)
    camera_data.ortho_scale = max(span * 1.12, 1e-3)
    distance = extent.length * 2 + 1
    camera.location = center + direction * distance
    # Eje local Y de la cámara (arriba de la imagen) alineado con el eje vertical elegido.
    up = Vector((0, 0, 0))
    up[vertical] = 1
    forward = (center - camera.location).normalized()
    right = forward.cross(up).normalized()
    true_up = right.cross(forward).normalized()
    from mathutils import Matrix
    camera.matrix_world = Matrix((
        (right.x, true_up.x, -forward.x, camera.location.x),
        (right.y, true_up.y, -forward.y, camera.location.y),
        (right.z, true_up.z, -forward.z, camera.location.z),
        (0, 0, 0, 1)))
    camera_data.clip_start = distance * 0.01
    camera_data.clip_end = distance * 4
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.stamp_note_text = note
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


all_objects = [obj for obj in scene.objects if obj.type == "MESH"]
for obj in all_objects:
    obj.hide_render = False
shoot(all_objects, "top-z", renders / "pieces" / "all-pieces-top-z.png", "4 STL en coordenadas fuente (sin registro)", (1600, 1000))
for piece_id, _ in PIECES:
    objects = [obj for obj in all_objects if obj.get("pieceId") == piece_id]
    for obj in all_objects:
        obj.hide_render = obj not in objects
    for view in PIECE_VIEWS:
        shoot(objects, view, renders / "pieces" / f"{piece_id}-{view}.png", f"{piece_id} {view} colores=componente", (1400, 1400))
    for obj in objects:
        rank = obj["componentRank"]
        for other in objects:
            other.hide_render = other is not obj
        for view in VIEWS:
            shoot([obj], view, renders / "components" / f"{piece_id}-c{rank:02d}-{view}.png",
                  f"{piece_id} c{rank:02d} {len(obj.data.polygons)} caras {view}", (360, 360))
        # Contexto: componente resaltado sobre la pieza en gris.
        saved = {other.name: tuple(other.color) for other in objects}
        for other in objects:
            other.hide_render = False
            other.color = (0.45, 0.45, 0.45, 1) if other is not obj else (1, 0.15, 0.1, 1)
        shoot(objects, "top-z", renders / "components" / f"{piece_id}-c{rank:02d}-context-top-z.png",
              f"{piece_id} c{rank:02d} contexto", (360, 360))
        for other in objects:
            other.color = saved[other.name]
    for obj in all_objects:
        obj.hide_render = False

# Hojas de contacto: 4 imágenes por componente en una fila (contexto, top, front, side).
import numpy as np  # noqa: E402

for piece_id, _ in PIECES:
    ranks = sorted(obj["componentRank"] for obj in all_objects if obj.get("pieceId") == piece_id)
    for start in range(0, len(ranks), 8):
        chunk = ranks[start:start + 8]
        rows = []
        for rank in chunk:
            tiles = []
            for suffix in ("context-top-z", "top-z", "front-y", "side-x"):
                image = bpy.data.images.load(str(renders / "components" / f"{piece_id}-c{rank:02d}-{suffix}.png"))
                pixels = np.array(image.pixels[:], dtype=np.float32).reshape(image.size[1], image.size[0], 4)
                tiles.append(pixels)
                bpy.data.images.remove(image)
            rows.append(np.concatenate(tiles, axis=1))
        sheet = np.concatenate(rows[::-1], axis=0)
        height, width = sheet.shape[:2]
        output = bpy.data.images.new(f"sheet-{piece_id}-{start}", width=width, height=height, alpha=True)
        output.pixels.foreach_set(sheet.ravel())
        output.filepath_raw = str(renders / "sheets" / f"{piece_id}-c{chunk[0]:02d}-c{chunk[-1]:02d}.png")
        output.file_format = "PNG"
        output.save()
        bpy.data.images.remove(output)
print(json.dumps({"renders": renders.relative_to(root).as_posix()}))
