# Architecture and ownership

- src/components contains React UI only; no Three.js objects here.
- src/core contains Three.js classes; do not import React in core.
- src/hooks bridge UI and core; manage lifecycle and resize.
- src/utils contains pure functions (audioProcessor, colorPalettes, performanceMonitor).
- App.jsx owns app state and wiring between UI, audio, and scene.
- ThreeScene owns renderer, camera, animation loop, and ParticleSystem.
