"""Two-storey wooden apartment (木造アパート), ≈ 9.1 × 6.6 m, ridge ≈ 6.6 m.

Three narrow units (2.73 m, 1.5 ken) per floor in a siding box under a low
metal gable roof whose front eave runs over an open corridor (外廊下): a
concrete slab on steel columns with a solid steel railing, a door, a
grilled kitchen window and a corridor lamp per unit, washing machines by
some doors. A straight steel stair climbs the right side from the back to
the corridor's landing; under the landing, the residents' mailboxes and the
building's name board (atlas cell `apartment_board`). The back has a sliding
window per unit, small balconies with an AC unit upstairs. Front faces −Y.
No baked AO or grime.
"""

import math

NAME = "building_apartment_01"
CATEGORY = "buildings"
TRI_BUDGET = 7000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

UNIT = 2.73
UNITS = 3
W = UNIT * UNITS  # 8.19
D = 5.46
CORR = 1.1  # corridor depth
LANDING = 0.9  # the corridor runs on past the right wall to the stair

# The body sits left of and behind the middle, so the whole footprint (corridor and stair included) is centered.
BX = -LANDING / 2
BY = CORR / 2
LEFT, RIGHT = BX - W / 2, BX + W / 2
FRONT, BACK = BY - D / 2, BY + D / 2
EDGE = FRONT - CORR  # outer edge of the corridor

FOUNDATION = 0.3
FLOOR2 = 3.0  # top of the corridor slab = upstairs floor
EAVE = 5.8

SLOPE = 0.25  # 2.5寸: a low metal roof
OVERHANG = 0.4
VERGE = 0.3
ROOF_T = 0.1

RISE, RUN, STEPS = 0.2, 0.24, 15  # the stair: 15 rises up to FLOOR2

FRAME = "signPost"
GLASS = "windowGlow"
STEEL = "steelPaint"


def build(b) -> None:
    _body(b)
    _corridor(b)
    _stair(b)
    _roof(b)
    for i in range(UNITS):
        ux = LEFT + (i + 0.5) * UNIT
        for floor_z, washer in ((FOUNDATION, i == 1), (FLOOR2, i != 1)):
            _unit_front(b, ux, floor_z, washer)
        _unit_back(b, ux)
    for floor_z in (FOUNDATION, FLOOR2):
        _window(b, "left", BY, 0.9, floor_z + 1.0, floor_z + 1.9)
        _window(b, "right", BY + 1.4, 0.6, floor_z + 1.2, floor_z + 1.9, panes=1)
    _mailboxes(b)


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


def _body(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUNDATION), (BX, BY, FOUNDATION / 2), "foundation")
    b.box((W, D, EAVE - FOUNDATION), (BX, BY, (FOUNDATION + EAVE) / 2), "wallSiding")
    b.box((W + 0.05, D + 0.05, 0.1), (BX, BY, FLOOR2 - 0.05), "wallSiding", shade=0.86)  # floor band
    # Gable walls from the eave up to the ridge, over the body and the corridor
    half = CORR + D
    ridge = EAVE + half / 2 * SLOPE
    b.extrude([(EDGE, EAVE), (BACK, EAVE), (0, ridge)], W, (BX, 0, 0), "wallSiding", axis="x")
    # Concrete apron under the corridor
    b.box((W + LANDING, CORR, 0.06), (BX + LANDING / 2, FRONT - CORR / 2, 0.03), "sidewalkConcrete")


def _corridor(b) -> None:
    length = W + LANDING
    cx = BX + LANDING / 2
    cy = FRONT - CORR / 2
    b.box((length, CORR, 0.2), (cx, cy, FLOOR2 - 0.1), "concreteSlab")
    b.box((length + 0.02, 0.04, 0.2), (cx, EDGE - 0.01, FLOOR2 - 0.1), "wallSiding", shade=0.92)  # fascia

    # Solid steel railing along the front and both ends, with a top rail
    rail_h = 1.05
    b.box((length, 0.05, rail_h), (cx, EDGE + 0.025, FLOOR2 + rail_h / 2), STEEL)
    b.box((length + 0.04, 0.09, 0.05), (cx, EDGE + 0.03, FLOOR2 + rail_h + 0.02), STEEL, shade=0.8)
    for x in (LEFT + 0.025, RIGHT + LANDING - 0.025):
        b.box((0.05, CORR, rail_h), (x, cy, FLOOR2 + rail_h / 2), STEEL)
    # Pressed ribs on the railing's face, so it reads as sheet steel
    ribs = 14
    for i in range(ribs):
        x = LEFT + 0.3 + i * (length - 0.6) / (ribs - 1)
        b.box((0.04, 0.02, rail_h - 0.15), (x, EDGE - 0.005, FLOOR2 + rail_h / 2), STEEL, shade=0.9)

    # Steel columns from the ground up to the eave beam
    for x in (LEFT + 0.06, BX - UNIT / 2, BX + UNIT / 2, RIGHT + LANDING - 0.06):
        b.box((0.1, 0.1, EAVE), (x, EDGE + 0.08, EAVE / 2), STEEL, shade=0.9)
    b.box((length, 0.12, 0.22), (cx, EDGE + 0.08, EAVE - 0.11), STEEL, shade=0.9)  # eave beam


