"""Manhole cover (マンホール), Ø 0.6 m, standing 2 cm proud of the road.

A cast-iron lid in a concrete collar, with a raised ring, eight radial ribs
and a center boss. Flat and round, so it has no front. No baked AO or grime.
"""

import math

from lib.builder import arc_points

NAME = "street_manhole_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

RADIUS = 0.3


def build(b) -> None:
    b.cylinder(RADIUS + 0.035, 0.008, (0, 0, 0), "poleConcrete", shade=0.85, segments=20)  # collar
    b.cylinder(RADIUS, 0.014, (0, 0, 0), "vendingDark", shade=1.5, segments=20)  # lid
    top = 0.014
    b.tube(arc_points((0, 0, top), 0.19, 0, 360, "z", 20)[:-1], 0.008, "vendingDark", shade=1.9, sides=4, closed=True, up=(0, 0, 1))
    b.tube(arc_points((0, 0, top), RADIUS - 0.02, 0, 360, "z", 20)[:-1], 0.008, "vendingDark", shade=1.9, sides=4, closed=True, up=(0, 0, 1))
    for i in range(8):
        a = i * math.tau / 8
        b.box((0.19, 0.018, 0.006), (math.cos(a) * 0.14, math.sin(a) * 0.14, top + 0.003), "vendingDark", shade=1.9, rotation=(0, 0, math.degrees(a)))
    b.cylinder(0.05, 0.02, (0, 0, 0), "vendingDark", shade=1.9, segments=10)  # boss
