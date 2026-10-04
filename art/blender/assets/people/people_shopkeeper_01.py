"""Shopkeeper, 1.65 m, in the style of a painted model-railway figure.

The same simple forms as the pedestrian, dressed for work: grey trousers, a
white shirt with the sleeves rolled, a long navy apron with a bib, hands
held together in front. Faces −Y. No baked AO or grime.
"""

import math

NAME = "people_shopkeeper_01"
CATEGORY = "people"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

APRON = "clothNavy"


def build(b) -> None:
    _legs(b)
    _body(b)
    _apron(b)
    _arms(b)
    _head(b)


def _legs(b) -> None:
    for side in (-1, 1):
        x = side * 0.085
        b.box((0.1, 0.24, 0.07), (x, -0.03, 0.035), "vendingDark", shade=1.2, bevel=0.02, segments=2)
        b.tube([(x, 0, 0.06), (side * 0.09, 0, 0.46), (side * 0.09, 0, 0.86)], [0.055, 0.062, 0.08], "clothGray", sides=8)
    b.blob((0, 0, 0.84), (0.145, 0.088, 0.09), "clothGray", subdivisions=2, roughness=0.0)


def _body(b) -> None:
    b.tube(
        [(0, 0, 0.79), (0, 0, 1.0), (0, 0, 1.22), (0, 0, 1.36), (0, 0, 1.42)],
        [0.165, 0.158, 0.175, 0.19, 0.08],
        "clothWhite",
        sides=10,
        section=(1.0, 0.62),
        up=(1, 0, 0),
    )
    b.cylinder(0.045, 0.1, (0, 0, 1.38), "skin", segments=8)


def _apron(b) -> None:
    b.box((0.2, 0.024, 0.26), (0, -0.108, 1.18), APRON, bevel=0.008, segments=1)  # bib
    b.box((0.33, 0.03, 0.56), (0, -0.103, 0.77), APRON, bevel=0.01, segments=1)  # skirt
    # Waist tie: a thin band around the body
    ring = [(0.17 * math.cos(a), 0.108 * math.sin(a), 1.04) for a in (2 * math.pi * i / 14 for i in range(14))]
    b.tube(ring, 0.014, APRON, shade=0.9, sides=4, closed=True, up=(0, 0, 1))
    for side in (-1, 1):  # neck straps
        strap = [(side * 0.08, -0.12, 1.29), (side * 0.075, -0.108, 1.37), (side * 0.065, -0.04, 1.428), (side * 0.05, 0.05, 1.42)]
        b.tube(strap, 0.011, APRON, sides=4)


def _arms(b) -> None:
    for side in (-1, 1):
        b.blob((side * 0.188, 0, 1.335), (0.055, 0.054, 0.052), "clothWhite", subdivisions=2, roughness=0.0)
        b.tube([(side * 0.2, 0, 1.34), (side * 0.24, -0.01, 1.12)], [0.053, 0.047], "clothWhite", sides=7)  # rolled sleeve
        b.tube([(side * 0.24, -0.01, 1.13), (side * 0.06, -0.15, 0.97)], [0.04, 0.034], "skin", sides=7)  # forearm
    b.blob((0, -0.16, 0.955), (0.065, 0.035, 0.04), "skin", subdivisions=2, roughness=0.0)  # clasped hands


def _head(b) -> None:
    b.blob((0, -0.005, 1.54), (0.085, 0.095, 0.11), "skin", subdivisions=3, roughness=0.0)
    b.blob((0, 0.022, 1.575), (0.09, 0.095, 0.092), "hairDark", subdivisions=3, roughness=0.04, frequency=3)
