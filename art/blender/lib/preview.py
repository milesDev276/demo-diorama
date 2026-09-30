"""Review renders for an asset: a daylight 3/4 view, a dusk view (emissive
parts on) and an orthographic scale check next to a 1.7 m figure and a 2 m door."""

import math
from pathlib import Path

import bpy
from mathutils import Vector

from .builder import MeshBuilder
from .materials import plain_material
from .palette import Rgb


def _setup_render(width: int, height: int) -> bpy.types.Scene:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    return scene


def _set_world(color: Rgb, strength: float) -> None:
    scene = bpy.context.scene
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    if world.node_tree is None:
        world.use_nodes = True  # pre-5.0 worlds start without a node tree
    background = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    background.inputs["Color"].default_value = (*color, 1.0)
    background.inputs["Strength"].default_value = strength


def _add_object(name: str, data) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _add_floor(palette: dict[str, Rgb]) -> bpy.types.Object:
    mesh = bpy.data.meshes.new("_floor")
    mesh.from_pydata([(-20, -20, 0), (20, -20, 0), (20, 20, 0), (-20, 20, 0)], [], [(0, 1, 2, 3)])
    mesh.materials.append(plain_material("_floor", palette["sidewalkConcrete"]))
    return _add_object("_floor", mesh)


def _add_sun(name: str, color: Rgb, strength: float, tilt_deg: float, heading_deg: float) -> bpy.types.Object:
    light = bpy.data.lights.new(name, "SUN")
    light.color = color
    light.energy = strength
    light.angle = math.radians(4)
    sun = _add_object(name, light)
    sun.rotation_euler = (math.radians(tilt_deg), 0, math.radians(heading_deg))
    return sun


def _add_camera(location: Vector, target: Vector, *, lens: float = 55, ortho_scale: float | None = None) -> None:
    cam_data = bpy.data.cameras.new("_camera")
    if ortho_scale is not None:
        cam_data.type = "ORTHO"
        cam_data.ortho_scale = ortho_scale
    else:
        cam_data.lens = lens
    cam = _add_object("_camera", cam_data)
    cam.location = location
    cam.rotation_euler = (target - location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam


def _render(path: Path) -> None:
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def _clear_preview_objects() -> None:
    for obj in [o for o in bpy.context.scene.objects if o.name.startswith("_")]:
        bpy.data.objects.remove(obj, do_unlink=True)


def render_previews(asset: bpy.types.Object, out_dir: Path, palette: dict[str, Rgb]) -> list[Path]:
    """Renders <name>_day / _dusk / _scale PNGs into out_dir; returns their paths."""
    out_dir.mkdir(parents=True, exist_ok=True)
    name = asset.name
    height = max(v.co.z for v in asset.data.vertices)
    focus = Vector((0, 0, height * 0.48))
    distance = max(3.0, height * 2.3)
    three_quarter = focus + Vector((0.5, -0.83, 0.32)).normalized() * distance
    paths = []

    # Daylight 3/4 view: warm sun from front-left, cool sky fill.
    _setup_render(900, 900)
    _add_floor(palette)
    _set_world((0.52, 0.60, 0.72), 0.9)
    _add_sun("_sun", (1.0, 0.93, 0.82), 3.2, 50, -35)
    _add_camera(three_quarter, focus)
    paths.append(out_dir / f"{name}_day.png")
    _render(paths[-1])

    # Dusk: dim blue sky, low warm sun — shows the emissive parts.
    _clear_preview_objects()
    _add_floor(palette)
    _set_world((0.05, 0.07, 0.13), 1.0)
    _add_sun("_sun", (1.0, 0.55, 0.32), 0.6, 80, -60)
    _add_camera(three_quarter, focus)
    paths.append(out_dir / f"{name}_dusk.png")
    _render(paths[-1])

    # Scale check: front orthographic, 1.7 m figure left, 2 m door right.
    _clear_preview_objects()
    _setup_render(1000, 640)
    _add_floor(palette)
    _set_world((0.6, 0.62, 0.66), 1.2)
    _add_sun("_sun", (1.0, 1.0, 1.0), 2.0, 35, -20)
    width = max(v.co.x for v in asset.data.vertices) - min(v.co.x for v in asset.data.vertices)
    refs = MeshBuilder("_scale_refs", palette)
    refs.cylinder(0.16, 1.44, (-width / 2 - 0.6, 0, 0), "poleConcrete", segments=16)
    refs.cylinder(0.11, 0.26, (-width / 2 - 0.6, 0, 1.44), "poleConcrete", segments=16)
    refs.box((0.9, 0.05, 2.0), (width / 2 + 0.9, 0.3, 1.0), "woodTrim")
    refs.to_object()
    span = width + 3.2
    _add_camera(Vector((0.15, -10, 1.0)), Vector((0.15, 0, 1.0)), ortho_scale=max(span, 3.2))
    paths.append(out_dir / f"{name}_scale.png")
    _render(paths[-1])

    _clear_preview_objects()
    return paths
