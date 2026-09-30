"""Gray-box blockout of the hero scene, built from plan/Hero-Layout.md.

    blender --background --factory-startup --python art/blender/blockout/hero_blockout.py

Exports public/models/_dev/hero_blockout.glb (loaded by the app at
/diorama?dev=blockout) and renders art/previews/hero_blockout_view.png (hero
3/4 view) and hero_blockout_top.png (top-down). Numbers below are app-space
meters (x right, y up, z front) exactly as in the layout sheet.
"""

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from build import MODELS_DIR, PREVIEWS_DIR, reset_scene  # noqa: E402
from lib import preview  # noqa: E402
from lib.builder import MeshBuilder  # noqa: E402
from lib.finish import export_glb, triangle_count  # noqa: E402
from lib.palette import load_palette  # noqa: E402

ROAD_Y = -0.15
BAY = 1.82


def to_blender(x: float, y: float, z: float) -> tuple[float, float, float]:
    return (x, -z, y)


class Blockout:
    """Thin wrapper so every call reads in layout-sheet (app) coordinates."""

    def __init__(self, builder: MeshBuilder):
        self.b = builder

    def rect(self, x0, x1, z0, z1, y0, y1, color, **kw):
        size = (x1 - x0, z1 - z0, y1 - y0)
        self.b.box(size, to_blender((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), color, **kw)

    def post(self, x, z, y0, height, radius, color, **kw):
        self.b.cylinder(radius, height, to_blender(x, y0, z), color, **kw)

    def ball(self, x, y, z, radius, color, **kw):
        self.b.sphere(radius, to_blender(x, y, z), color, **kw)


def base(k: Blockout) -> None:
    k.rect(-8, 8, -8, 8, -1.35, ROAD_Y - 0.1, "vendingDark", bevel=0.05)  # plinth
    k.rect(-8, 8, 3.5, 8, ROAD_Y - 0.1, ROAD_Y, "asphalt")  # front road
    k.rect(3.5, 8, -8, 3.5, ROAD_Y - 0.1, ROAD_Y, "asphalt")  # right road
    k.rect(-8, 3.5, 2, 3.5, ROAD_Y, 0, "sidewalkConcrete")  # front sidewalk
    k.rect(2, 3.5, -8, 2, ROAD_Y, 0, "sidewalkConcrete")  # right sidewalk
    k.rect(-8, 2, -8, 2, ROAD_Y, 0, "lotGravel")  # lot


def road_markings(k: Blockout) -> None:
    line = dict(color="asphaltLine")
    top = ROAD_Y + 0.01
    for i in range(5):  # crosswalk stripes run along Z
        x0 = 3.725 + i * 0.9
        k.rect(x0, x0 + 0.45, 0.5, 3.0, ROAD_Y, top, **line)
    k.rect(5.75, 7.45, -0.5, -0.05, ROAD_Y, top, **line)  # stop line
    for z0, z1 in ((-1.8, -1.0), (-2.65, -1.95), (-3.5, -2.8)):  # 止 ま れ
        k.rect(5.9, 7.4, z0, z1, ROAD_Y, top, **line)
    k.rect(7.45, 7.6, -8, -0.5, ROAD_Y, top, **line)  # edge line, right road
    k.rect(-8, 8, 7.45, 7.6, ROAD_Y, top, **line)  # edge line, front road
    k.post(-2, 5.8, ROAD_Y, 0.012, 0.3, "vendingDark", shade=1.4, segments=16)  # manhole
    for x in (-6, -2, 1):
        k.rect(x - 0.5, x + 0.5, 3.5, 3.8, ROAD_Y, top, "vendingDark", shade=1.4)
    for z in (-6, -3):
        k.rect(3.5, 3.8, z - 0.5, z + 0.5, ROAD_Y, top, "vendingDark", shade=1.4)


def building(k: Blockout) -> None:
    x0, x1, z0, z1 = -3.76, 1.7, -3.76, 1.7
    roof = 8.8
    k.rect(x0, x1, z0, z1, 0, roof, "wallPlaster")
    for y in (3.2, 6.0):  # floor bands
        k.rect(x0 - 0.05, x1 + 0.05, z0 - 0.05, z1 + 0.05, y - 0.05, y + 0.05, "wallSiding", shade=0.9)

    glow = dict(color="windowGlow", material="emissive")
    k.rect(x0 + 0.2, x1 - 0.2, z1, z1 + 0.03, 0.2, 2.5, **glow)  # front shopfront
    k.rect(x1, x1 + 0.03, -0.1, z1 - 0.2, 0.2, 2.5, **glow)  # corner bay, right facade
    k.rect(x0, x1, z1, z1 + 1.0, 2.6, 2.8, "shopAwning")  # awning

    window = dict(color="vendingDark", shade=1.8)
    bay_centers = [x0 + BAY * (i + 0.5) for i in range(3)]
    side_centers = [z0 + BAY * (i + 0.5) for i in range(3)]
    k.rect(bay_centers[0] - 0.6, bay_centers[0] + 0.6, z1, z1 + 0.03, 4.0, 5.2, **window)
    for c in bay_centers:
        k.rect(c - 0.6, c + 0.6, z1, z1 + 0.03, 6.8, 8.0, **window)
    for c in side_centers:
        for y0 in (4.0, 6.8):
            k.rect(x1, x1 + 0.03, c - 0.6, c + 0.6, y0, y0 + 1.2, **window)
    k.rect(x1, x1 + 0.03, side_centers[1] - 0.4, side_centers[1] + 0.4, 1.3, 2.1, **window)  # small 1F window
    k.rect(x1, x1 + 0.12, side_centers[0] - 0.25, side_centers[0] + 0.25, 1.0, 1.6, "signPost")  # meter box

    # 2F balcony on the two right bays, with an AC unit and laundry
    bx0 = x0 + BAY
    k.rect(bx0, x1, z1, z1 + 0.9, 3.2, 3.35, "wallSiding")
    k.rect(bx0, x1, z1 + 0.82, z1 + 0.9, 3.35, 4.35, "wallSiding", shade=0.95)
    k.rect(0.4, 1.2, z1 + 0.1, z1 + 0.4, 3.35, 3.95, "acUnit")
    k.rect(bx0 + 0.3, bx0 + 1.9, z1 + 0.45, z1 + 0.5, 4.2, 5.0, "canBlue", shade=1.2)  # laundry
    k.rect(x1, x1 + 0.3, -2.9, -2.1, 6.5, 7.1, "acUnit")  # 3F wall AC, right facade

    # Roof: parapet, railing, shed, water tank, pots
    for rx0, rx1, rz0, rz1 in ((x0, x1, z1 - 0.15, z1), (x0, x1, z0, z0 + 0.15), (x0, x0 + 0.15, z0, z1), (x1 - 0.15, x1, z0, z1)):
        k.rect(rx0, rx1, rz0, rz1, roof, roof + 0.5, "wallSiding")
        k.rect(rx0, rx1, rz0, rz1, roof + 1.05, roof + 1.1, "signPost")  # top rail
    for i in range(4):
        px = x0 + i * BAY
        pz = z0 + i * BAY
        for x, z in ((px, z1 - 0.07), (px, z0 + 0.07), (x0 + 0.07, pz), (x1 - 0.07, pz)):
            k.post(x, z, roof + 0.5, 0.6, 0.025, "signPost", segments=6)
    k.rect(-3.5, -1.1, -3.5, -1.7, roof, roof + 2.2, "wallSiding", shade=0.95)  # shed
    k.rect(0.1, 1.1, -3.3, -2.3, roof, roof + 1.0, "signPost", shade=0.8)  # tank stand
    k.post(0.6, -2.8, roof + 1.0, 1.2, 0.6, "insulator", segments=16)  # water tank
    for x, h in ((0.6, 0.4), (1.0, 0.6)):
        k.post(x, 1.1, roof, h, 0.18, "dirt", segments=10)
        k.ball(x, roof + h + 0.15, 1.1, 0.25, "foliageDark")

    k.rect(x1, x1 + 0.6, 0.95, 1.2, 3.6, 6.0, "signBoard", material="emissive")  # vertical kanban


def street_furniture(k: Blockout) -> None:
    k.post(-5.5, 3.2, 0, 10, 0.16, "poleConcrete", segments=12)  # utility pole
    k.rect(-6.3, -4.7, 3.15, 3.25, 9.1, 9.25, "poleConcrete")  # crossarm
    k.post(-5.5, 2.8, 6.8, 0.9, 0.3, "transformer", segments=12)
    for z, y in ((2.9, 9.3), (3.5, 9.3), (3.2, 10.0)):  # wires along X
        k.rect(-8, 8, z - 0.015, z + 0.015, y - 0.015, y + 0.015, "wireGray")

    k.post(3.2, 3.2, 0, 3.2, 0.04, "shopAwningLight", segments=8)  # curve mirror
    k.rect(2.8, 3.6, 3.12, 3.18, 2.8, 3.6, "shopAwningLight")
    k.post(7.8, -0.8, ROAD_Y, 2.5, 0.035, "signPost", segments=8)  # stop sign
    k.rect(7.45, 8.15, -0.84, -0.8, 1.8, 2.45, "signRed")

    for x0 in (-6.3, -5.3):
        k.rect(x0, x0 + 1.0, 1.0, 1.7, 0, 1.83, "vendingBody")
        k.rect(x0 + 0.06, x0 + 0.94, 1.7, 1.73, 1.0, 1.6, "vendingPanel", material="emissive")
    k.rect(-6.925, -6.475, 1.225, 1.675, 0, 0.8, "canBlue")  # recycling bin
    k.rect(-7.4, -7.0, 2.3, 2.7, 0, 1.25, "signRed")  # post box
    for x, h in ((-3.45, 0.4), (-3.1, 0.3), (-3.25, 0.55)):
        k.post(x, 1.85, 0, h, 0.14, "dirt", segments=10)
        k.ball(x, h + 0.12, 1.85, 0.2, "foliageLight")
    k.rect(-2.8, -1.0, 2.4, 2.5, 0, 1.0, "vendingDark")  # bicycle
    k.rect(0.35, 0.85, 2.4, 2.8, 0, 0.9, "signBoard")  # A-frame sign


def nature(k: Blockout) -> None:
    k.post(-6.6, -1.0, 0, 3.2, 0.2, "trunk", segments=10)  # ginkgo
    k.ball(-6.6, 4.4, -1.0, 2.3, "canYellow", subdivisions=2)
    k.ball(-6.6, 6.4, -1.0, 1.6, "canYellow", shade=1.05)
    k.post(-0.3, -6.2, 0, 3.0, 0.25, "trunk", segments=10)  # zelkova
    for dx, dz, dy, r in ((0, 0, 5.0, 2.0), (-1.4, 0.3, 4.5, 1.6), (1.4, -0.2, 4.6, 1.7), (0.3, 1.2, 4.3, 1.5)):
        k.ball(-0.3 + dx, dy, -6.2 + dz, r, "dirt", shade=1.25)
    k.rect(-8, 2, -8, -7.85, 0, 1.2, "curb", shade=0.92)  # block wall, back
    k.rect(-8, -7.85, -8, 2, 0, 1.2, "curb", shade=0.92)  # block wall, left
    k.rect(1.3, 1.9, -7.8, -4.2, 0, 1.0, "foliageDark")  # hedge


def vehicles_and_people(k: Blockout) -> None:
    k.rect(3.61, 5.09, -7.3, -3.9, ROAD_Y + 0.15, ROAD_Y + 0.95, "insulator", bevel=0.08)  # kei car body
    k.rect(3.66, 5.04, -6.8, -4.0, ROAD_Y + 0.95, ROAD_Y + 1.7, "insulator", shade=0.95, bevel=0.08)
    for x, z, h in ((-0.8, 2.2, 1.6), (-5.3, 2.4, 1.7), (5.6, 1.8, 1.65)):
        y0 = ROAD_Y if x > 3.5 else 0
        k.post(x, z, y0, h - 0.25, 0.2, "poleConcrete", shade=1.1, segments=10)
        k.ball(x, y0 + h - 0.12, z, 0.13, "poleConcrete", shade=1.1)


def render() -> None:
    palette = load_palette()
    builder = MeshBuilder("_hero_blockout", palette)
    k = Blockout(builder)
    base(k)
    road_markings(k)
    building(k)
    street_furniture(k)
    nature(k)
    vehicles_and_people(k)
    blockout = builder.to_object()

    glb = MODELS_DIR / "_dev" / "hero_blockout.glb"
    export_glb(blockout, glb)
    print(f"[blockout] {glb} ({triangle_count(blockout)} tris, {glb.stat().st_size / 1024:.0f} KB)")

    backdrop = Blockout(MeshBuilder("_backdrop", palette))  # render-only floor, not exported
    backdrop.rect(-40, 40, -40, 40, -1.40, -1.36, "poleConcrete", shade=0.75)
    backdrop.b.to_object()

    PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
    preview._set_world((0.52, 0.60, 0.72), 0.9)
    preview._add_sun("_sun", (1.0, 0.93, 0.82), 3.2, 50, -35)

    # Hero view: front-right, azimuth 45°, elevation 35°, horizontal FOV ≈ 28°.
    preview._setup_render(1300, 1100)
    target = Vector(to_blender(0, 3.8, 0))
    elevation = math.radians(35)
    direction = Vector(to_blender(math.cos(elevation) * math.sin(math.pi / 4), math.sin(elevation), math.cos(elevation) * math.cos(math.pi / 4)))
    preview._add_camera(target + direction * 62, target, lens=72)
    preview._render(PREVIEWS_DIR / "hero_blockout_view.png")

    # Top-down: the camera sits a hair toward the front so the image's up
    # vector resolves to the back (−Z) and the front road lands at the bottom.
    bpy.data.objects.remove(bpy.context.scene.camera, do_unlink=True)
    preview._setup_render(1000, 1000)
    preview._add_camera(Vector((0, -0.001, 40)), Vector((0, 0, 0)), ortho_scale=17)
    preview._render(PREVIEWS_DIR / "hero_blockout_top.png")


reset_scene()
render()
