"""Small workshop (町工場 / garage), 7.28 × 6.37 m (4 × 3.5 ken) plus an outside stair, ≈ 6.2 m tall.

A steel shed clad in corrugated metal (波板) under a low metal shed roof that
falls to the back. The street side is one wide roll-up shutter (シャッター),
half raised over a dark workshop — a concrete floor, a workbench, a pegboard,
tires, a tool chest, a fluorescent tube — and, beside it, an aluminium office
door and window with the outdoor AC unit under it. Upstairs, two office
windows, a gooseneck lamp over the shutter and a painted name board (atlas
cell `workshop_board`). A straight steel stair climbs the right wall to a
landing and the upstairs door. A drum and a stack of pallets by the left
wall. Front faces −Y. No baked AO or grime.
"""

import math

from lib.materials import PAINT_BASE

NAME = "building_workshop_01"
CATEGORY = "buildings"
TRI_BUDGET = 6000
PAINT = "wallMetal"  # the cladding color the user can change (Stage 19); registry's first swatch

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

KEN = 1.82
W, D = 4 * KEN, 3.5 * KEN  # 7.28 × 6.37
STAIR = 0.9  # the stair runs outside the right wall

# The body sits left of the middle, so the whole footprint (stair included) is centered.
BX = -STAIR / 2
LEFT, RIGHT = BX - W / 2, BX + W / 2
FRONT, BACK = -D / 2, D / 2

FOUND = 0.12
FLOOR2 = 3.3  # upstairs floor = the landing
EAVE_F, EAVE_B = 6.0, 5.4  # the shed roof falls to the back
OVERHANG_F, OVERHANG_B, VERGE = 0.3, 0.45, 0.25
ROOF_T = 0.1

# The shutter opening and the room behind it
SH0, SH1 = LEFT + 0.6, LEFT + 4.6
SH_TOP = 3.0
SH_LOW = 1.75  # the shutter is half raised: its bottom bar hangs here
ROOM = 2.8

PITCH, AMP = 0.2, 0.035  # corrugation: wave length and depth

FRAME = "signPost"
GLOW = "windowGlow"
STEEL = "steelPaint"


def build(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUND), (BX, 0, FOUND / 2), "foundation")
    b.box((SH1 - SH0 + 0.4, 0.8, 0.04), ((SH0 + SH1) / 2, FRONT - 0.4, 0.02), "sidewalkConcrete")  # apron
    _core(b)
    _cladding(b)
    _room(b)
    _shutter(b)
    _roof(b)
    _office(b)
    _stair(b)
    _yard(b)


def _on_wall(face: str, u: float, out: float, z: float, width: float, depth: float, height: float):
    """Size and center of a box on one of the four walls: `u` along the wall
    (x for front and back, y for the sides), `out` how far its middle stands off the wall."""
    if face == "front":
        return (width, depth, height), (u, FRONT - out, z)
    if face == "back":
        return (width, depth, height), (u, BACK + out, z)
    if face == "left":
        return (depth, width, height), (LEFT - out, u, z)
    return (depth, width, height), (RIGHT + out, u, z)


def _core(b) -> None:
    """The solid behind the cladding, with the workshop room cut out of its front."""
    inset = 0.02
    h = EAVE_B - FOUND
    cz = FOUND + h / 2
    b.box((SH0 - LEFT - inset, D - 2 * inset, h), ((LEFT + inset + SH0) / 2, 0, cz), PAINT_BASE, material="paint", shade=0.85)
    b.box((RIGHT - SH1 - inset, D - 2 * inset, h), ((SH1 + RIGHT - inset) / 2, 0, cz), PAINT_BASE, material="paint", shade=0.85)
    b.box((SH1 - SH0, D - ROOM - inset, h), ((SH0 + SH1) / 2, (FRONT + ROOM + BACK - inset) / 2, cz), PAINT_BASE, material="paint", shade=0.85)
    b.box((SH1 - SH0, ROOM, EAVE_B - SH_TOP), ((SH0 + SH1) / 2, FRONT + ROOM / 2, (SH_TOP + EAVE_B) / 2), PAINT_BASE, material="paint", shade=0.85)


