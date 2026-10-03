"""Guard rail (ガードレール), one piece 2.0 m long × 0.8 m tall.

The white corrugated steel beam that lines Japanese roads, on one round
post in the middle of the piece. The beam's ends are flush, so pieces placed
end to end along X make one rail. The beam faces −Y (the road).
No baked AO or grime.
"""

NAME = "street_guard_rail_01"
CATEGORY = "street"
TRI_BUDGET = 1500

WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.0}

LENGTH = 2.0
POST_R = 0.057
POST_H = 0.8
BEAM_BOTTOM = 0.42
BEAM_TOP = 0.77
BEAM_Y = -POST_R - 0.045
RIDGE = 0.04
THICK = 0.012


def build(b) -> None:
    b.cylinder(POST_R, POST_H, (0, 0, 0), "signBoard", shade=0.94, segments=10)
    b.cylinder(POST_R + 0.004, 0.02, (0, 0, POST_H), "signBoard", shade=0.85, segments=10)  # cap

    # W-beam cross-section (y, z): two ridges toward the road, a valley between them
    heights = [BEAM_BOTTOM + (BEAM_TOP - BEAM_BOTTOM) * t for t in (0.0, 0.25, 0.5, 0.75, 1.0)]
    offsets = [0.0, -RIDGE, 0.0, -RIDGE, 0.0]
    front = [(BEAM_Y + o, z) for o, z in zip(offsets, heights)]
    back = [(y + THICK, z) for y, z in reversed(front)]
    b.extrude(front + back, LENGTH, (0, 0, 0), "signBoard", axis="x")

    # Bracket between the post and the beam
    b.box((0.12, 0.05, 0.16), (0, BEAM_Y / 2 - 0.01, (BEAM_BOTTOM + BEAM_TOP) / 2), "signBoard", shade=0.88)
