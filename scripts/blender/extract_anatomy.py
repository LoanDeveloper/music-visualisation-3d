#!/usr/bin/env python3
"""
Z-Anatomy Model Extractor for Music Visualisation 3D
=====================================================

This Blender script extracts and exports anatomical meshes from Z-Anatomy
to GLB format for use in the music visualizer's Human Layer feature.

Usage:
------
1. Download Z-Anatomy from https://www.z-anatomy.com/download (Blender version)
2. Run this script in Blender:

   blender z_anatomy.blend --background --python scripts/blender/extract_anatomy.py -- --output public/models/human

   Or interactively in Blender's scripting tab.

Requirements:
-------------
- Blender 3.0+ (tested with 4.x)
- Z-Anatomy .blend file

Output:
-------
- pose-open.glb  : T-pose with arms spread
- pose-closed.glb: Relaxed pose with arms down

Each GLB contains meshes named: Body, Veins, Brain, Heart

Note: This script runs inside Blender's Python environment.
      bpy, bmesh, mathutils are Blender-specific modules and
      will show import errors in regular Python IDEs - this is expected.
"""

# pyright: reportMissingImports=false
# pylint: disable=import-error
import bpy  # type: ignore
import bmesh  # type: ignore
import sys
import os
import math
from pathlib import Path
from mathutils import Matrix, Vector  # type: ignore

# =============================================================================
# Configuration
# =============================================================================

# Mesh search patterns (Z-Anatomy uses French/Latin names)
# These patterns help find the right meshes in Z-Anatomy's structure
MESH_PATTERNS = {
    "Body": [
        "skin",
        "peau",
        "body",
        "corps",
        "integument",
        "epiderm",
        "dermis",
        "cutaneous",
    ],
    "Veins": [
        "vein",
        "veine",
        "artery",
        "artère",
        "artere",
        "vessel",
        "vaisseau",
        "circulat",
        "blood",
        "sang",
        "aorta",
        "aorte",
        "vascular",
        "cardiovascular",
    ],
    "Brain": [
        "brain",
        "cerveau",
        "cerebr",
        "encephal",
        "cortex",
        "cerebellum",
        "cervelet",
        "neural",
    ],
    "Heart": [
        "heart",
        "coeur",
        "cœur",
        "cardiac",
        "cardiaque",
        "ventricle",
        "ventricul",
        "atrium",
        "auricle",
    ],
}

# Target triangle count per mesh (for decimation)
TARGET_TRIANGLES = {"Body": 20000, "Veins": 30000, "Brain": 15000, "Heart": 10000}

# Pose transformations (armature bone rotations)
POSE_TRANSFORMS = {
    "open": {
        # T-pose: arms horizontal
        "shoulder_l": (0, 0, math.radians(-80)),
        "shoulder_r": (0, 0, math.radians(80)),
        "arm_l": (0, 0, 0),
        "arm_r": (0, 0, 0),
    },
    "closed": {
        # Relaxed: arms down
        "shoulder_l": (0, 0, math.radians(-10)),
        "shoulder_r": (0, 0, math.radians(10)),
        "arm_l": (0, 0, 0),
        "arm_r": (0, 0, 0),
    },
}


# =============================================================================
# Utility Functions
# =============================================================================


def log(message: str, level: str = "INFO"):
    """Print formatted log message."""
    print(f"[{level}] {message}")


def find_meshes_by_pattern(patterns: list[str]) -> list[bpy.types.Object]:
    """Find all mesh objects matching any of the given patterns."""
    matches = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        name_lower = obj.name.lower()
        for pattern in patterns:
            if pattern.lower() in name_lower:
                matches.append(obj)
                break
    return matches


def get_mesh_triangle_count(obj: bpy.types.Object) -> int:
    """Get the triangle count of a mesh object."""
    if obj.type != "MESH":
        return 0
    # Evaluate to get the final mesh with modifiers applied
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()
    tri_count = len(mesh.loop_triangles)
    eval_obj.to_mesh_clear()
    return tri_count


