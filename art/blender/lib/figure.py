"""Posable figure (Stage 16): the painted model-railway person of the
existing figures (people_pedestrian_01), built from a pose instead of fixed
points.

A pose is where the pelvis is, how the trunk leans and turns, and where the
ankles and wrists go; knees and elbows are found by two-bone IK. Limbs are
the same tapered tubes, the head and hands the same smooth blobs, so the
figures belong to one set. Proportions are those of the 1.65 m pedestrian,
scaled by `height`. All positions are in the asset's frame (meters, Z up);
a figure with `yaw` 0 faces −Y.

Left and right are the figure's own: index 0 is its left side (−X when it
faces −Y), index 1 its right.
"""

import math
from dataclasses import dataclass
from typing import Callable

from mathutils import Matrix, Vector

Vec3 = tuple[float, float, float]
Pair = tuple[Vec3, Vec3]

REF_HEIGHT = 1.65

# Proportions of the 1.65 m figure, from its pelvis (the hip joints' midpoint).
THIGH, SHIN = 0.40, 0.40
UPPER_ARM, FOREARM = 0.26, 0.24
HIP_HALF = 0.09
SHOULDER = (0.2, 0.48)  # half width, height above the pelvis
TRUNK = [(-0.07, 0.17), (0.14, 0.16), (0.36, 0.18), (0.50, 0.195), (0.56, 0.08)]  # height, radius
NECK = (0.52, 0.045)  # base height, radius
HEAD = (0.16, 0.085, 0.095, 0.11)  # above the neck base; radii
HAIR = (0.02, 0.19, 0.092, 0.098, 0.098)  # back, above the neck base; radii


@dataclass(frozen=True)
class Outfit:
    """Palette keys of what a figure wears."""

    top: str
    bottom: str
    shoes: str = "vendingDark"
    hair: str = "hairDark"
    skin: str = "skin"
    short_sleeves: bool = False
    bun: bool = False  # hair tied up at the back


@dataclass(frozen=True)
class Joints:
    """Where a built figure's joints ended up, for props held or worn."""

    knees: tuple[Vector, Vector]
    ankles: tuple[Vector, Vector]
    shoulders: tuple[Vector, Vector]
    elbows: tuple[Vector, Vector]
    wrists: tuple[Vector, Vector]
    hands: tuple[Vector, Vector]
    head: Vector
    forward: Vector


def ik(root: Vector, target: Vector, upper: float, lower: float, pole: Vector) -> tuple[Vector, Vector]:
    """Two-bone IK: the middle joint and the end, which is `target` if it can
    be reached, else the nearest reachable point toward it. The middle joint
    bends toward `pole`."""
    reach = target - root
    direction = reach.normalized()
    d = min(max(reach.length, abs(upper - lower) + 1e-4), upper + lower - 1e-4)
    along = (upper * upper - lower * lower + d * d) / (2 * d)
    out = math.sqrt(max(upper * upper - along * along, 0.0))
    side = pole - direction * pole.dot(direction)
    if side.length < 1e-6:
        side = direction.orthogonal()
    return root + direction * along + side.normalized() * out, root + direction * d


def _radii(radii: Vec3, s: float, yaw: float) -> Vec3:
    """Blob radii in the asset's frame: blobs are axis-aligned, so a figure turned by about 90° swaps X and Y."""
    x, y, z = (r * s for r in radii)
    return (y, x, z) if abs(math.sin(math.radians(yaw))) > 0.7 else (x, y, z)


