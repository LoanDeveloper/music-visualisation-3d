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
import { getDefaultSettings } from '@/utils/settingsSchema';
import './App.css';

// Get default settings from central schema (single source of truth)
const DEFAULT_SETTINGS = getDefaultSettings();

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

      {/* Audio element (hidden) */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} className="hidden" />
      )}

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
