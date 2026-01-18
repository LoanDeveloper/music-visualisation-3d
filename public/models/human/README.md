# Human Layer 3D Models

This directory contains the GLB model files for the Human Layer visualization.

## Required Files

- `pose-open.glb` - Human figure with arms open/spread (T-pose)
- `pose-closed.glb` - Human figure with arms closer to body (relaxed)

## Required Mesh Names

Each GLB file must contain meshes with these exact names:
- `Body` - Full body outline
- `Veins` - Vascular system
- `Brain` - Brain structure
- `Heart` - Heart organ

---

## Quick Start: Generate Models from Z-Anatomy

### Prerequisites
- Blender 3.0+ installed (https://www.blender.org/download/)
- Z-Anatomy .blend file (https://www.z-anatomy.com/download)

### Step 1: Download Z-Anatomy

1. Go to https://www.z-anatomy.com/download
2. Download the **Blender version** (`.blend` file)
3. Save it somewhere accessible (e.g., `~/Downloads/z_anatomy.blend`)

### Step 2: Run the Extraction Script

```bash
# From the project root directory
blender ~/Downloads/z_anatomy.blend --background \
  --python scripts/blender/extract_anatomy.py \
  -- --output public/models/human
```

This will:
- Extract Body, Veins, Brain, and Heart meshes
- Apply decimation to optimize polygon count
- Create two poses (open and closed)
- Export as GLB files

### Step 3: Validate the Models

```bash
npm run validate-models
# or for verbose output:
npm run validate-models:verbose
```

### Step 4: Test in the Visualizer

```bash
npm run dev
```

Load an audio file and enable the Human Layer from the controls panel.

---

## Manual Preparation (Alternative)

If the automatic extraction doesn't work for your Z-Anatomy version:

### Blender Preprocessing Steps

1. **Open Z-Anatomy in Blender**

2. **Locate and rename meshes:**
   - Find skin/integument mesh → rename to `Body`
   - Find circulatory system → rename to `Veins`
   - Find brain mesh → rename to `Brain`
   - Find heart mesh → rename to `Heart`

3. **Optimize each mesh:**
   ```
   Select mesh → Modifier → Decimate → Ratio ~0.1-0.3
   Apply modifier
   ```
   
   Target triangle counts:
   - Body: ~20,000 triangles
   - Veins: ~30,000 triangles
   - Brain: ~15,000 triangles
   - Heart: ~10,000 triangles

4. **Apply transforms:**
   - Select all meshes
   - `Ctrl+A` → All Transforms

5. **Create poses:**
   - Duplicate all 4 meshes
   - Adjust arm positions for open/closed variants

6. **Export:**
   - Select open-pose meshes → File → Export → glTF 2.0 (.glb)
   - Save as `pose-open.glb`
   - Repeat for closed-pose → `pose-closed.glb`

### Export Settings

- Format: glTF Binary (.glb)
- Include: Selected Objects
- Mesh: Apply Modifiers ✓
- Materials: None (not needed)
- Animation: None (not needed)

---

## Validation

Run the validator to check your models:

```bash
npm run validate-models
```

The validator checks:
- Both pose files exist
- All 4 required meshes are present (Body, Veins, Brain, Heart)
- File size is reasonable (<5MB each)
- Triangle count is within limits

---

## Troubleshooting

### "Missing required mesh: X"
The mesh names must be exact. In Blender, select the object and rename it in the Outliner.

### "File too large"
Apply more aggressive decimation in Blender:
```
Modifier → Decimate → Ratio: 0.05
```

### EdgesGeometry looks wrong
Ensure meshes are manifold (closed surfaces). In Blender:
```
Edit Mode → Mesh → Clean Up → Delete Loose
```

### Models appear at wrong scale
The script normalizes to a ~1.8 unit height human. If scale looks off, adjust in Blender and re-export.

---

## License Compliance

Add proper attribution to `/public/credits/attributions.txt`:

```
Human anatomy models derived from:
  Z-Anatomy (https://www.z-anatomy.com)
  License: CC BY-SA 4.0
  https://creativecommons.org/licenses/by-sa/4.0/
```
