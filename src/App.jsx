import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizerCanvas from '@/components/VisualizerCanvas';
import AudioUploader from '@/components/AudioUploader';
import ControlPanel from '@/components/ControlPanel';
import ThemeSelector from '@/components/ThemeSelector';
import FullscreenButton from '@/components/FullscreenButton';
import SettingsPanel from '@/components/SettingsPanel';
import useAudioAnalysis from '@/hooks/useAudioAnalysis';
import './App.css';

// Default visualization settings - balanced for all frequencies
const DEFAULT_SETTINGS = {
  // Audio - higher sensitivity and balanced frequency response
  sensitivity: 1.5,
  bassIntensity: 1.4,
  midIntensity: 1.6,
  highIntensity: 1.8,
  smoothing: 0.65,
  // Particles
  particleCount: 12000,
  particleSize: 3,
  particleShape: 'circle',
  reactiveSize: true,
  // Animation
  rotationSpeed: 0.003,
  animationSpeed: 1.0,
  // Distribution shape
  shape: 'sphere',
  expansion: 1.0,
  // Trails
  trails: false,
  trailLength: 8,
  trailDecay: 0.92,
  trailWidth: 1,
  // Connections
  connections: false,
  connectionDistance: 30,
  connectionOpacity: 0.3,
  connectionMaxCount: 500,
  connectionLineWidth: 1,
  // Advanced Analysis
  beatReactive: true,
  beatPulseIntensity: 1.0,
  beatSensitivity: 1.0,
  onsetFlash: true,
  onsetSensitivity: 1.0,
  rmsScale: true,
  spectralColorMode: 'none',
  spectralColorIntensity: 0.5,
  enableChroma: false,
};

function App() {
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioName, setAudioName] = useState('');
  const [currentTheme, setCurrentTheme] = useState('neon');
  const [visualSettings, setVisualSettings] = useState(DEFAULT_SETTINGS);

  const audioRef = useRef(null);
  const sceneRef = useRef(null);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings) => {
    if (newSettings === null) {
      // Reset to defaults
      setVisualSettings(DEFAULT_SETTINGS);
    } else {
      setVisualSettings(newSettings);
    }
  }, []);

  const { initialize, startAnalysis, stopAnalysis, reset } = useAudioAnalysis(
    audioRef,
    sceneRef,
    visualSettings
  );

  // Handle audio file selection
  const handleFileSelect = (url, name) => {
    setAudioUrl(url);
    setAudioName(name);

    // Reset audio analyzer when new file is loaded
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    reset();
  };

  // Initialize audio analyzer when audio element is ready
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      console.log('[App] Audio URL set, initializing analyzer...');
      // Small delay to ensure audio element is fully mounted
      const timer = setTimeout(() => {
        if (audioRef.current) {
          initialize();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [audioUrl, initialize]);

  // Handle audio play/pause events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[App] No audio element for event listeners');
      return;
    }

    console.log('[App] Setting up audio event listeners');

    const handlePlay = () => {
      console.log('[App] Audio play event fired');
      startAnalysis();
    };

    const handlePause = () => {
      console.log('[App] Audio pause event fired');
      stopAnalysis();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // If audio is already playing, start analysis
    if (!audio.paused) {
      startAnalysis();
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl, startAnalysis, stopAnalysis]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space: Play/Pause
      if (e.code === 'Space' && audioRef.current) {
        e.preventDefault();
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      }

      // F: Fullscreen
      if (e.code === 'KeyF') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }

      // Number keys 1-5: Change theme
      const themeMap = {
        Digit1: 'neon',
        Digit2: 'sunset',
        Digit3: 'ocean',
        Digit4: 'fire',
        Digit5: 'pastel',
      };

      if (themeMap[e.code]) {
        e.preventDefault();
        setCurrentTheme(themeMap[e.code]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="app">
      {/* Three.js Canvas */}
      <VisualizerCanvas
        palette={currentTheme}
        sceneRef={sceneRef}
        visualSettings={visualSettings}
      />

      {/* Audio element (hidden) */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} className="hidden" />
      )}

      {/* Settings Panel */}
      <SettingsPanel
        settings={visualSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* UI Overlay */}
      <AudioUploader onFileSelect={handleFileSelect} hasAudio={!!audioUrl} />

      {audioUrl && (
        <>
          <ControlPanel audioRef={audioRef} audioName={audioName} />
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
          />
          <FullscreenButton />
        </>
      )}

      {/* Keyboard shortcuts hint */}
      {audioUrl && (
        <div className="fixed bottom-28 right-4 flex flex-col gap-1.5 z-[5]">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-black/40 backdrop-blur-xl rounded-lg text-xs text-foreground/60 border border-white/10">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Space</kbd>
            Play/Pause
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-black/40 backdrop-blur-xl rounded-lg text-xs text-foreground/60 border border-white/10">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">F</kbd>
            Plein ecran
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-black/40 backdrop-blur-xl rounded-lg text-xs text-foreground/60 border border-white/10">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">1-5</kbd>
            Themes
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
