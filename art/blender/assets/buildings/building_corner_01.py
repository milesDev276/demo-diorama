"""Building module: corner post, 0.18 × 0.18 × 1.0 m.

Covers the joint where two facades meet. The origin is the outer corner of
the building at the front right (+X, −Y); the post stands 1.5 cm proud of
both faces. The app rotates it for the other corners and scales its height.
No baked AO or grime.
"""

from lib.facade import WEATHER  # noqa: F401

NAME = "building_corner_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

SIZE = 0.18
PROUD = 0.015


def build(b) -> None:
    offset = SIZE / 2 - PROUD
    b.box((SIZE, SIZE, 1.0), (-offset, offset, 0.5), "wallPlaster", shade=0.93)
