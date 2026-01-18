# Human Layer 3D Models

This directory should contain the GLB model files for the Human Layer visualization.

## Required Files

- `pose-open.glb` - Human figure with arms open/spread
- `pose-closed.glb` - Human figure with arms closer to body

## Required Mesh Names

Each GLB file must contain meshes with these exact names:
- `Body` - Full body outline
- `Veins` - Vascular system
- `Brain` - Brain structure
- `Heart` - Heart organ

## Asset Preparation Guidelines

### Recommended Sources
- Z-Anatomy (CC BY-SA 4.0) - https://www.z-anatomy.com/
- BodyParts3D (CC BY-SA 2.1 JP) - http://lifesciencedb.jp/bp3d/

### Blender Preprocessing Steps
1. Import source meshes
2. Isolate Body, Veins, Brain, Heart into separate objects
3. Rename objects exactly as listed above
4. Create two poses (open, closed)
5. Decimate to keep total edge count < 50k per pose
6. Apply all transforms (Ctrl+A > All Transforms)
7. Center origin to geometry
8. Scale to consistent size (human should be ~150 units tall)
9. Export each pose as separate GLB file

### Export Settings
- Format: glTF Binary (.glb)
- Include: Meshes only (no materials/textures needed)
- Apply Modifiers: Yes
- Use Draco compression: Optional (reduces file size)

## License Compliance

Ensure proper attribution is added to `/public/credits/attributions.txt`
