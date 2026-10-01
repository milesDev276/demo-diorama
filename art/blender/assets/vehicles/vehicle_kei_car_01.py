"""Kei car (軽自動車), tall-wagon type, 1.48 × 1.70 × 3.40 m — the kei size limits.

A generic boxy body with no brand cues: an extruded side profile with wheel
arches and rounded (bevelled) edges, a slightly narrower cabin with a raked
windscreen, dark glass split by body-colored pillars, four wheels with
hubcaps, lamps, mirrors, door seams and yellow kei plates front and rear
(atlas cell `plate_kei`). Front faces −Y. No baked AO or grime (user
decision, Stage 3).
"""

import math

NAME = "vehicle_kei_car_01"
CATEGORY = "vehicles"
TRI_BUDGET = 10000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

HALF_W = 0.74
FRONT_Y, REAR_Y = -1.70, 1.70
WHEEL_R = 0.28
WHEEL_W = 0.16
WHEEL_Z = 0.28
AXLES = (-1.12, 1.10)  # front, rear
ARCH_R = 0.33
BODY_BOTTOM = 0.20


def _arch(center_y: float) -> list[tuple[float, float]]:
    """Wheel-arch notch in the (y, z) profile, rear side first."""
    start = math.degrees(math.asin((BODY_BOTTOM - WHEEL_Z) / ARCH_R))
    steps = 10
    return [
        (center_y + ARCH_R * math.cos(math.radians(a)), WHEEL_Z + ARCH_R * math.sin(math.radians(a)))
        for a in (start + (180 - 2 * start) * i / steps for i in range(steps + 1))
    ]


def build(b) -> None:
    _body(b)
    _glass(b)
    _wheels(b)
    _front(b)
    _rear(b)
    _sides(b)


def _body(b) -> None:
    lower = [
        (-1.66, BODY_BOTTOM),
        (FRONT_Y, 0.30),
        (FRONT_Y, 0.62),
        (-1.64, 0.74),
        (-1.20, 0.90),
        (1.64, 0.95),
        (REAR_Y, 0.90),
        (REAR_Y, 0.28),
        (1.66, BODY_BOTTOM),
        *_arch(AXLES[1]),
        *_arch(AXLES[0]),
    ]
    b.extrude(lower, 2 * HALF_W, (0, 0, 0), "carBody", axis="x", bevel=0.04)
    cabin = [(-1.20, 0.88), (-0.62, 1.58), (-0.50, 1.66), (1.52, 1.68), (1.66, 1.60), (REAR_Y - 0.01, 0.88)]
    b.extrude(cabin, 2 * HALF_W - 0.08, (0, 0, 0), "carBody", axis="x", bevel=0.05)
    # Wheel wells: dark fill between the tyres so the arches don't show a tunnel
    for y in AXLES:
        b.box((2 * (HALF_W - WHEEL_W) - 0.02, 0.62, 0.36), (0, y, 0.44), "tireRubber", shade=0.7)


def _glass(b) -> None:
    # Windscreen: a thin slab along the rake, just proud of the cabin
    a, c = (-1.14, 0.97), (-0.65, 1.53)
    length = math.dist(a, c)
    tilt = math.degrees(math.atan2(c[0] - a[0], c[1] - a[1]))
    normal = (-(c[1] - a[1]) / length, (c[0] - a[0]) / length)
    mid = ((a[0] + c[0]) / 2 + normal[0] * 0.012, (a[1] + c[1]) / 2 + normal[1] * 0.012)
    b.box((1.2, 0.012, length), (0, mid[0], mid[1]), "carGlass", rotation=(-tilt, 0, 0))

    windows = [
        [(-1.03, 1.0), (-0.62, 1.5), (-0.05, 1.53), (-0.05, 1.0)],
        [(0.05, 1.0), (0.05, 1.54), (0.86, 1.55), (0.86, 1.0)],
        [(0.96, 1.0), (0.96, 1.55), (1.48, 1.56), (1.56, 1.0)],
    ]
    for side in (-1, 1):
        for outline in windows:
            b.extrude(outline, 0.012, (side * (HALF_W - 0.034), 0, 0), "carGlass", axis="x")
    b.box((1.18, 0.012, 0.5), (0, REAR_Y + 0.004, 1.32), "carGlass")


def _wheels(b) -> None:
    for y in AXLES:
        for side in (-1, 1):
            inner = HALF_W - WHEEL_W if side > 0 else -HALF_W
            b.cylinder(WHEEL_R, WHEEL_W, (inner, y, WHEEL_Z), "tireRubber", segments=18, axis="x")
            cap_base = HALF_W if side > 0 else -HALF_W - 0.012
            b.cylinder(0.17, 0.012, (cap_base, y, WHEEL_Z), "metalLight", segments=14, axis="x")


def _front(b) -> None:
    for x in (-0.47, 0.47):
        b.box((0.30, 0.05, 0.10), (x, FRONT_Y + 0.015, 0.66), "insulator", bevel=0.012)
    b.box((0.5, 0.03, 0.08), (0, FRONT_Y - 0.01, 0.55), "vendingDark", shade=1.3, bevel=0.008)
    b.box((1.44, 0.06, 0.16), (0, FRONT_Y, 0.31), "carBody", shade=0.92, bevel=0.03)
    b.box((0.33, 0.012, 0.165), (0, FRONT_Y - 0.036, 0.42), "metalLight", print="plate_kei", print_dir="-y")
    for x in (-0.25, 0.25):
        b.box((0.42, 0.015, 0.012), (x, -1.12, 0.95), "vendingDark", rotation=(0, 0, 4 * (1 if x > 0 else -1)))


def _rear(b) -> None:
    for x in (-0.66, 0.66):
        b.box((0.08, 0.03, 0.30), (x, REAR_Y, 0.98), "signRed", bevel=0.01)
    b.box((1.44, 0.06, 0.16), (0, REAR_Y, 0.31), "carBody", shade=0.92, bevel=0.03)
    b.box((0.33, 0.012, 0.165), (0, REAR_Y + 0.008, 0.62), "metalLight", print="plate_kei", print_dir="+y")


def _sides(b) -> None:
    for side in (-1, 1):
        x = side * HALF_W
        b.box((0.08, 0.1, 0.07), (side * (HALF_W + 0.05), -0.98, 1.02), "carBody", shade=0.95, bevel=0.015)  # mirror
        for y in (-0.02, 0.9):
            b.box((0.006, 0.006, 0.6), (x + side * 0.001, y, 0.62), "vendingDark")  # door seams
        for y in (-0.25, 0.68):
            b.box((0.014, 0.1, 0.025), (x + side * 0.004, y, 0.84), "vendingDark", shade=1.4)  # handles