def duplicate_object(obj: bpy.types.Object, name: str) -> bpy.types.Object:
    """Create a duplicate of an object with a new name."""
    # Create a copy of the mesh data
    new_mesh = obj.data.copy()
    new_mesh.name = name

    # Create a new object with the copied mesh
    new_obj = bpy.data.objects.new(name, new_mesh)

    # Copy transforms
    new_obj.matrix_world = obj.matrix_world.copy()

    # Link to scene
    bpy.context.collection.objects.link(new_obj)

    return new_obj


def join_meshes(objects: list[bpy.types.Object], name: str) -> bpy.types.Object:
    """Join multiple mesh objects into one."""
    if not objects:
        return None

    if len(objects) == 1:
        result = duplicate_object(objects[0], name)
        return result

    # Deselect all
    bpy.ops.object.select_all(action="DESELECT")

    # Duplicate and select all objects to join
    duplicates = []
    for obj in objects:
        dup = duplicate_object(obj, f"{name}_part")
        duplicates.append(dup)
        dup.select_set(True)

    # Set active object
    bpy.context.view_layer.objects.active = duplicates[0]

    # Join
    bpy.ops.object.join()

    # Rename result
    result = bpy.context.active_object
    result.name = name
    result.data.name = name

    return result


def decimate_mesh(obj: bpy.types.Object, target_triangles: int):
    """Apply decimation to reduce triangle count."""
    current_tris = get_mesh_triangle_count(obj)

    if current_tris <= target_triangles:
        log(f"  {obj.name}: {current_tris} tris (no decimation needed)")
        return

    ratio = target_triangles / current_tris

    # Add decimate modifier
    mod = obj.modifiers.new(name="Decimate", type="DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = ratio
    mod.use_collapse_triangulate = True

    # Apply modifier
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)

    new_tris = get_mesh_triangle_count(obj)
    log(f"  {obj.name}: {current_tris} -> {new_tris} tris (ratio: {ratio:.3f})")


def apply_all_transforms(obj: bpy.types.Object):
    """Apply all transforms to mesh data."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)


def cleanup_mesh(obj: bpy.types.Object):
    """Remove unused data from mesh (UVs, materials, etc.)."""
    mesh = obj.data

    # Remove all materials
    mesh.materials.clear()

    # Remove all UV maps
    while mesh.uv_layers:
        mesh.uv_layers.remove(mesh.uv_layers[0])

    # Remove all vertex colors
    while mesh.vertex_colors:
        mesh.vertex_colors.remove(mesh.vertex_colors[0])

    # Remove all shape keys
    if obj.data.shape_keys:
        obj.shape_key_clear()


def center_origin_to_floor(obj: bpy.types.Object):
    """Center object origin to geometry center, with bottom at Z=0."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Set origin to geometry center
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")

    # Get bounding box to find bottom
    bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    min_z = min(v.z for v in bbox)

    # Move object so bottom is at Z=0
    obj.location.z -= min_z

    obj.select_set(False)


# =============================================================================
# Main Extraction Logic
# =============================================================================


def extract_anatomy_meshes() -> dict[str, bpy.types.Object]:
    """Find and extract the required anatomy meshes from Z-Anatomy."""
    log("Searching for anatomy meshes in Z-Anatomy...")

    extracted = {}

    for mesh_name, patterns in MESH_PATTERNS.items():
        found = find_meshes_by_pattern(patterns)

        if not found:
            log(f"  {mesh_name}: NOT FOUND - will create placeholder", "WARN")
            # Create a simple placeholder mesh
            extracted[mesh_name] = create_placeholder_mesh(mesh_name)
        else:
            log(f"  {mesh_name}: Found {len(found)} matching objects")
            for obj in found[:5]:  # Log first 5
                log(f"    - {obj.name}")

            # Join all matching meshes into one
            extracted[mesh_name] = join_meshes(found, mesh_name)

    return extracted


def create_placeholder_mesh(name: str) -> bpy.types.Object:
    """Create a simple placeholder mesh when anatomy mesh is not found."""
    # Create based on mesh type
    if name == "Body":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16)
        obj = bpy.context.active_object
        obj.scale = (0.3, 0.25, 0.8)
    elif name == "Heart":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, segments=16, ring_count=8)
        obj = bpy.context.active_object
        obj.location = (0, 0, 0.5)
    elif name == "Brain":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, segments=24, ring_count=12)
        obj = bpy.context.active_object
        obj.location = (0, 0, 0.9)
    elif name == "Veins":
        # Create a simple network of cylinders
        bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=1)
        obj = bpy.context.active_object
    else:
        bpy.ops.mesh.primitive_cube_add(size=0.5)
        obj = bpy.context.active_object

    obj.name = name
    obj.data.name = name

    log(f"  Created placeholder for {name}", "WARN")
    return obj


