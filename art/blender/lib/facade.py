"""Shared dimensions and parts of the building modules (roadmap L6 grid).

A module is one facade bay. Its origin is the bottom center of the bay on
the OUTER wall plane: the wall occupies y 0 … THICKNESS (inward), and
anything that projects from the facade (sills, awnings, balconies) has
y < 0. The app tiles modules edge to edge, so nothing on a module's left
and right ends may be bevelled or shaded differently from its neighbor.
"""

BAY = 1.82  # 1 ken
HALF = BAY / 2
THICKNESS = 0.15
UPPER_FLOOR = 2.8
GROUND_FLOOR = 3.2
FOUNDATION = 0.4
PARAPET = 0.5
RAILING = 0.6

WALL = "wallPlaster"
FRAME = "signPost"  # aluminium sash
GLASS = "windowGlow"

# No baked AO or grime (user decision, Stage 3), and no per-face value
# jitter either: tiled bays must match exactly.
WEATHER = {"ao_strength": 0.0, "grime_strength": 0.0, "face_jitter": 0.0}


def wall_piece(b, x0: float, x1: float, z0: float, z1: float, color: str = WALL, shade: float = 1.0) -> None:
    """A full-thickness piece of wall between the given extents."""
    b.box((x1 - x0, THICKNESS, z1 - z0), ((x0 + x1) / 2, THICKNESS / 2, (z0 + z1) / 2), color, shade=shade)


def wall_with_opening(b, height: float, x0: float, x1: float, z0: float, z1: float, base: float = 0.0) -> None:
    """The bay's wall from `base` to `height` with a rectangular hole."""
    wall_piece(b, -HALF, x0, base, height)
    wall_piece(b, x1, HALF, base, height)
    if z0 > base:
        wall_piece(b, x0, x1, base, z0)
    wall_piece(b, x0, x1, z1, height)


def belt_course(b, z: float) -> None:
    """Thin band marking a floor line, just proud of the wall. Runs the full bay width."""
    b.box((BAY, 0.02, 0.07), (0, -0.01, z - 0.035), WALL, shade=0.9)


def sash(b, x0: float, x1: float, z0: float, z1: float, *, y: float = 0.06, panes: int = 2, glass_shade: float = 0.86) -> None:
    """Aluminium sliding sash filling an opening: outer frame, `panes` glass
    leaves (alternating depth, like real sliding leaves) and their stiles.
    The glass is emissive, so rooms read as lit."""
    w, h = x1 - x0, z1 - z0
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    f = 0.035
    b.box((w, 0.07, f), (cx, y, z1 - f / 2), FRAME)
    b.box((w, 0.07, f), (cx, y, z0 + f / 2), FRAME)
    for x in (x0 + f / 2, x1 - f / 2):
        b.box((f, 0.07, h), (x, y, cz), FRAME)
    pane_w = (w - 2 * f) / panes
    for i in range(panes):
        px = x0 + f + pane_w * (i + 0.5)
        py = y + (0.012 if i % 2 else -0.012)
        b.box((pane_w, 0.012, h - 2 * f), (px, py, cz), GLASS, shade=glass_shade, material="emissive")
        for sx in (px - pane_w / 2 + 0.014, px + pane_w / 2 - 0.014):
            b.box((0.028, 0.02, h - 2 * f), (sx, py - 0.004, cz), FRAME, shade=0.95)
