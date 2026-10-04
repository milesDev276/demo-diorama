"""Convenience store (コンビニ), 9.1 × 7.28 m (5 × 4 ken), ≈ 3.7 m tall.

A low flat-roofed box with a glass front and a double door in the middle.
Behind the glass, the front of the sales floor: drink fridges along the
back, three gondolas and a counter. Over it a lit sign band that wraps onto
both sides — a pale panel with a green and a blue stripe and the name plate
of a store that does not exist (atlas cell `konbini_sign`). Three waste bins
stand by the door, an AC unit on the roof. Front faces −Y. No baked AO or
grime.
"""

import random

from lib.interior import product_row

NAME = "building_konbini_01"
CATEGORY = "buildings"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 9.1, 7.28
FRONT = -D / 2
FOUNDATION = 0.15
WALL_TOP = 3.55

GLASS_W = 8.2
GLASS_TOP = 2.5
ROOM_DEPTH = 2.2  # a shadow box: the front of the sales floor

BAND_Z = 3.0
BAND_H = 0.8
WRAP = 1.82  # how far the sign band runs along each side wall

PLATE_W, PLATE_H = 2.77, 0.44  # the shape of the atlas cell

FRAME = "signPost"
PANE = "glassPane"
LIT = "lampWhite"


def build(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUNDATION), (0, 0, FOUNDATION / 2), "foundation")
    _walls(b)
    b.box((W + 0.1, D + 0.1, 0.1), (0, 0, WALL_TOP + 0.05), "roofSlab", shade=0.92)  # parapet cap
    b.box((1.3, 0.8, 0.7), (2.4, 1.6, WALL_TOP + 0.45), "acUnit", bevel=0.02, segments=1)
    b.box((0.9, 0.06, 2.0), (-3.2, D / 2 + 0.01, FOUNDATION + 1.0), "doorDark")  # staff door at the back

    _room(b)
    _glass_front(b)
    _sign_band(b)
    _bins(b)


def _walls(b) -> None:
    """The box, with the room cut out of its front: a side wall at each end
    (one face each, so the siding has no seam), the block behind the room and
    the block over it."""
    pier = (W - GLASS_W) / 2
    height = WALL_TOP - FOUNDATION
    for side in (-1, 1):
        b.box((pier, D, height), (side * (W - pier) / 2, 0, FOUNDATION + height / 2), "wallSiding")
    b.box((GLASS_W, D - ROOM_DEPTH, height), (0, ROOM_DEPTH / 2, FOUNDATION + height / 2), "wallSiding")
    b.box((GLASS_W, ROOM_DEPTH, WALL_TOP - GLASS_TOP), (0, FRONT + ROOM_DEPTH / 2, (WALL_TOP + GLASS_TOP) / 2), "wallSiding")


def _room(b) -> None:
    """What the glass shows. Walls, fixtures and goods are emissive: a konbini is the brightest thing on its street."""
    rng = random.Random(NAME)
    back = FRONT + ROOM_DEPTH
    mid_y = FRONT + ROOM_DEPTH / 2
    height = GLASS_TOP - FOUNDATION
    b.box((GLASS_W, ROOM_DEPTH, 0.02), (0, mid_y, FOUNDATION + 0.01), "vendingPanel", shade=0.9)  # floor
    b.box((GLASS_W, 0.03, height), (0, back - 0.015, FOUNDATION + height / 2), LIT, shade=0.95, material="emissive")
    for side in (-1, 1):
        b.box((0.03, ROOM_DEPTH, height), (side * (GLASS_W / 2 - 0.015), mid_y, FOUNDATION + height / 2), LIT, shade=0.9, material="emissive")

    # Drink fridges along the back wall: five doors, four shelves of bottles and cans each
    case_w = 1.2
    for i in range(5):
        x0 = -GLASS_W / 2 + 0.25 + i * (case_w + 0.06)
        b.box((case_w, 0.3, 2.0), (x0 + case_w / 2, back - 0.18, FOUNDATION + 1.0), "vendingDark", shade=1.4, material="emissive")
        b.box((case_w - 0.1, 0.02, 1.8), (x0 + case_w / 2, back - 0.34, FOUNDATION + 1.05), LIT, material="emissive")
        for level in range(4):
            product_row(b, rng, x0 + 0.07, x0 + case_w - 0.07, (back - 0.37, FOUNDATION + 0.2 + level * 0.44), along="x", depth=0.05, height=0.32)

    # Gondolas running back from the window, goods on both faces
    for x in (1.3, 2.4, 3.5):
        b.box((0.5, 1.3, 0.12), (x, FRONT + 0.95, FOUNDATION + 0.06), "vendingPanel", shade=0.8, material="emissive")
        b.box((0.06, 1.3, 1.3), (x, FRONT + 0.95, FOUNDATION + 0.77), "vendingPanel", shade=0.95, material="emissive")
        for level in range(3):
            z = FOUNDATION + 0.14 + level * 0.42
            b.box((0.5, 1.3, 0.02), (x, FRONT + 0.95, z - 0.01), "vendingPanel", shade=0.85, material="emissive")
            for side in (-1, 1):
                product_row(b, rng, FRONT + 0.32, FRONT + 1.58, (x + side * 0.15, z), along="y", depth=0.18, height=0.3)

    # Counter on the left, with a till and a hot-snack case
    b.box((2.2, 0.6, 0.95), (-2.75, FRONT + 1.35, FOUNDATION + 0.475), "vendingPanel", shade=0.92, material="emissive")
    b.box((2.2, 0.62, 0.05), (-2.75, FRONT + 1.35, FOUNDATION + 0.975), "canGreen", material="emissive")
    b.box((0.3, 0.3, 0.22), (-2.2, FRONT + 1.35, FOUNDATION + 1.11), "vendingDark", shade=1.6, material="emissive")
    b.box((0.5, 0.4, 0.4), (-3.3, FRONT + 1.35, FOUNDATION + 1.2), "canYellow", shade=1.05, material="emissive")


