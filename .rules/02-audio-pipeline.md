# Audio pipeline rules

- AudioAnalyzer creates AudioContext and AnalyserNode.
- AnalyserNode settings: fftSize 2048, smoothingTimeConstant 0.8.
- Frequency data is a Uint8Array with 1024 bins.
- audioProcessor maps bins to bass/mid/high: 0-85, 85-512, 512-1024.
- Audio context must resume after a user gesture.
- If band ranges change, update visuals and any references.
