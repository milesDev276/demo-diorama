"""Japanese post box (郵便ポスト), 0.4 × 0.4 × 1.25 m.

The red box on a leg that stands on sidewalks everywhere: a square body
with two hooded slots, a rounded cap and a base plate. The front carries
the 〒 mark and the slot labels (atlas cell `post_front`). Front faces −Y.
No baked AO or grime.
"""

NAME = "prop_post_box_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W = 0.4
BODY_BOTTOM = 0.62
BODY_TOP = 1.2
FRONT = -W / 2


def build(b) -> None:
    b.box((0.3, 0.3, 0.03), (0, 0, 0.015), "vendingDark", shade=1.4)  # base plate
    b.box((0.13, 0.13, BODY_BOTTOM), (0, 0, BODY_BOTTOM / 2), "postRed", shade=0.88, bevel=0.01, segments=1)  # leg

    height = BODY_TOP - BODY_BOTTOM
    b.box((W, W, height), (0, 0, BODY_BOTTOM + height / 2), "postRed", bevel=0.018)
    b.box((W + 0.02, W + 0.02, 0.05), (0, 0, BODY_TOP + 0.025), "postRed", shade=0.92, bevel=0.02)  # cap

    # Printed front panel: 〒 mark, slot labels, collection times
    b.box(
        (W - 0.05, 0.006, height - 0.05),
        (0, FRONT - 0.002, BODY_BOTTOM + height / 2),
        "postRed",
        print="post_front",
    )

    # Two slots with hoods, side by side near the top
    for x in (-0.085, 0.085):
        b.box((0.13, 0.012, 0.022), (x, FRONT - 0.008, BODY_TOP - 0.13), "vendingDark")
        b.box((0.15, 0.035, 0.012), (x, FRONT - 0.018, BODY_TOP - 0.112), "postRed", shade=0.85)
