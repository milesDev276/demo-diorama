"""Old two-storey shop with a flat false front (看板建築), 5.46 × 7.28 m (3 × 4 ken), ≈ 7.3 m tall.

A wooden shop-house in siding under a tile gable roof whose ridge runs along
the street, hidden from the front by a flat mortar facade with copper-green
trim: pilasters at both ends, moldings, a raised crest, a row of copper
plaques under the cornice. The shop's name is painted across the band over
the ground floor (atlas cell `oldshop_front`, which also carries the little
red たばこ tag over the tobacco window). Below: four wooden-framed glass
sliding doors before a lit room of stocked shelves under a thin metal
canopy, and at the right end a small tobacco window with a counter shelf.
Upstairs: two windows with iron railings, set back in the facade. Front
faces −Y. No baked AO or grime.
"""

import math
import random

from lib.interior import stock_shelf

NAME = "building_shop_old_01"
CATEGORY = "buildings"
TRI_BUDGET = 6000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

KEN = 1.82
W, D = 3 * KEN, 4 * KEN  # 5.46 × 7.28
FRONT, BACK = -D / 2, D / 2
FOUND = 0.15
FLOOR2 = 3.3
EAVE = 5.9
SLOPE = 0.4
ROOF_T = 0.12
OVERHANG_B, VERGE = 0.5, 0.25

FACADE_T = 0.2  # the false front stands before the body's front wall
FF = FRONT - FACADE_T  # its street face
FF_TOP = 6.8
CREST = 0.4

# Ground floor: the shop doors, a pier, the tobacco window
DOOR0, DOOR1 = -W / 2 + 0.33, 1.35
GLASS_TOP = 2.55
ROOM_DEPTH = 1.0
TOB0, TOB1 = 1.65, 2.45
TOB_Z0, TOB_Z1 = 0.85, 1.95

# Upstairs windows: centers and width, sill and head
UP_X, UP_W = (-1.3, 1.3), 1.5
UP_Z0, UP_Z1 = 4.2, 5.5

FACE = "mortarFront"
TRIM = "copperGreen"
WOOD = "woodTrim"
GLOW = "windowGlow"
PANE = "glassPane"
STEEL = "steelPaint"


def build(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUND), (0, 0, FOUND / 2), "foundation")
    _body(b)
    _roof(b)
    _facade(b)
    _room(b)
    _shopfront(b)
    _tobacco(b)
    _upstairs(b)
    _sides(b)


def _body(b) -> None:
    """The siding box with the shop room and the tobacco nook cut out of its front."""
    h = EAVE - FOUND
    cz = FOUND + h / 2
    # Left of the doors, the pier between doors and tobacco window, right of it
    b.box((DOOR0 + W / 2, D, h), ((-W / 2 + DOOR0) / 2, 0, cz), "wallSiding")
    b.box((W / 2 - DOOR1, D - 0.4, h), ((DOOR1 + W / 2) / 2, 0.2, cz), "wallSiding")
    b.box((W / 2 - DOOR1, 0.4, h - (TOB_Z1 - TOB_Z0)), ((DOOR1 + W / 2) / 2, FRONT + 0.2, cz), "wallSiding", shade=0.98)
    b.box((DOOR1 - DOOR0, D - ROOM_DEPTH, h), ((DOOR0 + DOOR1) / 2, ROOM_DEPTH / 2, cz), "wallSiding")
    b.box((DOOR1 - DOOR0, ROOM_DEPTH, EAVE - GLASS_TOP), ((DOOR0 + DOOR1) / 2, FRONT + ROOM_DEPTH / 2, (EAVE + GLASS_TOP) / 2), "wallSiding")
    # Gables over the side walls, under the roof
    ridge = EAVE + D / 2 * SLOPE
    b.extrude([(FRONT, EAVE), (BACK, EAVE), (0, ridge)], W, (0, 0, 0), "wallSiding", axis="x")
    b.box((W + 0.05, D + 0.05, 0.08), (0, 0, FLOOR2 - 0.04), WOOD, shade=0.9)  # floor band


