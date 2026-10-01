"""Standing pedestrian, 1.65 m, in the style of a painted model-railway figure.

Simple smooth forms and flat paint: dark shoes, beige trousers, a navy
jacket, bare hands, a faceless head with dark hair. Arms hang slightly away
from the body so the silhouette reads at a distance. Faces −Y. Other heights
come from the object's scale.
"""

NAME = "people_pedestrian_01"
CATEGORY = "people"
TRI_BUDGET = 5000

WEATHER = {"ao_distance": 0.1, "ao_strength": 0.4, "grime_height": 0.12, "grime_strength": 0.15}


def build(b) -> None:
    _legs(b)
    _body(b)
    _arms(b)
    _head(b)


def _legs(b) -> None:
    for side in (-1, 1):
        x = side * 0.085
        b.box((0.1, 0.24, 0.07), (x, -0.03, 0.035), "vendingDark", shade=1.2, bevel=0.02, segments=2)
        b.tube([(x, 0, 0.06), (side * 0.09, 0, 0.46), (side * 0.09, 0, 0.86)], [0.055, 0.062, 0.08], "clothBeige", sides=8)
    b.blob((0, 0, 0.84), (0.145, 0.088, 0.09), "clothBeige", subdivisions=2, roughness=0.0)  # hips, under the jacket hem


def _body(b) -> None:
    # Jacket: a tube flattened front-to-back; the last ring narrows into the shoulders.
    b.tube(
        [(0, 0, 0.79), (0, 0, 1.0), (0, 0, 1.22), (0, 0, 1.36), (0, 0, 1.42)],
        [0.17, 0.16, 0.18, 0.195, 0.08],
        "clothNavy",
        sides=10,
        section=(1.0, 0.62),
        up=(1, 0, 0),
    )
    b.cylinder(0.045, 0.1, (0, 0, 1.38), "skin", segments=8)


def _arms(b) -> None:
    for side in (-1, 1):
        b.blob((side * 0.188, 0, 1.335), (0.055, 0.054, 0.052), "clothNavy", subdivisions=2, roughness=0.0)  # shoulder
        b.tube(
            [(side * 0.2, 0, 1.34), (side * 0.235, 0.02, 1.08), (side * 0.22, -0.03, 0.85)],
            [0.055, 0.048, 0.042],
            "clothNavy",
            sides=7,
        )
        b.blob((side * 0.22, -0.035, 0.8), (0.035, 0.03, 0.05), "skin", subdivisions=2, roughness=0.0)


def _head(b) -> None:
    b.blob((0, -0.005, 1.54), (0.085, 0.095, 0.11), "skin", subdivisions=3, roughness=0.0)
    b.blob((0, 0.02, 1.57), (0.092, 0.098, 0.098), "hairDark", subdivisions=3, roughness=0.04, frequency=3)
