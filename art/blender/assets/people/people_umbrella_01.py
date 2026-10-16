"""Walking adult under a clear vinyl umbrella (ビニール傘), 1.7 m; the canopy is 0.96 m across.

An office worker in a grey suit, a short stride, the right hand holding the
umbrella's shaft in front of the chest. The canopy is eight panels of tinted
see-through vinyl in the `glass` slot, with a white rim and thin ribs; the
handle is a white J. Built from lib/figure.py. Faces −Y. No baked AO or
grime.
"""

import math

from lib.figure import Outfit, figure

NAME = "people_umbrella_01"
CATEGORY = "people"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

OUTFIT = Outfit(top="clothGray", bottom="clothGray")

RIM_R = 0.48
RIM_Z = 1.84
APEX_Z = 2.1
PANELS = 8


def build(b) -> None:
    joints = figure(
        b,
        OUTFIT,
        height=1.7,
        pelvis=(0, 0.0, 0.86),
        lean=3,
        feet=((-0.085, -0.2, 0.075), (0.085, 0.18, 0.105)),
        foot_pitch=(-5, 20),
        hands=((-0.215, -0.07, 0.87), (0.07, -0.2, 1.17)),
    )
    _umbrella(b, joints.hands[1])


def _umbrella(b, hand) -> None:
    cx, cy, cz = hand
    # Shaft through the hand, the J handle below it
    b.tube([(cx, cy, cz - 0.1), (cx, cy, APEX_Z + 0.06)], 0.009, "metalLight", sides=5)
    hook = [(cx, cy, cz - 0.1), (cx, cy, cz - 0.17)] + [
        (cx + 0.04 - 0.04 * math.cos(math.radians(a)), cy, cz - 0.17 - 0.04 * math.sin(math.radians(a))) for a in (30, 90, 150, 180)
    ]
    b.tube(hook, 0.014, "clothWhite", sides=6)

    # Canopy: a shallow eight-sided pyramid of vinyl, faces wound to point up and out
    rim = [
        (cx + RIM_R * math.cos(2 * math.pi * (i + 0.5) / PANELS), cy + RIM_R * math.sin(2 * math.pi * (i + 0.5) / PANELS), RIM_Z)
        for i in range(PANELS)
    ]
    apex = (cx, cy, APEX_Z)
    b.solid([apex, *rim], [(0, 1 + i, 1 + (i + 1) % PANELS) for i in range(PANELS)], "glassPane", material="glass", orient=False)
    b.tube(rim, 0.008, "clothWhite", sides=4, closed=True, up=(0, 0, 1))
    for point in rim:
        b.tube([apex, point], 0.005, "metalLight", sides=3)
        b.sphere(0.012, point, "clothWhite", subdivisions=1)  # rib tip
    b.sphere(0.018, apex, "clothWhite", subdivisions=1)  # ferrule cap
