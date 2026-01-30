import { useState, useRef, useEffect, useCallback } from 'react';
import VisualizerCanvas from '@/components/VisualizerCanvas';
import AudioUploader from '@/components/AudioUploader';
import ControlPanel from '@/components/ControlPanel';
import ThemeSelector from '@/components/ThemeSelector';
import FullscreenButton from '@/components/FullscreenButton';
import ZoomControl from '@/components/ZoomControl';
import SettingsPanel from '@/components/SettingsPanel';
import HumanLayerControls from '@/components/HumanLayerControls';
import useAudioAnalysis from '@/hooks/useAudioAnalysis';
import { DEFAULT_PRESET, DEFAULT_POSE } from '@/utils/humanPresets';
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
  // Stereo
  stereoEnabled: true,
  stereoWidthEffect: 1.0,
  stereoPanningEffect: 1.0,
  stereoSeparation: true,
  stereoColorIntensity: 0.7,
};

function App() {
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioName, setAudioName] = useState('');
  const [currentTheme, setCurrentTheme] = useState('aurora');
  const [visualSettings, setVisualSettings] = useState(DEFAULT_SETTINGS);

  // Human layer state
  const [humanLayerEnabled, setHumanLayerEnabled] = useState(false);
  const [humanPreset, setHumanPreset] = useState(DEFAULT_PRESET);
  const [humanPose, setHumanPose] = useState(DEFAULT_POSE);
  const [humanLayerLoading, setHumanLayerLoading] = useState(false);
  const [humanLayerError, setHumanLayerError] = useState(false);

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

  // Human layer handlers
  const handleHumanLayerEnabledChange = useCallback(async (enabled) => {
    if (!sceneRef.current) return;
    
    setHumanLayerLoading(true);
    setHumanLayerError(false);
    try {
      const success = await sceneRef.current.setHumanLayerEnabled(enabled);
      if (success) {
        setHumanLayerEnabled(enabled);
        setHumanLayerError(false);
      } else {
        setHumanLayerEnabled(false);
        setHumanLayerError(true);
      }
    } catch (err) {
      console.error('[App] Human layer enable error:', err);
      setHumanLayerEnabled(false);
      setHumanLayerError(true);
    } finally {
      setHumanLayerLoading(false);
    }
  }, []);

  const handleHumanPresetChange = useCallback((presetId) => {
    if (sceneRef.current) {
      sceneRef.current.setHumanPreset(presetId);
      setHumanPreset(presetId);
    }
  }, []);

  const handleHumanPoseChange = useCallback(async (poseId) => {
    if (!sceneRef.current) return;
    
    setHumanLayerLoading(true);
    try {
      await sceneRef.current.setHumanPose(poseId);
      setHumanPose(poseId);
    } catch (err) {
      console.error('[App] Human pose change error:', err);
    } finally {
      setHumanLayerLoading(false);
    }
  }, []);

  const { initialize, startAnalysis, stopAnalysis, reset } = useAudioAnalysis(
    audioRef,
    sceneRef,
    visualSettings
  );

  // Handle audio file selection
  const handleFileSelect = (url, name) => {
    console.log('[App] File selected:', name);
    
    // Pause current audio if playing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    
    // Stop analysis loop (but don't destroy the analyzer)
    stopAnalysis();
    
    // Update URL and name (audio element stays the same, only src changes)
    setAudioUrl(url);
    setAudioName(name);

    // Reset position
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Initialize audio analyzer when audio element is ready
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      if (import.meta.env.DEV) console.log('[App] Audio URL set, initializing analyzer...');
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
    if (!audio) return;

    const handlePlay = () => {
      if (import.meta.env.DEV) {
        console.log('[App] Audio play event fired');
        console.log('[App] Audio play details:', {
          currentTime: audio.currentTime,
          duration: audio.duration,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
      }
      startAnalysis();
    };

    const handlePause = () => {
      if (import.meta.env.DEV) {
        console.log('[App] Audio pause event fired');
        console.log('[App] Audio pause details:', {
          currentTime: audio.currentTime,
          duration: audio.duration,
          ended: audio.ended,
          error: audio.error ? audio.error.message : 'none',
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
      }
      stopAnalysis();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    // Add more audio event listeners for debugging
    const handleEnded = () => {
      console.log('[App] Audio ended event fired');
    };
    
    const handleError = (e) => {
      console.error('[App] Audio error event:', e);
      console.error('[App] Audio error details:', audio.error);
    };
    
    const handleStalled = () => {
      console.warn('[App] Audio stalled event fired');
    };
    
    const handleSuspend = () => {
      console.warn('[App] Audio suspend event fired');
    };
    
    const handleWaiting = () => {
      console.warn('[App] Audio waiting event fired');
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('waiting', handleWaiting);

    // If audio is already playing, start analysis
    if (!audio.paused) {
      startAnalysis();
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('waiting', handleWaiting);
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

      // Number keys 1-9: Change theme (most popular themes)
      const themeMap = {
        Digit1: 'aurora',
        Digit2: 'cyberpunk',
        Digit3: 'synthwave',
        Digit4: 'ocean',
        Digit5: 'inferno',
        Digit6: 'nebula',
        Digit7: 'ethereal',
        Digit8: 'gold',
        Digit9: 'noir',
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

      {/* Audio element (hidden) - always present, only src changes */}
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
        preload="auto"
        className="hidden" 
      />

      {/* Settings Panel */}
      <SettingsPanel
        settings={visualSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Human Layer Controls */}
      {audioUrl && (
        <HumanLayerControls
          enabled={humanLayerEnabled}
          onEnabledChange={handleHumanLayerEnabledChange}
          preset={humanPreset}
          onPresetChange={handleHumanPresetChange}
          pose={humanPose}
          onPoseChange={handleHumanPoseChange}
          isLoading={humanLayerLoading}
          hasError={humanLayerError}
        />
      )}

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

      {/* Zoom Control - always visible when scene is ready */}
      <ZoomControl sceneRef={sceneRef} />

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
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">1-9</kbd>
            Themes
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
