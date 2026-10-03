"""Garden stone (庭石), ≈ 1.3 × 0.9 m and 0.7 m tall.

One weathered boulder set into the ground with a smaller stone leaning
against it and a third at its foot, as stones are grouped in a house
garden. Faceted, in two close greys. No baked AO or grime.
"""

NAME = "nature_rock_01"
CATEGORY = "nature"
TRI_BUDGET = 400

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.07}

# (x, y, radii, color, shade, subdivisions)
STONES = [
    (-0.1, 0.0, (0.58, 0.42, 0.5), "rock", 1.0, 2),
    (0.5, -0.12, (0.3, 0.26, 0.26), "rockDark", 1.05, 2),
    (0.1, -0.46, (0.16, 0.13, 0.11), "rock", 0.94, 1),
]


def build(b) -> None:
    for i, (x, y, radii, color, shade, subdivisions) in enumerate(STONES):
        # Sunk by a third of their height, so they sit in the ground instead of on it.
        center = (x, y, radii[2] * 0.4)
        b.blob(center, radii, color, shade=shade, subdivisions=subdivisions, roughness=0.22, frequency=1.1, seed=f"{NAME}-{i}", smooth=False)
