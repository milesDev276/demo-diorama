"""Elevated rooftop water tank (高架水槽), Ø 1.2 m on a 1.0 m steel stand, 2.2 m tall.

A cream FRP drum with two bands and a shallow conical lid, on four legs
with a platform, and a pipe running down one leg. No baked AO or grime.
"""

NAME = "prop_water_tank_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

STAND = 1.0
RADIUS = 0.6
LEG = 0.44


def build(b) -> None:
    for x in (-LEG, LEG):
        for y in (-LEG, LEG):
            b.box((0.07, 0.07, STAND), (x, y, STAND / 2), "signPost", shade=0.8)
            b.box((0.14, 0.14, 0.02), (x, y, 0.01), "signPost", shade=0.7)  # base plate
    for z in (0.35, STAND - 0.04):
        for y in (-LEG, LEG):
            b.box((2 * LEG, 0.04, 0.04), (0, y, z), "signPost", shade=0.75)
        for x in (-LEG, LEG):
            b.box((0.04, 2 * LEG, 0.04), (x, 0, z), "signPost", shade=0.75)
    b.box((1.06, 1.06, 0.04), (0, 0, STAND - 0.02), "signPost", shade=0.85)  # platform

    b.cylinder(RADIUS, 1.06, (0, 0, STAND), "tankCream", segments=20)
    for z in (STAND + 0.3, STAND + 0.76):
        b.cylinder(RADIUS + 0.012, 0.04, (0, 0, z), "tankCream", shade=0.9, segments=20)
    b.cylinder(RADIUS + 0.02, 0.14, (0, 0, STAND + 1.06), "tankCream", shade=0.95, segments=20, radius_top=0.14)  # lid
    b.cylinder(0.14, 0.03, (0, 0, STAND + 1.2 - 0.03), "signPost", shade=0.9, segments=10)  # hatch

    # Supply pipe: out of the drum, down the front right leg
    b.tube(
        [(0.3, -RADIUS + 0.02, STAND + 0.14), (0.3, -RADIUS - 0.08, STAND + 0.12), (0.3, -RADIUS - 0.08, 0.02)],
        0.03,
        "poleConcrete",
        sides=7,
    )
