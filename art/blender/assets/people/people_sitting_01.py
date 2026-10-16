"""Sitting adult, a painted model-railway figure resting on a seat.

An older man in a beige jacket and grey trousers, grey-haired, leaning back
a little with his hands on his knees. The seat under him is 0.425 m high —
the top of prop_bench_01 — so the figure placed where the bench is, turned
the same way, sits on it; on prop_chair_01 (seat top 0.465 m) it sinks 4 cm
into the seat, which does not show. The origin is the floor under the seat. Built from lib/figure.py.
Faces −Y. No baked AO or grime.
"""

from mathutils import Vector

from lib.figure import Outfit, figure

NAME = "people_sitting_01"
CATEGORY = "people"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

OUTFIT = Outfit(top="clothBeige", bottom="clothGray", hair="hairGray")

SEAT_TOP = 0.425


def build(b) -> None:
    figure(
        b,
        OUTFIT,
        pelvis=(0, 0.02, SEAT_TOP + 0.11),
        lean=-6,
        nod=4,
        seated=True,
        feet=((-0.11, -0.37, 0.065), (0.11, -0.36, 0.065)),
        knee_pole=(0, -1, 1),
        # Hands on the thighs just behind the knees, a little to the outside
        hands=lambda knees: tuple(tuple(k + Vector((side * 0.045, 0.11, 0.07))) for side, k in zip((-1, 1), knees)),
    )
