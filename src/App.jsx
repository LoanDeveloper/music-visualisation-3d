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
import platform from '@/utils/platform';
import { DEFAULT_PRESET, DEFAULT_POSE } from '@/utils/humanPresets';
import { getDefaultSettings } from '@/utils/settingsSchema';
import './App.css';

// Get default settings from central schema (single source of truth)
const DEFAULT_SETTINGS = getDefaultSettings();

function App() {
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioName, setAudioName] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysisError, setAnalysisError] = useState(null);
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
  const analysisRafRef = useRef(null);
  const isAnalysisRunningRef = useRef(false);

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

  const startPrecomputedAnalysis = useCallback(() => {
    if (!analysisData?.frames?.length) {
      return;
    }

    if (!audioRef.current || !sceneRef.current) {
      return;
    }

    if (isAnalysisRunningRef.current) {
      return;
    }

    const { frames, sampleRate, hopSize, frameRate: providedRate } = analysisData;
    const frameRate = providedRate || (sampleRate / hopSize);
    const maxIndex = frames.length - 1;

    isAnalysisRunningRef.current = true;

    const tick = () => {
      if (!isAnalysisRunningRef.current) return;

      const currentTime = audioRef.current.currentTime || 0;
      const index = Math.min(Math.floor(currentTime * frameRate), maxIndex);
      const frame = frames[index] || frames[maxIndex];

      sceneRef.current.updateFrequencyBands({
        bass: frame.bass,
        mid: frame.mid,
        high: frame.high,
        spectralCentroid: 0,
        spectralFlux: 0,
        spectralRolloff: 0,
        zeroCrossingRate: 0,
        rms: frame.rms,
        isBeat: false,
        beatIntensity: 0,
        bpm: 0,
        bassEnergy: 0,
        isOnset: false,
        onsetIntensity: 0,
        chroma: null,
        dominantPitch: 0,
        stereo: null,
      });

      analysisRafRef.current = requestAnimationFrame(tick);
    };

    tick();
  }, [analysisData]);

  const stopPrecomputedAnalysis = useCallback(() => {
    isAnalysisRunningRef.current = false;
    if (analysisRafRef.current) {
      cancelAnimationFrame(analysisRafRef.current);
      analysisRafRef.current = null;
    }
  }, []);

  const analyzeFile = useCallback(async (file) => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiBase}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Analyse impossible');
      }

      const data = await response.json();
      setAnalysisData(data);
      setAnalysisStatus('ready');
    } catch (error) {
      console.error('[App] Backend analysis failed:', error);
      setAnalysisError(error.message || 'Analyse impossible');
      setAnalysisStatus('failed');
    }
  }, []);

  // Handle audio file selection
  const handleFileSelect = (url, name, file) => {
    console.log('[App] File selected:', name);
    
    // Pause current audio if playing
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    
    // Stop analysis loop (but don't destroy the analyzer)
    stopAnalysis();
    stopPrecomputedAnalysis();
    
    // Update URL and name (audio element stays the same, only src changes)
    setAudioUrl(url);
    setAudioName(name);
    setAnalysisData(null);
    setAnalysisError(null);
    setAnalysisStatus(file ? 'analyzing' : 'idle');

    // Reset position
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }

    if (file) {
      analyzeFile(file);
    }
  };

  // Initialize audio analyzer when audio element is ready
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      if (platform.isProblematicPlatform()) {
        return;
      }
      if (analysisStatus === 'analyzing' || analysisStatus === 'ready') {
        return;
      }
      if (import.meta.env.DEV) console.log('[App] Audio URL set, initializing analyzer...');
      // Small delay to ensure audio element is fully mounted
      const timer = setTimeout(() => {
        if (audioRef.current) {
          initialize();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [audioUrl, analysisStatus, initialize]);

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
      if (analysisData) {
        startPrecomputedAnalysis();
      } else if (analysisStatus !== 'analyzing' && !platform.isProblematicPlatform()) {
        startAnalysis();
      }
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
      stopPrecomputedAnalysis();
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
      if (analysisData) {
        startPrecomputedAnalysis();
      } else if (analysisStatus !== 'analyzing' && !platform.isProblematicPlatform()) {
        startAnalysis();
      }
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
  }, [audioUrl, analysisData, analysisStatus, startAnalysis, startPrecomputedAnalysis, stopAnalysis, stopPrecomputedAnalysis]);

  useEffect(() => {
    if (analysisData && audioRef.current && !audioRef.current.paused) {
      startPrecomputedAnalysis();
    }
  }, [analysisData, startPrecomputedAnalysis]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space: Play/Pause
      if (e.code === 'Space' && audioRef.current) {
        e.preventDefault();
        if (audioRef.current.paused) {
          if (analysisStatus === 'analyzing') {
            return;
          }
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
  }, [analysisStatus]);

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
      <AudioUploader onFileSelect={handleFileSelect} hasAudio={!!audioUrl} audioName={audioName} />

      {audioUrl && (
        <>
          <ControlPanel
            audioRef={audioRef}
            audioName={audioName}
            canPlay={analysisStatus !== 'analyzing'}
            playBlockedReason="Analyse audio en cours"
          />
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

      {analysisStatus !== 'idle' && (
        <div className="fixed bottom-16 right-4 z-[5] px-2.5 py-2 bg-black/40 backdrop-blur-xl rounded-lg text-xs text-foreground/70 border border-white/10 min-w-[180px]">
          {analysisStatus === 'analyzing' && (
            <div className="space-y-1.5">
              <div>Analyse audio en cours...</div>
              <div className="analysis-progress">
                <div className="analysis-progress-bar" />
              </div>
            </div>
          )}
          {analysisStatus === 'ready' && 'Analyse audio prête'}
          {analysisStatus === 'failed' && `Analyse audio échouée${analysisError ? `: ${analysisError}` : ''}`}
        </div>
      )}
    </div>
  );
}

export default App;
