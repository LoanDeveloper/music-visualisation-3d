# React hooks and UI rules

- App.jsx owns audioUrl, audioName, currentTheme, audioRef, sceneRef.
- useThreeScene creates/destroys ThreeScene and handles resize cleanup.
- useAudioAnalysis initializes AudioAnalyzer and pushes bands to sceneRef.
- UI controls live in src/components and receive props (audioRef, callbacks).
- Start analysis only after user-initiated play.
