"""MeshBuilder: accumulates an asset's parts into ONE mesh. Each part gets a
palette color (written as a per-corner color attribute) and a material slot,
so the exported GLB is one object with at most len(MATERIAL_SLOTS) draw calls.

Blender axes: X right, Z up, front faces −Y (becomes +Z after glTF Y-up export).
All sizes are meters; the origin is the ground-contact center. Rotations are
Euler XYZ in degrees.
"""

import math
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Quaternion, Vector, noise

from .atlas import cell_uv_rect, face_axes
from .materials import COLOR_ATTRIBUTE, MATERIAL_SLOTS, slot_material
from .palette import Rgb

Vec3 = tuple[float, float, float]
Vec2 = tuple[float, float]

# Edges sharper than this (radians) are bevelled; flat grid edges are not.
_BEVEL_ANGLE = 0.5

_AXES = {"x": Vector((1, 0, 0)), "y": Vector((0, 1, 0)), "z": Vector((0, 0, 1))}
_PRINT_DIRS = {
    "-x": Vector((-1, 0, 0)),
    "+x": Vector((1, 0, 0)),
    "-y": Vector((0, -1, 0)),
    "+y": Vector((0, 1, 0)),
    "-z": Vector((0, 0, -1)),
    "+z": Vector((0, 0, 1)),
}


def _rotation(rotation: Vec3 | None) -> Matrix:
    if rotation is None:
        return Matrix.Identity(4)
    return Euler(tuple(math.radians(a) for a in rotation), "XYZ").to_matrix().to_4x4()


def _z_to(axis: str) -> Matrix:
    """Rotation taking +Z onto the named axis."""
    return Quaternion(Vector((0, 0, 1)).rotation_difference(_AXES[axis])).to_matrix().to_4x4()


def smooth_path(points: list[Vec3], samples: int = 4) -> list[Vec3]:
    """Catmull-Rom through `points`, `samples` segments per span. Ends are kept."""
    pts = [Vector(p) for p in points]
    if len(pts) < 3:
        return [tuple(p) for p in pts]
    padded = [2 * pts[0] - pts[1], *pts, 2 * pts[-1] - pts[-2]]
    out = []
    for i in range(1, len(padded) - 2):
        p0, p1, p2, p3 = padded[i - 1 : i + 3]
        for s in range(samples):
            t = s / samples
            t2, t3 = t * t, t * t * t
            out.append(
                0.5
                * (
                    2 * p1
                    + (p2 - p0) * t
                    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                    + (3 * p1 - p0 - 3 * p2 + p3) * t3
                )
            )
    out.append(pts[-1])
    return [tuple(p) for p in out]


def arc_points(center: Vec3, radius: float, start_deg: float, end_deg: float, axis: str = "y", segments: int = 12) -> list[Vec3]:
    """Points on a circular arc around `axis`, in the plane of the two other
    axes taken in order (y: x then z). 0° points along the first of them and
    90° along the second — for axis "y", 0° is +X (forward) and 90° is +Z (up)."""
    c = Vector(center)
    first, second = {"x": (1, 2), "y": (0, 2), "z": (0, 1)}[axis]
    pts = []
    for i in range(segments + 1):
        a = math.radians(start_deg + (end_deg - start_deg) * i / segments)
        p = c.copy()
        p[first] += radius * math.cos(a)
        p[second] += radius * math.sin(a)
        pts.append(tuple(p))
    return pts


