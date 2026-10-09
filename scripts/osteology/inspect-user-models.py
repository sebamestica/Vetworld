"""Inspect user-supplied files privately in Blender; no scientific admission."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
output = root / "workbench" / "inspection" / "user-models"
output.mkdir(parents=True, exist_ok=True)
inputs = [("feline", root / "workbench/processing/feline/cat-skeleton/source/Chat.glb")]
inputs += [("canine", file) for file in sorted((root / "workbench/incoming/canine/originals").glob("*.stl"))]
reports = []

for species, file in inputs:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if file.suffix.lower() == ".glb":
        bpy.ops.import_scene.gltf(filepath=str(file))
    else:
        bpy.ops.wm.stl_import(filepath=str(file))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    details = []
    for index, obj in enumerate(meshes):
        obj["technicalMeshId"] = f"user-import:{species}:{file.stem}:{index}"
        obj["anatomicalIdentity"] = "unverified"
        obj["reviewStatus"] = "pending"
        parents = list(range(len(obj.data.vertices)))
        def find(item):
            while parents[item] != item:
                parents[item] = parents[parents[item]]
                item = parents[item]
            return item
        for edge in obj.data.edges:
            a, b = (find(v) for v in edge.vertices)
            parents[a] = b
        components = len({find(v) for v in range(len(parents))})
        obj.data.calc_loop_triangles()
        details.append({
            "name": obj.name, "technicalMeshId": obj["technicalMeshId"],
            "vertices": len(obj.data.vertices), "triangles": len(obj.data.loop_triangles),
            "connectedComponents": components,
            "dimensionsNative": list(obj.dimensions),
            "matrixWorld": [list(row) for row in obj.matrix_world],
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
        })
    scene = bpy.context.scene
    scene["assemblyStatus"] = "imported_candidate_not_anatomically_identified"
    scene["physicalScaleStatus"] = "unverified"
    scene["speciesDeclaredByFile"] = species
    scene["sourceFile"] = file.relative_to(root).as_posix()
    scene["reviewStatus"] = "pending"
    target = output / f"{species}-{file.stem}-inspection.blend"
    if target.exists():
        raise RuntimeError(f"Preserving existing scene: {target}")
    bpy.ops.wm.save_as_mainfile(filepath=str(target))
    bpy.ops.wm.open_mainfile(filepath=str(target))
    report = {
        "file": file.relative_to(root).as_posix(), "declaredSpecies": species,
        "meshCount": len(meshes), "meshes": details,
        "unitInterpretation": "glTF metre convention" if file.suffix == ".glb" else "STL has no unit metadata",
        "physicalScaleVerified": False, "anatomicalReview": "pending",
        "savedAndReopened": True, "scene": target.relative_to(root).as_posix(),
        "note": "Connected components are geometry islands, not identified bones.",
    }
    reports.append(report)
    print(json.dumps({"file": file.name, "meshes": len(meshes), "triangles": sum(item["triangles"] for item in details)}))

(output / "inspection.json").write_text(json.dumps(reports, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
