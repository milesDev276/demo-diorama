"""Garbage collection cage (ゴミ集積所), 1.2 × 0.65 × 0.9 m.

The folding steel-mesh box at the roadside where a street's rubbish is put
out: a galvanized frame, wire mesh on every side and on the lid, a notice
plate with the collection days, and three tied bags inside. Front faces
−Y. No baked AO or grime.
"""

NAME = "prop_garbage_station_01"
CATEGORY = "props"
TRI_BUDGET = 4000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

W, D, H = 1.2, 0.65, 0.9
BAR = 0.025
WIRE = 0.007
FRAME = "signPost"


def build(b) -> None:
    _frame(b)
    _mesh(b)
    _bags(b)
    b.box((0.34, 0.008, 0.2), (0, -D / 2 - 0.014, 0.66), "signBoard")  # collection-days notice
    b.box((0.34, 0.009, 0.05), (0, -D / 2 - 0.0145, 0.735), "fenceGreen")


def _frame(b) -> None:
    for x in (-W / 2, W / 2):
        for y in (-D / 2, D / 2):
            b.box((BAR, BAR, H), (x, y, H / 2), FRAME)
    for z in (BAR / 2 + 0.04, H - BAR / 2):
        for y in (-D / 2, D / 2):
            b.box((W, BAR, BAR), (0, y, z), FRAME, shade=0.95)
        for x in (-W / 2, W / 2):
            b.box((BAR, D, BAR), (x, 0, z), FRAME, shade=0.95)


def _mesh(b) -> None:
    rows = [0.26, 0.47, 0.68]
    for y in (-D / 2, D / 2):
        for i in range(1, 10):
            b.box((WIRE, WIRE, H - 0.06), (-W / 2 + i * W / 10, y, H / 2 + 0.02), FRAME, shade=0.9)
        for z in rows:
            b.box((W, WIRE, WIRE), (0, y, z), FRAME, shade=0.9)
    for x in (-W / 2, W / 2):
        for i in range(1, 5):
            b.box((WIRE, WIRE, H - 0.06), (x, -D / 2 + i * D / 5, H / 2 + 0.02), FRAME, shade=0.9)
        for z in rows:
            b.box((WIRE, D, WIRE), (x, 0, z), FRAME, shade=0.9)
    for i in range(1, 10):  # lid
        b.box((WIRE, D, WIRE), (-W / 2 + i * W / 10, 0, H - BAR / 2), FRAME, shade=0.9)
    b.box((W, WIRE, WIRE), (0, 0, H - BAR / 2), FRAME, shade=0.9)


def _bags(b) -> None:
    bags = [
        ((-0.3, 0.02, 0.2), (0.25, 0.22, 0.2), "clothWhite", 1.0),
        ((0.24, 0.04, 0.19), (0.24, 0.22, 0.19), "clothWhite", 0.93),
        ((-0.02, -0.02, 0.52), (0.22, 0.2, 0.16), "tankCream", 1.0),
    ]
    for i, (center, radii, color, shade) in enumerate(bags):
        b.blob(center, radii, color, shade=shade, subdivisions=2, roughness=0.22, frequency=2.2, seed=f"bag{i}")
        top = (center[0], center[1], center[2] + radii[2] * 0.95)
        b.blob(top, (0.045, 0.045, 0.05), color, shade=shade * 0.92, subdivisions=1, roughness=0.3, seed=f"knot{i}")