def _roof(b) -> None:
    """A tile gable roof with its ridge along the street; the front slope starts behind the facade."""
    angle = math.atan(SLOPE)
    deg = math.degrees(angle)
    length = W + 2 * VERGE
    ridge = EAVE + D / 2 * SLOPE + ROOF_T / 2
    for side, turn, over in ((-1, deg, 0.0), (1, -deg, OVERHANG_B)):
        run = D / 2 + over
        slope_len = run / math.cos(angle)
        cy = side * run / 2
        cz = ridge - run / 2 * SLOPE
        b.box((length, slope_len + 0.04, ROOF_T), (0, cy, cz), "roofTile", rotation=(turn, 0, 0))
        ny, nz = side * math.sin(angle), math.cos(angle)
        lift = ROOF_T / 2 + 0.02
        for i in range(10):  # tile rows
            t = (i + 0.5) / 10
            y = side * run * t
            z = ridge - run * t * SLOPE
            b.box((length, 0.05, 0.04), (0, y + ny * lift, z + nz * lift), "roofTile", shade=0.82, rotation=(turn, 0, 0))
    b.box((length + 0.06, 0.3, 0.18), (0, 0, ridge + 0.08), "roofTile", shade=0.75, bevel=0.03, segments=1)  # ridge cap
    b.box((length, 0.12, 0.1), (0, BACK + OVERHANG_B + 0.04, EAVE - OVERHANG_B * SLOPE - 0.08), "signPost", shade=0.85)  # gutter


def _facade(b) -> None:
    """The false front: mortar pieces around the openings, copper-green trim, the painted name band."""
    y = FRONT - FACADE_T / 2
    x0, x1 = -W / 2 - 0.05, W / 2 + 0.05

    def piece(u0: float, u1: float, z0: float, z1: float, shade: float = 1.0) -> None:
        b.box((u1 - u0, FACADE_T, z1 - z0), ((u0 + u1) / 2, y, (z0 + z1) / 2), FACE, shade=shade)

    piece(x0, DOOR0, FOUND, GLASS_TOP)
    piece(DOOR1, TOB0, FOUND, GLASS_TOP)
    piece(TOB0, TOB1, FOUND, TOB_Z0)
    piece(TOB0, TOB1, TOB_Z1, GLASS_TOP)
    piece(TOB1, x1, FOUND, GLASS_TOP)
    piece(x0, x1, GLASS_TOP, UP_Z0)
    edges = [x0]
    for cx in UP_X:
        edges += [cx - UP_W / 2, cx + UP_W / 2]
    edges.append(x1)
    for u0, u1 in zip(edges[::2], edges[1::2]):
        piece(u0, u1, UP_Z0, UP_Z1)
    piece(x0, x1, UP_Z1, FF_TOP)
    piece(-1.2, 1.2, FF_TOP, FF_TOP + CREST)  # raised crest

    # Copper trim: pilasters, moldings, the crest's cap, plaques under the cornice
    for sx in (-1, 1):
        b.box((0.2, 0.06, FF_TOP - FOUND), (sx * (x1 - 0.1), FF - 0.03, (FOUND + FF_TOP) / 2), TRIM)
    b.box((x1 - x0 + 0.16, FACADE_T + 0.16, 0.12), (0, y - 0.04, FF_TOP + 0.06), TRIM, shade=0.92)  # cornice
    b.box((2.56, FACADE_T + 0.14, 0.1), (0, y - 0.03, FF_TOP + CREST + 0.05), TRIM, shade=0.92)
    b.box((x1 - x0 + 0.06, 0.08, 0.08), (0, FF - 0.04, UP_Z1 + 0.06), TRIM)  # molding over the windows
    b.box((x1 - x0 + 0.06, 0.08, 0.08), (0, FF - 0.04, UP_Z0 - 0.05), TRIM)  # molding under them
    for i in range(7):
        b.box((0.42, 0.03, 0.42), (-2.1 + i * 0.7, FF - 0.015, 6.17), TRIM, shade=0.86 if i % 2 else 1.0)

    # The name band, and a thin copper frame round it
    b.box((4.3, 0.04, 0.8), (0.25, FF - 0.02, 3.5), TRIM, shade=0.85)
    b.box((4.2, 0.04, 0.7), (0.25, FF - 0.05, 3.5), "signBoard", print="oldshop_front")

    # Thin metal canopy over the ground floor, on three brackets
    b.box((W + 0.1, 0.7, 0.05), (0, FF - 0.35, 2.68), "roofMetal", rotation=(-4, 0, 0))
    b.box((W + 0.1, 0.03, 0.1), (0, FF - 0.69, 2.64), "roofMetal", shade=0.85)
    for x in (-2.4, 0.0, 2.4):
        b.box((0.04, 0.6, 0.04), (x, FF - 0.3, 2.62), STEEL, shade=0.8)


