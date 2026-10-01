"""Building module: window bay for an upper floor, 1.82 × 2.8 m.

A two-leaf aluminium sliding window (引き違い窓) with frosted, lit glass,
recessed in the wall, with a projecting sill and a small hood. No baked AO
or grime.
"""

from lib.facade import FRAME, UPPER_FLOOR, WEATHER, belt_course, sash, wall_with_opening  # noqa: F401

NAME = "building_bay_window_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

X0, X1 = -0.66, 0.66
Z0, Z1 = 0.95, 2.1


def build(b) -> None:
    wall_with_opening(b, UPPER_FLOOR, X0, X1, Z0, Z1)
    belt_course(b, UPPER_FLOOR)
    sash(b, X0, X1, Z0, Z1)
    b.box((X1 - X0 + 0.1, 0.09, 0.035), (0, -0.015, Z0 - 0.0175), FRAME, shade=0.9)  # sill
    b.box((X1 - X0 + 0.12, 0.11, 0.03), (0, -0.025, Z1 + 0.035), FRAME, shade=0.85)  # hood
