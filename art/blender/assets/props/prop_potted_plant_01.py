"""Potted shrub (鉢植え), ≈ 0.4 × 0.4 × 0.6 m.

A terracotta pot on a saucer with a rounded evergreen shrub, the kind that
lines Japanese shopfronts and doorsteps. No baked AO or grime.
"""

NAME = "prop_potted_plant_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}


def build(b) -> None:
    b.cylinder(0.15, 0.02, (0, 0, 0), "terracotta", shade=0.85, segments=12)  # saucer
    b.cylinder(0.11, 0.24, (0, 0, 0.02), "terracotta", segments=12, radius_top=0.155)
    b.cylinder(0.165, 0.03, (0, 0, 0.245), "terracotta", shade=1.06, segments=12)  # rim
    b.cylinder(0.14, 0.01, (0, 0, 0.268), "dirtDark", shade=0.8, segments=12)  # soil
    b.cylinder(0.014, 0.14, (0, 0, 0.27), "trunk", segments=5)
    b.blob((0, 0.01, 0.45), (0.17, 0.16, 0.15), "foliageDark", roughness=0.25, seed="a", subdivisions=2)
    b.blob((0.09, -0.04, 0.39), (0.11, 0.1, 0.1), "foliageLight", shade=0.92, roughness=0.3, seed="b", subdivisions=1, smooth=False)
    b.blob((-0.08, 0.05, 0.4), (0.1, 0.1, 0.09), "foliageDark", shade=1.12, roughness=0.3, seed="c", subdivisions=1, smooth=False)
