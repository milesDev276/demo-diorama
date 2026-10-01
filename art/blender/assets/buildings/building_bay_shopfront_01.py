"""Building module: shopfront bay for the ground floor, 1.82 × 3.2 m.

Two glass sliding doors (the lit shop interior behind them, with shelves of
goods showing through), a lit transom, a plaster fascia above and an awning
1.0 m deep at y 2.6 … 2.8 that runs on into the neighboring bays. No baked
AO or grime.
"""

import random

from lib.facade import BAY, FRAME, GLASS, GROUND_FLOOR, HALF, WEATHER, belt_course, wall_piece  # noqa: F401

NAME = "building_bay_shopfront_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

DOOR_TOP = 2.3
OPENING_TOP = 2.62
GLASS_Y = 0.07

GOODS = ["canBlue", "signRed", "canYellow", "canGreen", "insulator", "shopAwningLight", "clothBeige"]


def build(b) -> None:
    rng = random.Random(NAME)
    wall_piece(b, -HALF, HALF, OPENING_TOP, GROUND_FLOOR)  # fascia
    belt_course(b, GROUND_FLOOR)
    for x in (-HALF + 0.025, HALF - 0.025):
        b.box((0.05, 0.11, OPENING_TOP), (x, 0.065, OPENING_TOP / 2), FRAME, shade=0.92)  # bay posts
    b.box((BAY, 0.11, 0.1), (0, 0.065, 0.05), "vendingDark", shade=1.3)  # threshold

    # Lit interior behind the glass, then shelves of goods in front of it
    b.box((BAY - 0.1, 0.012, OPENING_TOP - 0.1), (0, GLASS_Y + 0.03, 0.1 + (OPENING_TOP - 0.1) / 2), GLASS, material="emissive")
    for z in (0.55, 1.0, 1.45):
        b.box((BAY - 0.2, 0.01, 0.025), (0, GLASS_Y + 0.02, z), "woodTrim", shade=1.3, material="emissive")
        x = -HALF + 0.16
        while x < HALF - 0.3:
            w = rng.uniform(0.07, 0.15)
            h = rng.uniform(0.14, 0.3)
            b.box(
                (w, 0.01, h),
                (x + w / 2, GLASS_Y + 0.018, z + 0.0125 + h / 2),
                rng.choice(GOODS),
                shade=rng.uniform(0.85, 1.05),
                material="emissive",
            )
            x += w + rng.uniform(0.015, 0.05)

    # Door leaves: aluminium frames and kick panels; transom bar above
    leaf = (BAY - 0.1) / 2
    for i, cx in enumerate((-leaf / 2, leaf / 2)):
        y = GLASS_Y + (-0.012 if i else 0.0)
        for sx in (cx - leaf / 2 + 0.02, cx + leaf / 2 - 0.02):
            b.box((0.04, 0.025, DOOR_TOP - 0.1), (sx, y, 0.1 + (DOOR_TOP - 0.1) / 2), FRAME)
        b.box((leaf, 0.025, 0.04), (cx, y, DOOR_TOP - 0.02), FRAME)
        b.box((leaf - 0.08, 0.02, 0.22), (cx, y, 0.21), FRAME, shade=0.9)  # kick panel
    b.box((BAY - 0.1, 0.06, 0.05), (0, GLASS_Y, DOOR_TOP + 0.025), FRAME, shade=0.9)

    # Awning: sloped canvas with a valance
    b.extrude(
        [(0.0, 2.8), (-1.0, 2.6), (-1.0, 2.43), (-0.985, 2.43), (-0.985, 2.57), (0.0, 2.765)],
        BAY,
        (0, 0, 0),
        "shopAwning",
        axis="x",
    )
