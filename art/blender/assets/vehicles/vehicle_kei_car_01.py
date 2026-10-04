"""Kei car (軽自動車), tall-wagon type, 1.48 × 1.70 × 3.40 m — the kei size limits.

A generic boxy body with no brand cues: an extruded side profile with wheel
arches and rounded (bevelled) edges, and a slightly narrower cabin that is
hollow: a roof on body-colored pillars, tinted glass all round (the `glass`
slot), and seats, a dashboard and a steering wheel on the right inside. Four
wheels with hubcaps, lamps, mirrors, door seams and yellow kei plates front
and rear (atlas cell `plate_kei`). Front faces −Y. No baked AO or grime
(user decision, Stage 3).
"""

import math

from lib.builder import arc_points

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

CABIN_W = 2 * HALF_W - 0.08
BELT = 1.0  # bottom of the glass
ROOF = 1.55  # top of the glass
PILLAR = 0.11  # how far a pillar reaches in from the cabin's side


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
    _cabin(b)
    _interior(b)
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
    # Wheel wells: dark fill between the tyres so the arches don't show a tunnel
    for y in AXLES:
        b.box((2 * (HALF_W - WHEEL_W) - 0.02, 0.62, 0.36), (0, y, 0.44), "tireRubber", shade=0.7)


def _cabin(b) -> None:
    """The cabin's shell around the glass: the belt under it, the roof over
    it and four pillars a side. Profiles are (y, z), like the body's."""
    b.extrude([(-1.20, 0.88), (-1.10, BELT), (1.685, BELT), (REAR_Y - 0.01, 0.88)], CABIN_W, (0, 0, 0), "carBody", axis="x")
    roof = [(-0.645, ROOF), (-0.62, 1.58), (-0.50, 1.66), (1.52, 1.68), (1.66, 1.60), (1.662, ROOF)]
    b.extrude(roof, CABIN_W, (0, 0, 0), "carBody", axis="x", bevel=0.03)
    pillars = [
        [(-1.10, BELT), (-1.03, BELT), (-0.60, ROOF), (-0.645, ROOF)],
        [(-0.05, BELT), (0.05, BELT), (0.05, ROOF), (-0.05, ROOF)],
        [(0.86, BELT), (0.96, BELT), (0.96, ROOF), (0.86, ROOF)],
        [(1.56, BELT), (1.685, BELT), (1.662, ROOF), (1.49, ROOF)],
    ]
    for side in (-1, 1):
        for outline in pillars:
            b.extrude(outline, PILLAR, (side * (CABIN_W - PILLAR) / 2, 0, 0), "carBody", axis="x")


def _interior(b) -> None:
    """What the glass shows: a dark floor, the dashboard, a steering wheel on
    the right (−X when the front faces −Y), two front seats and a rear bench."""
    b.box((CABIN_W - 0.06, 2.72, 0.012), (0, 0.29, BELT + 0.006), "vendingDark", shade=1.1)
    b.box((CABIN_W - 0.1, 0.22, 0.09), (0, -0.88, BELT + 0.05), "vendingDark", shade=1.5, bevel=0.02, segments=1)
    b.tube(arc_points((-0.33, -0.76, BELT + 0.17), 0.13, 0, 324, axis="y", segments=9), 0.016, "vendingDark", shade=0.9, sides=4, closed=True)
    for x in (-0.33, 0.33):
        b.box((0.44, 0.12, 0.36), (x, -0.36, BELT + 0.18), "carSeat", bevel=0.03, segments=1)
        b.box((0.22, 0.09, 0.12), (x, -0.35, BELT + 0.43), "carSeat", shade=0.92, bevel=0.02, segments=1)
    b.box((1.14, 0.12, 0.34), (0, 0.78, BELT + 0.17), "carSeat", bevel=0.03, segments=1)
    for x in (-0.33, 0.33):
        b.box((0.22, 0.09, 0.12), (x, 0.79, BELT + 0.41), "carSeat", shade=0.92, bevel=0.02, segments=1)


def _glass(b) -> None:
    # Windscreen: a thin slab along the rake, between the front pillars
    a, c = (-1.14, 0.97), (-0.64, 1.56)
    length = math.dist(a, c)
    tilt = math.degrees(math.atan2(c[0] - a[0], c[1] - a[1]))
    normal = (-(c[1] - a[1]) / length, (c[0] - a[0]) / length)
    mid = ((a[0] + c[0]) / 2 + normal[0] * 0.012, (a[1] + c[1]) / 2 + normal[1] * 0.012)
    b.box((CABIN_W - 2 * PILLAR + 0.02, 0.012, length), (0, mid[0], mid[1]), "carGlass", rotation=(-tilt, 0, 0), material="glass")

    windows = [
        [(-1.03, BELT), (-0.60, ROOF), (-0.05, ROOF), (-0.05, BELT)],
        [(0.05, BELT), (0.05, ROOF), (0.86, ROOF), (0.86, BELT)],
        [(0.96, BELT), (0.96, ROOF), (1.49, ROOF), (1.56, BELT)],
    ]
    for side in (-1, 1):
        for outline in windows:
            b.extrude(outline, 0.012, (side * (HALF_W - 0.046), 0, 0), "carGlass", axis="x", material="glass")
    b.box((CABIN_W - 2 * PILLAR + 0.02, 0.012, ROOF - BELT), (0, 1.672, (ROOF + BELT) / 2), "carGlass", rotation=(-2.4, 0, 0), material="glass")


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
