"""Electricity meter (電力量計) on its wall plate, 0.3 × 0.14 × 0.45 m.

The grey meter found on the side wall of every Japanese house: a backing
plate, the meter body with a round glass face and a dial, and conduits
running up and down the wall. Wall-mounted: the origin is on the wall plane
at the bottom of the plate, and the meter projects toward −Y. No baked AO
or grime.
"""

NAME = "prop_meter_box_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, H = 0.3, 0.45


def build(b) -> None:
    b.box((W, 0.015, H), (0, -0.0075, H / 2), "meterGray", shade=0.85)  # wall plate
    b.box((0.22, 0.09, 0.3), (0, -0.06, 0.22), "meterGray", bevel=0.012)  # body
    b.box((0.22, 0.11, 0.06), (0, -0.07, 0.36), "meterGray", shade=0.92, bevel=0.008, segments=1)  # terminal cover

    # Round glass face with a dial plate behind it
    b.cylinder(0.075, 0.03, (0, -0.105, 0.2), "carGlass", shade=1.5, segments=16, axis="y")
    b.cylinder(0.06, 0.004, (0, -0.108, 0.2), "vendingPanel", segments=16, axis="y")
    b.box((0.07, 0.003, 0.018), (0, -0.111, 0.215), "vendingDark")  # counter window

    # Conduits: service drop from above, the feed into the wall below
    b.cylinder(0.014, 0.5, (0.06, -0.02, H - 0.03), "meterGray", shade=0.8, segments=6)
    b.cylinder(0.014, 0.25, (-0.05, -0.02, -0.25), "meterGray", shade=0.8, segments=6)
