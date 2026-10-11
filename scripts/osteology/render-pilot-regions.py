"""Private close-ups of candidate regions; no inferred bone identity or geometry edits."""
import bpy
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
out = root / "workbench/segmentation/feline/pilot"
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / "workbench/segmentation/feline/feline_annotation.blend"))
mesh = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
material = bpy.data.materials.new("pilot-inspection-grey")
material.diffuse_color = (.65, .65, .65, 1)
mesh.data.materials.clear()
mesh.data.materials.append(material)
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.show_cavity = True
scene.world = bpy.data.worlds.new("pilot-world")
scene.world.color = (.07, .07, .07)
scene.render.resolution_x = 1200
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
bpy.ops.object.camera_add()
camera = bpy.context.object
scene.camera = camera
camera.data.type = "ORTHO"
for name, center, scale in [("forelimb", Vector((-2, 0, 2.7)), 4.5), ("hindlimb", Vector((3, 0, 2.8)), 5)]:
    for axis, direction in [("y", Vector((0,-1,0))), ("z", Vector((0,0,1)))]:
        camera.location = center + direction * 30
        camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
        camera.data.ortho_scale = scale
        scene.render.filepath = str(out / f"{name}-{axis}.png")
        bpy.ops.render.render(write_still=True)