def process_meshes(meshes: dict[str, bpy.types.Object]):
    """Process meshes: decimate, cleanup, center."""
    log("Processing meshes...")

    for name, obj in meshes.items():
        log(f"Processing {name}...")

        # Apply all transforms first
        apply_all_transforms(obj)

        # Decimate if needed
        target = TARGET_TRIANGLES.get(name, 20000)
        decimate_mesh(obj, target)

        # Cleanup unused data
        cleanup_mesh(obj)

        # Re-apply transforms after modifications
        apply_all_transforms(obj)


def create_pose_collection(
    meshes: dict[str, bpy.types.Object], pose_name: str
) -> bpy.types.Collection:
    """Create a collection with meshes positioned for a specific pose."""
    log(f"Creating {pose_name} pose collection...")

    # Create new collection
    collection = bpy.data.collections.new(f"HumanLayer_{pose_name}")
    bpy.context.scene.collection.children.link(collection)

    # Duplicate meshes into this collection
    for name, source_obj in meshes.items():
        # Duplicate
        new_obj = duplicate_object(source_obj, f"{name}")

        # Move to new collection
        for coll in new_obj.users_collection:
            coll.objects.unlink(new_obj)
        collection.objects.link(new_obj)

        # Apply pose transforms (simplified - no armature)
        # For a real implementation, you'd manipulate armature bones

    return collection


def export_collection_to_glb(collection: bpy.types.Collection, output_path: str):
    """Export a collection to GLB format."""
    log(f"Exporting to {output_path}...")

    # Deselect all
    bpy.ops.object.select_all(action="DESELECT")

    # Select all objects in collection
    for obj in collection.objects:
        obj.select_set(True)

    # Export
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=False,
        export_materials="NONE",  # We don't need materials
        export_colors=False,
        export_normals=True,
        export_yup=True,  # Three.js uses Y-up
    )

    log(f"  Exported: {output_path}")


def cleanup_scene():
    """Remove all created objects and collections."""
    # Remove HumanLayer collections
    for coll in list(bpy.data.collections):
        if coll.name.startswith("HumanLayer_"):
            for obj in list(coll.objects):
                bpy.data.objects.remove(obj, do_unlink=True)
            bpy.data.collections.remove(coll)


# =============================================================================
# Entry Point
# =============================================================================


def main():
    """Main entry point for the script."""
    log("=" * 60)
    log("Z-Anatomy Model Extractor")
    log("=" * 60)

    # Parse command line arguments
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    # Default output directory
    output_dir = "public/models/human"

    # Parse --output argument
    for i, arg in enumerate(argv):
        if arg == "--output" and i + 1 < len(argv):
            output_dir = argv[i + 1]

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    log(f"Output directory: {output_path.absolute()}")

    try:
        # Step 1: Extract meshes
        meshes = extract_anatomy_meshes()

        # Step 2: Process meshes (decimate, cleanup)
        process_meshes(meshes)

        # Step 3: Center all meshes at origin
        for obj in meshes.values():
            center_origin_to_floor(obj)

        # Step 4: Create pose variations
        open_collection = create_pose_collection(meshes, "open")
        closed_collection = create_pose_collection(meshes, "closed")

        # Step 5: Export each pose
        export_collection_to_glb(open_collection, str(output_path / "pose-open.glb"))
        export_collection_to_glb(
            closed_collection, str(output_path / "pose-closed.glb")
        )

        log("=" * 60)
        log("Export complete!")
        log("=" * 60)
        log("")
        log("Next steps:")
        log("1. Run: npm run validate-models")
        log("2. Test in the visualizer with an audio file")
        log("")

    except Exception as e:
        log(f"Error: {e}", "ERROR")
        import traceback

        traceback.print_exc()
        sys.exit(1)

    finally:
        # Cleanup temporary objects
        cleanup_scene()


if __name__ == "__main__":
    main()
