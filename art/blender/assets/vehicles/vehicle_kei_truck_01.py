"""Kei truck (軽トラ), 1.48 × 1.78 × 3.40 m — the kei size limits.

The white cab-over pickup of farms, shops and building sites: a short cab
with the front wheels under the seats — hollow, with tinted glass all round
(the `glass` slot), two seats and a steering wheel on the right — a flat
bed with drop sides, a guard frame behind the cab, and yellow kei plates
front and rear (atlas cell `plate_kei`). No brand cues. Front faces −Y. No
baked AO or grime.
"""

import math

from lib.builder import arc_points

NAME = "vehicle_kei_truck_01"
CATEGORY = "vehicles"
TRI_BUDGET = 8000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

HALF_W = 0.74
FRONT_Y, REAR_Y = -1.70, 1.70
CAB_BACK = -0.55
WHEEL_R = 0.26
WHEEL_W = 0.15
AXLES = (-1.25, 1.05)  # front, rear
ARCH_R = 0.31
BODY_BOTTOM = 0.22

BELT = 1.03  # bottom of the glass
ROOF = 1.64  # top of the glass
PILLAR = 0.11  # how far a pillar reaches in from the cab's side

BED_FRONT = -0.50
BED_FLOOR = 0.66
BED_SIDE = 0.30

BODY = "vendingPanel"


def _arch(center_y: float) -> list[tuple[float, float]]:
    """Wheel-arch notch in the (y, z) profile, rear side first."""
    start = math.degrees(math.asin((BODY_BOTTOM - WHEEL_R) / ARCH_R))
    steps = 10
    return [
        (center_y + ARCH_R * math.cos(math.radians(a)), WHEEL_R + ARCH_R * math.sin(math.radians(a)))
        for a in (start + (180 - 2 * start) * i / steps for i in range(steps + 1))
    ]


def build(b) -> None:
    _cab(b)
    _bed(b)
    _wheels(b)
    _front(b)
    _rear(b)


def _cab(b) -> None:
    """The cab in three parts, so that it is hollow behind the glass: the
    body up to the belt, the roof, and two pillars a side. Profiles are (y, z)."""
    lower = [
        (-1.66, BODY_BOTTOM),
        (FRONT_Y, 0.32),
        (FRONT_Y, 0.86),
        (-1.62, 0.95),
        (-1.599, BELT),
        (CAB_BACK, BELT),
        (CAB_BACK, BODY_BOTTOM),
        *_arch(AXLES[0]),
    ]
    b.extrude(lower, 2 * HALF_W, (0, 0, 0), BODY, axis="x", bevel=0.04)
    roof = [(-1.436, ROOF), (-1.42, 1.70), (-1.34, 1.78), (-0.60, 1.78), (CAB_BACK, 1.72), (CAB_BACK, ROOF)]
    b.extrude(roof, 2 * HALF_W, (0, 0, 0), BODY, axis="x", bevel=0.03)
    pillars = [
        [(-1.599, BELT), (-1.50, BELT), (-1.36, ROOF), (-1.436, ROOF)],
        [(-0.68, BELT), (CAB_BACK, BELT), (CAB_BACK, ROOF), (-0.68, ROOF)],
    ]
    for side in (-1, 1):
        for outline in pillars:
            b.extrude(outline, PILLAR, (side * (HALF_W - PILLAR / 2), 0, 0), BODY, axis="x")

    # Inside: a dark floor, the dashboard, a steering wheel on the right (−X) and two seats
    b.box((2 * HALF_W - 0.08, 0.98, 0.012), (0, -1.07, BELT + 0.006), "vendingDark", shade=1.1)
    b.box((2 * HALF_W - 0.12, 0.16, 0.08), (0, -1.47, BELT + 0.045), "vendingDark", shade=1.5, bevel=0.02, segments=1)
    b.tube(arc_points((-0.35, -1.33, BELT + 0.2), 0.14, 0, 324, axis="y", segments=9), 0.016, "vendingDark", shade=0.9, sides=4, closed=True)
    for x in (-0.35, 0.35):
        b.box((0.5, 0.1, 0.4), (x, -0.72, BELT + 0.2), "carSeat", bevel=0.03, segments=1)
        b.box((0.24, 0.08, 0.12), (x, -0.71, BELT + 0.47), "carSeat", shade=0.92, bevel=0.02, segments=1)

    # Windscreen: a thin slab along the rake, between the front pillars
    a, c = (-1.60, BELT), (-1.44, ROOF)
    length = math.dist(a, c)
    tilt = math.degrees(math.atan2(c[0] - a[0], c[1] - a[1]))
    normal = (-(c[1] - a[1]) / length, (c[0] - a[0]) / length)
    mid = ((a[0] + c[0]) / 2 + normal[0] * 0.012, (a[1] + c[1]) / 2 + normal[1] * 0.012)
    b.box((2 * (HALF_W - PILLAR) + 0.02, 0.012, length), (0, mid[0], mid[1]), "carGlass", rotation=(-tilt, 0, 0), material="glass")

    window = [(-1.50, BELT), (-1.36, ROOF), (-0.68, ROOF), (-0.68, BELT)]
    for side in (-1, 1):
        x = side * HALF_W
        b.extrude(window, 0.012, (side * (HALF_W - 0.006), 0, 0), "carGlass", axis="x", material="glass")
        b.box((0.006, 0.006, 0.74), (x + side * 0.001, -0.63, 0.66), "vendingDark")  # door seam
        b.box((0.014, 0.1, 0.025), (x + side * 0.004, -0.76, 0.9), "vendingDark", shade=1.4)  # handle
        b.box((0.1, 0.03, 0.03), (side * (HALF_W + 0.05), -1.46, 1.2), "vendingDark")  # mirror arm
        b.box((0.03, 0.04, 0.2), (side * (HALF_W + 0.1), -1.47, 1.26), "vendingDark", bevel=0.008, segments=1)
    b.box((2 * (HALF_W - PILLAR) + 0.02, 0.012, ROOF - BELT), (0, CAB_BACK - 0.01, (ROOF + BELT) / 2), "carGlass", material="glass")  # rear cab window


