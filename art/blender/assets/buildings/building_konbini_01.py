"""Convenience store (コンビニ), 9.1 × 7.28 m (5 × 4 ken), ≈ 3.7 m tall.

A low flat-roofed box with a glass front lit from inside, a double door in
the middle, and a sign band over it that wraps onto both sides: a pale
lit panel with a green and a blue stripe and a round mark, for a store that
does not exist. Three waste bins stand by the door, an AC unit on the roof.
Front faces −Y. No baked AO or grime.
"""

NAME = "building_konbini_01"
CATEGORY = "buildings"
TRI_BUDGET = 2500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 9.1, 7.28
FRONT = -D / 2
FOUNDATION = 0.15
WALL_TOP = 3.55

GLASS_W = 8.2
GLASS_TOP = 2.5

BAND_Z = 3.0
BAND_H = 0.8
WRAP = 1.82  # how far the sign band runs along each side wall

FRAME = "signPost"
GLASS = "windowGlow"


def build(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUNDATION), (0, 0, FOUNDATION / 2), "foundation")
    b.box((W, D, WALL_TOP - FOUNDATION), (0, 0, (FOUNDATION + WALL_TOP) / 2), "wallSiding")
    b.box((W + 0.1, D + 0.1, 0.1), (0, 0, WALL_TOP + 0.05), "roofSlab", shade=0.92)  # parapet cap
    b.box((1.3, 0.8, 0.7), (2.4, 1.6, WALL_TOP + 0.45), "acUnit", bevel=0.02, segments=1)
    b.box((0.9, 0.06, 2.0), (-3.2, D / 2 + 0.01, FOUNDATION + 1.0), "doorDark")  # staff door at the back

    _glass_front(b)
    _sign_band(b)
    _bins(b)


def _glass_front(b) -> None:
    height = GLASS_TOP - FOUNDATION
    cz = FOUNDATION + height / 2
    b.box((GLASS_W + 0.12, 0.1, height + 0.1), (0, FRONT, cz), FRAME)
    b.box((GLASS_W, 0.03, height), (0, FRONT - 0.04, cz), GLASS, shade=0.9, material="emissive")
    pane = GLASS_W / 6
    for i in range(7):
        b.box((0.05, 0.03, height), (-GLASS_W / 2 + i * pane, FRONT - 0.055, cz), FRAME, shade=0.95)
    b.box((GLASS_W, 0.035, 0.3), (0, FRONT - 0.05, FOUNDATION + 0.15), FRAME, shade=0.88)  # kick panel
    b.box((GLASS_W, 0.03, 0.05), (0, FRONT - 0.055, GLASS_TOP - 0.35), FRAME, shade=0.95)  # transom rail

    # Double door in the middle: its glass runs to the floor, a dark rail on each leaf
    door_w = 1.7
    b.box((door_w, 0.036, 0.3), (0, FRONT - 0.052, FOUNDATION + 0.15), GLASS, shade=0.9, material="emissive")
    for x in (-door_w / 2, 0.0, door_w / 2):
        b.box((0.07, 0.04, GLASS_TOP - 0.35 - FOUNDATION), (x, FRONT - 0.06, (GLASS_TOP - 0.35 + FOUNDATION) / 2), "vendingDark", shade=1.5)
    for x in (-0.18, 0.18):
        b.box((0.03, 0.03, 0.5), (x, FRONT - 0.085, 1.2), FRAME, shade=1.05)  # handles
    b.box((1.8, 0.9, 0.012), (0, FRONT - 0.55, 0.006), "vendingDark", shade=1.3)  # door mat


def _sign_band(b) -> None:
    """A lit panel with two stripes along its lower edge, on the front and the first bays of each side."""
    stripes = (("canGreen", BAND_Z - 0.2, 0.16), ("canBlue", BAND_Z - 0.33, 0.07))
    b.box((W + 0.16, 0.1, BAND_H), (0, FRONT - 0.03, BAND_Z), "lampWhite", material="emissive")
    for color, z, h in stripes:
        b.box((W + 0.17, 0.012, h), (0, FRONT - 0.082, z), color, material="emissive")
    for side in (-1, 1):
        x = side * (W / 2 + 0.03)
        y = FRONT + WRAP / 2
        b.box((0.1, WRAP, BAND_H), (x, y, BAND_Z), "lampWhite", material="emissive")
        for color, z, h in stripes:
            b.box((0.012, WRAP, h), (x + side * 0.052, y, z), color, material="emissive")

    # The store's mark: a green tile with a pale disc, and blocks standing for its name
    face = FRONT - 0.082
    b.box((0.46, 0.014, 0.4), (-1.0, face, BAND_Z + 0.14), "canGreen", material="emissive")
    b.cylinder(0.13, 0.012, (-1.0, face - 0.014, BAND_Z + 0.14), "lampWhite", segments=14, axis="y", material="emissive")
    for i in range(5):
        b.box((0.26, 0.014, 0.28), (-0.48 + i * 0.36, face, BAND_Z + 0.14), "canBlue", material="emissive")


def _bins(b) -> None:
    for i, color in enumerate(("canBlue", "canGreen", "signRed")):
        x = 2.75 + i * 0.5
        b.box((0.46, 0.4, 0.85), (x, FRONT - 0.3, 0.425), "vendingPanel", shade=0.94, bevel=0.012, segments=1)
        b.box((0.36, 0.01, 0.14), (x, FRONT - 0.503, 0.66), color)  # label over the opening
        b.box((0.24, 0.012, 0.09), (x, FRONT - 0.503, 0.5), "vendingDark")  # opening
