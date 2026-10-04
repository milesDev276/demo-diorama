"""Shared material slots. The app remaps these by name onto its own shared
materials, so the Blender versions only need to look right in previews."""

import bpy

from .palette import Rgb, srgb_to_linear

COLOR_ATTRIBUTE = "Col"

# Slot order = face material_index used by MeshBuilder. "printed" faces carry
# UVs into the app's graphics atlas; Blender has no atlas, so previews show
# them as blank panels. "foliage" is the crown of a deciduous tree: the app
# recolors it by season and hides it in winter, so it must be modeled in its
# autumn colors and must not hold anything but leaves. "glass" is a pane with
# something to see behind it; its color is the tint, and it casts no shadow
# in the app.
MATERIAL_SLOTS = ("base", "emissive", "printed", "foliage", "glass")
BASE_INDEX = MATERIAL_SLOTS.index("base")
EMISSIVE_INDEX = MATERIAL_SLOTS.index("emissive")

EMISSION_STRENGTH = 1.1
GLASS_ALPHA = 0.3  # GLASS_OPACITY in the app's objects/materials.ts


def _fresh_node_tree(mat: bpy.types.Material) -> bpy.types.NodeTree:
    if mat.node_tree is None:
        mat.use_nodes = True  # pre-5.0 materials start without a node tree
    tree = mat.node_tree
    tree.nodes.clear()
    return tree


def _principled(tree: bpy.types.NodeTree) -> bpy.types.Node:
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return bsdf


def slot_material(name: str) -> bpy.types.Material:
    """Vertex-colored material for one of MATERIAL_SLOTS."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    tree = _fresh_node_tree(mat)
    bsdf = _principled(tree)
    attr = tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = COLOR_ATTRIBUTE
    tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.55
    if name == "emissive":
        tree.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = EMISSION_STRENGTH
    if name == "glass":
        bsdf.inputs["Roughness"].default_value = 0.08
        bsdf.inputs["Alpha"].default_value = GLASS_ALPHA
        mat.surface_render_method = "BLENDED"
    return mat


def plain_material(name: str, srgb: Rgb, roughness: float = 0.9) -> bpy.types.Material:
    """Single-color material for preview-only props (floor, scale figures)."""
    mat = bpy.data.materials.new(name)
    bsdf = _principled(_fresh_node_tree(mat))
    bsdf.inputs["Base Color"].default_value = (*(srgb_to_linear(c) for c in srgb), 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat
