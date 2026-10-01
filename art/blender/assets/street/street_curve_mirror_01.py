"""Roadside curve mirror (カーブミラー), 3.15 m tall with a Ø 0.8 m mirror.

The orange pole and housing found at blind junctions all over Japan: a round
convex mirror under a short hood, on a bracket, with a small blank notice
plate on the pole. The mirror faces −Y. No baked AO or grime.
"""

from lib.builder import arc_points

NAME = "street_curve_mirror_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

MIRROR_Z = 2.75
MIRROR_R = 0.4
FACE_Y = -0.15


def build(b) -> None:
    b.cylinder(0.038, 3.0, (0, 0, 0), "mirrorOrange", segments=10)  # pole
    b.cylinder(0.05, 0.03, (0, 0, 0), "mirrorOrange", shade=0.85, segments=10)  # base collar
    b.box((0.07, 0.11, 0.07), (0, -0.045, MIRROR_Z), "mirrorOrange", shade=0.9)  # bracket
    b.cylinder(MIRROR_R, 0.06, (0, FACE_Y, MIRROR_Z), "mirrorOrange", segments=24, axis="y")  # housing
    b.cylinder(MIRROR_R - 0.04, 0.008, (0, FACE_Y - 0.008, MIRROR_Z), "mirrorGlass", segments=24, axis="y")
    hood = arc_points((0, FACE_Y - 0.03, MIRROR_Z), MIRROR_R + 0.01, 15, 165, "y", 12)
    b.tube(hood, 0.075, "mirrorOrange", shade=0.95, sides=6, section=(1.0, 0.15), up=(0, 1, 0))
    b.box((0.3, 0.008, 0.12), (0, -0.044, 2.12), "signBoard")  # notice plate
