"""One-storey Japanese house (和風住宅, 平屋), 9.1 × 6.37 m (5 × 3.5 ken) plus an engawa, ridge ≈ 5.6 m.

A raised floor on a plain foundation; dark charred boards (焼杉) below
white plaster, with the posts showing (真壁). A heavy tile 入母屋 roof: a
hipped lower roof with deep eaves, a small gable (妻) above it, hip ridges
and a ridge cap with end tiles. The front has the entrance on the right —
a lattice sliding door (格子戸) under a small tile canopy, a step stone —
and an engawa on the left: a wooden deck before glass doors with shoji
behind them, lit after dark. Lattice windows on the other walls. Front
faces −Y. No baked AO or grime.
"""

import math

NAME = "building_house_traditional_01"
CATEGORY = "buildings"
TRI_BUDGET = 6000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

KEN = 1.82
W, D = 5 * KEN, 3.5 * KEN  # 9.1 × 6.37
FRONT, BACK = -D / 2, D / 2
FLOOR = 0.5  # raised floor
BOARD_TOP = 1.35  # charred boards below, plaster above
EAVE = 3.1

SLOPE = 0.5  # 5寸
OVERHANG = 0.95  # deep eaves, over the engawa
HIP = 1.5  # plan length of the hipped part before the gable starts
ROOF_T = 0.14
VERGE = 0.25  # upper roof past the gable wall

ENGAWA_X = (-W / 2, 1.0)
ENGAWA_DEPTH = 0.9
ENTRANCE_X = 2.75

POST = "woodTrim"
TILE = "roofTile"


def build(b) -> None:
    _walls(b)
    _posts(b)
    _roof(b)
    _entrance(b)
    _engawa(b)
    _lattice_window(b, "back", -2.7, 1.6)
    _lattice_window(b, "back", 1.8, 1.6)
    _lattice_window(b, "left", 0.9, 1.6)
    _lattice_window(b, "right", -0.9, 1.6)
    _lattice_window(b, "right", 1.9, 0.8, z0=1.9)  # high bathroom window


def _on_wall(face: str, u: float, out: float, z: float, width: float, depth: float, height: float):
    """Size and center of a box on one of the four walls: `u` along the wall, `out` how far its middle stands off it."""
    if face == "front":
        return (width, depth, height), (u, FRONT - out, z)
    if face == "back":
        return (width, depth, height), (u, BACK + out, z)
    if face == "left":
        return (depth, width, height), (-W / 2 - out, u, z)
    return (depth, width, height), (W / 2 + out, u, z)


def _walls(b) -> None:
    b.box((W + 0.04, D + 0.04, FLOOR), (0, 0, FLOOR / 2), "foundation", shade=0.95)
    b.box((W, D, BOARD_TOP - FLOOR), (0, 0, (FLOOR + BOARD_TOP) / 2), "charredBoard")
    b.box((W, D, EAVE - BOARD_TOP), (0, 0, (BOARD_TOP + EAVE) / 2), "wallPlaster")
    b.box((W + 0.05, D + 0.05, 0.06), (0, 0, BOARD_TOP + 0.03), POST, shade=0.9)  # rail over the boards
    # Board joints on the charred band
    for face, length in (("front", W), ("back", W), ("left", D), ("right", D)):
        for i in range(1, int(length / 0.45)):
            u = -length / 2 + i * 0.45
            b.box(*_on_wall(face, u, 0.005, (FLOOR + BOARD_TOP) / 2, 0.02, 0.012, BOARD_TOP - FLOOR), "charredBoard", shade=0.75)
    # Under-floor vents in the foundation
    for x in (-3.0, 0.0, 3.0):
        b.box((0.4, 0.02, 0.12), (x, BACK + 0.025, 0.28), "vendingDark", shade=1.3)


def _posts(b) -> None:
    """Exposed posts (真壁) at the corners and every ken on the plaster, and a beam under the eaves."""
    for face, length in (("front", W), ("back", W), ("left", D), ("right", D)):
        n = round(length / KEN)
        for i in range(n + 1):
            u = -length / 2 + i * length / n
            b.box(*_on_wall(face, u, 0.02, (BOARD_TOP + EAVE) / 2, 0.12, 0.04, EAVE - BOARD_TOP), POST)
        b.box(*_on_wall(face, 0, 0.025, EAVE - 0.1, length + 0.1, 0.05, 0.2), POST, shade=0.92)


