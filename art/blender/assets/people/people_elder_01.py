"""Elderly woman with a walker cart (シルバーカー), 1.5 m, a painted model-railway figure.

Grey hair tied in a bun, a mauve cardigan and beige trousers; she leans
forward over the cart's handle as she walks with short steps. The cart is
a navy bag-box with a seat lid on a light frame and four small wheels.
Built from lib/figure.py. Faces −Y. No baked AO or grime.
"""

from lib.figure import Outfit, figure

NAME = "people_elder_01"
CATEGORY = "people"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

OUTFIT = Outfit(top="clothMauve", bottom="clothBeige", hair="hairGray", bun=True)

HANDLE_Y = -0.39
HANDLE_Z = 0.8
HALF = 0.17  # half the cart's track
FRAME = "metalLight"


def build(b) -> None:
    figure(
        b,
        OUTFIT,
        height=1.5,
        pelvis=(0, 0.06, 0.74),
        lean=20,
        nod=-14,
        feet=((-0.08, -0.12, 0.06), (0.08, 0.12, 0.075)),
        foot_pitch=(0, 14),
        hands=((-HALF + 0.02, HANDLE_Y, HANDLE_Z + 0.02), (HALF - 0.02, HANDLE_Y, HANDLE_Z + 0.02)),
    )
    _cart(b)


def _cart(b) -> None:
    b.tube([(-HALF, HANDLE_Y, HANDLE_Z), (HALF, HANDLE_Y, HANDLE_Z)], 0.018, "vendingDark", shade=1.3, sides=6)  # grip
    front_y, back_y = -0.95, -0.55
    for side in (-1, 1):
        x = side * HALF
        b.tube([(x, HANDLE_Y, HANDLE_Z), (x, back_y, 0.52), (x, back_y, 0.07)], 0.011, FRAME, sides=5)
        b.tube([(x, back_y, 0.2), (x, front_y, 0.2), (x, front_y, 0.07)], 0.011, FRAME, sides=5)
        for y in (front_y, back_y):
            b.cylinder(0.065, 0.035, (x - 0.0175, y, 0.065), "tireRubber", segments=10, axis="x")
    b.box((0.36, 0.38, 0.3), (0, (front_y + back_y) / 2, 0.42), "clothNavy", bevel=0.02, segments=1)
    b.box((0.38, 0.4, 0.04), (0, (front_y + back_y) / 2, 0.59), "clothBeige", shade=0.95, bevel=0.012, segments=1)  # seat lid