class MeshBuilder:
    def __init__(self, name: str, palette: dict[str, Rgb]):
        self.name = name
        self.palette = palette
        self.bm = bmesh.new()
        self._paint_layer = self.bm.faces.layers.int.new("paint")
        self._uv_layer = None
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
        rotation: Vec3 | None = None,
        print: str | None = None,
        print_dir: str = "-y",
    ) -> None:
        """Box around `center`, rotated about it. `cuts` subdivides the faces so
        baked AO has vertices to land on. `print` maps the face pointing along
        `print_dir` (before rotation) onto that atlas cell."""
        before = set(self.bm.faces)
        matrix = Matrix.Translation(center) @ _rotation(rotation) @ Matrix.Diagonal((*size, 1.0))
        verts = bmesh.ops.create_cube(self.bm, size=1.0, matrix=matrix)["verts"]
        if cuts:
            edges = list({e for v in verts for e in v.link_edges})
            bmesh.ops.subdivide_edges(self.bm, edges=edges, cuts=cuts, use_grid_fill=True)
        self._bevel(before, bevel, segments)
        faces = self._new_faces(before)
        self._paint(faces, self.color(color, shade), material, smooth=False)
        if print:
            self._print(faces, print, _rotation(rotation).to_3x3() @ _PRINT_DIRS[print_dir])

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
        radius_top: float | None = None,
        axis: str = "z",
    ) -> None:
        """Cylinder (or frustum, with `radius_top`) rising from `base` (the
        center of its bottom cap) along +`axis`. Smooth sides, flat caps."""
        before = set(self.bm.faces)
        direction = _AXES[axis]
        matrix = Matrix.Translation(Vector(base) + direction * height / 2) @ _z_to(axis)
        bmesh.ops.create_cone(
            self.bm,
            cap_ends=True,
            cap_tris=False,
            segments=segments,
            radius1=radius,
            radius2=radius if radius_top is None else radius_top,
            depth=height,
            matrix=matrix,
        )
        faces = self._new_faces(before)
        self._paint(faces, self.color(color, shade), material, smooth=True)
        for f in faces:
            f.normal_update()
            f.smooth = abs(f.normal.dot(direction)) < 0.5

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

    def blob(
        self,
        center: Vec3,
        radii: Vec3,
        color: str,
        *,
        shade: float = 1.0,
        subdivisions: int = 2,
        roughness: float = 0.15,
        frequency: float = 1.6,
        bumps: float = 0.0,
        seed: str | int = 0,
        smooth: bool = True,
        material: str = "base",
    ) -> None:
        """Ellipsoid with coherent-noise displacement, for canopy clumps, heads
        and hair. `roughness` is the displacement as a fraction of each radius;
        `bumps` adds a finer octave (4× the frequency) for a foam-like surface."""
        before = set(self.bm.faces)
        verts = bmesh.ops.create_icosphere(self.bm, subdivisions=subdivisions, radius=1.0)["verts"]
        rng = random.Random(str(seed))
        offset = Vector((rng.uniform(-100, 100), rng.uniform(-100, 100), rng.uniform(-100, 100)))
        c, r = Vector(center), Vector(radii)
        for v in verts:
            n = v.co.normalized()
            bump = 1 + roughness * noise.noise(n * frequency + offset) + bumps * noise.noise(n * frequency * 4 - offset)
            v.co = c + Vector((n.x * r.x, n.y * r.y, n.z * r.z)) * bump
        self._paint(self._new_faces(before), self.color(color, shade), material, smooth=smooth)

    def tube(
        self,
        points: list[Vec3],
        radius: float | list[float],
        color: str,
        *,
        shade: float = 1.0,
        sides: int = 6,
        section: Vec2 = (1.0, 1.0),
        up: Vec3 | None = None,
        closed: bool = False,
        caps: bool = True,
        smooth: bool = True,
        material: str = "base",
    ) -> None:
        """Swept tube along a polyline, for branches, frames, pipes and limbs.

        `radius` may vary per point. `section` scales the cross-section along
        the frame's normal / binormal (e.g. (1, 0.3) for a flat strap); with
        `up` the normal is kept toward that vector, otherwise it is parallel-
        transported. `closed` joins the last point back to the first (rings)."""
        pts = [Vector(p) for p in points]
        n = len(pts)
        radii = radius if isinstance(radius, list) else [radius] * n
        if len(radii) != n or n < 2:
            raise ValueError("tube needs ≥ 2 points and one radius per point")

        tangents = []
        for i in range(n):
            if closed:
                t = pts[(i + 1) % n] - pts[i - 1]
            elif i == 0:
                t = pts[1] - pts[0]
            elif i == n - 1:
                t = pts[-1] - pts[-2]
            else:
                t = (pts[i + 1] - pts[i]).normalized() + (pts[i] - pts[i - 1]).normalized()
            tangents.append(t.normalized())

        normals = []
        for i, t in enumerate(tangents):
            if up is not None:
                ref = Vector(up)
                normal = ref - ref.dot(t) * t
            elif i == 0:
                ref = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
                normal = ref - ref.dot(t) * t
            else:
                normal = tangents[i - 1].rotation_difference(t) @ normals[-1]
            normals.append(normal.normalized())

        before = set(self.bm.faces)
        rings = []
        for p, t, nrm, r in zip(pts, tangents, normals, radii):
            binormal = t.cross(nrm)
            ring = []
            for s in range(sides):
                a = 2 * math.pi * s / sides
                offset = math.cos(a) * section[0] * nrm + math.sin(a) * section[1] * binormal
                ring.append(self.bm.verts.new(p + r * offset))
            rings.append(ring)

        spans = n if closed else n - 1
        for i in range(spans):
            a, b = rings[i], rings[(i + 1) % n]
            for s in range(sides):
                self.bm.faces.new((a[s], a[(s + 1) % sides], b[(s + 1) % sides], b[s]))
        if caps and not closed:
            self.bm.faces.new(list(reversed(rings[0])))
            self.bm.faces.new(rings[-1])

        # Rings run counter-clockwise about the tangent, so quads and caps face outward.
        faces = self._new_faces(before)
        self._paint(faces, self.color(color, shade), material, smooth=smooth)
        if caps and not closed:
            faces[-1].smooth = faces[-2].smooth = False

    def extrude(
        self,
        profile: list[Vec2],
        depth: float,
        center: Vec3,
        color: str,
        *,
        axis: str = "x",
        shade: float = 1.0,
        bevel: float = 0.0,
        segments: int = 2,
        material: str = "base",
        print: str | None = None,
        print_dir: str = "-y",
    ) -> None:
        """A 2D outline extruded `depth` along `axis`, centered on `center`.

        Profile coordinates are the two remaining axes in order: (y, z) for x,
        (x, z) for y, (x, y) for z — e.g. a car's side outline as (length,
        height) extruded across its width."""
        before = set(self.bm.faces)
        c = Vector(center)
        plane = {"x": (1, 2), "y": (0, 2), "z": (0, 1)}[axis]
        k = "xyz".index(axis)

        def vert(p: Vec2, d: float):
            co = Vector((0.0, 0.0, 0.0))
            co[plane[0]], co[plane[1]], co[k] = p[0], p[1], d
            return self.bm.verts.new(c + co)

        near = [vert(p, -depth / 2) for p in profile]
        far = [vert(p, depth / 2) for p in profile]
        m = len(profile)
        self.bm.faces.new(near)
        self.bm.faces.new(list(reversed(far)))
        for i in range(m):
            j = (i + 1) % m
            self.bm.faces.new((near[i], near[j], far[j], far[i]))
        bmesh.ops.recalc_face_normals(self.bm, faces=self._new_faces(before))

        self._bevel(before, bevel, segments)
        faces = self._new_faces(before)
        self._paint(faces, self.color(color, shade), material, smooth=False)
        if print:
            self._print(faces, print, _PRINT_DIRS[print_dir])

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

    def _bevel(self, before: set, width: float, segments: int) -> None:
        if width <= 0:
            return
        part_edges = {e for f in self._new_faces(before) for e in f.edges}
        sharp = [e for e in part_edges if e.calc_face_angle(0.0) > _BEVEL_ANGLE]
        bmesh.ops.bevel(
            self.bm,
            geom=sharp,
            offset=width,
            offset_type="OFFSET",
            segments=segments,
            profile=0.5,
            affect="EDGES",
            clamp_overlap=True,
        )

    def _paint(self, faces: list, rgb: Rgb, material: str, *, smooth: bool) -> None:
        self._paints.append(rgb)
        paint_id = len(self._paints) - 1
        material_index = MATERIAL_SLOTS.index(material)
        for f in faces:
            f[self._paint_layer] = paint_id
            f.material_index = material_index
            f.smooth = smooth

    def _print(self, faces: list, cell: str, direction: Vector) -> None:
        """Moves the part's faces that point along `direction` into the printed
        slot, painted white (the atlas supplies the color), with planar UVs
        spanning `cell`."""
        if self._uv_layer is None:
            self._uv_layer = self.bm.loops.layers.uv.new("UVMap")
        for f in faces:
            f.normal_update()
        printed = [f for f in faces if f.normal.dot(direction) > 0.99]
        if not printed:
            raise ValueError(f"print '{cell}': no face points along {tuple(direction)}")

        self._paint(printed, (1.0, 1.0, 1.0), "printed", smooth=False)
        right, up = face_axes(direction)
        verts = {v for f in printed for v in f.verts}
        s = [v.co.dot(right) for v in verts]
        t = [v.co.dot(up) for v in verts]
        s0, s1, t0, t1 = min(s), max(s), min(t), max(t)
        u0, v0, u1, v1 = cell_uv_rect(cell)
        for f in printed:
            for loop in f.loops:
                co = loop.vert.co
                loop[self._uv_layer].uv = (
                    u0 + (co.dot(right) - s0) / (s1 - s0) * (u1 - u0),
                    v0 + (co.dot(up) - t0) / (t1 - t0) * (v1 - v0),
                )


def set_active_color(mesh: bpy.types.Mesh, name: str) -> None:
    """Makes `name` both the active and the render color attribute (the one glTF exports)."""
    attrs = mesh.color_attributes
    index = next(i for i, a in enumerate(attrs) if a.name == name)
    attrs.active_color_index = index
    attrs.render_color_index = index
