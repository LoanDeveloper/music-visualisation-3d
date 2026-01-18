# Debugging checklist

- Particles not moving: AudioAnalyzer initialized and startAnalysis runs on play.
- Colors not changing: updateTheme sets geometry.attributes.color.needsUpdate.
- Camera not rotating: CameraController.update runs in RAF and pointer events enabled.
- AudioContext error: resumeContext after a user gesture.
