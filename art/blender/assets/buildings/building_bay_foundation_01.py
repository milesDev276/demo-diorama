"""Building module: concrete base course (基礎), 1.82 × 0.4 m.

Sits under ground-floor wall, window and balcony bays, with one under-floor
vent. No baked AO or grime.
"""

from lib.facade import FOUNDATION, HALF, WEATHER, wall_piece  # noqa: F401

NAME = "building_bay_foundation_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000


def build(b) -> None:
    wall_piece(b, -HALF, HALF, 0.0, FOUNDATION, "foundation")
    b.box((0.36, 0.012, 0.11), (0, -0.004, 0.2), "vendingDark", shade=1.4)  # under-floor vent
    for i in range(5):
        b.box((0.012, 0.012, 0.11), (-0.12 + i * 0.06, -0.008, 0.2), "foundation", shade=0.9)
