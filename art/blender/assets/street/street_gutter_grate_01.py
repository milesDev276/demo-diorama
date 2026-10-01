"""Roadside gutter grate (側溝のグレーチング), 1.0 × 0.3 m, 2 cm proud of the road.

A steel grating over a dark channel: two long bearing bars and a row of
cross bars. Its length runs along X. No baked AO or grime.
"""

NAME = "street_gutter_grate_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

LENGTH = 1.0
WIDTH = 0.3
BARS = 19


def build(b) -> None:
    b.box((LENGTH, WIDTH, 0.008), (0, 0, 0.004), "vendingDark", shade=0.55)  # the dark channel below
    for y in (-WIDTH / 2 + 0.012, WIDTH / 2 - 0.012):
        b.box((LENGTH, 0.024, 0.02), (0, y, 0.01), "signPost", shade=0.75)
    for x in (-LENGTH / 2 + 0.012, LENGTH / 2 - 0.012):
        b.box((0.024, WIDTH, 0.02), (x, 0, 0.01), "signPost", shade=0.75)
    pitch = (LENGTH - 0.048) / (BARS + 1)
    for i in range(BARS):
        x = -LENGTH / 2 + 0.024 + pitch * (i + 1)
        b.box((0.018, WIDTH - 0.048, 0.012), (x, 0, 0.012), "signPost", shade=0.65)
