"""Verify source triangle IDs in Blender and preserve them for manual annotation."""
import bpy
import json
import struct
from collections import defaultdict, deque
from pathlib import Path

root = Path(__file__).resolve().parents[2]
source = root / "workbench/processing/feline/cat-skeleton/source/Chat.glb"
target = root / "workbench/segmentation/feline/feline_annotation.blend"
if target.exists():
    raise RuntimeError("Existing annotation workspace preserved")
data = source.read_bytes()
length = struct.unpack_from("<I", data, 12)[0]
document = json.loads(data[20:20 + length])
binary = data[28 + length:]
primitive = document["meshes"][0]["primitives"][0]

def accessor_bytes(index):
    accessor = document["accessors"][index]
    view = document["bufferViews"][accessor["bufferView"]]
    return accessor, view, (view.get("byteOffset", 0) + accessor.get("byteOffset", 0))

position, position_view, start = accessor_bytes(primitive["attributes"]["POSITION"])
assert position["componentType"] == 5126 and position["type"] == "VEC3"
points = []
for index in range(position["count"]):
    x, y, z = struct.unpack_from("<fff", binary, start + index * position_view.get("byteStride", 12))
    points.append((x, -z, y))  # glTF → Blender; source values preserved.
indices, index_view, start = accessor_bytes(primitive["indices"])
format_code, size = {5121: ("B", 1), 5123: ("H", 2), 5125: ("I", 4)}[indices["componentType"]]
values = [struct.unpack_from("<" + format_code, binary, start + index * index_view.get("byteStride", size))[0] for index in range(indices["count"])]
lookup = defaultdict(deque)
for index in range(0, len(values), 3):
    key = tuple(sorted(points[vertex] for vertex in values[index:index + 3]))
    lookup[key].append(index // 3)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
obj = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
attribute = obj.data.attributes.new("source_face_index", "INT", "FACE")
matched = 0
for face in obj.data.polygons:
    key = tuple(sorted(tuple(obj.data.vertices[index].co) for index in face.vertices))
    if not lookup[key]:
        raise RuntimeError(f"Source correspondence not exact for face {face.index}; no IDs inferred")
    attribute.data[face.index].value = lookup[key].popleft()
    matched += 1
assert matched == len(values) // 3 and not any(lookup.values())
obj["identityStatus"] = "no_bones_identified"
obj["annotationInstructions"] = "Select faces manually; export source_face_index, not polygon index"
obj["sourceSha256"] = __import__("hashlib").sha256(data).hexdigest()
bpy.ops.wm.save_as_mainfile(filepath=str(target))
bpy.ops.wm.open_mainfile(filepath=str(target))
restored = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
assert len(restored.data.attributes["source_face_index"].data) == matched
report = {"matchedSourceTriangles": matched, "exactCoordinatesVerified": True,
          "sourceGeometryAltered": False, "anatomicalIdentityVerified": False,
          "workspace": target.relative_to(root).as_posix()}
(target.parent / "annotation-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report))
