"""Stackable plastic chair, 0.45 × 0.48 × 0.8 m.

The off-white chair that ends up on rooftops, balconies and behind shops:
a seat on four slightly splayed legs and a slatted backrest. Front faces
−Y. No baked AO or grime.
"""

NAME = "prop_chair_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

SEAT = 0.43
W, D = 0.44, 0.42


def build(b) -> None:
    # Legs splay out a little toward the floor
    for x in (-1, 1):
        for y in (-1, 1):
            top = (x * (W / 2 - 0.04), y * (D / 2 - 0.04), SEAT)
            foot = (x * (W / 2 - 0.01), y * (D / 2 - 0.01), 0.0)
            b.tube([foot, top], 0.016, "acUnit", shade=0.97, sides=6)
    b.box((W, D, 0.035), (0, 0, SEAT + 0.0175), "acUnit", bevel=0.012)
    b.box((W - 0.04, D - 0.04, 0.02), (0, 0, SEAT - 0.01), "acUnit", shade=0.9)  # seat rim underneath

    # Backrest: two posts and three slats, leaning back 8°
    back_y = D / 2 - 0.02
    for x in (-1, 1):
        b.box((0.03, 0.03, 0.4), (x * (W / 2 - 0.03), back_y + 0.025, SEAT + 0.2), "acUnit", rotation=(-8, 0, 0))
    for i, z in enumerate((0.16, 0.26, 0.35)):
        b.box((W - 0.02, 0.022, 0.06), (0, back_y + 0.012 + z * 0.14, SEAT + z), "acUnit", shade=1.0 - i * 0.02, bevel=0.008, rotation=(-8, 0, 0))
