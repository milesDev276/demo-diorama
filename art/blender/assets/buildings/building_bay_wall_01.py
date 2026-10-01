"""Building module: plain wall bay for an upper floor, 1.82 × 2.8 m.

Plaster wall with a belt course at the floor line above. See lib/facade.py
for the module conventions. No baked AO or grime.
"""

from lib.facade import HALF, UPPER_FLOOR, WEATHER, belt_course, wall_piece  # noqa: F401

NAME = "building_bay_wall_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000


def build(b) -> None:
    wall_piece(b, -HALF, HALF, 0.0, UPPER_FLOOR)
    belt_course(b, UPPER_FLOOR)
