"""Roadside weeds (雑草), one scatter piece ≈ 0.25 m across.

A low rosette of five leaves with one yellow dandelion-like flower — the
weeds that grow out of the joints along Japanese walls, curbs and
utility-pole bases. The app scatters it with a random heading and size per
instance. No baked AO or grime.
"""

import math

NAME = "nature_scatter_weeds_01"
CATEGORY = "nature"
TRI_BUDGET = 200

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.05}

# (heading in degrees, length, color)
LEAVES = [(10, 0.12, "foliageDark"), (80, 0.1, "foliageLight"), (150, 0.13, "foliageDark"), (220, 0.11, "grassTop"), (290, 0.12, "foliageLight")]


def build(b) -> None:
    for heading, length, color in LEAVES:
        a = math.radians(heading)
        dx, dy = math.cos(a), math.sin(a)
        # Each leaf rises from the center and arches back down toward the ground.
        points = [(dx * 0.01, dy * 0.01, 0.01), (dx * length * 0.5, dy * length * 0.5, 0.045), (dx * length, dy * length, 0.015)]
        b.tube(points, [0.008, 0.02, 0.004], color, sides=4, section=(0.25, 1.0), up=(0, 0, 1), smooth=False)

    stem_top = (0.015, -0.01, 0.17)
    b.tube([(0, 0, 0.01), (0.008, -0.004, 0.09), stem_top], 0.003, "foliageDark", sides=3, caps=False)
    b.blob(stem_top, (0.022, 0.022, 0.012), "plateYellow", subdivisions=1, roughness=0.1, seed=NAME, smooth=False)