def _room(b) -> None:
    """What the glass doors show: a lit room of shelves, a counter with a till, crates."""
    rng = random.Random(NAME)
    width = DOOR1 - DOOR0
    cx = (DOOR0 + DOOR1) / 2
    back = FRONT + ROOM_DEPTH
    height = GLASS_TOP - FOUND
    b.box((width, ROOM_DEPTH, 0.02), (cx, FRONT + ROOM_DEPTH / 2, FOUND + 0.01), "sidewalkConcrete", shade=0.8)
    b.box((width, 0.03, height), (cx, back - 0.015, FOUND + height / 2), GLOW, shade=0.95, material="emissive")
    for side in (-1, 1):
        b.box((0.03, ROOM_DEPTH, height), (cx + side * (width / 2 - 0.015), FRONT + ROOM_DEPTH / 2, FOUND + height / 2), GLOW, shade=0.9, material="emissive")
    for z in (0.8, 1.35, 1.9):
        b.box((width - 0.06, 0.24, 0.025), (cx, back - 0.15, z), WOOD, shade=1.5, material="emissive")
        stock_shelf(b, rng, DOOR0 + 0.03, DOOR1 - 0.03, back - 0.16, z + 0.0125, bottles=0.2)
    b.box((0.9, 0.4, 0.75), (DOOR1 - 0.6, FRONT + 0.45, FOUND + 0.375), WOOD, shade=1.6, material="emissive")
    b.box((0.26, 0.24, 0.18), (DOOR1 - 0.45, FRONT + 0.45, FOUND + 0.84), "vendingPanel", shade=0.9, material="emissive")
    for i, color in enumerate(("canYellow", "signRed")):
        b.box((0.4, 0.3, 0.25), (DOOR0 + 0.35, FRONT + 0.4, FOUND + 0.145 + i * 0.26), color, shade=0.95, material="emissive")


def _shopfront(b) -> None:
    """Four wooden-framed glass sliding doors with a kick rail, set in the facade's opening."""
    width = DOOR1 - DOOR0
    cx = (DOOR0 + DOOR1) / 2
    height = GLASS_TOP - FOUND
    cz = FOUND + height / 2
    y = FRONT - 0.06
    b.box((width, 0.008, height), (cx, y, cz), PANE, material="glass")
    leaf = width / 4
    for i in range(5):
        b.box((0.07, 0.05, height), (DOOR0 + i * leaf, y - 0.02, cz), WOOD)
    b.box((width, 0.06, 0.08), (cx, y - 0.02, GLASS_TOP - 0.04), WOOD)  # head
    b.box((width, 0.05, 0.3), (cx, y - 0.02, FOUND + 0.15), WOOD, shade=0.9)  # kick rail
    for z in (1.1, 1.75):  # glazing bars
        b.box((width, 0.04, 0.03), (cx, y - 0.02, z), WOOD, shade=0.95)
    b.box((width + 0.1, FACADE_T + 0.1, 0.04), (cx, FRONT - FACADE_T / 2, FOUND + 0.02), "foundation", shade=0.9)  # sill


def _tobacco(b) -> None:
    """The tobacco window: a small glass slider before a lit nook of cartons, a counter shelf in front."""
    w = TOB1 - TOB0
    cx = (TOB0 + TOB1) / 2
    h = TOB_Z1 - TOB_Z0
    cz = (TOB_Z0 + TOB_Z1) / 2
    nook = 0.35
    b.box((w, 0.03, h), (cx, FRONT + nook, cz), GLOW, shade=0.95, material="emissive")
    for side in (-1, 1):
        b.box((0.03, nook, h), (cx + side * (w / 2 - 0.015), FRONT + nook / 2, cz), GLOW, shade=0.85, material="emissive")
    b.box((w, nook, 0.03), (cx, FRONT + nook / 2, TOB_Z0 + 0.015), WOOD, shade=1.4, material="emissive")
    colors = ("insulator", "signRed", "canBlue", "canYellow", "canGreen", "clothWhite")
    for row in range(3):
        for col in range(6):
            b.box((0.1, 0.03, 0.14), (TOB0 + 0.1 + col * 0.12, FRONT + nook - 0.03, TOB_Z0 + 0.35 + row * 0.22), colors[(col + row) % 6], material="emissive")
    b.box((w, 0.008, h), (cx, FRONT - 0.07, cz), PANE, material="glass")
    b.box((0.04, 0.04, h), (cx, FRONT - 0.09, cz), WOOD)  # meeting stiles
    b.box((w + 0.16, 0.42, 0.05), (cx, FF - 0.17, TOB_Z0 - 0.02), WOOD, shade=1.05)  # counter shelf
    b.box((0.05, 0.3, 0.22), (cx, FF - 0.12, TOB_Z0 - 0.16), WOOD, shade=0.85)  # its bracket


