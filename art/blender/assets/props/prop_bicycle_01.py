"""City bicycle (ママチャリ), ≈ 1.8 × 1.0 × 0.6 m, parked on its center stand.

A step-through frame with a front wire basket, fenders, a chain guard, a
rear carrier, swept-back handlebar, bell and dynamo lamp. Thin tubes, no
spokes: at diorama distance the wheels read as rings. Heads +X, so the chain
side faces −Y (the viewer). No baked AO or grime (user decision, Stage 3).
"""

from lib.builder import arc_points, smooth_path

NAME = "prop_bicycle_01"
CATEGORY = "props"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

TIRE_R = 0.315  # tyre centerline
TIRE_T = 0.022  # tyre tube radius
AXLE_Z = TIRE_R + TIRE_T
REAR_X, FRONT_X = -0.54, 0.54
BB = (-0.08, 0.0, 0.30)
HEAD_TOP = (0.40, 0.0, 0.80)
HEAD_BOTTOM = (0.44, 0.0, 0.64)
SEAT = (-0.22, 0.0, 0.78)
Y_AXIS = (0, 1, 0)


def build(b) -> None:
    for x in (REAR_X, FRONT_X):
        _wheel(b, x)
    _frame(b)
    _cockpit(b)
    _basket(b)
    _fenders(b)
    _drivetrain(b)
    _carrier_and_stand(b)


def _wheel(b, x: float) -> None:
    center = (x, 0.0, AXLE_Z)
    b.tube(arc_points(center, TIRE_R, 0, 360, "y", 28)[:-1], TIRE_T, "tireRubber", sides=6, closed=True, up=Y_AXIS)
    b.tube(arc_points(center, TIRE_R - 0.03, 0, 360, "y", 28)[:-1], 0.008, "metalLight", sides=4, closed=True, up=Y_AXIS)
    b.cylinder(0.028, 0.1, (x, -0.05, AXLE_Z), "metalLight", segments=8, axis="y")


def _frame(b) -> None:
    b.tube(smooth_path([HEAD_BOTTOM, (0.30, 0, 0.47), (0.10, 0, 0.33), BB], 3), 0.02, "bikeFrame", sides=6)
    b.tube([BB, SEAT], 0.019, "bikeFrame", sides=6)
    b.tube([HEAD_BOTTOM, HEAD_TOP], 0.024, "bikeFrame", sides=6)
    for side in (-1, 1):
        axle = (REAR_X, side * 0.055, AXLE_Z)
        b.tube([(BB[0], side * 0.03, BB[2]), axle], 0.012, "bikeFrame", sides=5)  # chain stay
        b.tube([(-0.2, side * 0.03, 0.7), axle], 0.011, "bikeFrame", sides=5)  # seat stay
        b.tube([(HEAD_BOTTOM[0], side * 0.04, HEAD_BOTTOM[2]), (FRONT_X, side * 0.05, AXLE_Z)], 0.013, "bikeFrame", sides=5)  # fork


def _cockpit(b) -> None:
    b.tube([SEAT, (-0.235, 0, 0.9)], 0.013, "metalLight", sides=5)
    b.blob((-0.25, 0, 0.93), (0.13, 0.085, 0.04), "vendingDark", subdivisions=2, roughness=0.0)
    b.tube([HEAD_TOP, (0.39, 0, 0.98)], 0.014, "metalLight", sides=5)
    bar = [(0.26, -0.29, 0.99), (0.33, -0.22, 1.0), (0.39, -0.08, 1.0), (0.39, 0.08, 1.0), (0.33, 0.22, 1.0), (0.26, 0.29, 0.99)]
    b.tube(smooth_path(bar, 2), 0.011, "metalLight", sides=5)
    for side in (-1, 1):
        b.tube([(0.26, side * 0.29, 0.99), (0.19, side * 0.3, 0.985)], 0.016, "vendingDark", sides=6)  # grips
    b.cylinder(0.025, 0.02, (0.37, -0.15, 1.005), "metalLight", segments=8)  # bell
    b.cylinder(0.03, 0.07, (0.47, -0.07, 0.58), "metalLight", segments=8, axis="x")  # dynamo lamp


def _basket(b) -> None:
    cx, cz = 0.62, 0.86
    lx, wy, h = 0.32, 0.36, 0.22
    top, bottom = cz + h / 2, cz - h / 2
    wire = "metalLight"
    for dz in (top, bottom + 0.1):
        b.box((lx, 0.008, 0.008), (cx, -wy / 2, dz), wire)
        b.box((lx, 0.008, 0.008), (cx, wy / 2, dz), wire)
        b.box((0.008, wy, 0.008), (cx - lx / 2, 0, dz), wire)
        b.box((0.008, wy, 0.008), (cx + lx / 2, 0, dz), wire)
    b.box((lx, wy, 0.008), (cx, 0, bottom), wire, shade=0.85)
    for i in range(5):  # front wires
        b.box((0.005, 0.005, h), (cx + lx / 2, -wy / 2 + (i + 0.5) * wy / 5, cz), wire)
    for side in (-1, 1):
        for i in range(4):  # side wires
            b.box((0.005, 0.005, h), (cx - lx / 2 + (i + 0.5) * lx / 4, side * wy / 2, cz), wire)
        b.tube([(cx - 0.05, side * 0.08, bottom), (FRONT_X, side * 0.05, AXLE_Z)], 0.007, wire, sides=4)  # stays


def _fenders(b) -> None:
    for x, start, end in ((REAR_X, 25, 190), (FRONT_X, -20, 140)):
        arc = arc_points((x, 0.0, AXLE_Z), TIRE_R + 0.045, start, end, "y", 14)
        b.tube(arc, 0.03, "bikeFrame", shade=1.05, sides=6, section=(1.0, 0.25), up=Y_AXIS)
    b.box((0.012, 0.04, 0.05), (REAR_X - TIRE_R - 0.06, 0, AXLE_Z + 0.08), "signRed")  # reflector


def _drivetrain(b) -> None:
    guard = [(0.02, 0.30), (-0.02, 0.37), (-0.12, 0.41), (-0.52, 0.39), (-0.58, 0.35), (-0.52, 0.30), (-0.12, 0.24), (-0.02, 0.24)]
    b.extrude(guard, 0.01, (0, -0.075, 0), "bikeFrame", axis="y", shade=0.85)
    for side, angle_end in ((-1, (0.0, 0.16)), (1, (-0.16, 0.44))):
        y = side * 0.085
        b.tube([(BB[0], y, BB[2]), (angle_end[0], y, angle_end[1])], 0.012, "vendingDark", sides=5)  # crank
        b.box((0.1, 0.07, 0.02), (angle_end[0], side * 0.13, angle_end[1]), "vendingDark", shade=1.3)  # pedal


def _carrier_and_stand(b) -> None:
    b.box((0.36, 0.14, 0.012), (REAR_X - 0.02, 0, 0.72), "metalLight", shade=0.9)
    for side in (-1, 1):
        y = side * 0.065
        b.tube([(REAR_X - 0.2, y, 0.72), (REAR_X, y, AXLE_Z)], 0.008, "metalLight", sides=4)
        b.tube([(REAR_X + 0.15, y, 0.72), (-0.2, y, 0.7)], 0.008, "metalLight", sides=4)
        b.tube([(REAR_X, side * 0.06, AXLE_Z), (REAR_X - 0.18, side * 0.12, 0.012)], 0.01, "metalLight", sides=5)  # stand
    b.box((0.02, 0.26, 0.02), (REAR_X - 0.18, 0, 0.012), "metalLight")
