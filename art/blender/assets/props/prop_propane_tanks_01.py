"""Propane cylinders (プロパンガス), 0.9 × 0.45 m, ≈ 1.35 m tall.

Two 50 kg cylinders on a small concrete pad against a house wall, held by
a chain to a wall bracket, with the valve guards on top, a regulator
between them and the pipe going into the wall. The wall is behind (+Y); the
front faces −Y. No baked AO or grime.
"""

NAME = "prop_propane_tanks_01"
CATEGORY = "props"
TRI_BUDGET = 2000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

R = 0.185  # cylinder radius
BODY = 1.0
XS = (-0.21, 0.21)
Y = -0.02
BACK = 0.22  # the wall face


def build(b) -> None:
    b.box((0.9, 0.45, 0.05), (0, 0, 0.025), "concreteSlab", shade=1.03)  # pad
    for x in XS:
        _cylinder(b, x)

    # Chain round both cylinders to a bracket on the wall
    z = 0.82
    b.tube(
        [(-0.4, BACK, z), (-0.4, Y - 0.12, z), (-0.21, Y - R - 0.01, z), (0.0, Y - 0.16, z), (0.21, Y - R - 0.01, z), (0.4, Y - 0.12, z), (0.4, BACK, z)],
        0.01,
        "vendingDark",
        shade=1.3,
        sides=4,
    )
    b.box((0.86, 0.03, 0.06), (0, BACK - 0.015, z), "signPost", shade=0.9)  # wall bracket

    # Regulator between the valves, and the pipe from it into the wall
    top = 0.05 + BODY + 0.12
    b.box((0.12, 0.1, 0.12), (0, Y + 0.02, top + 0.08), "signPost", bevel=0.01, segments=1)
    for x in XS:
        b.tube([(x * 0.55, Y + 0.02, top + 0.08), (x, Y, top + 0.1)], 0.012, "signPost", shade=0.8, sides=5)
    b.tube([(0, Y + 0.07, top + 0.08), (0, BACK - 0.01, top + 0.08), (0, BACK - 0.01, 0.6)], 0.016, "signPost", shade=0.85, sides=6)


def _cylinder(b, x: float) -> None:
    b.cylinder(R - 0.02, 0.05, (x, Y, 0.05), "vendingDark", shade=1.4, segments=12)  # foot ring
    b.cylinder(R, BODY, (x, Y, 0.1), "propaneBlue", segments=16)
    b.cylinder(R, 0.1, (x, Y, 0.1 + BODY), "propaneBlue", segments=16, radius_top=0.1)  # shoulder
    b.cylinder(R + 0.004, 0.03, (x, Y, 0.6), "propaneBlue", shade=0.85, segments=16)  # weld seam
    # Valve guard (プロテクター): an open collar round the valve
    guard = 0.2 + BODY
    b.cylinder(0.1, 0.13, (x, Y, guard - 0.02), "propaneBlue", shade=0.9, segments=10)
    b.cylinder(0.035, 0.08, (x, Y, guard + 0.08), "signPost", segments=6)
