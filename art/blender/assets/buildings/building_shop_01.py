"""Small neighborhood shop (商店), 5.46 × 4.6 m (3 ken wide), ≈ 4.0 m tall.

A one-storey siding box under a roof slab that slopes slightly to the back.
The front is all sliding glass in aluminium frames, with a shallow lit room
of stocked shelves behind it, under a cloth awning and a signboard with the
shop's name (atlas cell `shop_sign`); crates of goods stand by the door. A
frosted window on the left wall and a back door. Front faces −Y. No baked AO
or grime.
"""

import random

from lib.interior import stock_shelf

NAME = "building_shop_01"
CATEGORY = "buildings"
TRI_BUDGET = 4500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 5.46, 4.6
FRONT = -D / 2
FOUNDATION = 0.2
WALL_TOP = 3.5

GLASS_W = 4.6
GLASS_TOP = 2.3
ROOM_DEPTH = 0.9  # a shadow box: as deep as the shelves need to read from the street

SIGN_W, SIGN_H = 3.3, 0.525  # the shape of the atlas cell

FRAME = "signPost"
GLOW = "windowGlow"
PANE = "glassPane"


def build(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUNDATION), (0, 0, FOUNDATION / 2), "foundation")
    _walls(b)
    # Roof: a slab tilted 3° toward the back, with a fascia at the front
    b.box((W + 0.3, D + 0.4, 0.1), (0, 0, WALL_TOP + 0.14), "roofTile", rotation=(-3, 0, 0), bevel=0.01, segments=1)
    b.box((W + 0.3, 0.06, 0.2), (0, FRONT - 0.17, WALL_TOP + 0.02), "roofTile", shade=0.9)

    _room(b)
    _shopfront(b)
    b.box((SIGN_W, 0.08, SIGN_H), (0, FRONT - 0.04, 3.17), "signBoard", print="shop_sign")  # signboard (看板)

    # Awning: sloped canvas with a valance
    b.extrude(
        [(FRONT, 2.85), (FRONT - 1.0, 2.6), (FRONT - 1.0, 2.42), (FRONT - 0.985, 2.42), (FRONT - 0.985, 2.57), (FRONT, 2.815)],
        W - 0.2,
        (0, 0, 0),
        "shopAwning",
        axis="x",
    )

    # Goods by the door: two beer crates and a carton
    for i, color in enumerate(("canYellow", "signRed")):
        b.box((0.42, 0.32, 0.26), (-2.05, FRONT - 0.3, 0.13 + i * 0.27), color, shade=0.95, bevel=0.01, segments=1)
    b.box((0.4, 0.3, 0.3), (2.1, FRONT - 0.28, 0.15), "clothBeige", shade=0.95)

    # Left wall window (frosted, lit), back door
    b.box((0.1, 1.3, 1.1), (-W / 2, 0.3, 1.75), FRAME)
    b.box((0.03, 1.2, 1.0), (-W / 2 - 0.04, 0.3, 1.75), GLOW, shade=0.86, material="emissive")
    b.box((0.02, 0.04, 1.0), (-W / 2 - 0.055, 0.3, 1.75), FRAME, shade=0.95)
    b.box((0.9, 0.06, 2.0), (1.5, D / 2 + 0.01, FOUNDATION + 1.0), "doorDark")


def _walls(b) -> None:
    """The box, with the room cut out of its front: a side wall at each end
    (one face each, so the siding has no seam), the block behind the room and
    the block over it."""
    pier = (W - GLASS_W) / 2
    height = WALL_TOP - FOUNDATION
    for side in (-1, 1):
        b.box((pier, D, height), (side * (W - pier) / 2, 0, FOUNDATION + height / 2), "wallSiding")
    b.box((GLASS_W, D - ROOM_DEPTH, height), (0, ROOM_DEPTH / 2, FOUNDATION + height / 2), "wallSiding")
    b.box((GLASS_W, ROOM_DEPTH, WALL_TOP - GLASS_TOP), (0, FRONT + ROOM_DEPTH / 2, (WALL_TOP + GLASS_TOP) / 2), "wallSiding")


def _room(b) -> None:
    """What the glass shows: a lit back wall with three shelves of goods, a counter and crates."""
    rng = random.Random(NAME)
    back = FRONT + ROOM_DEPTH
    height = GLASS_TOP - FOUNDATION
    b.box((GLASS_W, ROOM_DEPTH, 0.02), (0, FRONT + ROOM_DEPTH / 2, FOUNDATION + 0.01), "sidewalkConcrete", shade=0.82)
    b.box((GLASS_W, 0.03, height), (0, back - 0.015, FOUNDATION + height / 2), GLOW, shade=0.95, material="emissive")
    for side in (-1, 1):
        b.box((0.03, ROOM_DEPTH, height), (side * (GLASS_W / 2 - 0.015), FRONT + ROOM_DEPTH / 2, FOUNDATION + height / 2), GLOW, shade=0.9, material="emissive")

    for z in (0.75, 1.25, 1.75):
        b.box((GLASS_W - 0.06, 0.24, 0.025), (0, back - 0.15, z), "woodTrim", shade=1.5, material="emissive")
        stock_shelf(b, rng, -GLASS_W / 2 + 0.03, GLASS_W / 2 - 0.03, back - 0.16, z + 0.0125, bottles=0.2)

    # Counter with a till on the right, crates on the left
    b.box((1.1, 0.4, 0.75), (1.45, FRONT + 0.42, FOUNDATION + 0.375), "woodTrim", shade=1.6, material="emissive")
    b.box((0.26, 0.24, 0.18), (1.7, FRONT + 0.42, FOUNDATION + 0.84), "vendingPanel", shade=0.9, material="emissive")
    for i, color in enumerate(("canBlue", "canYellow")):
        b.box((0.4, 0.3, 0.25), (-1.6, FRONT + 0.4, FOUNDATION + 0.145 + i * 0.26), color, shade=0.95, material="emissive")


def _shopfront(b) -> None:
    """Four sliding glass leaves in an aluminium frame, with a kick panel and a mid rail."""
    height = GLASS_TOP - FOUNDATION
    cz = FOUNDATION + height / 2
    y = FRONT - 0.02
    b.box((GLASS_W + 0.12, 0.1, 0.06), (0, y, GLASS_TOP + 0.02), FRAME)  # head
    for side in (-1, 1):
        b.box((0.06, 0.1, height + 0.1), (side * (GLASS_W / 2 + 0.03), y, cz), FRAME)  # jambs
    b.box((GLASS_W, 0.008, height), (0, FRONT - 0.04, cz), PANE, material="glass")
    leaf = GLASS_W / 4
    for i in range(5):
        b.box((0.05, 0.03, height), (-GLASS_W / 2 + i * leaf, FRONT - 0.055, cz), FRAME, shade=0.95)
    b.box((GLASS_W, 0.03, 0.04), (0, FRONT - 0.055, FOUNDATION + 1.0), FRAME, shade=0.95)  # mid rail
    b.box((GLASS_W, 0.035, 0.28), (0, FRONT - 0.05, FOUNDATION + 0.14), FRAME, shade=0.88)  # kick panel