def _glass_front(b) -> None:
    height = GLASS_TOP - FOUNDATION
    cz = FOUNDATION + height / 2
    y = FRONT - 0.02
    b.box((GLASS_W + 0.12, 0.1, 0.06), (0, y, GLASS_TOP + 0.02), FRAME)  # head
    for side in (-1, 1):
        b.box((0.06, 0.1, height + 0.1), (side * (GLASS_W / 2 + 0.03), y, cz), FRAME)  # jambs
    b.box((GLASS_W, 0.008, height), (0, FRONT - 0.04, cz), PANE, material="glass")
    pane = GLASS_W / 6
    for i in range(7):
        b.box((0.05, 0.03, height), (-GLASS_W / 2 + i * pane, FRONT - 0.055, cz), FRAME, shade=0.95)
    b.box((GLASS_W, 0.03, 0.05), (0, FRONT - 0.055, GLASS_TOP - 0.35), FRAME, shade=0.95)  # transom rail

    # Kick panel on both sides of the double door, whose glass runs to the floor
    door_w = 1.7
    kick_w = (GLASS_W - door_w) / 2
    for side in (-1, 1):
        b.box((kick_w, 0.035, 0.3), (side * (door_w + kick_w) / 2, FRONT - 0.05, FOUNDATION + 0.15), FRAME, shade=0.88)
    for x in (-door_w / 2, 0.0, door_w / 2):
        b.box((0.07, 0.04, GLASS_TOP - 0.35 - FOUNDATION), (x, FRONT - 0.06, (GLASS_TOP - 0.35 + FOUNDATION) / 2), "vendingDark", shade=1.5)
    for x in (-0.18, 0.18):
        b.box((0.03, 0.03, 0.5), (x, FRONT - 0.085, 1.2), FRAME, shade=1.05)  # handles
    b.box((1.8, 0.9, 0.012), (0, FRONT - 0.55, 0.006), "vendingDark", shade=1.3)  # door mat


def _sign_band(b) -> None:
    """A lit panel with two stripes along its lower edge, on the front and the first bays of each side."""
    stripes = (("canGreen", BAND_Z - 0.2, 0.16), ("canBlue", BAND_Z - 0.33, 0.07))
    b.box((W + 0.16, 0.1, BAND_H), (0, FRONT - 0.03, BAND_Z), LIT, material="emissive")
    for color, z, h in stripes:
        b.box((W + 0.17, 0.012, h), (0, FRONT - 0.082, z), color, material="emissive")
    for side in (-1, 1):
        x = side * (W / 2 + 0.03)
        y = FRONT + WRAP / 2
        b.box((0.1, WRAP, BAND_H), (x, y, BAND_Z), LIT, material="emissive")
        for color, z, h in stripes:
            b.box((0.012, WRAP, h), (x + side * 0.052, y, z), color, material="emissive")

    # The store's name plate, over the door
    b.box((PLATE_W, 0.016, PLATE_H), (0, FRONT - 0.088, BAND_Z + 0.14), "canGreen", shade=0.8, print="konbini_sign")


def _bins(b) -> None:
    for i, color in enumerate(("canBlue", "canGreen", "signRed")):
        x = 2.75 + i * 0.5
        b.box((0.46, 0.4, 0.85), (x, FRONT - 0.3, 0.425), "vendingPanel", shade=0.94, bevel=0.012, segments=1)
        b.box((0.36, 0.01, 0.14), (x, FRONT - 0.503, 0.66), color)  # label over the opening
        b.box((0.24, 0.012, 0.09), (x, FRONT - 0.503, 0.5), "vendingDark")  # opening
