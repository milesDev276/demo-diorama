"""Building module: shopfront bay for the ground floor, 1.82 × 3.2 m.

Two sliding door leaves (frames only: an open frame reads as glass at this
scale) in front of the shop's interior — a lit back wall of shelves stocked
with bottles and boxes, and crates on the floor, as in a 酒屋. A plaster
fascia above and an awning 1.0 m deep at y 2.6 … 2.8 that runs on into the
neighboring bays. The interior is open at both ends so that bays join into
one room; building_shop_side_01 closes a run. No baked AO or grime.
"""

import random

from lib.facade import (  # noqa: F401
    BAY,
    FRAME,
    GLASS,
    GROUND_FLOOR,
    HALF,
    SHOP_BACK,
    SHOP_FRONT,
    SHOP_OPENING_TOP,
    WEATHER,
    belt_course,
    wall_piece,
)

NAME = "building_bay_shopfront_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

DOOR_TOP = 2.3
OPENING_TOP = SHOP_OPENING_TOP
DOOR_Y = 0.07

SHELF_DEPTH = 0.2
SHELVES = (0.42, 0.87, 1.32, 1.77)

BOXES = ["canBlue", "signRed", "canYellow", "insulator", "shopAwningLight", "clothBeige"]
BOTTLES = ["canGreen", "woodTrim", "insulator", "vendingBody", "canBlue"]


def build(b) -> None:
    rng = random.Random(NAME)
    wall_piece(b, -HALF, HALF, OPENING_TOP, GROUND_FLOOR)  # fascia
    belt_course(b, GROUND_FLOOR)
    for x in (-HALF + 0.025, HALF - 0.025):
        b.box((0.05, 0.11, OPENING_TOP), (x, 0.065, OPENING_TOP / 2), FRAME, shade=0.92)  # bay posts
    b.box((BAY, 0.11, 0.1), (0, 0.065, 0.05), "vendingDark", shade=1.3)  # threshold

    _interior(b, rng)
    _doors(b)

    # Awning: sloped canvas with a valance
    b.extrude(
        [(0.0, 2.8), (-1.0, 2.6), (-1.0, 2.43), (-0.985, 2.43), (-0.985, 2.57), (0.0, 2.765)],
        BAY,
        (0, 0, 0),
        "shopAwning",
        axis="x",
    )


def _interior(b, rng: random.Random) -> None:
    """The room behind the doors. The floor takes the shop light; the back
    wall, the shelves and the goods are emissive, so the shop reads as lit."""
    depth = SHOP_BACK - SHOP_FRONT
    b.box((BAY, depth, 0.02), (0, SHOP_FRONT + depth / 2, 0.09), "sidewalkConcrete", shade=0.82)
    b.box((BAY, 0.03, OPENING_TOP), (0, SHOP_BACK + 0.015, OPENING_TOP / 2), GLASS, shade=0.95, material="emissive")

    shelf_y = SHOP_BACK - SHELF_DEPTH / 2
    goods_y = SHOP_BACK - SHELF_DEPTH + 0.07
    for z in SHELVES:
        b.box((BAY, SHELF_DEPTH, 0.025), (0, shelf_y, z), "woodTrim", shade=1.5, material="emissive")
        x = -HALF + 0.08
        while x < HALF - 0.2:
            if rng.random() < 0.55:
                radius = rng.uniform(0.03, 0.04)
                height = rng.uniform(0.2, 0.3)
                color = rng.choice(BOTTLES)
                shade = rng.uniform(0.85, 1.05)
                b.cylinder(radius, height * 0.7, (x + radius, goods_y, z + 0.0125), color, shade=shade, segments=6, material="emissive")
                b.cylinder(
                    radius * 0.4, height * 0.3, (x + radius, goods_y, z + 0.0125 + height * 0.7), color,
                    shade=shade, segments=6, material="emissive",
                )  # neck
                x += radius * 2 + rng.uniform(0.012, 0.03)
            else:
                w = rng.uniform(0.08, 0.16)
                h = rng.uniform(0.12, 0.26)
                b.box(
                    (w, 0.12, h), (x + w / 2, goods_y, z + 0.0125 + h / 2), rng.choice(BOXES),
                    shade=rng.uniform(0.85, 1.05), material="emissive",
                )
                x += w + rng.uniform(0.015, 0.05)

    # Crates on the floor in front of the shelves: two beer crates and a carton
    for i, color in enumerate(("canYellow", "signRed")):
        b.box((0.4, 0.3, 0.25), (-0.5, 0.33, 0.225 + i * 0.26), color, shade=0.95, bevel=0.01, segments=1, material="emissive")
    b.box((0.36, 0.28, 0.3), (0.48, 0.33, 0.25), "clothBeige", shade=0.95, material="emissive")


def _doors(b) -> None:
    """Sliding door leaves: aluminium stiles, a top rail, a mid rail and a kick panel; a transom bar above."""
    leaf = (BAY - 0.1) / 2
    for i, cx in enumerate((-leaf / 2, leaf / 2)):
        y = DOOR_Y + (-0.012 if i else 0.0)
        for sx in (cx - leaf / 2 + 0.02, cx + leaf / 2 - 0.02):
            b.box((0.04, 0.025, DOOR_TOP - 0.1), (sx, y, 0.1 + (DOOR_TOP - 0.1) / 2), FRAME)
        b.box((leaf, 0.025, 0.04), (cx, y, DOOR_TOP - 0.02), FRAME)
        b.box((leaf - 0.08, 0.02, 0.025), (cx, y, 1.05), FRAME)  # mid rail
        b.box((leaf - 0.08, 0.02, 0.22), (cx, y, 0.21), FRAME, shade=0.9)  # kick panel
    b.box((BAY - 0.1, 0.06, 0.05), (0, DOOR_Y, DOOR_TOP + 0.025), FRAME, shade=0.9)
