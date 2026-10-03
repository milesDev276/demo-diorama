"""Two-storey Japanese house (一戸建て), 6.37 × 5.46 m (3.5 × 3 ken), ridge ≈ 7.3 m.

Siding below and plaster above a belt course, under a dark tile gable roof
with deep eaves whose ridge runs along X. The front has the entrance with
its small canopy and step on the right, a floor-length sliding window on
the left and two windows upstairs; the other walls have plain windows. The
glass is emissive, so rooms read as lit. Front faces −Y. No baked AO or grime.
"""

import math

NAME = "building_house_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 6.37, 5.46
FOUNDATION = 0.35
FLOOR_LINE = 3.05
EAVE = 5.7  # top of the side walls

SLOPE = 0.5  # rise per meter: 5寸勾配
OVERHANG = 0.55  # eaves, front and back
VERGE = 0.4  # roof past the gable walls
ROOF_T = 0.12

FRAME = "signPost"
GLASS = "windowGlow"


def build(b) -> None:
    _walls(b)
    _roof(b)
    _entrance(b)

    _window(b, "front", -1.45, 2.5, 0.45, 2.35, panes=2)  # 掃き出し窓
    _window(b, "front", -1.45, 1.8, 3.95, 5.05)
    _window(b, "front", 1.75, 1.5, 3.95, 5.05)
    _window(b, "back", -1.6, 1.5, 1.2, 2.3)
    _window(b, "back", 1.5, 0.7, 1.5, 2.2, panes=1)
    _window(b, "back", 0.0, 1.5, 3.95, 5.05)
    _window(b, "left", 0.4, 1.5, 1.2, 2.3)
    _window(b, "left", -0.6, 1.2, 3.95, 5.05)
    _window(b, "right", 0.9, 0.7, 1.5, 2.2, panes=1)
    _window(b, "right", -0.2, 1.5, 3.95, 5.05)

    # Rain downpipe at the front left corner
    b.cylinder(0.04, EAVE - 0.3, (-W / 2 + 0.12, -D / 2 - 0.06, 0.0), FRAME, shade=0.85, segments=6)


def _on_wall(face: str, u: float, out: float, z: float, width: float, depth: float, height: float):
    """Size and center of a box on one of the four walls: `u` along the wall,
    `out` how far its middle stands off the wall plane."""
    if face == "front":
        return (width, depth, height), (u, -D / 2 - out, z)
    if face == "back":
        return (width, depth, height), (u, D / 2 + out, z)
    if face == "left":
        return (depth, width, height), (-W / 2 - out, u, z)
    return (depth, width, height), (W / 2 + out, u, z)


def _walls(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUNDATION), (0, 0, FOUNDATION / 2), "foundation")
    b.box((W, D, FLOOR_LINE - FOUNDATION), (0, 0, (FOUNDATION + FLOOR_LINE) / 2), "wallSiding")
    b.box((W, D, EAVE - FLOOR_LINE), (0, 0, (FLOOR_LINE + EAVE) / 2), "wallPlaster")
    b.box((W + 0.05, D + 0.05, 0.09), (0, 0, FLOOR_LINE), "wallPlaster", shade=0.88)  # belt course
    # Gable walls up to the ridge
    b.extrude([(-D / 2, EAVE), (D / 2, EAVE), (0, EAVE + D / 2 * SLOPE)], W, (0, 0, 0), "wallPlaster", axis="x")


def _roof(b) -> None:
    """Two slabs meeting at the ridge, with raised ribs down the slope so the
    roof reads as tile, and a ridge cap."""
    angle = math.atan(SLOPE)
    deg = math.degrees(angle)
    half = D / 2 + OVERHANG
    length = W + 2 * VERGE
    slope_len = half / math.cos(angle)
    ridge = EAVE + D / 2 * SLOPE + ROOF_T / 2
    for side, turn in ((-1, deg), (1, -deg)):  # front slope, back slope
        cy = side * half / 2
        cz = ridge - half / 2 * SLOPE
        b.box((length, slope_len + 0.04, ROOF_T), (0, cy, cz), "roofTile", rotation=(turn, 0, 0))
        # Normal of this slope, to lift the ribs onto its top face
        ny, nz = side * math.sin(angle), math.cos(angle)
        lift = ROOF_T / 2 + 0.02
        ribs = 15
        for i in range(ribs):
            x = -length / 2 + 0.12 + i * (length - 0.24) / (ribs - 1)
            b.box((0.09, slope_len, 0.05), (x, cy + ny * lift, cz + nz * lift), "roofTile", shade=0.86, rotation=(turn, 0, 0))
    b.box((length + 0.06, 0.34, 0.16), (0, 0, ridge + 0.06), "roofTile", shade=0.8, bevel=0.03, segments=1)


def _entrance(b) -> None:
    x = 1.75
    front = -D / 2
    b.box((1.7, 0.7, 0.18), (x, front - 0.35, 0.09), "sidewalkConcrete")  # step
    b.box((1.16, 0.08, 2.2), (x, front - 0.02, FOUNDATION + 1.1), "woodTrim", shade=0.9)  # frame
    b.box((0.98, 0.06, 2.05), (x, front - 0.05, FOUNDATION + 1.025), "doorDark")
    b.box((0.16, 0.02, 1.3), (x + 0.25, front - 0.085, FOUNDATION + 1.15), GLASS, shade=0.86, material="emissive")  # light slit
    b.box((0.03, 0.05, 0.3), (x - 0.34, front - 0.1, FOUNDATION + 1.05), FRAME)  # handle
    # Canopy (庇) on two brackets
    b.box((1.8, 0.85, 0.06), (x, front - 0.4, 2.72), "roofTile", rotation=(10, 0, 0))
    for bx in (x - 0.8, x + 0.8):
        b.box((0.05, 0.6, 0.05), (bx, front - 0.3, 2.62), "woodTrim", rotation=(10, 0, 0))


def _window(b, face: str, u: float, width: float, z0: float, z1: float, panes: int = 2) -> None:
    """Aluminium sliding window standing just proud of the wall, with a sill."""
    h = z1 - z0
    cz = (z0 + z1) / 2
    b.box(*_on_wall(face, u, 0.0, cz, width + 0.1, 0.1, h + 0.1), FRAME)
    b.box(*_on_wall(face, u, 0.04, cz, width, 0.03, h), GLASS, shade=0.86, material="emissive")
    for i in range(1, panes):
        b.box(*_on_wall(face, u - width / 2 + i * width / panes, 0.055, cz, 0.04, 0.02, h), FRAME, shade=0.95)
    b.box(*_on_wall(face, u, 0.05, z0 - 0.07, width + 0.2, 0.14, 0.04), FRAME, shade=0.9)
