"""Grass tuft (草むら), one scatter piece ≈ 0.25 m tall.

Nine flat, tapering blades fanning out from one root, in the lot's grass
greens. The app scatters it with a random heading and size per instance.
No baked AO or grime.
"""

import math

NAME = "nature_scatter_grass_01"
CATEGORY = "nature"
TRI_BUDGET = 200

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.05}

# (heading in degrees, lean from vertical in degrees, height, color)
BLADES = [
    (0, 18, 0.26, "grassTop"),
    (40, 30, 0.2, "foliageLight"),
    (85, 14, 0.24, "grassTop"),
    (130, 34, 0.18, "foliageDark"),
    (175, 22, 0.25, "foliageLight"),
    (215, 30, 0.2, "grassTop"),
    (255, 12, 0.22, "foliageDark"),
    (300, 28, 0.19, "grassTop"),
    (335, 20, 0.23, "foliageLight"),
]


def build(b) -> None:
    for heading, lean, height, color in BLADES:
        h, l = math.radians(heading), math.radians(lean)
        dx, dy = math.cos(h), math.sin(h)
        root = (dx * 0.02, dy * 0.02, 0.0)
        # The blade bends outward: steeper at the root, flatter toward the tip.
        mid = (dx * (0.02 + height * 0.45 * math.sin(l)), dy * (0.02 + height * 0.45 * math.sin(l)), height * 0.55)
        tip = (dx * (0.02 + height * math.sin(l) * 1.4), dy * (0.02 + height * math.sin(l) * 1.4), height)
        b.tube([root, mid, tip], [0.012, 0.009, 0.001], color, sides=3, section=(1.0, 0.3), smooth=False)
