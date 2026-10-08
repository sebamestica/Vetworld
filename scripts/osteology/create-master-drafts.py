"""Run with Blender --background --factory-startup --python this_file.

Creates empty, explicitly blocked assembly workspaces, never skeleton geometry.
Existing masters are protected against accidental replacement.
"""
import bpy
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
destination = root / "workbench" / "masters" / "drafts"
destination.mkdir(parents=True, exist_ok=True)

for species in ("canine", "feline"):
    target = destination / f"{species}_master.blend"
    if target.exists():
        raise RuntimeError(f"Existing master preserved: {target}")
    inventory = json.loads((root / "data" / "osteology" / "reference" / f"{species}.json").read_text(encoding="utf-8"))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["speciesId"] = species
    scene["assemblyStatus"] = "draft_missing_authorized_geometry"
    scene["specimenStatus"] = "not_selected"
    scene["reviewStatus"] = "pending"
    scene["orientation"] = "+X right; -Y cranial; +Z dorsal"
    scene["referenceInventory"] = f"data/osteology/reference/{species}.json"
    for region in sorted({entry["regionId"] for entry in inventory["structures"]}):
        collection = bpy.data.collections.new(f"{species}:skeleton:{region}")
        collection["regionId"] = region
        collection["geometryStatus"] = "not_available"
        scene.collection.children.link(collection)
    bpy.ops.wm.save_as_mainfile(filepath=str(target))
    bpy.ops.wm.open_mainfile(filepath=str(target))
    assert len(bpy.data.objects) == 0, "Draft unexpectedly contains geometry"
    assert bpy.context.scene.unit_settings.scale_length == 1.0
    report = {
        "speciesId": species,
        "fileName": target.name,
        "status": bpy.context.scene["assemblyStatus"],
        "specimenId": None,
        "meshCount": 0,
        "unit": "metre",
        "orientation": bpy.context.scene["orientation"],
        "technicalCheck": "saved_and_reopened_in_blender",
        "anatomicalReview": "pending",
        "webExport": None,
    }
    (destination / f"{species}-draft-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))
