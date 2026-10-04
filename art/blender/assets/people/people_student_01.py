"""Schoolchild on the way to school, 1.25 m, a painted model-railway figure.

A yellow hat with a brim, a white shirt, navy shorts, white socks and a red
randoseru (ランドセル) on the back with its straps over the shoulders.
Faces −Y. No baked AO or grime.
"""

NAME = "people_student_01"
CATEGORY = "people"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}


def build(b) -> None:
    _legs(b)
    _body(b)
    _arms(b)
    _head(b)
    _randoseru(b)


def _legs(b) -> None:
    for side in (-1, 1):
        x = side * 0.065
        b.box((0.075, 0.17, 0.05), (x, -0.02, 0.025), "vendingDark", shade=1.3, bevel=0.015, segments=2)
        b.tube([(x, 0, 0.045), (x, 0, 0.3), (side * 0.068, 0, 0.56)], [0.038, 0.042, 0.055], "skin", sides=8)
        b.cylinder(0.044, 0.11, (x, 0, 0.045), "clothWhite", segments=8)  # sock
    b.tube(
        [(0, 0, 0.47), (0, 0, 0.6), (0, 0, 0.7)],
        [0.14, 0.135, 0.125],
        "clothNavy",
        sides=10,
        section=(1.0, 0.68),
        up=(1, 0, 0),
    )


def _body(b) -> None:
    b.tube(
        [(0, 0, 0.66), (0, 0, 0.82), (0, 0, 0.98), (0, 0, 1.03)],
        [0.125, 0.13, 0.14, 0.06],
        "clothWhite",
        sides=10,
        section=(1.0, 0.62),
        up=(1, 0, 0),
    )
    b.cylinder(0.035, 0.08, (0, 0, 1.0), "skin", segments=8)


def _arms(b) -> None:
    for side in (-1, 1):
        b.blob((side * 0.14, 0, 0.975), (0.042, 0.04, 0.04), "clothWhite", subdivisions=2, roughness=0.0)
        b.tube(
            [(side * 0.15, 0, 0.98), (side * 0.178, 0.01, 0.8), (side * 0.168, -0.02, 0.66)],
            [0.04, 0.035, 0.03],
            "clothWhite",
            sides=7,
        )
        b.blob((side * 0.168, -0.022, 0.62), (0.026, 0.024, 0.036), "skin", subdivisions=2, roughness=0.0)


def _head(b) -> None:
    b.blob((0, -0.005, 1.13), (0.082, 0.09, 0.1), "skin", subdivisions=3, roughness=0.0)
    b.blob((0, 0.028, 1.14), (0.086, 0.088, 0.085), "hairDark", subdivisions=3, roughness=0.03, frequency=3)
    b.cylinder(0.14, 0.012, (0, -0.012, 1.17), "canYellow", segments=16)  # brim
    b.blob((0, 0.004, 1.18), (0.094, 0.1, 0.072), "canYellow", subdivisions=3, roughness=0.0)  # crown


def _randoseru(b) -> None:
    b.box((0.23, 0.12, 0.29), (0, 0.15, 0.86), "signRed", bevel=0.03)
    b.box((0.235, 0.03, 0.2), (0, 0.215, 0.9), "signRed", shade=0.9, bevel=0.012, segments=1)  # flap
    for side in (-1, 1):
        x = side * 0.085
        b.tube(
            [(x, 0.09, 1.0), (x, 0.0, 1.035), (x, -0.085, 0.95), (side * 0.1, -0.08, 0.78), (side * 0.11, 0.06, 0.74)],
            0.012,
            "signRed",
            shade=0.9,
            sides=4,
        )