def _stair(b) -> None:
    """A straight steel stair against the right wall: it rises from the back toward the front and lands on the corridor."""
    x0 = RIGHT + 0.05
    width = LANDING - 0.1
    cx = x0 + width / 2
    run = STEPS * RUN
    for k in range(1, STEPS):
        y = FRONT + (STEPS - k) * RUN - RUN / 2
        b.box((width - 0.08, RUN + 0.02, 0.04), (cx, y, k * RISE - 0.02), STEEL, shade=1.08)
    # Stringers, from the landing's edge down to the ground
    angle = math.degrees(math.atan2(FLOOR2, run))
    length = math.hypot(FLOOR2, run)
    for x in (x0 + 0.03, x0 + width - 0.03):
        b.box((0.06, length, 0.24), (x, FRONT + run / 2, FLOOR2 / 2), STEEL, shade=0.85, rotation=(-angle, 0, 0))
    # Handrail on the open side, on posts
    rail = x0 + width - 0.03
    b.tube([(rail, FRONT, FLOOR2 + 0.9), (rail, FRONT + run, 0.9)], 0.025, STEEL, shade=0.8, sides=6)
    for t in (0.15, 0.5, 0.85):
        y = FRONT + t * run
        z = FLOOR2 * (1 - t)
        b.box((0.035, 0.035, 0.9), (rail, y, z + 0.45), STEEL, shade=0.8)


def _roof(b) -> None:
    """Two metal slabs meeting at the ridge over the middle of body and corridor, with standing seams."""
    angle = math.atan(SLOPE)
    deg = math.degrees(angle)
    span = (CORR + D) / 2
    half = span + OVERHANG
    length = W + LANDING + 2 * VERGE
    cx = BX + LANDING / 2
    slope_len = half / math.cos(angle)
    ridge = EAVE + span * SLOPE + ROOF_T / 2
    for side, turn in ((-1, deg), (1, -deg)):  # front slope, back slope
        cy = side * half / 2
        cz = ridge - half / 2 * SLOPE
        b.box((length, slope_len + 0.04, ROOF_T), (cx, cy, cz), "roofMetal", rotation=(turn, 0, 0))
        ny, nz = side * math.sin(angle), math.cos(angle)
        lift = ROOF_T / 2 + 0.015
        seams = 22
        for i in range(seams):
            x = cx - length / 2 + 0.15 + i * (length - 0.3) / (seams - 1)
            b.box((0.04, slope_len, 0.03), (x + 0, cy + ny * lift, cz + nz * lift), "roofMetal", shade=0.88, rotation=(turn, 0, 0))
    b.box((length + 0.04, 0.3, 0.1), (cx, 0, ridge + 0.04), "roofMetal", shade=0.82)  # ridge cap


