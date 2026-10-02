"""Can and bottle recycling box (自販機横のリサイクルボックス), 0.45 × 0.45 × 0.95 m.

The box that stands beside every vending machine: a blue body, a pale
label band under the lid, two round openings below it (cans and PET bottles),
a pale lid and a dark kick plinth. Front faces −Y. No baked AO or grime.
"""

NAME = "prop_recycle_bin_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 0.45, 0.45
BODY_TOP = 0.9
FRONT = -D / 2


def build(b) -> None:
    b.box((W - 0.04, D - 0.04, 0.05), (0, 0, 0.025), "vendingDark")  # recessed plinth
    b.box((W, D, BODY_TOP - 0.05), (0, 0, 0.05 + (BODY_TOP - 0.05) / 2), "canBlue", bevel=0.012)
    b.box((W + 0.02, D + 0.02, 0.05), (0, 0, BODY_TOP + 0.025), "vendingPanel", shade=0.96, bevel=0.012)  # lid

    # Pale label band under the lid, the door seam low down
    b.box((W - 0.04, 0.008, 0.1), (0, FRONT - 0.002, 0.8), "vendingPanel")
    b.box((W - 0.08, 0.006, 0.006), (0, FRONT - 0.001, 0.22), "canBlue", shade=0.75)

    # Two round openings with dark rims, close together under the band
    for x in (-0.095, 0.095):
        b.cylinder(0.058, 0.01, (x, FRONT - 0.01, 0.6), "vendingDark", shade=1.5, segments=14, axis="y")
        b.cylinder(0.045, 0.01, (x, FRONT - 0.013, 0.6), "vendingDark", segments=14, axis="y")
