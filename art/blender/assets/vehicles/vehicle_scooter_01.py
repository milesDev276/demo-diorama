"""50 cc scooter (原付), ≈ 1.75 × 1.2 × 0.66 m, parked upright on its stand.

A step-through body with a leg shield, a flat floorboard, a long dark seat,
small fat wheels, a handlebar cowl with a round lamp and two mirrors, and a
white delivery box on the rear rack. No brand cues. Heads +X like the
bicycle, so its right side faces −Y (the viewer). No baked AO or grime.
"""

from lib.builder import arc_points

NAME = "vehicle_scooter_01"
CATEGORY = "vehicles"
TRI_BUDGET = 4000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

WHEEL_R = 0.21
WHEEL_W = 0.1
REAR_X, FRONT_X = -0.58, 0.62
BODY = "tankCream"
Y_AXIS = (0, 1, 0)


def build(b) -> None:
    for x in (REAR_X, FRONT_X):
        b.cylinder(WHEEL_R, WHEEL_W, (x, -WHEEL_W / 2, WHEEL_R), "tireRubber", segments=16, axis="y")
        b.cylinder(0.1, WHEEL_W + 0.02, (x, -WHEEL_W / 2 - 0.01, WHEEL_R), "metalLight", shade=0.9, segments=10, axis="y")
    _body(b)
    _front(b)
    _rear(b)


def _body(b) -> None:
    b.box((0.5, 0.3, 0.07), (0.1, 0, 0.27), BODY, shade=0.92, bevel=0.015, segments=1)  # floorboard
    b.box((0.44, 0.22, 0.006), (0.1, 0, 0.308), "vendingDark", shade=1.3)  # rubber mat
    shield = [(0.30, 0.24), (0.44, 0.26), (0.52, 0.80), (0.46, 0.87), (0.39, 0.85), (0.31, 0.36)]
    b.extrude(shield, 0.36, (0, 0, 0), BODY, axis="y", bevel=0.025)
    rear = [(-0.14, 0.25), (-0.10, 0.60), (-0.18, 0.68), (-0.80, 0.66), (-0.88, 0.58), (-0.82, 0.46), (-0.52, 0.45), (-0.34, 0.25)]
    b.extrude(rear, 0.32, (0, 0, 0), BODY, axis="y", bevel=0.03)
    b.box((0.6, 0.27, 0.08), (-0.46, 0, 0.715), "vendingDark", shade=1.15, bevel=0.03)  # seat

    # Engine and swing arm on the left, muffler on the right
    b.box((0.42, 0.1, 0.15), (-0.42, 0.11, 0.24), "acFan", bevel=0.02, segments=1)
    b.cylinder(0.045, 0.44, (-0.84, -0.15, 0.27), "metalLight", shade=0.8, segments=8, axis="x")
    for side in (-1, 1):  # center stand
        b.tube([(-0.22, side * 0.07, 0.24), (-0.27, side * 0.15, 0.012)], 0.012, "vendingDark", shade=1.4, sides=5)


def _front(b) -> None:
    fender = arc_points((FRONT_X, 0.0, WHEEL_R), WHEEL_R + 0.04, 15, 150, "y", 9)
    b.tube(fender, 0.065, BODY, sides=6, section=(1.0, 0.3), up=Y_AXIS)
    for side in (-1, 1):
        b.tube([(0.5, side * 0.075, 0.62), (FRONT_X, side * 0.075, WHEEL_R)], 0.016, "metalLight", sides=5)  # fork
    b.tube([(0.47, 0, 0.82), (0.42, 0, 0.98)], 0.022, "vendingDark", shade=1.3, sides=6)  # steering column

    b.box((0.14, 0.4, 0.11), (0.42, 0, 1.0), BODY, bevel=0.035)  # handlebar cowl
    b.cylinder(0.062, 0.03, (0.475, 0, 1.0), "insulator", segments=12, axis="x")  # headlamp
    for side in (-1, 1):
        b.tube([(0.41, side * 0.19, 1.0), (0.39, side * 0.33, 1.0)], 0.018, "vendingDark", sides=6)  # grip
        b.tube([(0.42, side * 0.17, 1.04), (0.38, side * 0.27, 1.19)], 0.006, "vendingDark", shade=1.4, sides=4)
        b.box((0.012, 0.1, 0.06), (0.378, side * 0.28, 1.2), "vendingDark", shade=1.4)  # mirror
    b.box((0.012, 0.05, 0.03), (0.445, 0.11, 0.7), "mirrorOrange")  # indicators on the shield
    b.box((0.012, 0.05, 0.03), (0.445, -0.11, 0.7), "mirrorOrange")


def _rear(b) -> None:
    b.box((0.03, 0.12, 0.05), (-0.875, 0, 0.6), "signRed", bevel=0.008, segments=1)  # tail lamp
    b.box((0.008, 0.1, 0.1), (-0.86, 0, 0.42), "insulator")  # plate
    b.box((0.3, 0.22, 0.015), (-0.84, 0, 0.7), "metalLight", shade=0.85)  # rack
    b.box((0.34, 0.36, 0.28), (-0.86, 0, 0.85), "insulator", bevel=0.02)  # delivery box
    b.box((0.35, 0.37, 0.02), (-0.86, 0, 0.94), "insulator", shade=0.88)  # lid seam