def _unit_front(b, ux: float, floor_z: float, washer: bool) -> None:
    """A unit's corridor side: steel door, grilled kitchen window, lamp; a washing machine by some doors."""
    door_x = ux + 0.45
    b.box(*_on_wall("front", door_x, 0.02, floor_z + 1.0, 0.88, 0.06, 2.06), FRAME)
    b.box(*_on_wall("front", door_x, 0.04, floor_z + 0.98, 0.78, 0.05, 1.95), "doorSteel")
    b.box(*_on_wall("front", door_x - 0.3, 0.075, floor_z + 1.0, 0.04, 0.04, 0.18), FRAME, shade=0.8)  # lever
    b.box(*_on_wall("front", door_x, 0.065, floor_z + 1.62, 0.1, 0.02, 0.06), "vendingDark", shade=1.4)  # peephole plate

    # Kitchen window with a grille
    wx, z0, z1 = ux - 0.6, floor_z + 1.05, floor_z + 1.9
    cz = (z0 + z1) / 2
    b.box(*_on_wall("front", wx, 0.0, cz, 0.8, 0.1, z1 - z0 + 0.1), FRAME)
    b.box(*_on_wall("front", wx, 0.04, cz, 0.7, 0.03, z1 - z0), GLASS, shade=0.8, material="emissive")
    for i in range(4):
        b.box(*_on_wall("front", wx - 0.3 + i * 0.2, 0.09, cz, 0.025, 0.025, z1 - z0 + 0.06), FRAME, shade=0.92)
    b.box(*_on_wall("front", wx, 0.09, z0 + 0.12, 0.74, 0.025, 0.025), FRAME, shade=0.92)
    b.box(*_on_wall("front", wx, 0.09, z1 - 0.12, 0.74, 0.025, 0.025), FRAME, shade=0.92)

    # Corridor lamp over the door, and the electric meter beside it
    b.box(*_on_wall("front", door_x - 0.62, 0.05, floor_z + 2.3, 0.16, 0.1, 0.1), "lampWhite", material="emissive")
    b.box(*_on_wall("front", door_x + 0.62, 0.06, floor_z + 2.15, 0.22, 0.12, 0.3), "meterGray")

    if washer:
        wx = ux + 1.1
        y = FRONT - 0.36
        b.box((0.55, 0.58, 0.9), (wx, y, floor_z + 0.45), "acUnit", bevel=0.03, segments=1)
        b.box((0.42, 0.45, 0.03), (wx, y, floor_z + 0.905), "acFan", shade=1.3)  # lid
        b.box((0.4, 0.02, 0.08), (wx, y - 0.3, floor_z + 0.8), "vendingDark", shade=1.6)  # control panel


def _unit_back(b, ux: float) -> None:
    """A unit's garden side: a sliding window per floor, a small balcony with an AC unit upstairs."""
    _window(b, "back", ux, 1.7, FOUNDATION + 0.15, FOUNDATION + 2.05)
    _window(b, "back", ux, 1.7, FLOOR2 + 0.1, FLOOR2 + 2.0)
    depth, width, rail_h = 0.85, UNIT - 0.2, 1.0
    y = BACK + depth / 2
    b.box((width, depth, 0.12), (ux, y, FLOOR2 - 0.06), "concreteSlab")
    b.box((width, 0.04, rail_h), (ux, BACK + depth - 0.02, FLOOR2 + rail_h / 2), STEEL, shade=1.05)
    for side in (-1, 1):
        b.box((0.04, depth, rail_h), (ux + side * (width / 2 - 0.02), y, FLOOR2 + rail_h / 2), STEEL, shade=1.05)
    b.box((0.7, 0.26, 0.55), (ux + 0.85, BACK + 0.3, FLOOR2 + 0.28), "acUnit", bevel=0.02, segments=1)
    b.cylinder(0.17, 0.02, (ux + 0.78, BACK + 0.44, FLOOR2 + 0.28), "acFan", segments=10, axis="y")


def _window(b, face: str, u: float, width: float, z0: float, z1: float, panes: int = 2) -> None:
    """Aluminium sliding window standing just proud of the wall."""
    h = z1 - z0
    cz = (z0 + z1) / 2
    b.box(*_on_wall(face, u, 0.0, cz, width + 0.1, 0.1, h + 0.1), FRAME)
    b.box(*_on_wall(face, u, 0.04, cz, width, 0.03, h), GLASS, shade=0.86, material="emissive")
    for i in range(1, panes):
        b.box(*_on_wall(face, u - width / 2 + i * width / panes, 0.055, cz, 0.04, 0.02, h), FRAME, shade=0.95)


def _mailboxes(b) -> None:
    """Six mail slots on a stand under the landing, facing the street; the name board on the railing above."""
    x = RIGHT + LANDING / 2
    y = EDGE + 0.35
    b.box((0.06, 0.06, 0.95), (x - 0.3, y, 0.475), FRAME)
    b.box((0.06, 0.06, 0.95), (x + 0.3, y, 0.475), FRAME)
    b.box((0.8, 0.32, 0.5), (x, y, 1.2), "doorSteel", shade=0.95, bevel=0.01, segments=1)
    for row in range(2):
        for col in range(3):
            b.box((0.22, 0.02, 0.19), (x - 0.26 + col * 0.26, y - 0.165, 1.08 + row * 0.24), "doorSteel", shade=0.85)
            b.box((0.1, 0.01, 0.02), (x - 0.26 + col * 0.26, y - 0.177, 1.13 + row * 0.24), "vendingDark", shade=1.4)

    b.box((1.1, 0.03, 0.4), (RIGHT + LANDING - 0.6, EDGE - 0.02, FLOOR2 + 0.55), "signBoard", print="apartment_board")
