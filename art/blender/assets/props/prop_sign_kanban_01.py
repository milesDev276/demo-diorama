"""Projecting vertical shop sign (袖看板), 0.6 m out from the wall × 2.4 m tall.

A slim box sign on two brackets, with the same printed face (atlas cell
`kanban_sakaya`) on both sides so it reads from either direction along the
street. Wall-mounted: the origin is on the wall plane at the bottom of the
sign, and the sign projects toward −Y. No baked AO or grime.
"""

NAME = "prop_sign_kanban_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

HEIGHT = 2.4
THICK = 0.14
REACH = 0.6  # outer edge, from the wall
GAP = 0.06  # between the wall and the box


def build(b) -> None:
    depth = REACH - GAP
    cy = -(GAP + depth / 2)
    b.box((THICK, depth, HEIGHT), (0, cy, HEIGHT / 2), "vendingDark", shade=1.2, bevel=0.01, segments=1)
    for side, direction in ((-1, "-x"), (1, "+x")):
        b.box(
            (0.006, depth - 0.05, HEIGHT - 0.05),
            (side * (THICK / 2 + 0.002), cy, HEIGHT / 2),
            "signBoard",
            print="kanban_sakaya",
            print_dir=direction,
        )
    for z in (0.35, HEIGHT - 0.35):
        b.box((0.05, GAP + 0.04, 0.05), (0, -GAP / 2, z), "signPost", shade=0.8)  # bracket arm
        b.box((0.12, 0.012, 0.16), (0, -0.006, z), "signPost", shade=0.75)  # wall plate
