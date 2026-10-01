"""Building module: rooftop parapet bay, 1.82 × 1.1 m.

A 0.5 m parapet wall with a concrete coping and a 0.6 m metal railing (two
rails, posts 0.91 m apart so they stay evenly spaced across bays). No baked
AO or grime.
"""

from lib.facade import BAY, HALF, PARAPET, RAILING, THICKNESS, WEATHER, wall_piece  # noqa: F401

NAME = "building_parapet_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000


def build(b) -> None:
    wall_piece(b, -HALF, HALF, 0.0, PARAPET - 0.05)
    b.box((BAY, THICKNESS + 0.05, 0.05), (0, THICKNESS / 2, PARAPET - 0.025), "foundation", shade=1.1)  # coping
    y = THICKNESS / 2
    top = PARAPET + RAILING
    for x in (-HALF / 2, HALF / 2):
        b.box((0.035, 0.035, RAILING), (x, y, PARAPET + RAILING / 2), "metalLight", shade=0.92)
    b.box((BAY, 0.045, 0.04), (0, y, top - 0.02), "metalLight")
    b.box((BAY, 0.025, 0.025), (0, y, PARAPET + RAILING * 0.5), "metalLight", shade=0.95)
