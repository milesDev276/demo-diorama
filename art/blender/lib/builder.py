"""MeshBuilder: accumulates an asset's parts into ONE mesh. Each part gets a
palette color (written as a per-corner color attribute) and a material slot,
so the exported GLB is one object with at most len(MATERIAL_SLOTS) draw calls.

Blender axes: X right, Z up, front faces −Y (becomes +Z after glTF Y-up export).
All sizes are meters; the origin is the ground-contact center.
"""

import bmesh
import bpy
from mathutils import Matrix

from .materials import COLOR_ATTRIBUTE, MATERIAL_SLOTS, slot_material
from .palette import Rgb

Vec3 = tuple[float, float, float]

# Edges sharper than this (radians) are bevelled; flat grid edges are not.
_BEVEL_ANGLE = 0.5


class MeshBuilder:
    def __init__(self, name: str, palette: dict[str, Rgb]):
        self.name = name
        self.palette = palette
        self.bm = bmesh.new()
        self._paint_layer = self.bm.faces.layers.int.new("paint")
        self._paints: list[Rgb] = []

    def color(self, key: str, shade: float = 1.0) -> Rgb:
        r, g, b = self.palette[key]
        return (min(r * shade, 1.0), min(g * shade, 1.0), min(b * shade, 1.0))

    # ── Primitives ──────────────────────────────────────────────────────

    def box(
        self,
        size: Vec3,
        center: Vec3,
        color: str,
        *,
        shade: float = 1.0,
        bevel: float = 0.0,
        segments: int = 2,
        cuts: int = 0,
        material: str = "base",
    ) -> None:
        """Axis-aligned box. `cuts` subdivides the faces so baked AO has vertices to land on."""
        before = set(self.bm.faces)
        matrix = Matrix.Translation(center) @ Matrix.Diagonal((*size, 1.0))
        verts = bmesh.ops.create_cube(self.bm, size=1.0, matrix=matrix)["verts"]
        if cuts:
            edges = list({e for v in verts for e in v.link_edges})
            bmesh.ops.subdivide_edges(self.bm, edges=edges, cuts=cuts, use_grid_fill=True)
        if bevel > 0:
            part_edges = {e for f in self._new_faces(before) for e in f.edges}
            sharp = [e for e in part_edges if e.calc_face_angle(0.0) > _BEVEL_ANGLE]
            bmesh.ops.bevel(
                self.bm,
                geom=sharp,
                offset=bevel,
                offset_type="OFFSET",
                segments=segments,
                profile=0.5,
                affect="EDGES",
                clamp_overlap=True,
            )
        self._paint(self._new_faces(before), self.color(color, shade), material, smooth=False)

    def cylinder(
        self,
        radius: float,
        height: float,
        base: Vec3,
        color: str,
        *,
        shade: float = 1.0,
        segments: int = 10,
        material: str = "base",
    ) -> None:
        """Upright cylinder standing on `base` (its bottom-center point). Smooth sides, flat caps."""
        before = set(self.bm.faces)
        x, y, z = base
        bmesh.ops.create_cone(
            self.bm,
            cap_ends=True,
            cap_tris=False,
            segments=segments,
            radius1=radius,
            radius2=radius,
            depth=height,
            matrix=Matrix.Translation((x, y, z + height / 2)),
        )
        faces = self._new_faces(before)
        self._paint(faces, self.color(color, shade), material, smooth=True)
        for f in faces:
            f.normal_update()
            f.smooth = abs(f.normal.z) < 0.5

    def sphere(
        self,
        radius: float,
        center: Vec3,
        color: str,
        *,
        shade: float = 1.0,
        subdivisions: int = 2,
        material: str = "base",
    ) -> None:
        """Smooth-shaded icosphere around `center`."""
        before = set(self.bm.faces)
        bmesh.ops.create_icosphere(
            self.bm, subdivisions=subdivisions, radius=radius, matrix=Matrix.Translation(center)
        )
        self._paint(self._new_faces(before), self.color(color, shade), material, smooth=True)

    # ── Output ──────────────────────────────────────────────────────────

    def to_object(self) -> bpy.types.Object:
        """Writes the accumulated geometry into a linked scene object with colors and slots."""
        self.bm.normal_update()
        mesh = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(mesh)
        self.bm.free()

        paint_ids = [d.value for d in mesh.attributes["paint"].data]
        colors = mesh.color_attributes.new(COLOR_ATTRIBUTE, "BYTE_COLOR", "CORNER")
        for poly in mesh.polygons:
            rgba = (*self._paints[paint_ids[poly.index]], 1.0)
            for li in poly.loop_indices:
                colors.data[li].color_srgb = rgba
        mesh.attributes.remove(mesh.attributes["paint"])
        set_active_color(mesh, COLOR_ATTRIBUTE)

        for slot in MATERIAL_SLOTS:
            mesh.materials.append(slot_material(slot))

        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        return obj

    # ── Internals ───────────────────────────────────────────────────────

    def _new_faces(self, before: set) -> list:
        return [f for f in self.bm.faces if f not in before]

    def _paint(self, faces: list, rgb: Rgb, material: str, *, smooth: bool) -> None:
        self._paints.append(rgb)
        paint_id = len(self._paints) - 1
        material_index = MATERIAL_SLOTS.index(material)
        for f in faces:
            f[self._paint_layer] = paint_id
            f.material_index = material_index
            f.smooth = smooth


def set_active_color(mesh: bpy.types.Mesh, name: str) -> None:
    """Makes `name` both the active and the render color attribute (the one glTF exports)."""
    attrs = mesh.color_attributes
    index = next(i for i, a in enumerate(attrs) if a.name == name)
    attrs.active_color_index = index
    attrs.render_color_index = index
