"""Walking adult, 1.68 m, a painted model-railway figure in mid-stride.

A muted green jacket and dark trousers; the left foot comes down heel
first while the right heel lifts, the arms swing against the legs, and the
right hand carries a canvas shopping bag (エコバッグ). Built from
lib/figure.py. Faces −Y. No baked AO or grime.
"""

from lib.figure import Outfit, figure

NAME = "people_walker_01"
CATEGORY = "people"
TRI_BUDGET = 5000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

OUTFIT = Outfit(top="fenceGreen", bottom="clothNavy")
BAG = "clothWhite"


def build(b) -> None:
    joints = figure(
        b,
        OUTFIT,
        height=1.68,
        pelvis=(0, 0.0, 0.84),
        lean=4,
        feet=((-0.085, -0.27, 0.085), (0.085, 0.24, 0.115)),
        foot_pitch=(-8, 26),
        hands=((-0.2, -0.17, 0.9), (0.215, 0.11, 0.87)),
    )
    _bag(b, joints.hands[1])


def _bag(b, hand) -> None:
    """A canvas tote hanging from the right hand on two handles."""
    x, y, z = hand
    top = z - 0.17
    b.box((0.06, 0.3, 0.32), (x + 0.02, y, top - 0.16), BAG, shade=0.97, bevel=0.012, segments=1)
    b.box((0.062, 0.3, 0.06), (x + 0.02, y, top - 0.1), "canGreen", shade=0.95)  # printed band
    for dy in (-0.07, 0.07):
        b.tube([(x + 0.02, y + dy, top), (x + 0.01, y + dy * 0.2, z - 0.03)], 0.009, BAG, shade=0.9, sides=4)