def figure(
    b,
    outfit: Outfit,
    *,
    pelvis: Vec3,
    feet: Pair,
    hands: Pair | Callable[[tuple[Vector, Vector]], Pair],
    height: float = REF_HEIGHT,
    yaw: float = 0.0,
    lean: float = 0.0,
    nod: float = 0.0,
    foot_pitch: tuple[float, float] = (0.0, 0.0),
    knee_pole: Vec3 | None = None,
    seated: bool = False,
) -> Joints:
    """Builds one figure and returns its joints.

    `feet` are ankle positions; `hands` are wrist positions, or a function
    of the knees that gives them (hands resting on the knees). `lean` tips
    the trunk forward (degrees, negative leans back), `nod` tips the head,
    `yaw` turns the whole figure about Z. `foot_pitch` lifts a heel
    (degrees). A `seated` figure gets a deeper seat under its pelvis."""
    s = height / REF_HEIGHT
    turn = Matrix.Rotation(math.radians(yaw), 3, "Z")
    trunk = turn @ Matrix.Rotation(math.radians(lean), 3, "X")
    head_turn = trunk @ Matrix.Rotation(math.radians(nod), 3, "X")
    p = Vector(pelvis)
    lateral = turn @ Vector((1, 0, 0))
    forward = turn @ Vector((0, -1, 0))
    up = Vector((0, 0, 1))

    def body(x: float, y: float, z: float) -> Vector:
        return p + trunk @ Vector((x * s, y * s, z * s))

    # Legs
    knees, ankles = [], []
    pole = Vector(knee_pole) if knee_pole else forward
    for i, side in enumerate((-1, 1)):
        hip = p + turn @ Vector((side * HIP_HALF * s, 0, 0))
        knee, ankle = ik(hip, Vector(feet[i]), THIGH * s, SHIN * s, pole)
        knees.append(knee)
        ankles.append(ankle)
        b.tube([tuple(ankle), tuple(knee), tuple(hip)], [0.055 * s, 0.062 * s, 0.08 * s], outfit.bottom, sides=8)
        shoe = ankle + forward * 0.03 * s - up * 0.025 * s
        b.box((0.1 * s, 0.24 * s, 0.07 * s), tuple(shoe), outfit.shoes, shade=1.2, bevel=0.02 * s, segments=2, rotation=(foot_pitch[i], 0, yaw))
    seat = (0.145, 0.13, 0.09) if seated else (0.145, 0.088, 0.09)
    seat_center = p - up * 0.02 * s - (forward * 0.03 * s if seated else Vector())
    b.blob(tuple(seat_center), _radii(seat, s, yaw), outfit.bottom, subdivisions=2, roughness=0.0)

    # Trunk, neck, head
    b.tube(
        [tuple(body(0, 0, z)) for z, _ in TRUNK],
        [r * s for _, r in TRUNK],
        outfit.top,
        sides=10,
        section=(1.0, 0.62),
        up=tuple(lateral),
    )
    neck = body(0, 0, NECK[0])
    b.tube([tuple(neck), tuple(neck + trunk @ Vector((0, 0, 0.1 * s)))], NECK[1] * s, outfit.skin, sides=8)
    head = neck + head_turn @ Vector((0, -0.005 * s, HEAD[0] * s))
    b.blob(tuple(head), _radii(HEAD[1:], s, yaw), outfit.skin, subdivisions=3, roughness=0.0)
    hair = neck + head_turn @ Vector((0, HAIR[0] * s, HAIR[1] * s))
    b.blob(tuple(hair), _radii(HAIR[2:], s, yaw), outfit.hair, subdivisions=3, roughness=0.04, frequency=3)
    if outfit.bun:
        bun = neck + head_turn @ Vector((0, 0.1 * s, 0.2 * s))
        b.sphere(0.045 * s, tuple(bun), outfit.hair, subdivisions=2)

    # Arms
    wrist_targets = hands(tuple(knees)) if callable(hands) else hands
    shoulders, elbows, wrists, hand_centers = [], [], [], []
    for i, side in enumerate((-1, 1)):
        shoulder = body(side * SHOULDER[0], 0, SHOULDER[1])
        elbow_pole = -forward + lateral * side * 0.5 - up * 0.3
        elbow, wrist = ik(shoulder, Vector(wrist_targets[i]), UPPER_ARM * s, FOREARM * s, elbow_pole)
        b.blob(tuple(shoulder), _radii((0.055, 0.054, 0.052), s, yaw), outfit.top, subdivisions=2, roughness=0.0)
        if outfit.short_sleeves:
            b.tube([tuple(shoulder), tuple(elbow)], [0.053 * s, 0.047 * s], outfit.top, sides=7)
            b.tube([tuple(elbow), tuple(wrist)], [0.04 * s, 0.034 * s], outfit.skin, sides=7)
        else:
            b.tube([tuple(shoulder), tuple(elbow), tuple(wrist)], [0.055 * s, 0.048 * s, 0.042 * s], outfit.top, sides=7)
        hand = wrist + (wrist - elbow).normalized() * 0.04 * s
        b.blob(tuple(hand), _radii((0.034, 0.032, 0.042), s, yaw), outfit.skin, subdivisions=2, roughness=0.0)
        shoulders.append(shoulder)
        elbows.append(elbow)
        wrists.append(wrist)
        hand_centers.append(hand)

    return Joints(
        knees=tuple(knees),
        ankles=tuple(ankles),
        shoulders=tuple(shoulders),
        elbows=tuple(elbows),
        wrists=tuple(wrists),
        hands=tuple(hand_centers),
        head=head,
        forward=forward,
    )
