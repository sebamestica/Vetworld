"""Non-destructive candidate masters, with unverified identity and native scale."""
import bpy
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
destination = root / "workbench/masters/candidates"
destination.mkdir(parents=True, exist_ok=True)
for species in ("canine", "feline"):
    target = destination / f"{species}_master.blend"
    if target.exists():
        raise RuntimeError(f"Existing master preserved: {target}")
    files = sorted((root / "workbench/incoming/canine/originals").glob("*.stl")) if species == "canine" else [root / "workbench/processing/feline/cat-skeleton/source/Chat.glb"]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene["assemblyStatus"] = "candidate_import_native_coordinates"
    scene["anatomicalReview"] = "pending"
    scene["physicalScaleStatus"] = "unverified_no_conversion_applied"
    scene["orientationStatus"] = "source_preserved_unverified"
    scene["specimenStatus"] = "source_specimen_not_documented"
    scene["licenseStatus"] = "pending_file_provenance"
    scene["speciesDeclared"] = species
    scene["webAvailable"] = False
    for file in files:
        previous = set(scene.objects)
        if file.suffix == ".glb":
            bpy.ops.import_scene.gltf(filepath=str(file))
        else:
            bpy.ops.wm.stl_import(filepath=str(file))
        collection = bpy.data.collections.new(f"source:{file.stem}")
        scene.collection.children.link(collection)
        for index, obj in enumerate(set(scene.objects) - previous):
            for owner in list(obj.users_collection):
                owner.objects.unlink(obj)
            collection.objects.link(obj)
            obj["sourceFile"] = file.relative_to(root).as_posix()
            obj["technicalMeshId"] = f"candidate:{species}:{file.stem}:{index}"
            obj["anatomicalIdentity"] = "pending"
            obj["scaleConversionApplied"] = False
    mesh_count = sum(obj.type == "MESH" for obj in scene.objects)
    bpy.ops.wm.save_as_mainfile(filepath=str(target))
    bpy.ops.wm.open_mainfile(filepath=str(target))
    assert sum(obj.type == "MESH" for obj in bpy.context.scene.objects) == mesh_count
    report = {"speciesId": species, "scene": target.relative_to(root).as_posix(), "meshCount": mesh_count,
              "sourceFiles": [file.relative_to(root).as_posix() for file in files],
              "status": "candidate_not_anatomically_validated", "savedAndReopened": True,
              "physicalScaleVerified": False, "individualBonesIdentified": 0, "webAvailable": False}
    (destination / f"{species}-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))
