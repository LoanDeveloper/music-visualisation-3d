# Audio pipeline rules

## Core architecture
- AudioAnalyzer creates AudioContext and AnalyserNode.
- AnalyserNode settings: fftSize 2048, smoothingTimeConstant 0.8.
- Frequency data is a Uint8Array with 1024 bins.
- audioProcessor maps bins to bass/mid/high: 0-85, 85-512, 512-1024.

## Audio context lifecycle
- Audio context must resume after a user gesture (browser autoplay policy).
- Always await `resumeContext()` before starting audio analysis.
- Use async/await with try/catch when calling `audio.play()`.

## Stereo routing architecture
The stereo mode uses separate paths for analysis and output:

```
ANALYSIS PATH (for visualization):
  source -> analyser (main, mono/combined)
  source -> channelSplitter -> analyserLeft (channel 0)
                            -> analyserRight (channel 1)

OUTPUT PATH (for audio playback):
  source -> outputGain -> destination
```

This separation ensures audio always plays while analyzers capture frequency data.

## Key implementation notes
- Never route audio output through AnalyserNodes in stereo mode.
- Use a GainNode (outputGain) for reliable audio output.
- The main analyser provides combined mono data for basic frequency bands.
- L/R analysers provide per-channel data for stereo visualization effects.
- If band ranges change, update visuals and any references.