def _roof(b) -> None:
    """入母屋: a hipped lower roof up to where the gable begins, a gable block above it, two tiled upper slopes."""
    x0, y0 = W / 2 + OVERHANG, D / 2 + OVERHANG  # eave outline
    x1, y1 = x0 - HIP, y0 - HIP  # where the hips end
    z0 = EAVE
    z1 = z0 + HIP * SLOPE
    ridge = z0 + y0 * SLOPE

    # Hipped lower roof: a frustum from the eave outline to the inset rectangle
    corners = [(-x0, -y0, z0), (x0, -y0, z0), (x0, y0, z0), (-x0, y0, z0), (-x1, -y1, z1), (x1, -y1, z1), (x1, y1, z1), (-x1, y1, z1)]
    b.solid(corners, [(0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (3, 2, 1, 0), (4, 5, 6, 7)], TILE)
    b.box((2 * x0 + 0.04, 2 * y0 + 0.04, 0.1), (0, 0, z0 - 0.05), TILE, shade=0.82)  # eave edge (軒先)

    # Gable block: the gable walls are its ends
    b.extrude([(-y1, z1), (y1, z1), (0, ridge)], 2 * x1, (0, 0, 0), "wallPlaster", axis="x")
    for side in (-1, 1):  # a wooden board along each gable's foot
        b.box((0.05, 2 * y1, 0.14), (side * (x1 + 0.025), 0, z1 + 0.07), POST)

    # Upper slopes: slabs from the ridge to where the hips end, past the gables by VERGE
    angle = math.atan(SLOPE)
    deg = math.degrees(angle)
    slope_len = y1 / math.cos(angle)
    length = 2 * (x1 + VERGE)
    for side, turn in ((-1, deg), (1, -deg)):
        cy = side * y1 / 2
        cz = (z1 + ridge) / 2 + ROOF_T / 2 * math.cos(angle)
        b.box((length, slope_len + 0.1, ROOF_T), (0, cy, cz), TILE, rotation=(turn, 0, 0))

    _tile_ribs(b, x0, y0, z0, z1, ridge, x1, y1)

    # Ridge cap with end tiles (鬼瓦)
    b.box((length + 0.1, 0.36, 0.22), (0, 0, ridge + 0.12), TILE, shade=0.78, bevel=0.03, segments=1)
    for side in (-1, 1):
        b.box((0.16, 0.46, 0.4), (side * (length / 2 + 0.08), 0, ridge + 0.18), TILE, shade=0.7, bevel=0.03, segments=1)

    # Hip ridges (隅棟) from the eave corners to where the hips end
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.tube([(sx * x0, sy * y0, z0 + 0.06), (sx * x1, sy * y1, z1 + 0.06)], 0.07, TILE, shade=0.75, sides=6, smooth=False)


def _tile_ribs(b, x0, y0, z0, z1, ridge, x1, y1) -> None:
    """Raised rows of tile down every slope. On the hipped part each row runs from the eave
    to the hip line; on the front and back it goes on, one roof thickness higher, up the upper slope."""
    angle = math.atan(SLOPE)
    deg = math.degrees(angle)
    sin, cos = math.sin(angle), math.cos(angle)
    lift = 0.03
    step = 0.3

    def rib(plan_from: float, plan_to: float, z_from: float, across: float, side: int, raised: float, along_y: bool) -> None:
        plan = plan_to - plan_from
        length = plan / cos
        mid = side * (plan_from + plan_to) / 2
        z = z_from + plan / 2 * SLOPE + cos * raised
        out = side * sin * raised
        if along_y:
            b.box((0.08, length, 0.05), (across, mid + out, z), TILE, shade=0.86, rotation=(-side * deg, 0, 0))
        else:
            b.box((length, 0.08, 0.05), (mid + out, across, z), TILE, shade=0.86, rotation=(0, side * deg, 0))

    for side in (-1, 1):
        # Front and back: rows run in y.
        for i in range(int(2 * x0 / step)):
            x = -x0 + step * (i + 0.5)
            hip = min(HIP, x0 - abs(x))
            if hip > 0.15:
                rib(y0 - hip, y0, z0, x, side, lift, True)
            if abs(x) < x1 + VERGE - 0.1:
                rib(0.15, y1, z1, x, side, ROOF_T + lift, True)
        # Left and right ends: rows run in x.
        for i in range(int(2 * y0 / step)):
            y = -y0 + step * (i + 0.5)
            hip = min(HIP, y0 - abs(y))
            if hip > 0.15:
                rib(x0 - hip, x0, z0, y, side, lift, False)


def _entrance(b) -> None:
    """The entrance (玄関): a lattice sliding door under a small tile canopy, a step stone before it."""
    x = ENTRANCE_X
    door_w, door_h = 1.7, 1.95
    z0 = 0.18  # the entrance floor is lower than the rooms
    b.box((2.1, 0.9, z0), (x, FRONT - 0.45, z0 / 2), "concreteSlab", shade=1.05)  # entrance porch
    b.box((0.9, 0.5, 0.12), (x, FRONT - 1.15, 0.06), "rock", shade=1.05, bevel=0.03, segments=1)  # step stone
    b.box((door_w + 0.2, 0.08, door_h + 0.14), (x, FRONT - 0.02, z0 + door_h / 2 + 0.05), POST)  # frame
    b.box((door_w, 0.04, door_h), (x, FRONT - 0.05, z0 + door_h / 2), "shojiPaper", shade=0.9, material="emissive")
    # Lattice (格子) of the two leaves
    for i in range(1, 12):
        if i == 6:
            continue
        lx = x - door_w / 2 + i * door_w / 12
        b.box((0.03, 0.03, door_h), (lx, FRONT - 0.085, z0 + door_h / 2), "woodLight")
    b.box((0.06, 0.05, door_h), (x, FRONT - 0.09, z0 + door_h / 2), "woodLight", shade=0.85)  # meeting stiles
    for zz in (z0 + 0.35, z0 + door_h - 0.1):
        b.box((door_w, 0.04, 0.05), (x, FRONT - 0.09, zz), "woodLight", shade=0.92)
    # Small tile canopy (庇) on brackets
    b.box((2.3, 1.0, 0.08), (x, FRONT - 0.45, 2.55), TILE, rotation=(12, 0, 0))
    b.box((2.3, 0.08, 0.1), (x, FRONT - 0.94, 2.45), TILE, shade=0.8)
    for bx in (x - 1.0, x + 1.0):
        b.box((0.06, 0.7, 0.06), (bx, FRONT - 0.35, 2.44), POST, rotation=(12, 0, 0))


def _engawa(b) -> None:
    """A wooden deck on short posts before a row of glass doors, with lit shoji behind them."""
    xa, xb = ENGAWA_X
    length = xb - xa
    cx = (xa + xb) / 2
    y = FRONT - ENGAWA_DEPTH / 2
    deck_z = FLOOR - 0.06
    b.box((length, ENGAWA_DEPTH, 0.06), (cx, y, deck_z + 0.03), "woodLight")
    for i in range(1, int(length / 0.3)):
        b.box((0.012, ENGAWA_DEPTH, 0.01), (xa + i * 0.3, y, deck_z + 0.062), "woodLight", shade=0.8)
    for px in (xa + 0.15, cx, xb - 0.15):
        b.box((0.1, 0.1, deck_z), (px, FRONT - ENGAWA_DEPTH + 0.1, deck_z / 2), POST, shade=0.9)
    b.box((0.7, 0.35, 0.18), (cx, FRONT - ENGAWA_DEPTH - 0.3, 0.09), "rock", shade=1.05, bevel=0.03, segments=1)  # step stone

    # Shoji filling the opening, lit from inside, with their lattice
    top = EAVE - 0.35
    height = top - FLOOR
    b.box((length - 0.2, 0.04, height), (cx + 0.05, FRONT - 0.03, FLOOR + height / 2), "shojiPaper", material="emissive")
    for i in range(1, int(length / 0.3)):
        b.box((0.025, 0.03, height), (xa + 0.1 + i * 0.3, FRONT - 0.06, FLOOR + height / 2), "woodLight", shade=0.95)
    for k in range(1, 6):
        b.box((length - 0.2, 0.03, 0.025), (cx + 0.05, FRONT - 0.06, FLOOR + k * height / 6), "woodLight", shade=0.95)
    # Glass doors in front of them: frames only (the panes are not drawn)
    leaves = 4
    leaf = (length - 0.2) / leaves
    for i in range(leaves + 1):
        b.box((0.06, 0.05, height), (xa + 0.15 + i * leaf, FRONT - 0.12, FLOOR + height / 2), POST, shade=0.95)
    for zz in (FLOOR + 0.04, top - 0.03):
        b.box((length - 0.15, 0.05, 0.06), (cx + 0.05, FRONT - 0.12, zz), POST, shade=0.95)
    b.box((length, 0.08, 0.14), (cx, FRONT - 0.04, top + 0.07), POST)  # head rail


def _lattice_window(b, face: str, u: float, width: float, z0: float = 1.25) -> None:
    """A window with a wooden lattice (格子) in front of a lit pane."""
    z1 = 2.45
    h = z1 - z0
    cz = (z0 + z1) / 2
    b.box(*_on_wall(face, u, 0.0, cz, width + 0.12, 0.1, h + 0.12), POST)
    b.box(*_on_wall(face, u, 0.04, cz, width, 0.03, h), "windowGlow", shade=0.82, material="emissive")
    bars = max(3, round(width / 0.12))
    for i in range(1, bars):
        b.box(*_on_wall(face, u - width / 2 + i * width / bars, 0.08, cz, 0.03, 0.03, h), "woodLight", shade=0.9)
