# Music Visualisation 3D - AI Project Guide

> **IMPORTANT**: Before starting any development task, read the rules in `.rules/` directory, especially `08-workflows.md` for commit conventions and development workflows.

## Project summary
Real-time 3D music visualization web app. The user uploads an audio file and a particle system reacts to bass/mid/high frequency bands. UI includes audio controls, theme selector, fullscreen, and keyboard shortcuts (Space, F, 1-5).

## Non-negotiables and constraints
- Three.js only, no React Three Fiber.
- Default 10k particles using BufferGeometry with position and color attributes.
- Render loop must stay allocation-free (no new objects/arrays per frame).
- Always cleanup: audio nodes, geometries, materials, renderer, event listeners.
- Audio context must start after user interaction (browser autoplay policy).
- Keep React UI separate from Three.js core logic.

## Tech stack
- React 18 + Vite
- Three.js (direct usage)
- Web Audio API

## Key commands
- npm run dev
- npm run build
- npm run preview

## Directory map
```
src/
  components/         React UI
  core/               Three.js classes
  hooks/              React hooks that bridge UI and core
  utils/              Pure utilities
  App.jsx             App state + composition
  App.css             Global styles
```

## Runtime pipeline (audio -> visuals)
Audio file
  -> AudioContext + AnalyserNode (fftSize 2048, smoothingTimeConstant 0.8)
  -> Uint8Array frequency data (1024 bins)
  -> utils/audioProcessor.js (bass/mid/high)
  -> core/ThreeScene.updateFrequencyBands(...)
  -> core/ParticleSystem.update(...)
  -> renderer.render(...)

## Frequency bands
- bass: bins 0-85 (~20-250 Hz)
- mid: bins 85-512 (~250-4000 Hz)
- high: bins 512-1024 (~4000-20000 Hz)

## Core modules
- src/core/AudioAnalyzer.js: AudioContext setup, AnalyserNode, getFrequencyBands, resumeContext.
- src/utils/audioProcessor.js: Map bins to bass/mid/high with temporal smoothing.
- src/core/ParticleSystem.js: Particle buffers, per-frame update, theme colors.
- src/core/ThreeScene.js: Scene, renderer, camera, RAF loop, palette updates.
- src/core/CameraController.js: Orbit controls with damping and wheel zoom.

## React data flow
- App.jsx owns audioUrl, audioName, currentTheme, audioRef, sceneRef.
- VisualizerCanvas -> useThreeScene creates/destroys ThreeScene and handles resize.
- useAudioAnalysis initializes AudioAnalyzer and pushes frequency bands to sceneRef.

## Theme system
- Palettes live in src/utils/colorPalettes.js.
- Palette shape: { name, primary, secondary, accent, background } with RGB 0-1.
- getIntensityColor interpolates primary -> secondary -> accent by intensity.
- ThreeScene.updatePalette -> ParticleSystem.updateTheme -> color attribute update.

## Particle system details
- 10k particles in a spherical distribution.
- BufferGeometry with position and color Float32Array attributes.
- Update loop uses bass for radial expansion, mid for motion, high for brightness.
- Only set position.needsUpdate and color.needsUpdate after edits.

## Camera controls
- Orbit style with damping (factor 0.1).
- Mouse/touch rotate; wheel zoom adjusts distance (100-500).
- Canvas must allow pointer events for controls to work.

## Keyboard shortcuts
- Space: play/pause
- F: fullscreen
- 1-5: select themes

## Performance targets and tuning
- Targets: 60 fps desktop, 45+ fps mid laptops, 30+ fps high-end mobile.
- If fps drops, reduce particle count, lower pixel ratio, or disable antialias.
- performanceMonitor can adapt particle count dynamically.

## Common tasks

### Add a new theme
1. Add a palette in src/utils/colorPalettes.js.
2. Update themeMap in App.jsx for keyboard shortcuts.
3. Verify ThemeSelector lists the new palette.

### Adjust particle behavior
- Edit formulas in src/core/ParticleSystem.js update().
- Keep computations allocation-free and update attributes in place.

### Change particle count
- Static: update the ParticleSystem count in ThreeScene constructor.
- Dynamic: use performanceMonitor and sceneRef.setParticleCount.

### Add a new audio control
1. Create a component in src/components.
2. Wire it in App.jsx with audioRef or sceneRef props.

### Modify frequency bands
- Update ranges in src/utils/audioProcessor.js.
- Ensure downstream visuals still map to bass/mid/high as expected.

## Debugging checklist
- Particles not moving: confirm AudioAnalyzer initialized and startAnalysis runs on play.
- Colors not changing: ensure updateTheme sets geometry.attributes.color.needsUpdate.
- Camera not rotating: ensure CameraController.update runs in RAF and pointer events are enabled.
- AudioContext error: call resumeContext after a user gesture.

## Critical files
- src/core/ParticleSystem.js
- src/core/AudioAnalyzer.js
- src/hooks/useThreeScene.js
- src/utils/audioProcessor.js

If you modify these, test immediately with a real audio file.
