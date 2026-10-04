"""Pad-mounted utility cabinet (地上機器), 1.1 × 0.45 × 1.45 m.

The grey steel box that stands on sidewalks where the cables run
underground: a concrete plinth, a two-door body with handles and a seam, a
flat cap, louvers near the top and a small yellow warning label. Front
faces −Y. No baked AO or grime.
"""

NAME = "infra_utility_box_01"
CATEGORY = "infrastructure"
TRI_BUDGET = 1000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 1.1, 0.45
PLINTH = 0.12
BODY_H = 1.3
FRONT = -D / 2


def build(b) -> None:
    b.box((W + 0.1, D + 0.1, PLINTH), (0, 0, PLINTH / 2), "foundation")
    b.box((W, D, BODY_H), (0, 0, PLINTH + BODY_H / 2), "meterGray", bevel=0.015)
    b.box((W + 0.04, D + 0.04, 0.035), (0, 0, PLINTH + BODY_H + 0.015), "meterGray", shade=0.9)  # cap

    mid = PLINTH + BODY_H / 2
    b.box((0.008, 0.008, BODY_H - 0.12), (0, FRONT - 0.002, mid), "vendingDark", shade=1.6)  # door seam
    for x in (-0.07, 0.07):
        b.box((0.022, 0.03, 0.14), (x, FRONT - 0.012, mid), "vendingDark", shade=1.4)  # handles
    for side in (-1, 1):
        for i in range(4):  # louvers
            b.box((0.3, 0.012, 0.014), (side * 0.3, FRONT - 0.004, PLINTH + BODY_H - 0.2 + i * 0.035), "meterGray", shade=0.78)
    b.box((0.13, 0.006, 0.09), (0.3, FRONT - 0.002, mid + 0.1), "plateYellow")  # warning label
    b.box((0.2, 0.006, 0.06), (-0.3, FRONT - 0.002, mid + 0.1), "signBoard")  # number plate
