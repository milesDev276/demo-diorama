"""Gate post (門柱), 0.45 × 0.35 m, 1.3 m tall.

The plastered post at the gap in a house's boundary wall: a cap on top; on
the street face the wooden name plate (表札, atlas cell `name_plate`), an
intercom and a mail slot. It is a little taller than the block wall
(`street_block_wall_01`, 1.2 m), so it reads as the end of one. Front faces
−Y. No baked AO or grime.
"""

NAME = "street_gate_post_01"
CATEGORY = "street"
TRI_BUDGET = 800

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 0.45, 0.35
HEIGHT = 1.24
FRONT = -D / 2


def build(b) -> None:
    b.box((W, D, HEIGHT), (0, 0, HEIGHT / 2), "wallPlaster", shade=0.94, bevel=0.012, segments=1)
    b.box((W + 0.06, D + 0.06, 0.06), (0, 0, HEIGHT + 0.03), "concreteBlock", shade=1.05, bevel=0.01, segments=1)  # cap
    b.box((W + 0.02, D + 0.02, 0.08), (0, 0, 0.04), "concreteBlock", shade=0.92)  # plinth

    # Name plate
    b.box((0.12, 0.02, 0.24), (-0.1, FRONT - 0.01, 0.98), "woodLight", print="name_plate")

    # Intercom: a small panel with a camera lens and a call button
    x = 0.11
    b.box((0.1, 0.03, 0.16), (x, FRONT - 0.015, 0.98), "meterGray", shade=1.05, bevel=0.008, segments=1)
    b.box((0.03, 0.01, 0.03), (x, FRONT - 0.033, 1.02), "vendingDark")
    b.box((0.04, 0.012, 0.04), (x, FRONT - 0.034, 0.94), "lampWhite")

    # Mail slot with its flap
    b.box((0.28, 0.012, 0.08), (0, FRONT - 0.006, 0.66), "vendingDark", shade=1.2)
    b.box((0.26, 0.02, 0.05), (0, FRONT - 0.016, 0.675), "signPost")