def _corrugated(b, face: str, u0: float, u1: float, z0: float, z1: float) -> None:
    """A panel of corrugated sheet on one wall: a triangle wave across `u0`–`u1`, from `z0` to `z1`."""
    n = max(1, round((u1 - u0) / PITCH))
    step = (u1 - u0) / n
    wave = []
    for i in range(2 * n + 1):
        u = u0 + i * step / 2
        out = AMP if i % 2 else 0.0
        wave.append((u, out))
    back = -0.02  # the panel's inner face sits just inside the wall
    outline = wave + [(u1, back), (u0, back)]
    if face == "front":
        pts = [(u, FRONT - o) for u, o in outline]
    elif face == "back":
        pts = [(u, BACK + o) for u, o in reversed(outline)]
    elif face == "left":
        pts = [(LEFT - o, u) for u, o in reversed(outline)]
    else:
        pts = [(RIGHT + o, u) for u, o in outline]
    b.extrude(pts, z1 - z0, (0, 0, (z0 + z1) / 2), PAINT_BASE, axis="z", material="paint")


def _cladding(b) -> None:
    # Front: a pier left of the shutter, the office part right of it, the band over it up to the eave
    _corrugated(b, "front", LEFT, SH0, FOUND, SH_TOP)
    _corrugated(b, "front", SH1, RIGHT, FOUND, SH_TOP)
    _corrugated(b, "front", LEFT, RIGHT, SH_TOP, EAVE_F)
    _corrugated(b, "back", LEFT, RIGHT, FOUND, EAVE_B)
    for face in ("left", "right"):
        _corrugated(b, face, FRONT, BACK, FOUND, EAVE_B)
        x = LEFT - 0.01 if face == "left" else RIGHT + 0.01
        # Flashing over the wedge between the back eave and the sloping roof
        b.extrude([(FRONT, EAVE_B), (BACK, EAVE_B), (FRONT, EAVE_F)], 0.06, (x, 0, 0), PAINT_BASE, axis="x", material="paint", shade=0.93)
    # Corner trims
    for x, y in ((LEFT, FRONT), (RIGHT, FRONT), (LEFT, BACK), (RIGHT, BACK)):
        top = EAVE_F if y == FRONT else EAVE_B
        b.box((0.09, 0.09, top - FOUND), (x, y, (FOUND + top) / 2), PAINT_BASE, material="paint", shade=0.8)
    b.box((W + 0.1, 0.08, 0.1), (BX, FRONT - 0.03, SH_TOP + 0.36), PAINT_BASE, material="paint", shade=0.8)  # floor band


