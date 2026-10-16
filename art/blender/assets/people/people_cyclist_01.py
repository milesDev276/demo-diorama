"""Cyclist, a painted model-railway figure riding the city bicycle.

The bicycle of lib/bicycle.py with its stand folded up, and a rider in a
brick-red sweater and beige trousers on the saddle, feet on the pedals,
hands on the grips, leaning forward a little and looking ahead. ≈ 1.8 m
long; heads +X like the parked bicycle, so the chain side faces −Y. Built
from lib/figure.py. No baked AO or grime.
"""

from lib.bicycle import GRIPS, PEDALS, SADDLE_TOP, build_bicycle
from lib.figure import Outfit, figure

NAME = "people_cyclist_01"
CATEGORY = "people"
TRI_BUDGET = 7000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

OUTFIT = Outfit(top="shopAwningLight", bottom="clothBeige")


def build(b) -> None:
    build_bicycle(b, stand=False)
    # The rider's left is the bicycle's −Y side: the low, forward pedal.
    feet = tuple((x + 0.015, y * 0.92, z + 0.075) for x, y, z in PEDALS)
    hands = tuple((x - 0.03, y * 0.9, z + 0.02) for x, y, z in GRIPS)
    figure(
        b,
        OUTFIT,
        height=1.72,
        yaw=90,
        pelvis=(SADDLE_TOP[0] + 0.03, 0, SADDLE_TOP[2] + 0.1),
        lean=24,
        nod=-18,
        seated=True,
        feet=feet,
        foot_pitch=(6, 6),
        hands=hands,
    )
