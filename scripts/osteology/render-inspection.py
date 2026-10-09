"""Private geometry previews; never anatomical validation or publication."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
folder = root / "workbench/inspection/user-models"
if "--masters" in sys.argv:
    reports = [json.loads((root / f"workbench/masters/candidates/{species}-report.json").read_text(encoding="utf-8")) for species in ("canine", "feline")]
else:
    reports = json.loads((folder / "inspection.json").read_text(encoding="utf-8"))
for report in reports:
    bpy.ops.wm.open_mainfile(filepath=str(root / report["scene"]))
    scene = bpy.context.scene
    points = [obj.matrix_world @ Vector(corner) for obj in scene.objects if obj.type == "MESH" for corner in obj.bound_box]
    lower = Vector(tuple(min(point[axis] for point in points) for axis in range(3)))
    upper = Vector(tuple(max(point[axis] for point in points) for axis in range(3)))
    center = (lower + upper) / 2
    extent = max(upper - lower)
    data = bpy.data.cameras.new("inspection-camera")
    camera = bpy.data.objects.new("inspection-camera", data)
    scene.collection.objects.link(camera)
    camera.location = center + Vector((1.3, -1.8, 1.1)) * extent
    camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
    data.type = "ORTHO"
    data.ortho_scale = extent * 1.45
    data.clip_start = max(extent * 0.0001, 0.00001)
    data.clip_end = extent * 20
    scene.camera = camera
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "SINGLE"
    scene.display.shading.single_color = (0.72, 0.68, 0.58)
    scene.display.shading.background_type = "WORLD"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("inspection-world")
    scene.world.color = (0.025, 0.025, 0.03)
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(folder / (Path(report["scene"]).stem + ".png"))
    bpy.ops.render.render(write_still=True)
