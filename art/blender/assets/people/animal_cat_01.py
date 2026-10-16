"""Sitting cat (猫), 0.3 m tall, in the same foam-simple style as the figures.

A ginger cat with a white chest and muzzle, sitting upright, front paws
together, its tail curled round its feet. Faces −Y. No baked AO or grime.
"""

NAME = "animal_cat_01"
CATEGORY = "people"
TRI_BUDGET = 3000

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0}

FUR = "catGinger"
WHITE = "clothWhite"


def build(b) -> None:
    # Body: haunches behind, a chest rising in front
    b.blob((0, 0.03, 0.1), (0.075, 0.1, 0.1), FUR, subdivisions=3, roughness=0.0)
    for side in (-1, 1):
        b.blob((side * 0.055, 0.05, 0.06), (0.04, 0.075, 0.06), FUR, subdivisions=2, roughness=0.0)
    b.blob((0, -0.035, 0.14), (0.055, 0.05, 0.075), WHITE, subdivisions=2, roughness=0.0)  # chest

    # Front legs and paws
    for side in (-1, 1):
        x = side * 0.028
        b.tube([(x, -0.045, 0.13), (x, -0.06, 0.02)], [0.019, 0.016], FUR, sides=6)
        b.blob((x, -0.07, 0.012), (0.019, 0.026, 0.012), WHITE, subdivisions=1, roughness=0.0)

    # Head, ears, muzzle
    b.blob((0, -0.04, 0.245), (0.06, 0.055, 0.052), FUR, subdivisions=3, roughness=0.0)
    for side in (-1, 1):
        b.cylinder(0.022, 0.045, (side * 0.033, -0.035, 0.278), FUR, segments=6, radius_top=0.003)
    b.blob((0, -0.088, 0.228), (0.03, 0.018, 0.02), WHITE, subdivisions=2, roughness=0.0)

    # Tail round the feet
    b.tube(
        [(0.04, 0.12, 0.05), (0.09, 0.07, 0.025), (0.095, -0.03, 0.02), (0.06, -0.09, 0.018), (0.0, -0.1, 0.018)],
        [0.018, 0.017, 0.016, 0.014, 0.011],
        FUR,
        sides=6,
    )
