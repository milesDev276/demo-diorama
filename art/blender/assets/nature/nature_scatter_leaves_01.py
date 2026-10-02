"""Fallen leaves (落ち葉), one scatter piece ≈ 0.4 m across.

Seven leaves lying flat on the ground: ginkgo fans in the tree's yellows,
an orange zelkova leaf and a brown one. Leaves are about 12 cm — a little
large, as model-makers make them, so they still read from the isometric
camera. The app scatters this piece with a random heading and size per
instance (objects/scatter). No baked AO or grime.
"""

import math

NAME = "nature_scatter_leaves_01"
CATEGORY = "nature"
TRI_BUDGET = 200

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.06}

THICKNESS = 0.004

# Outlines with the stem end at the origin, pointing +Y.
GINKGO = [(0.0, 0.0), (-0.055, 0.075), (-0.035, 0.105), (0.0, 0.095), (0.035, 0.105), (0.055, 0.075)]
ZELKOVA = [(0.0, 0.0), (0.028, 0.04), (0.022, 0.085), (0.0, 0.12), (-0.022, 0.085), (-0.028, 0.04)]

# (outline, x, y, heading in degrees, scale, color, shade)
LEAVES = [
    (GINKGO, -0.09, -0.06, 20, 1.0, "ginkgoLeaf", 1.0),
    (GINKGO, 0.07, -0.1, 140, 0.95, "ginkgoLeafLight", 1.0),
    (GINKGO, 0.11, 0.06, 250, 1.05, "ginkgoLeafDeep", 1.0),
    (GINKGO, -0.04, 0.1, 300, 0.9, "ginkgoLeaf", 0.94),
    (ZELKOVA, 0.0, -0.01, 75, 1.0, "zelkovaLeaf", 1.0),
    (ZELKOVA, -0.15, 0.05, 200, 0.9, "leafBrown", 1.0),
    (GINKGO, 0.15, -0.03, 30, 0.85, "ginkgoLeafGreen", 1.0),
]


def _placed(outline, x: float, y: float, heading: float, scale: float):
    a = math.radians(heading)
    c, s = math.cos(a), math.sin(a)
    return [(x + (px * c - py * s) * scale, y + (px * s + py * c) * scale) for px, py in outline]


def build(b) -> None:
    for i, (outline, x, y, heading, scale, color, shade) in enumerate(LEAVES):
        # Stacked a few millimeters apart so overlapping leaves never flicker.
        z = THICKNESS / 2 + 0.001 + i * 0.0015
        b.extrude(_placed(outline, x, y, heading, scale), THICKNESS, (0, 0, z), color, axis="z", shade=shade)
