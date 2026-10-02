"""Pebbles (小石), one scatter piece ≈ 0.25 m across.

Four flattened stones of different sizes in close greys, the gravel that
gathers along lot edges and under downpipes. The app scatters it with a
random heading and size per instance. No baked AO or grime.
"""

NAME = "nature_scatter_pebbles_01"
CATEGORY = "nature"
TRI_BUDGET = 200

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.06}

# (x, y, radii, color, shade)
STONES = [
    (0.0, 0.0, (0.055, 0.042, 0.028), "pebble", 1.0),
    (0.08, 0.05, (0.035, 0.03, 0.02), "rock", 1.0),
    (-0.07, 0.06, (0.03, 0.026, 0.018), "rockDark", 1.05),
    (0.05, -0.07, (0.026, 0.022, 0.015), "sidewalkJoint", 1.0),
]


def build(b) -> None:
    for i, (x, y, radii, color, shade) in enumerate(STONES):
        # Sunk by a third of their height, so they sit in the ground instead of on it.
        center = (x, y, radii[2] * 0.65)
        b.blob(center, radii, color, shade=shade, subdivisions=1, roughness=0.18, seed=f"{NAME}-{i}", smooth=False)
