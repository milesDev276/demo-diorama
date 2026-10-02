"""Building module: end wall of a shop interior, 0.57 m deep × 2.62 m tall.

Closes the lit room behind a run of shopfront bays at its left or right
end. The origin is on the outer wall plane where the run ends; the app
places it just inside the bay post (objects/building/buildingLayout.ts) and
leaves it out where the shop turns the corner into another shopfront.
Lit like the shop's back wall. No baked AO or grime.
"""

from lib.facade import GLASS, SHOP_BACK, SHOP_FRONT, SHOP_OPENING_TOP, WEATHER  # noqa: F401

NAME = "building_shop_side_01"
CATEGORY = "buildings"
TRI_BUDGET = 3000

THICKNESS = 0.03


def build(b) -> None:
    depth = SHOP_BACK - SHOP_FRONT + THICKNESS
    b.box(
        (THICKNESS, depth, SHOP_OPENING_TOP),
        (0, SHOP_FRONT + depth / 2, SHOP_OPENING_TOP / 2),
        GLASS,
        shade=0.92,
        material="emissive",
    )
