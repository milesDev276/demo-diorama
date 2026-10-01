"""Building module: the end of a balcony run, closing building_bay_balcony_01.

A siding panel and top rail 0.9 m deep, centered on x = 0 and running from
the wall plane outward (−Y). Symmetric, so one piece serves both ends. No
baked AO or grime.
"""

from lib.facade import WEATHER  # noqa: F401

NAME = "building_balcony_side_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

DEPTH = 0.9
SLAB_TOP = 0.05
RAIL_TOP = SLAB_TOP + 1.1


def build(b) -> None:
    length = DEPTH - 0.01
    b.box((0.04, length, 0.82), (0, -length / 2, SLAB_TOP + 0.12 + 0.41), "wallSiding")
    b.box((0.07, length, 0.045), (0, -length / 2, RAIL_TOP - 0.0225), "metalLight")
