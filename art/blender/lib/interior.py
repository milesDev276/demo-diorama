"""Parts of shop interiors, shared by the shopfront bay and the fixed shops.

Everything here is in the `emissive` slot: a room behind glass reads as lit
by day and is lit at night.
"""

import random

BOXES = ["canBlue", "signRed", "canYellow", "insulator", "shopAwningLight", "clothBeige"]
BOTTLES = ["canGreen", "woodTrim", "insulator", "vendingBody", "canBlue"]


def stock_shelf(b, rng: random.Random, x0: float, x1: float, y: float, z: float, *, bottles: float = 0.55) -> None:
    """A row of goods standing at height `z` from `x0` to `x1`, centered on
    depth `y`: bottles (a body and a neck) and cartons, in random sizes and
    colors. `bottles` is the share of bottles, which cost three times the
    triangles of a carton."""
    x = x0 + 0.08
    while x < x1 - 0.2:
        if rng.random() < bottles:
            radius = rng.uniform(0.03, 0.04)
            height = rng.uniform(0.2, 0.3)
            color = rng.choice(BOTTLES)
            shade = rng.uniform(0.85, 1.05)
            b.cylinder(radius, height * 0.7, (x + radius, y, z), color, shade=shade, segments=6, material="emissive")
            b.cylinder(
                radius * 0.4, height * 0.3, (x + radius, y, z + height * 0.7), color,
                shade=shade, segments=6, material="emissive",
            )  # neck
            x += radius * 2 + rng.uniform(0.012, 0.03)
        else:
            w = rng.uniform(0.08, 0.16)
            h = rng.uniform(0.12, 0.26)
            b.box(
                (w, 0.12, h), (x + w / 2, y, z + h / 2), rng.choice(BOXES),
                shade=rng.uniform(0.85, 1.05), material="emissive",
            )
            x += w + rng.uniform(0.015, 0.05)


def product_row(b, rng: random.Random, start: float, end: float, fixed: tuple[float, float], *, along: str, depth: float, height: float) -> None:
    """A shelf face filled edge to edge with blocks of packaged goods, cheap
    enough for a whole convenience store. The row runs from `start` to `end`
    on the `along` axis ("x" or "y"); `fixed` is (the other horizontal
    coordinate, the bottom z); `depth` is the blocks' size across the row."""
    p = start
    while p < end - 0.05:
        length = min(rng.uniform(0.16, 0.34), end - p)
        h = height * rng.uniform(0.7, 1.0)
        size = (length - 0.015, depth, h) if along == "x" else (depth, length - 0.015, h)
        center = (p + length / 2, fixed[0], fixed[1] + h / 2) if along == "x" else (fixed[0], p + length / 2, fixed[1] + h / 2)
        b.box(size, center, rng.choice(BOXES + BOTTLES), shade=rng.uniform(0.85, 1.05), material="emissive")
        p += length
