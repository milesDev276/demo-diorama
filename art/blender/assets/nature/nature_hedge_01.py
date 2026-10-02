"""Clipped evergreen hedge (生垣), one piece 1.2 m long × 0.6 m deep × 1.0 m tall.

A hedge that is trimmed square once a year: a rounded block of foliage
down to the ground with low foam bumps growing out of its top and sides.
Pieces placed end to end along X read as one hedge of clipped shrubs.
Evergreen, so it is in the `base` slot and ignores the season. No baked AO
or grime.
"""

import random

NAME = "nature_hedge_01"
CATEGORY = "nature"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.07}

LENGTH = 1.2
DEPTH = 0.6
HEIGHT = 1.0
BODY_BOTTOM = 0.06


def build(b) -> None:
    rng = random.Random(NAME)
    body_height = HEIGHT - 0.08 - BODY_BOTTOM
    b.box(
        (LENGTH, DEPTH - 0.08, body_height),
        (0, 0, BODY_BOTTOM + body_height / 2),
        "hedgeLeafDark",
        bevel=0.1,
        segments=2,
        cuts=1,
    )

    # New growth pushing out of the clipped faces: a row along the top, a few on each side
    for i in range(4):
        x = -LENGTH / 2 + (i + 0.5) * LENGTH / 4 + rng.uniform(-0.04, 0.04)
        _bump(b, rng, (x, rng.uniform(-0.06, 0.06), HEIGHT - 0.14), (0.2, 0.22, 0.13), i)
    for side in (-1, 1):
        for i in range(3):
            x = -LENGTH / 2 + (i + 0.5) * LENGTH / 3 + rng.uniform(-0.06, 0.06)
            z = rng.uniform(0.3, 0.68)
            _bump(b, rng, (x, side * (DEPTH / 2 - 0.1), z), (0.24, 0.09, 0.2), 10 + i + (side + 1) * 5)


def _bump(b, rng: random.Random, center, radii, index: int) -> None:
    b.blob(
        center,
        radii,
        "hedgeLeaf",
        shade=rng.uniform(0.95, 1.07),
        subdivisions=2,
        roughness=0.16,
        frequency=1.8,
        bumps=0.08,
        seed=f"{NAME}-{index}",
    )