def _bed(b) -> None:
    length = REAR_Y - BED_FRONT
    mid_y = (REAR_Y + BED_FRONT) / 2
    side_z = BED_FLOOR + BED_SIDE / 2
    b.box((0.9, 2.9, 0.16), (0, 0.2, 0.44), "vendingDark", shade=1.2)  # chassis
    b.box((2 * HALF_W, length, 0.06), (0, mid_y, BED_FLOOR), BODY, shade=0.9)

    for side in (-1, 1):
        x = side * (HALF_W - 0.02)
        b.box((0.04, length, BED_SIDE), (x, mid_y, side_z + 0.03), BODY, bevel=0.008, segments=1)
        for y in (0.0, 0.6, 1.2):  # ribs and latches of the drop side
            b.box((0.012, 0.05, BED_SIDE - 0.04), (side * (HALF_W + 0.004), y, side_z + 0.03), BODY, shade=0.9)
    for y in (BED_FRONT + 0.02, REAR_Y - 0.02):
        b.box((2 * HALF_W, 0.04, BED_SIDE), (0, y, side_z + 0.03), BODY, bevel=0.008, segments=1)

    # Guard frame (鳥居) behind the cab
    top = 1.74
    for x in (-0.62, 0.62):
        b.box((0.04, 0.04, top - BED_FLOOR - BED_SIDE), (x, BED_FRONT + 0.02, (top + BED_FLOOR + BED_SIDE) / 2), BODY, shade=0.92)
    b.box((1.28, 0.04, 0.04), (0, BED_FRONT + 0.02, top), BODY, shade=0.92)


def _wheels(b) -> None:
    for y in AXLES:
        b.box((2 * (HALF_W - WHEEL_W) - 0.02, 0.56, 0.3), (0, y, 0.38), "tireRubber", shade=0.7)  # dark fill behind
        for side in (-1, 1):
            inner = HALF_W - WHEEL_W if side > 0 else -HALF_W
            b.cylinder(WHEEL_R, WHEEL_W, (inner, y, WHEEL_R), "tireRubber", segments=18, axis="x")
            cap_base = HALF_W if side > 0 else -HALF_W - 0.012
            b.cylinder(0.15, 0.012, (cap_base, y, WHEEL_R), "metalLight", shade=0.9, segments=14, axis="x")


def _front(b) -> None:
    for x in (-0.5, 0.5):
        b.box((0.24, 0.04, 0.15), (x, FRONT_Y + 0.005, 0.72), "insulator", bevel=0.012)  # headlamps
        b.box((0.07, 0.035, 0.07), (x * 1.3, FRONT_Y + 0.008, 0.56), "mirrorOrange", shade=1.05)  # indicators
    b.box((0.6, 0.02, 0.07), (0, FRONT_Y - 0.004, 0.72), "vendingDark", shade=1.3)  # grille slot
    b.box((1.44, 0.06, 0.16), (0, FRONT_Y, 0.34), "vendingDark", shade=1.5, bevel=0.03)  # bumper
    b.box((0.33, 0.012, 0.165), (0, FRONT_Y - 0.036, 0.46), "metalLight", print="plate_kei", print_dir="-y")
    for x in (-0.3, 0.3):  # wipers
        b.box((0.46, 0.015, 0.012), (x, -1.615, 1.06), "vendingDark", rotation=(0, 0, 4 * (1 if x > 0 else -1)))


def _rear(b) -> None:
    b.box((1.36, 0.05, 0.1), (0, REAR_Y - 0.04, 0.5), "vendingDark", shade=1.3)  # lamp bar under the gate
    for x in (-0.58, 0.58):
        b.box((0.16, 0.03, 0.08), (x, REAR_Y - 0.01, 0.5), "signRed", bevel=0.008, segments=1)
    b.box((0.33, 0.012, 0.165), (0.18, REAR_Y - 0.008, 0.5), "metalLight", print="plate_kei", print_dir="+y")
    for x in (-0.45, 0.45):  # gate latches
        b.box((0.05, 0.012, 0.08), (x, REAR_Y + 0.004, BED_FLOOR + BED_SIDE - 0.03), "vendingDark", shade=1.4)