def _room(b) -> None:
    """What the half-open shutter shows: a dim workshop."""
    width = SH1 - SH0
    cx = (SH0 + SH1) / 2
    back = FRONT + ROOM
    dark = "workFloor"
    b.box((width, ROOM, 0.02), (cx, FRONT + ROOM / 2, FOUND + 0.01), dark)
    b.box((width, 0.03, SH_TOP - FOUND), (cx, back - 0.015, (FOUND + SH_TOP) / 2), dark, shade=0.62)
    for side in (-1, 1):
        b.box((0.03, ROOM, SH_TOP - FOUND), (cx + side * (width / 2 - 0.015), FRONT + ROOM / 2, (FOUND + SH_TOP) / 2), dark, shade=0.55)
    b.box((width, ROOM, 0.03), (cx, FRONT + ROOM / 2, SH_TOP - 0.015), dark, shade=0.45)
    b.box((1.3, 0.06, 0.05), (cx, FRONT + ROOM / 2, SH_TOP - 0.06), "lampWhite", material="emissive")  # fluorescent tube

    # Workbench along the back wall with a vise, a pegboard of tools over it
    bx = SH0 + 1.2
    b.box((1.8, 0.6, 0.06), (bx, back - 0.33, FOUND + 0.85), "woodLight")
    for dx in (-0.82, 0.82):
        b.box((0.06, 0.5, 0.82), (bx + dx, back - 0.33, FOUND + 0.42), STEEL, shade=0.8)
    b.box((1.7, 0.5, 0.04), (bx, back - 0.33, FOUND + 0.25), STEEL, shade=0.8)  # shelf
    b.box((0.16, 0.2, 0.14), (bx + 0.6, back - 0.5, FOUND + 0.95), "fenceGreen", shade=0.8)  # vise
    b.box((1.6, 0.03, 0.8), (bx, back - 0.045, FOUND + 1.55), "woodLight", shade=0.75)
    for i, (dx, dz, color) in enumerate(((-0.55, 0.2, "signRed"), (-0.2, -0.1, "metalLight"), (0.15, 0.15, "metalLight"), (0.5, -0.05, "canBlue"))):
        b.box((0.08 + 0.04 * (i % 2), 0.03, 0.28), (bx + dx, back - 0.07, FOUND + 1.55 + dz), color, shade=0.9)

    # A red tool chest and a stack of tires on the right
    b.box((0.7, 0.45, 0.95), (SH1 - 0.55, back - 0.3, FOUND + 0.475), "signRed", shade=0.85, bevel=0.015, segments=1)
    for k in range(4):
        b.box((0.66, 0.02, 0.012), (SH1 - 0.55, back - 0.53, FOUND + 0.25 + k * 0.2), "vendingDark", shade=1.3)  # drawer lines
    for k in range(3):
        b.cylinder(0.3, 0.2, (SH1 - 1.0, FRONT + 1.0, FOUND + k * 0.2), "tireRubber", segments=12)
        b.cylinder(0.17, 0.205, (SH1 - 1.0, FRONT + 1.0, FOUND + k * 0.2 - 0.002), "metalLight", shade=0.7, segments=8)


def _shutter(b) -> None:
    """A roll-up shutter half raised: the drum housing, two guide rails, the slats down to the bottom bar."""
    width = SH1 - SH0
    cx = (SH0 + SH1) / 2
    for x in (SH0 + 0.03, SH1 - 0.03):
        b.box((0.08, 0.1, SH_TOP - FOUND), (x, FRONT - 0.05, (FOUND + SH_TOP) / 2), FRAME, shade=0.9)
    b.box((width + 0.2, 0.32, 0.34), (cx, FRONT - 0.16, SH_TOP + 0.17), FRAME, shade=0.95, bevel=0.02, segments=1)  # housing
    h = SH_TOP - SH_LOW
    b.box((width - 0.06, 0.04, h), (cx, FRONT - 0.06, SH_LOW + h / 2), "doorSteel", shade=0.95)
    for k in range(1, int(h / 0.1)):
        b.box((width - 0.06, 0.012, 0.012), (cx, FRONT - 0.082, SH_LOW + k * 0.1), "doorSteel", shade=0.82)
    b.box((width - 0.06, 0.07, 0.07), (cx, FRONT - 0.07, SH_LOW + 0.03), "doorSteel", shade=0.75)  # bottom bar
    b.box((0.18, 0.03, 0.05), (cx, FRONT - 0.11, SH_LOW + 0.03), FRAME, shade=0.7)  # handle

    # Gooseneck lamp over the shutter, between the office windows
    lx = cx + 0.05
    b.tube([(lx, FRONT, 3.62), (lx, FRONT - 0.3, 3.68), (lx, FRONT - 0.46, 3.6)], 0.02, STEEL, shade=0.7, sides=5)
    b.cylinder(0.12, 0.08, (lx, FRONT - 0.48, 3.5), STEEL, shade=0.75, segments=8, radius_top=0.04)
    b.cylinder(0.1, 0.01, (lx, FRONT - 0.48, 3.495), "lampWhite", segments=8, material="emissive")


