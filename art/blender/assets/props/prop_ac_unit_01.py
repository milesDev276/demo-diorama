"""Outdoor air-conditioner unit (室外機), ≈ 0.78 × 0.62 × 0.30 m on a resin stand.

A pale bevelled casing with a round fan grille on the left two-thirds of the
front, a service cover on the right, louvres down the left side and the
taped refrigerant-pipe bundle leaving the right side toward the wall, with a
thin drain hose. Front faces −Y; the wall it would stand against is +Y.
"""

import math

from lib.builder import smooth_path

NAME = "prop_ac_unit_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"grime_height": 0.3}

WIDTH = 0.78
DEPTH = 0.28
STAND = 0.07  # resin stand blocks under the casing
BODY_H = 0.54
FRONT_Y = -DEPTH / 2
BODY_Z = STAND + BODY_H / 2

FAN_X = -0.12
FAN_Z = STAND + 0.27
FAN_R = 0.2


def build(b) -> None:
    _stand(b)
    _casing(b)
    _fan_grille(b)
    _service_side(b)
    _pipes(b)


def _stand(b) -> None:
    for x in (-0.26, 0.26):
        b.box((0.09, DEPTH + 0.06, STAND), (x, 0.0, STAND / 2), "acFan", shade=0.75, bevel=0.006, segments=1)


def _casing(b) -> None:
    b.box((WIDTH, DEPTH, BODY_H), (0, 0, BODY_Z), "acUnit", bevel=0.012, cuts=2)
    b.box((WIDTH + 0.01, DEPTH + 0.01, 0.014), (0, 0, STAND + BODY_H - 0.004), "acUnit", shade=0.95, bevel=0.004, segments=1)
    # Maker badge, no lettering
    b.box((0.08, 0.004, 0.018), (-0.3, FRONT_Y - 0.002, STAND + BODY_H - 0.05), "signPost")
    # Side louvres on the left
    for i in range(6):
        b.box((0.006, 0.2, 0.012), (-WIDTH / 2 - 0.003, 0.0, STAND + 0.12 + i * 0.06), "acUnit", shade=0.85)


def _fan_grille(b) -> None:
    y = FRONT_Y
    b.cylinder(FAN_R, 0.006, (FAN_X, y - 0.004, FAN_Z), "acFan", shade=0.45, segments=20, axis="y")  # dark fan opening
    b.cylinder(0.045, 0.012, (FAN_X, y - 0.012, FAN_Z), "acFan", shade=0.8, segments=10, axis="y")  # fan hub
    ring = [(FAN_X + FAN_R * math.cos(a), y - 0.008, FAN_Z + FAN_R * math.sin(a)) for a in (i * math.tau / 20 for i in range(20))]
    b.tube(ring, 0.009, "acUnit", shade=0.93, sides=4, closed=True, up=(0, 1, 0))
    # Grille: a square grid of thin bars clipped to the circle
    for i in range(-3, 4):
        d = i * 0.052
        half = math.sqrt(max(FAN_R**2 - d**2, 0.0))
        b.box((2 * half, 0.005, 0.007), (FAN_X, y - 0.011, FAN_Z + d), "acUnit", shade=0.9)
        b.box((0.007, 0.005, 2 * half), (FAN_X + d, y - 0.013, FAN_Z), "acUnit", shade=0.9)


def _service_side(b) -> None:
    b.box((0.16, 0.006, 0.44), (0.29, FRONT_Y - 0.003, BODY_Z), "acUnit", shade=0.97, bevel=0.003, segments=1)
    # Valve cover on the right side, where the pipes connect
    b.box((0.02, 0.16, 0.14), (WIDTH / 2 + 0.01, 0.02, STAND + 0.14), "acUnit", shade=0.93, bevel=0.004, segments=1)


def _pipes(b) -> None:
    # Taped pipe bundle: out of the valve cover, then back to the wall and up it
    path = smooth_path(
        [
            (WIDTH / 2 + 0.02, 0.0, STAND + 0.14),
            (WIDTH / 2 + 0.09, 0.02, STAND + 0.15),
            (WIDTH / 2 + 0.11, 0.12, STAND + 0.22),
            (WIDTH / 2 + 0.11, DEPTH / 2 + 0.05, STAND + 0.34),
            (WIDTH / 2 + 0.11, DEPTH / 2 + 0.06, STAND + 0.58),
        ],
        samples=3,
    )
    b.tube(path, 0.028, "insulator", shade=0.92, sides=7)
    # Drain hose, out of the base and down to the ground
    drain = smooth_path([(0.2, 0.06, STAND + 0.01), (0.24, 0.08, 0.03), (0.34, 0.12, 0.012)], samples=3)
    b.tube(drain, 0.008, "acFan", shade=0.55, sides=5)
