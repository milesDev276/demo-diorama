"""Laundry on a drying stand (物干し), ≈ 1.8 × 0.5 × 1.55 m.

Two uprights on concrete feet carry a pole with a towel, a shirt and a pair
of trousers hung over it. Stands on a balcony or a rooftop. No baked AO or
grime.
"""

NAME = "prop_laundry_01"
CATEGORY = "props"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

POLE_Z = 1.45
HALF = 0.8


def build(b) -> None:
    for x in (-HALF, HALF):
        b.box((0.2, 0.42, 0.07), (x, 0, 0.035), "foundation", bevel=0.01, segments=1)  # foot
        b.cylinder(0.018, POLE_Z + 0.06, (x, 0, 0.07), "metalLight", segments=8)
        b.box((0.05, 0.03, 0.04), (x, 0, POLE_Z), "metalLight", shade=0.85)  # pole hook
    b.cylinder(0.014, 2 * HALF + 0.2, (-HALF - 0.1, 0, POLE_Z + 0.03), "metalLight", segments=8, axis="x")

    top = POLE_Z + 0.03
    # Towel, folded over the pole
    for y in (-0.012, 0.012):
        b.box((0.34, 0.008, 0.62), (-0.5, y, top - 0.31), "insulator", shade=0.98)
    b.box((0.34, 0.008, 0.06), (-0.5, -0.017, top - 0.5), "canBlue")  # stripe
    # Shirt on a hanger: body and two sleeves
    b.box((0.44, 0.03, 0.56), (0.02, 0, top - 0.36), "clothNavy")
    b.box((0.16, 0.028, 0.24), (-0.25, 0, top - 0.2), "clothNavy", rotation=(0, 35, 0))
    b.box((0.16, 0.028, 0.24), (0.29, 0, top - 0.2), "clothNavy", rotation=(0, -35, 0))
    b.box((0.03, 0.02, 0.07), (0.02, 0, top - 0.045), "metalLight")  # hanger hook
    # Trousers, hung by the waist
    b.box((0.36, 0.03, 0.16), (0.55, 0, top - 0.11), "clothBeige")
    for x in (0.465, 0.635):
        b.box((0.16, 0.03, 0.66), (x, 0, top - 0.5), "clothBeige", shade=0.97)
