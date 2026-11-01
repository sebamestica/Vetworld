"""Mapa rotulado de componentes (índice cNN) sobre cada pieza canina; render privado de inspección.

Ejecutar: blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/render-canine-labels.py
Abre la escena guardada sin modificarla en disco (no se vuelve a guardar).
"""
import bpy
import sys
from pathlib import Path
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from canine_stl import PIECES  # noqa: E402

root = Path(__file__).resolve().parents[2]
scene_file = root / "workbench/masters/candidates/canine/canine_private_components.blend"
out = root / "workbench/inspection/canine-oct31/labels"
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(scene_file))
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "OBJECT"
if scene.world is None:
    scene.world = bpy.data.worlds.new("labels-world")
scene.world.color = (0.08, 0.08, 0.08)
camera_data = bpy.data.cameras.new("labels-camera")
camera_data.type = "ORTHO"
camera = bpy.data.objects.new("labels-camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
meshes = [obj for obj in scene.objects if obj.type == "MESH"]
VIEWS = {"top-z": (Vector((0, 0, 1)), 0, 1), "side-x": (Vector((1, 0, 0)), 1, 2), "front-y": (Vector((0, -1, 0)), 0, 2)}

for piece_id, _ in PIECES:
    objects = [obj for obj in meshes if obj.get("pieceId") == piece_id]
    for obj in meshes:
        obj.hide_render = obj not in objects
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    lower = Vector([min(p[i] for p in points) for i in range(3)])
    upper = Vector([max(p[i] for p in points) for i in range(3)])
    center, extent = (lower + upper) / 2, upper - lower
    for view, (direction, horizontal, vertical) in VIEWS.items():
        labels = []
        size = max(extent[horizontal], extent[vertical]) * 0.018
        up = Vector((0, 0, 0))
        up[vertical] = 1
        forward = -direction
        right = forward.cross(up).normalized()
        true_up = right.cross(forward).normalized()
        rotation = Matrix(((right.x, true_up.x, -forward.x), (right.y, true_up.y, -forward.y), (right.z, true_up.z, -forward.z))).to_4x4()
        for obj in objects:
            box = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
            c = sum(box, Vector()) / 8
            curve = bpy.data.curves.new(f"label-{obj.name}-{view}", "FONT")
            curve.body = f"c{obj['componentRank']:02d}"
            curve.size = size
            curve.align_x = "CENTER"
            text = bpy.data.objects.new(curve.name, curve)
            scene.collection.objects.link(text)
            text.matrix_world = Matrix.Translation(c + direction * (extent.length + 1)) @ rotation
            text.color = (1, 1, 1, 1)
            labels.append(text)
        distance = extent.length * 3 + 2
        camera.location = center + direction * distance
        camera.matrix_world = Matrix.Translation(camera.location) @ rotation
        camera_data.ortho_scale = max(extent[horizontal], extent[vertical]) * 1.1
        camera_data.clip_start = distance * 0.01
        camera_data.clip_end = distance * 4
        scene.render.resolution_x = scene.render.resolution_y = 2400
        scene.render.filepath = str(out / f"{piece_id}-labels-{view}.png")
        bpy.ops.render.render(write_still=True)
        for text in labels:
            bpy.data.objects.remove(text)
print("labels-done")