def _office(b) -> None:
    """The office door and window beside the shutter, the AC unit, the upstairs windows and the name board."""
    door_x = SH1 + 0.85
    b.box(*_on_wall("front", door_x, 0.05, FOUND + 1.03, 0.9, 0.06, 2.06), FRAME)
    b.box(*_on_wall("front", door_x, 0.08, FOUND + 1.4, 0.68, 0.02, 1.1), GLOW, shade=0.78, material="emissive")
    b.box(*_on_wall("front", door_x, 0.08, FOUND + 0.42, 0.7, 0.03, 0.66), FRAME, shade=0.85)  # kick panel
    b.box(*_on_wall("front", door_x + 0.28, 0.1, FOUND + 1.0, 0.04, 0.04, 0.22), FRAME, shade=0.7)  # handle
    b.box((1.1, 0.5, 0.06), (door_x, FRONT - 0.3, FOUND + 2.3), FRAME, shade=0.9)  # small canopy

    _window(b, "front", RIGHT - 0.75, 0.9, FOUND + 1.0, FOUND + 1.9)
    b.box((0.7, 0.26, 0.55), (RIGHT - 0.75, FRONT - 0.2, 0.35), "acUnit", bevel=0.02, segments=1)
    b.cylinder(0.17, 0.02, (RIGHT - 0.82, FRONT - 0.33, 0.35), "acFan", segments=10, axis="y")

    for x in (LEFT + 1.35, LEFT + 3.75):
        _window(b, "front", x, 1.6, FLOOR2 + 0.45, FLOOR2 + 1.35)
    _window(b, "left", 0.4, 1.6, FLOOR2 + 0.45, FLOOR2 + 1.35)
    _window(b, "left", -1.6, 0.9, FOUND + 1.0, FOUND + 1.9)
    _window(b, "back", LEFT + 1.6, 0.9, FLOOR2 + 0.6, FLOOR2 + 1.3, panes=1)
    _window(b, "right", FRONT + 1.2, 0.9, FOUND + 1.0, FOUND + 1.9)

    b.box((3.6, 0.06, 0.6), (LEFT + 2.55, FRONT - 0.08, 5.25), "signBoard", print="workshop_board")
    b.box((3.7, 0.04, 0.7), (LEFT + 2.55, FRONT - 0.05, 5.25), FRAME, shade=0.8)


def _window(b, face: str, u: float, width: float, z0: float, z1: float, panes: int = 2) -> None:
    """Aluminium sliding window standing proud of the corrugation."""
    h = z1 - z0
    cz = (z0 + z1) / 2
    b.box(*_on_wall(face, u, 0.03, cz, width + 0.1, 0.08, h + 0.1), FRAME)
    b.box(*_on_wall(face, u, 0.07, cz, width, 0.02, h), GLOW, shade=0.84, material="emissive")
    for i in range(1, panes):
        b.box(*_on_wall(face, u - width / 2 + i * width / panes, 0.085, cz, 0.04, 0.02, h), FRAME, shade=0.95)


def _roof(b) -> None:
    """A metal shed roof falling to the back, with standing seams, a back gutter and a downpipe."""
    y0, y1 = FRONT - OVERHANG_F, BACK + OVERHANG_B
    slope = (EAVE_F - EAVE_B) / D
    z0 = EAVE_F + OVERHANG_F * slope
    z1 = EAVE_B - OVERHANG_B * slope
    angle = math.atan2(z0 - z1, y1 - y0)
    deg = math.degrees(angle)
    length = W + 2 * VERGE
    slope_len = math.hypot(y1 - y0, z0 - z1)
    cy, cz = (y0 + y1) / 2, (z0 + z1) / 2 + ROOF_T / 2
    b.box((length, slope_len, ROOF_T), (BX, cy, cz), "roofMetal", rotation=(-deg, 0, 0))
    ny, nz = math.sin(angle), math.cos(angle)
    lift = ROOF_T / 2 + 0.015
    seams = 20
    for i in range(seams):
        x = BX - length / 2 + 0.15 + i * (length - 0.3) / (seams - 1)
        b.box((0.04, slope_len, 0.03), (x, cy + ny * lift, cz + nz * lift), "roofMetal", shade=0.88, rotation=(-deg, 0, 0))
    b.box((length, 0.06, 0.18), (BX, y0 - 0.02, z0 - 0.02), "roofMetal", shade=0.8)  # front fascia
    b.box((length, 0.14, 0.1), (BX, y1 + 0.05, z1 - 0.1), FRAME, shade=0.85)  # gutter
    b.tube([(LEFT + 0.2, y1 + 0.05, z1 - 0.1), (LEFT + 0.2, BACK + 0.08, z1 - 0.4), (LEFT + 0.2, BACK + 0.08, 0.1)], 0.04, FRAME, shade=0.85, sides=6)


