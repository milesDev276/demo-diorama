"""Small neighborhood shop (商店), 5.46 × 4.6 m (3 ken wide), ≈ 4.0 m tall.

A one-storey siding box under a roof slab that slopes slightly to the back.
The front is all sliding glass in aluminium frames, lit from inside, under a
cloth awning and a long signboard with blocks for lettering; crates of
goods stand by the door. A window on the left wall and a back door. Front
faces −Y. No baked AO or grime.
"""

NAME = "building_shop_01"
CATEGORY = "buildings"
TRI_BUDGET = 2000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D = 5.46, 4.6
FRONT = -D / 2
FOUNDATION = 0.2
WALL_TOP = 3.5

GLASS_W = 4.6
GLASS_TOP = 2.3

FRAME = "signPost"
GLASS = "windowGlow"


def build(b) -> None:
    b.box((W + 0.06, D + 0.06, FOUNDATION), (0, 0, FOUNDATION / 2), "foundation")
    b.box((W, D, WALL_TOP - FOUNDATION), (0, 0, (FOUNDATION + WALL_TOP) / 2), "wallSiding")
    # Roof: a slab tilted 3° toward the back, with a fascia at the front
    b.box((W + 0.3, D + 0.4, 0.1), (0, 0, WALL_TOP + 0.14), "roofTile", rotation=(-3, 0, 0), bevel=0.01, segments=1)
    b.box((W + 0.3, 0.06, 0.2), (0, FRONT - 0.17, WALL_TOP + 0.02), "roofTile", shade=0.9)

    _shopfront(b)
    _sign(b)

    # Awning: sloped canvas with a valance
    b.extrude(
        [(FRONT, 2.85), (FRONT - 1.0, 2.6), (FRONT - 1.0, 2.42), (FRONT - 0.985, 2.42), (FRONT - 0.985, 2.57), (FRONT, 2.815)],
        W - 0.2,
        (0, 0, 0),
        "shopAwning",
        axis="x",
    )

    # Goods by the door: two beer crates and a carton
    for i, color in enumerate(("canYellow", "signRed")):
        b.box((0.42, 0.32, 0.26), (-2.05, FRONT - 0.3, 0.13 + i * 0.27), color, shade=0.95, bevel=0.01, segments=1)
    b.box((0.4, 0.3, 0.3), (2.1, FRONT - 0.28, 0.15), "clothBeige", shade=0.95)

    # Left wall window, back door
    b.box((0.1, 1.3, 1.1), (-W / 2, 0.3, 1.75), FRAME)
    b.box((0.03, 1.2, 1.0), (-W / 2 - 0.04, 0.3, 1.75), GLASS, shade=0.86, material="emissive")
    b.box((0.02, 0.04, 1.0), (-W / 2 - 0.055, 0.3, 1.75), FRAME, shade=0.95)
    b.box((0.9, 0.06, 2.0), (1.5, D / 2 + 0.01, FOUNDATION + 1.0), "doorDark")


def _shopfront(b) -> None:
    """Four sliding glass leaves between posts, with a kick panel and a transom."""
    height = GLASS_TOP - FOUNDATION
    cz = FOUNDATION + height / 2
    b.box((GLASS_W + 0.12, 0.1, height + 0.1), (0, FRONT, cz), FRAME)
    b.box((GLASS_W, 0.03, height), (0, FRONT - 0.04, cz), GLASS, shade=0.86, material="emissive")
    leaf = GLASS_W / 4
    for i in range(5):
        b.box((0.05, 0.03, height), (-GLASS_W / 2 + i * leaf, FRONT - 0.055, cz), FRAME, shade=0.95)
    b.box((GLASS_W, 0.03, 0.04), (0, FRONT - 0.055, FOUNDATION + 1.0), FRAME, shade=0.95)  # mid rail
    b.box((GLASS_W, 0.035, 0.28), (0, FRONT - 0.05, FOUNDATION + 0.14), FRAME, shade=0.88)  # kick panel


def _sign(b) -> None:
    """Signboard (看板) over the awning: a pale board with four blocks standing for the shop's name."""
    z = 3.17
    b.box((W - 0.5, 0.08, 0.52), (0, FRONT - 0.04, z), "signBoard", bevel=0.01, segments=1)
    for i in range(4):
        b.box((0.3, 0.02, 0.3), (-0.72 + i * 0.48, FRONT - 0.085, z), "signRed", shade=0.95)
