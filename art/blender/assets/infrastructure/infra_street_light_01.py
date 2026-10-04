"""Street light (街路灯), 5 m tall, reaching 1.4 m over the road.

A tapering steel pole with a base collar and an inspection hatch, an arm
that curves out toward −Y, and a flat LED head whose lens is in the
emissive slot. The app adds the light itself after dark (`glow` in the asset
registry). No baked AO or grime.
"""

from lib.builder import smooth_path

NAME = "infra_street_light_01"
CATEGORY = "infrastructure"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

POLE_TOP = 4.5
HEAD_Y = -1.15
HEAD_Z = 4.98


def build(b) -> None:
    b.cylinder(0.075, POLE_TOP, (0, 0, 0), "signPost", segments=10, radius_top=0.05)
    b.cylinder(0.105, 0.28, (0, 0, 0), "signPost", shade=0.85, segments=10, radius_top=0.085)  # base collar
    b.box((0.07, 0.012, 0.22), (0, -0.07, 0.75), "signPost", shade=0.8)  # inspection hatch

    arm = smooth_path([(0, 0, POLE_TOP - 0.05), (0, -0.12, 4.82), (0, -0.5, HEAD_Z), (0, HEAD_Y + 0.2, HEAD_Z)], 4)
    b.tube(arm, 0.036, "signPost", sides=7)

    b.box((0.24, 0.52, 0.08), (0, HEAD_Y, HEAD_Z), "signPost", shade=0.9, bevel=0.02)
    b.box((0.17, 0.4, 0.02), (0, HEAD_Y, HEAD_Z - 0.045), "lampWhite", material="emissive")
