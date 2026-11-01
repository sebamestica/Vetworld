"""Lectura binaria de STL sin dependencias, compartida por los diagnósticos caninos privados.

No modifica geometría: devuelve triángulos en el orden del archivo (índice = cara fuente).
"""
import hashlib
import struct
from pathlib import Path

PIECES = (
    ("skull", "craneo_dog_skeleton.stl"),
    ("vertebral-column", "espina dorsal_dog_skeleton.stl"),
    ("thoracic-limb", "pata delantera_dog_skeleton.stl"),
    ("pelvic-limb", "pata trasera_dog_skeleton.stl"),
)

EXPECTED_SHA256 = {
    "craneo_dog_skeleton.stl": "7a2d498293ed84dce2e039cf239b11fbe0f406ba1a69fc3bf0a3c80922c529d2",
    "espina dorsal_dog_skeleton.stl": "a4b9d4e7503651e7c3bbb79b65e157cbd6633c7d982ad32c3a7b2d140e654f48",
    "pata delantera_dog_skeleton.stl": "14f3ba51632f405159d754a8f5c21c1eb22beacfc34835e69a7a9d1641ae2498",
    "pata trasera_dog_skeleton.stl": "6ba7a11ae2874af14972bb2fd4b4ba37de92631fb3ac01bda42958350294fe99",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_binary_stl(path: Path):
    data = path.read_bytes()
    if len(data) < 84:
        raise RuntimeError(f"STL demasiado corto: {path}")
    header = data[:80]
    (count,) = struct.unpack_from("<I", data, 80)
    if 84 + 50 * count != len(data):
        raise RuntimeError(f"Tamaño incompatible con STL binario: {path}")
    normals, triangles, attributes = [], [], []
    for index in range(count):
        values = struct.unpack_from("<12fH", data, 84 + 50 * index)
        normals.append(values[0:3])
        triangles.append((values[3:6], values[6:9], values[9:12]))
        attributes.append(values[12])
    return {"header": header, "count": count, "normals": normals, "triangles": triangles, "attributes": attributes}
