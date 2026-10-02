"""Japanese concrete utility pole (電柱) with a pole transformer, 10 m tall.

A tapering concrete shaft with the yellow-and-black guard band at its foot
and step bolts up its sides; a crossarm at 9.2 m carrying two high-voltage
insulators, a third on the pole top; a rack of two low-voltage insulators
and a pole transformer (柱上変圧器) on the lot side at 6.8 … 7.7 m; and a
clamp for the communication cable lower down. Wires run along X; the lot
side is +Y (the back). The insulators stand where
features/diorama/objects/poleLayout.json puts the wires, which the app
draws. No baked AO or grime.
"""

import json

from lib.palette import REPO_ROOT

NAME = "infra_utility_pole_01"
CATEGORY = "infrastructure"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

LAYOUT = json.loads((REPO_ROOT / "features" / "diorama" / "objects" / "poleLayout.json").read_text(encoding="utf-8"))
HEIGHT = LAYOUT["height"]
CROSSARM_Z = LAYOUT["crossarmY"]

BASE_R = 0.17
TOP_R = 0.095
INSULATOR_H = 0.2


def shaft_radius(z: float) -> float:
    return BASE_R + (TOP_R - BASE_R) * z / HEIGHT


def build(b) -> None:
    b.cylinder(BASE_R, HEIGHT, (0, 0, 0), "poleConcrete", segments=12, radius_top=TOP_R)

    # Guard band: yellow with black stripes
    b.cylinder(BASE_R + 0.012, 1.1, (0, 0, 0.35), "poleGuard", segments=12, radius_top=shaft_radius(1.45) + 0.012)
    for z in (0.55, 0.85, 1.15):
        b.cylinder(shaft_radius(z) + 0.016, 0.13, (0, 0, z), "wireGray", segments=12)

    # Step bolts, alternating sides
    for i in range(14):
        z = 2.0 + i * 0.45
        side = 1 if i % 2 else -1
        r = shaft_radius(z)
        b.box((0.2, 0.022, 0.022), (side * (r + 0.08), 0, z), "signPost", shade=0.7)

    _wires_hardware(b)
    _transformer(b)


def _wires_hardware(b) -> None:
    """Crossarm, braces and an insulator under every wire of the layout."""
    arm_y = shaft_radius(CROSSARM_Z) + 0.045  # bolted to the side of the pole
    b.box((0.09, 1.75, 0.09), (-arm_y, 0, CROSSARM_Z), "signPost", shade=0.75)
    for side in (-1, 1):
        b.tube([(-arm_y, side * 0.6, CROSSARM_Z - 0.04), (-shaft_radius(8.6), 0, 8.6)], 0.018, "signPost", shade=0.7, sides=4)

    rack_done = False
    for wire in LAYOUT["wires"]:
        # App space (y up, z front) → Blender (z up, −y front)
        y, z = -wire["z"], wire["y"]
        if z > CROSSARM_Z:  # high voltage: a pin insulator standing under the wire
            x = -arm_y if abs(y) > 0.1 else 0
            foot = z - INSULATOR_H
            b.cylinder(0.02, 0.07, (x, y, foot - 0.03), "signPost", shade=0.7, segments=6)
            b.cylinder(0.055, INSULATOR_H * 0.45, (x, y, foot + 0.02), "insulator", segments=10, radius_top=0.035)
            b.cylinder(0.05, INSULATOR_H * 0.4, (x, y, foot + 0.1), "insulator", segments=10, radius_top=0.025)
        elif z > 7:  # low voltage: spool insulators on a vertical rack
            if not rack_done:
                rack_done = True
                reach = y - shaft_radius(z)
                b.box((0.04, abs(reach) + 0.04, 0.04), (0, shaft_radius(z) + reach / 2, z + 0.02), "signPost", shade=0.7)
                b.box((0.035, 0.035, 0.5), (0, y, z - 0.1), "signPost", shade=0.75)
            b.cylinder(0.04, 0.09, (-0.045, y, z), "insulator", segments=8, axis="x")
        else:  # communication cable: a clamp on the street side
            b.cylinder(shaft_radius(z) + 0.012, 0.07, (0, 0, z - 0.035), "signPost", shade=0.65, segments=12)
            b.box((0.05, abs(y) - shaft_radius(z) + 0.03, 0.04), (0, y / 2 - 0.03, z), "signPost", shade=0.7)


def _transformer(b) -> None:
    """Pole transformer on a bracket, on the lot side."""
    y = shaft_radius(7.2) + 0.36
    b.box((0.09, 0.3, 0.09), (0, shaft_radius(7.0) + 0.12, 6.86), "signPost", shade=0.7)  # bracket
    b.cylinder(shaft_radius(7.0) + 0.012, 0.09, (0, 0, 6.82), "signPost", shade=0.65, segments=12)  # pole band
    b.cylinder(0.3, 0.82, (0, y, 6.84), "transformer", segments=14)  # tank
    b.cylinder(0.315, 0.05, (0, y, 7.62), "transformer", shade=0.85, segments=14)  # lid
    for i in range(5):  # cooling fins toward the back
        a = -0.9 + i * 0.45
        b.box((0.012, 0.09, 0.56), (0.3 * a / 0.9 * 0.55, y + 0.31, 7.2), "transformer", shade=0.8)
    for x in (-0.12, 0.12):  # bushings on the lid
        b.cylinder(0.035, 0.16, (x, y, 7.67), "insulator", segments=8, radius_top=0.02)
    # Leads up to the low-voltage rack
    b.tube([(0.12, y, 7.83), (0.1, 0.3, 8.0), (0.0, 0.27, 8.12)], 0.012, "wireGray", sides=4)