def _stair(b) -> None:
    """A straight steel stair against the right wall, rising from the front to a landing at the upstairs door."""
    x0 = RIGHT + 0.05
    width = STAIR - 0.1
    cx = x0 + width / 2
    land0, land1 = BACK - 1.45, BACK - 0.1
    start = FRONT + 0.45
    steps = 17
    rise = FLOOR2 / steps
    run = (land0 - start) / steps
    for k in range(1, steps):
        y = start + k * run - run / 2
        b.box((width - 0.08, run + 0.02, 0.04), (cx, y, k * rise - 0.02), STEEL, shade=1.08)
    angle = math.degrees(math.atan2(FLOOR2, land0 - start))
    length = math.hypot(FLOOR2, land0 - start)
    for x in (x0 + 0.03, x0 + width - 0.03):
        b.box((0.06, length, 0.24), (x, (start + land0) / 2, FLOOR2 / 2), STEEL, shade=0.85, rotation=(angle, 0, 0))
    # Landing on two posts, with a railing on its open sides
    b.box((width, land1 - land0, 0.1), (cx, (land0 + land1) / 2, FLOOR2 - 0.05), STEEL)
    for y in (land0 + 0.05, land1 - 0.05):
        b.box((0.08, 0.08, FLOOR2), (x0 + width - 0.05, y, FLOOR2 / 2), STEEL, shade=0.85)
    rail = x0 + width - 0.03
    b.tube([(rail, start, 0.9), (rail, land0, FLOOR2 + 0.9), (rail, land1, FLOOR2 + 0.9), (RIGHT + 0.02, land1, FLOOR2 + 0.9)], 0.025, STEEL, shade=0.8, sides=6)
    for t in (0.2, 0.55, 0.9):
        y = start + t * (land0 - start)
        b.box((0.035, 0.035, 0.9), (rail, y, FLOOR2 * t + 0.45), STEEL, shade=0.8)
    for y in (land0 + 0.6, land1):
        b.box((0.035, 0.035, 0.9), (rail, y, FLOOR2 + 0.45), STEEL, shade=0.8)
    # The upstairs door
    door_y = (land0 + land1) / 2
    b.box(*_on_wall("right", door_y, 0.05, FLOOR2 + 1.0, 0.86, 0.06, 2.0), FRAME)
    b.box(*_on_wall("right", door_y, 0.08, FLOOR2 + 0.98, 0.76, 0.03, 1.9), "doorSteel")
    b.box(*_on_wall("right", door_y + 0.28, 0.11, FLOOR2 + 1.0, 0.04, 0.04, 0.16), FRAME, shade=0.7)


def _yard(b) -> None:
    """A blue drum in front of the pier and a stack of pallets along the left wall."""
    b.cylinder(0.29, 0.88, (LEFT + 0.3, FRONT - 0.42, 0.0), "canBlue", shade=0.85, segments=12)
    for z in (0.3, 0.6):
        b.cylinder(0.3, 0.03, (LEFT + 0.3, FRONT - 0.42, z), "canBlue", shade=0.7, segments=12)
    b.cylinder(0.29, 0.02, (LEFT + 0.3, FRONT - 0.42, 0.88), "canBlue", shade=0.75, segments=12)

    px, py = LEFT - 0.5, FRONT + 1.5
    for k in range(3):
        z = k * 0.14
        b.box((0.8, 1.1, 0.03), (px, py, z + 0.125), "woodLight", shade=0.95 - 0.04 * k)  # deck
        for dy in (-0.45, 0.0, 0.45):
            b.box((0.8, 0.1, 0.095), (px, py + dy, z + 0.0475), "woodLight", shade=0.8)  # runners
