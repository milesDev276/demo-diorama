"""Building module: balcony bay for an upper floor, 1.82 × 2.8 m.

A sliding glass door (掃き出し窓) opening onto a balcony 0.9 m deep: a
concrete slab, a solid siding panel with a gap under it and a metal top rail
at 1.1 m. The ends are open; the app closes each run of balcony bays with
building_balcony_side_01. No baked AO or grime.
"""

from lib.facade import BAY, HALF, UPPER_FLOOR, WEATHER, belt_course, sash, wall_with_opening  # noqa: F401

NAME = "building_bay_balcony_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

DEPTH = 0.9
SLAB_TOP = 0.05
RAIL_TOP = SLAB_TOP + 1.1


def build(b) -> None:
    wall_with_opening(b, UPPER_FLOOR, -0.75, 0.75, SLAB_TOP, 2.05)
    belt_course(b, UPPER_FLOOR)
    sash(b, -0.75, 0.75, SLAB_TOP, 2.05)

    b.box((BAY, DEPTH, 0.12), (0, -DEPTH / 2, SLAB_TOP - 0.06), "foundation", shade=1.08)  # slab
    front = -DEPTH + 0.03
    b.box((BAY, 0.04, 0.82), (0, front, SLAB_TOP + 0.12 + 0.41), "wallSiding")  # panel
    b.box((BAY, 0.07, 0.045), (0, front, RAIL_TOP - 0.0225), "metalLight")  # top rail
    for x in (-HALF / 2, HALF / 2):
        b.box((0.04, 0.04, 0.14), (x, front, SLAB_TOP + 0.06), "metalLight", shade=0.9)  # panel feet
