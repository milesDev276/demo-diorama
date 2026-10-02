"""A-frame sign (立て看板), 0.5 × 0.45 × 0.9 m.

Two dark chalkboard panels in light wooden frames, leaning against each
other, the kind a small shop sets out by its door every morning. Front
faces −Y. No baked AO or grime.
"""

import math

NAME = "prop_a_frame_sign_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W = 0.5
LENGTH = 0.92  # along the slope
LEAN = 13  # degrees from vertical


def _panel(b, side: int) -> None:
    """One leaning panel; side −1 is the front (−Y), +1 the back."""
    lean = math.radians(LEAN)
    height = LENGTH * math.cos(lean)
    # The panels meet at the top center and splay out toward the ground.
    center = (0, side * LENGTH / 2 * math.sin(lean), height / 2)
    rotation = (side * LEAN, 0, 0)
    b.box((W, 0.03, LENGTH), center, "woodTrim", shade=1.35, bevel=0.006, segments=1, rotation=rotation)  # frame
    face = (0, center[1] + side * 0.012, center[2] + 0.03)
    b.box((W - 0.08, 0.012, LENGTH - 0.2), face, "vendingDark", shade=1.15, rotation=rotation)


def build(b) -> None:
    _panel(b, -1)
    _panel(b, 1)
    top = LENGTH * math.cos(math.radians(LEAN))
    b.cylinder(0.012, W + 0.04, (-W / 2 - 0.02, 0, top - 0.03), "signPost", segments=6, axis="x")  # hinge
