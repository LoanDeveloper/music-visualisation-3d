# Debugging checklist

## Visual issues
- Particles not moving: AudioAnalyzer initialized and startAnalysis runs on play.
- Colors not changing: updateTheme sets geometry.attributes.color.needsUpdate.
- Camera not rotating: CameraController.update runs in RAF and pointer events enabled.

## Audio issues
- No sound at all:
  1. Check AudioContext state (must be 'running', not 'suspended')
  2. Verify resumeContext() is awaited before playback
  3. Check audio routing: source must connect to outputGain -> destination
  4. Ensure audio element has valid src and can play
  5. Check browser console for autoplay policy errors

- AudioContext error: call resumeContext after a user gesture.

- Sound but no visualization:
  1. Verify analyzer is connected to source
  2. Check that startAnalysis is called on 'play' event
  3. Verify sceneRef.current exists when updateFrequencyBands is called

## Debug logging
- All console.log calls are wrapped in `import.meta.env.DEV` checks
- To see debug logs, run in development mode: `npm run dev`
- Production builds have no console output for performance

## Browser DevTools tips
- Use Performance tab to check for frame drops
- Use Application > Media to inspect audio element state
- Console filter: `[Audio` to see all audio-related logs