def _upstairs(b) -> None:
    """Two wooden windows set back in the facade, each behind a low iron railing."""
    h = UP_Z1 - UP_Z0
    cz = (UP_Z0 + UP_Z1) / 2
    for cx in UP_X:
        b.box((UP_W, 0.04, h), (cx, FRONT - 0.04, cz), GLOW, shade=0.82, material="emissive")
        for dx in (-UP_W / 2 + 0.03, 0.0, UP_W / 2 - 0.03):
            b.box((0.06, 0.06, h), (cx + dx, FRONT - 0.07, cz), WOOD)
        b.box((UP_W, 0.06, 0.06), (cx, FRONT - 0.07, cz + 0.1), WOOD, shade=0.95)  # transom bar
        b.box((UP_W + 0.06, 0.24, 0.05), (cx, FF - 0.08, UP_Z0 + 0.03), FACE, shade=0.9)  # sill
        rail_y = FF - 0.14
        b.box((UP_W - 0.1, 0.03, 0.03), (cx, rail_y, UP_Z0 + 0.62), STEEL, shade=0.6)
        b.box((UP_W - 0.1, 0.02, 0.02), (cx, rail_y, UP_Z0 + 0.3), STEEL, shade=0.6)
        for k in range(7):
            b.box((0.02, 0.02, 0.56), (cx - UP_W / 2 + 0.1 + k * (UP_W - 0.2) / 6, rail_y, UP_Z0 + 0.34), STEEL, shade=0.6)


def _sides(b) -> None:
    """Side windows, a back door, the meter and the AC unit, a downpipe."""
    for sx in (-1, 1):
        x = sx * W / 2
        for y, z0, z1 in ((0.6, 1.0, 1.9), (-0.8, FLOOR2 + 0.7, FLOOR2 + 1.6), (1.9, FLOOR2 + 0.7, FLOOR2 + 1.6)):
            b.box((0.1, 1.0, z1 - z0 + 0.1), (x + sx * 0.02, y, (z0 + z1) / 2), "signPost")
            b.box((0.03, 0.9, z1 - z0), (x + sx * 0.06, y, (z0 + z1) / 2), GLOW, shade=0.84, material="emissive")
            b.box((0.02, 0.04, z1 - z0), (x + sx * 0.08, y, (z0 + z1) / 2), "signPost", shade=0.95)
    b.box((0.9, 0.06, 2.0), (-1.2, BACK + 0.02, FOUND + 1.0), "doorDark")
    b.box((0.06, 0.24, 0.32), (W / 2 + 0.03, -2.2, 1.6), "meterGray")
    b.box((0.26, 0.7, 0.55), (W / 2 + 0.16, 2.5, FLOOR2 + 0.3), "acUnit", bevel=0.02, segments=1)
    b.cylinder(0.17, 0.02, (W / 2 + 0.29, 2.43, FLOOR2 + 0.3), "acFan", segments=10, axis="x")
    b.box((0.4, 0.5, 0.05), (W / 2 + 0.2, 2.5, FLOOR2 + 0.02), STEEL, shade=0.8)  # its bracket
    b.tube([(-W / 2 - 0.08, BACK + OVERHANG_B, EAVE - 0.3), (-W / 2 - 0.08, BACK + 0.1, EAVE - 0.6), (-W / 2 - 0.08, BACK + 0.1, 0.1)], 0.04, "signPost", shade=0.85, sides=6)
