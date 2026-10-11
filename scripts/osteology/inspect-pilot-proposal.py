"""Private proposal inspection; all labels are hypotheses, never bone admission."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
source = root / "workbench/segmentation/feline/exports/proposal-c540990410e973539ef2f4ad00226cde7d57d1dfd16b2eb09032659c9a91d355.glb"
output = root / "workbench/segmentation/feline/pilot"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
counts = {}
for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    counts[obj.name] = len(obj.data.polygons)
    material = bpy.data.materials.new(obj.name + "-private-review")
    colors = {"proposal-humeral-shaft-surface": (.15,.45,.85,1), "proposal-femoral-shaft-surface": (.85,.45,.1,1), "proposal-tibial-shaft-surface": (.2,.75,.45,1)}
    material.diffuse_color = colors.get(obj.name, (.55,.55,.55,1))
    obj.data.materials.clear()
    obj.data.materials.append(material)
    obj["identityStatus"] = "proposal_not_approved"
assert sum(counts.values()) == 74235
scene = bpy.context.scene
scene["scientificReview"] = "pending"
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.light = "STUDIO"
scene.display.shading.show_cavity = True
scene.world = bpy.data.worlds.new("proposal-world")
scene.world.color = (.07,.07,.07)
scene.render.resolution_x = 1400
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = "ORTHO"
camera.data.ortho_scale = 14.5
scene.camera = camera
center = Vector((-.4,0,2.8))
for axis, direction in [("y",Vector((0,-1,0))), ("z",Vector((0,0,1)))]:
    camera.location = center + direction * 30
    camera.rotation_euler = (center-camera.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath = str(output / f"private-proposals-{axis}.png")
    bpy.ops.render.render(write_still=True)
target = output / "private-surface-pilot.blend"
if target.exists():
    raise RuntimeError("Existing pilot preserved")
bpy.ops.wm.save_as_mainfile(filepath=str(target))
bpy.ops.wm.open_mainfile(filepath=str(target))
assert sum(len(obj.data.polygons) for obj in bpy.context.scene.objects if obj.type == "MESH") == 74235
(output / "inspection.json").write_text(json.dumps({"nodeFaces":counts,"sourceTrianglesRetained":74235,"newAnatomyGenerated":False,"anatomicallyAcceptedBones":0,"previewOnly":True,"savedAndReopened":True},indent=2)+"\n",encoding="utf-8")
print(json.dumps(counts))
