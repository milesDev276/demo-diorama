"""Japanese stop sign (止まれ), 2.5 m tall.

The inverted red triangle, 0.8 m on a side, on a plain steel pole with two
clamps. The face carries the 止まれ lettering (atlas cell `sign_stop`); the
back is bare metal. The face points −Y. No baked AO or grime.
"""

NAME = "street_sign_stop_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

HEIGHT = 2.5
SIDE = 0.8
TOP = 2.45
TIP = TOP - SIDE * 0.866
POLE_R = 0.03
FACE_Y = -0.05


def build(b) -> None:
    b.cylinder(POLE_R, HEIGHT, (0, 0, 0), "signPost", segments=10)
    b.cylinder(POLE_R + 0.012, 0.02, (0, 0, 0), "signPost", shade=0.85, segments=10)  # base collar

    # Sign plate: an inverted triangle, printed on the side facing −Y
    b.extrude(
        [(-SIDE / 2, TOP), (SIDE / 2, TOP), (0.0, TIP)],
        0.012,
        (0, FACE_Y, 0),
        "signPost",
        axis="y",
        print="sign_stop",
        print_dir="-y",
    )

    # Two clamps holding the plate to the pole
    for z in (TOP - 0.12, TOP - 0.42):
        b.box((0.09, 0.07, 0.035), (0, -0.015, z), "signPost", shade=0.8)
