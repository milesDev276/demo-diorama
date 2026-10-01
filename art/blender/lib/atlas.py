"""Graphics atlas layout shared with the app (objects/textures/atlasLayout.json).

The app draws each named cell on a runtime canvas; Blender only needs the
cell rectangles to give `printed` faces their UVs. Cells are [x, y, w, h] in
canvas pixels with the origin at the top-left, like the canvas itself.
"""

import json
from functools import cache

from mathutils import Vector

from .palette import REPO_ROOT

ATLAS_JSON = REPO_ROOT / "features" / "diorama" / "objects" / "textures" / "atlasLayout.json"


@cache
def _layout() -> dict:
    return json.loads(ATLAS_JSON.read_text(encoding="utf-8"))


def cell_uv_rect(name: str) -> tuple[float, float, float, float]:
    """(u_left, v_bottom, u_right, v_top) in Blender UV space (v up).

    The glTF exporter flips V (v_gltf = 1 - v_blender), so v_top lands on the
    cell's top canvas row, which the app samples with flipY = false."""
    layout = _layout()
    cells = layout["cells"]
    if name not in cells:
        raise KeyError(f"Atlas cell '{name}' not in {ATLAS_JSON.name}. Cells: {', '.join(cells)}")
    size = layout["size"]
    x, y, w, h = cells[name]
    return (x / size, 1 - (y + h) / size, (x + w) / size, 1 - y / size)


def face_axes(normal: Vector) -> tuple[Vector, Vector]:
    """(right, up) of a face as seen by a viewer looking at it head-on.
    Walls read upright; faces pointing up or down read with +Y (the back) up."""
    up = Vector((0, 0, 1)) if abs(normal.z) < 0.7 else Vector((0, 1, 0))
    right = up.cross(normal).normalized()
    return right, normal.cross(right).normalized()
