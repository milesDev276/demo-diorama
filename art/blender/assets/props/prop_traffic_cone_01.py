"""Traffic cone (カラーコーン), 0.38 × 0.38 × 0.70 m.

A red cone on a square foot with one white reflective band. No baked AO or
grime.
"""

NAME = "prop_traffic_cone_01"
CATEGORY = "props"
TRI_BUDGET = 400

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

FOOT = 0.03
HEIGHT = 0.67
BASE_R, TOP_R = 0.14, 0.025


def radius(z: float) -> float:
    return BASE_R + (TOP_R - BASE_R) * (z - FOOT) / HEIGHT


def build(b) -> None:
    b.box((0.38, 0.38, FOOT), (0, 0, FOOT / 2), "coneRed", shade=0.9, bevel=0.008, segments=1)
    b.cylinder(BASE_R, HEIGHT, (0, 0, FOOT), "coneRed", segments=14, radius_top=TOP_R)
    low, high = 0.34, 0.46
    b.cylinder(radius(low) + 0.003, high - low, (0, 0, low), "insulator", segments=14, radius_top=radius(high) + 0.003)
