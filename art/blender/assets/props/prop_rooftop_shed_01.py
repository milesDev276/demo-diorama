"""Prefab storage shed (プレハブ物置), 2.4 × 1.8 × 2.2 m.

Ribbed steel walls on concrete blocks, a pale sliding double door on the
front and a roof sloping slightly to the back. Stands on a rooftop or in a
yard. No baked AO or grime.
"""

NAME = "prop_rooftop_shed_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 2.4, 1.8
BLOCK = 0.1
WALL_TOP = 2.02


def build(b) -> None:
    for x in (-W / 2 + 0.25, W / 2 - 0.25):
        for y in (-D / 2 + 0.25, D / 2 - 0.25):
            b.box((0.4, 0.2, BLOCK), (x, y, BLOCK / 2), "foundation")
    body_h = WALL_TOP - BLOCK
    b.box((W - 0.1, D - 0.1, body_h), (0, 0, BLOCK + body_h / 2), "wallSiding", bevel=0.01, segments=1)
    # Ribs on the side and back walls
    for i in range(6):
        y = -D / 2 + 0.2 + i * 0.28
        for x in (-W / 2 + 0.045, W / 2 - 0.045):
            b.box((0.02, 0.05, body_h - 0.1), (x, y, BLOCK + body_h / 2), "wallSiding", shade=0.92)
    for i in range(8):
        b.box((0.05, 0.02, body_h - 0.1), (-W / 2 + 0.22 + i * 0.28, D / 2 - 0.045, BLOCK + body_h / 2), "wallSiding", shade=0.92)

    # Sliding double door with a frame and handles
    front = -D / 2 + 0.05
    b.box((1.7, 0.03, 1.72), (0, front - 0.01, BLOCK + 0.9), "signPost", shade=0.85)  # frame
    for i, x in enumerate((-0.41, 0.41)):
        b.box((0.8, 0.025, 1.64), (x, front - 0.03 - i * 0.012, BLOCK + 0.9), "acUnit", bevel=0.006, segments=1)
        b.box((0.03, 0.02, 0.18), (x - 0.3 + i * 0.6, front - 0.05 - i * 0.012, BLOCK + 0.95), "vendingDark", shade=1.4)

    # Roof: a slab tilted 3° toward the back, with a fascia at the front
    b.box((W, D + 0.08, 0.06), (0, 0, WALL_TOP + 0.08), "roofSlab", shade=0.85, rotation=(-3, 0, 0), bevel=0.01, segments=1)
    b.box((W, 0.04, 0.16), (0, -D / 2, WALL_TOP + 0.03), "roofSlab", shade=0.8)
