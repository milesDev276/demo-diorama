"""Post-build steps: weathering (baked AO + ground grime + per-face variation),
glTF export and stats."""

import random
from pathlib import Path

import bpy

from .builder import set_active_color
from .materials import BASE_INDEX, COLOR_ATTRIBUTE


def _smoothstep(edge0: float, edge1: float, x: float) -> float:
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)


def _select_only(obj: bpy.types.Object) -> None:
    for o in bpy.context.scene.objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def _bake_ambient_occlusion(obj: bpy.types.Object, distance: float, samples: int) -> None:
    """Bakes Cycles AO into a temporary "AO" color attribute, with a ground plane as occluder."""
    scene = bpy.context.scene
    ground_mesh = bpy.data.meshes.new("_ao_ground")
    ground_mesh.from_pydata([(-5, -5, 0), (5, -5, 0), (5, 5, 0), (-5, 5, 0)], [], [(0, 1, 2, 3)])
    ground = bpy.data.objects.new("_ao_ground", ground_mesh)
    scene.collection.objects.link(ground)

    mesh = obj.data
    mesh.color_attributes.new("AO", "FLOAT_COLOR", "CORNER")
    set_active_color(mesh, "AO")

    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.light_settings.distance = distance
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples

    _select_only(obj)
    bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")

    bpy.data.objects.remove(ground, do_unlink=True)
    bpy.data.meshes.remove(ground_mesh)


def weather(
    obj: bpy.types.Object,
    *,
    seed: str,
    ao_strength: float = 0.6,
    ao_distance: float = 0.25,
    grime_height: float = 0.5,
    grime_strength: float = 0.32,
    face_jitter: float = 0.035,
    samples: int = 128,
) -> None:
    """Darkens base-slot colors with baked AO, a dirt gradient near the ground and
    slight per-face value variation. Emissive faces are left untouched."""
    _bake_ambient_occlusion(obj, ao_distance, samples)

    mesh = obj.data
    colors = mesh.color_attributes[COLOR_ATTRIBUTE].data
    ao = mesh.color_attributes["AO"].data
    rng = random.Random(seed)

    for poly in mesh.polygons:
        jitter = 1 + rng.uniform(-face_jitter, face_jitter)
        if poly.material_index != BASE_INDEX:
            continue
        for li in poly.loop_indices:
            z = mesh.vertices[mesh.loops[li].vertex_index].co.z
            grime = 1 - grime_strength * (1 - _smoothstep(0.0, grime_height, z))
            occlusion = 1 - ao_strength * (1 - ao[li].color[0])
            k = jitter * grime * occlusion
            r, g, b, a = colors[li].color
            colors[li].color = (r * k, g * k, b * k, a)

    mesh.color_attributes.remove(mesh.color_attributes["AO"])
    set_active_color(mesh, COLOR_ATTRIBUTE)


def export_glb(obj: bpy.types.Object, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    _select_only(obj)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_texcoords=False,
        export_materials="EXPORT",
        export_vertex_color="ACTIVE",
        export_all_vertex_colors=False,
    )


def triangle_count(obj: bpy.types.Object) -> int:
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)
