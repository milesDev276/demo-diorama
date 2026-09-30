"""Japanese drink vending machine (自販機), ≈ 1.0 × 0.7 × 1.83 m.

A lit sample display with three rows of dummy drinks (PET bottles on top,
cans below) and a price button under each; blue buttons are cold drinks,
red are hot. Below: a coin / bill / IC-card panel on the right, an ad panel
on the left and the pickup flap near the ground. Front faces −Y.
"""

import random

NAME = "prop_vending_machine_01"
CATEGORY = "props"
TRI_BUDGET = 5000

WIDTH = 1.0
HEIGHT = 1.83
DOOR_FRONT_Y = -0.33  # front face of the door slab
GLASS_Y = -0.38  # front face of the display bezel

DISPLAY_BOTTOM = 1.01
ROW_HEIGHT = 0.195
SAMPLES_PER_ROW = 8
SAMPLE_PITCH = 0.105

DRINK_COLORS = ["canBlue", "signRed", "canYellow", "canGreen", "insulator", "vendingDark", "canBlue", "shopAwningLight"]


def build(b) -> None:
    rng = random.Random(NAME)
    _cabinet(b)
    _display(b, rng)
    _controls(b)
    _ad_panel(b)
    _pickup(b)


def _cabinet(b) -> None:
    b.box((0.94, 0.60, 0.06), (0, 0.04, 0.03), "vendingDark")  # recessed kick plinth
    b.box((WIDTH, 0.66, 1.74), (0, 0.03, 0.93), "vendingBody", bevel=0.015, cuts=3)
    b.box((1.02, 0.69, 0.03), (0, 0.03, 1.815), "vendingBody", shade=0.88, bevel=0.008)  # top cap
    b.box((0.97, 0.03, 1.66), (0, -0.315, 0.92), "vendingBody", shade=1.05, bevel=0.01)  # front door
    b.box((0.88, 0.012, 0.09), (0, -0.336, 1.68), "vendingPanel", material="emissive")  # lit header band


def _display(b, rng: random.Random) -> None:
    top = DISPLAY_BOTTOM + 3 * ROW_HEIGHT
    mid_z = (DISPLAY_BOTTOM + top) / 2
    bezel_y = (DOOR_FRONT_Y + GLASS_Y) / 2
    bezel_depth = DOOR_FRONT_Y - GLASS_Y

    # Backlit panel and a silver bezel around it
    b.box((0.86, 0.01, top - DISPLAY_BOTTOM), (0, DOOR_FRONT_Y - 0.005, mid_z), "vendingPanel", material="emissive")
    b.box((0.92, bezel_depth, 0.03), (0, bezel_y, top + 0.015), "signPost", bevel=0.004)
    b.box((0.92, bezel_depth, 0.03), (0, bezel_y, DISPLAY_BOTTOM - 0.015), "signPost", bevel=0.004)
    for x in (-0.445, 0.445):
        b.box((0.03, bezel_depth, top - DISPLAY_BOTTOM), (x, bezel_y, mid_z), "signPost", bevel=0.004)

    for row in range(3):
        base = DISPLAY_BOTTOM + row * ROW_HEIGHT
        if row > 0:
            b.box((0.86, bezel_depth, 0.014), (0, bezel_y, base - 0.007), "vendingPanel", shade=0.8)  # shelf ledge
        is_bottle_row = row == 2
        for i in range(SAMPLES_PER_ROW):
            x = (i - (SAMPLES_PER_ROW - 1) / 2) * SAMPLE_PITCH
            color = rng.choice(DRINK_COLORS)
            shade = rng.uniform(0.85, 1.1)
            if is_bottle_row:
                b.cylinder(0.03, 0.15, (x, -0.36, base), color, shade=shade, material="emissive")
                b.cylinder(0.014, 0.02, (x, -0.36, base + 0.15), "insulator", material="emissive")
            else:
                b.cylinder(0.029, 0.105, (x, -0.36, base), color, shade=shade, material="emissive")
            # Price button: the two right-most in the lower rows sell hot drinks.
            hot = row < 2 and i >= SAMPLES_PER_ROW - 2
            b.box(
                (0.045, 0.006, 0.012),
                (x, GLASS_Y - 0.003, base - 0.008),
                "signRed" if hot else "canBlue",
                material="emissive",
            )


def _controls(b) -> None:
    x = 0.33
    b.box((0.25, 0.03, 0.42), (x, -0.345, 0.73), "vendingDark", shade=1.25, bevel=0.006)
    front = -0.36
    b.box((0.12, 0.006, 0.03), (x, front - 0.003, 0.90), "signRed", material="emissive")  # credit readout
    # Coin slot and bill slot on silver plates
    b.box((0.06, 0.012, 0.08), (0.27, front - 0.006, 0.81), "signPost")
    b.box((0.006, 0.006, 0.045), (0.27, front - 0.013, 0.815), "vendingDark", shade=0.4)
    b.box((0.11, 0.012, 0.035), (0.375, front - 0.006, 0.81), "signPost")
    b.box((0.08, 0.006, 0.006), (0.375, front - 0.013, 0.81), "vendingDark", shade=0.4)
    # IC card reader with its status light
    b.box((0.10, 0.014, 0.075), (x, front - 0.007, 0.69), "insulator", shade=0.95, bevel=0.003)
    b.box((0.02, 0.004, 0.006), (x, front - 0.016, 0.715), "canBlue", material="emissive")
    b.box((0.08, 0.04, 0.05), (x, front - 0.01, 0.575), "vendingDark", shade=0.6)  # change return cup


def _ad_panel(b) -> None:
    b.box((0.58, 0.01, 0.40), (-0.17, -0.335, 0.73), "vendingPanel", shade=0.95)
    b.box((0.58, 0.004, 0.08), (-0.17, -0.342, 0.60), "canBlue")
    b.box((0.10, 0.004, 0.26), (-0.36, -0.342, 0.77), "canGreen", shade=0.9)


def _pickup(b) -> None:
    x = -0.13
    b.box((0.64, 0.04, 0.26), (x, -0.34, 0.29), "vendingDark", shade=0.7)  # dark opening
    b.box((0.58, 0.012, 0.19), (x, -0.362, 0.28), "vendingDark", shade=1.5, bevel=0.004)  # flap
    b.box((0.68, 0.07, 0.02), (x, -0.36, 0.43), "vendingBody", shade=0.9, bevel=0.004)  # hood
