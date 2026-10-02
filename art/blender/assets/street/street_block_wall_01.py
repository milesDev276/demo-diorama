"""Concrete block wall (ブロック塀), one piece 2.0 m long × 1.2 m tall × 0.15 m thick.

The boundary wall of Japanese lots: six courses of 40 × 20 cm blocks in
straight joints (芋目地) under a cap, with one pierced block (透かしブロック)
high up. The ends are flush, so pieces placed end to end along X make one
wall. Both faces are modeled. No baked AO or grime.
"""

import random

NAME = "street_block_wall_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.0}

LENGTH = 2.0
THICK = 0.15
BLOCK_W = 0.4
BLOCK_H = 0.19
COURSES = 6
JOINT = 0.012
CAP = 0.06

PIERCED = (3, 4)  # column, course (from the bottom)


def build(b) -> None:
    rng = random.Random(NAME)
    body = COURSES * BLOCK_H
    # Mortar: a thinner core that shows in the joints on both faces
    b.box((LENGTH, THICK - 0.02, body), (0, 0, body / 2), "mortar")

    columns = round(LENGTH / BLOCK_W)
    for course in range(COURSES):
        for column in range(columns):
            cx = -LENGTH / 2 + (column + 0.5) * BLOCK_W
            cz = (course + 0.5) * BLOCK_H
            if (column, course) == PIERCED:
                _pierced_block(b, cx, cz)
                continue
            b.box(
                (BLOCK_W - JOINT, THICK, BLOCK_H - JOINT),
                (cx, 0, cz),
                "concreteBlock",
                shade=rng.uniform(0.93, 1.04),
            )

    b.box((LENGTH, THICK + 0.03, CAP), (0, 0, body + CAP / 2), "concreteBlock", shade=1.08)  # cap


def _pierced_block(b, cx: float, cz: float) -> None:
    """A frame with a cross in it; the mortar core behind reads as the dark openings."""
    w, h = BLOCK_W - JOINT, BLOCK_H - JOINT
    rim = 0.035
    for z in (cz - h / 2 + rim / 2, cz + h / 2 - rim / 2):
        b.box((w, THICK, rim), (cx, 0, z), "concreteBlock")
    for x in (cx - w / 2 + rim / 2, cx + w / 2 - rim / 2):
        b.box((rim, THICK, h), (x, 0, cz), "concreteBlock")
    b.box((rim, THICK, h), (cx, 0, cz), "concreteBlock", shade=0.97)
    b.box((w, THICK, rim * 0.8), (cx, 0, cz), "concreteBlock", shade=0.97)
    b.box((w - 2 * rim, THICK - 0.06, h - 2 * rim), (cx, 0, cz), "vendingDark")  # shadowed hollow
