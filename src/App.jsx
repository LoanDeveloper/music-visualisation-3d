import { useState, useRef, useEffect } from 'react';
import VisualizerCanvas from './components/VisualizerCanvas';
import AudioUploader from './components/AudioUploader';
import ControlPanel from './components/ControlPanel';
import ThemeSelector from './components/ThemeSelector';
import FullscreenButton from './components/FullscreenButton';
import useAudioAnalysis from './hooks/useAudioAnalysis';
import './App.css';

function App() {
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioName, setAudioName] = useState('');
  const [currentTheme, setCurrentTheme] = useState('neon');

  const audioRef = useRef(null);
  const sceneRef = useRef(null);

  const { initialize, startAnalysis, stopAnalysis, reset } = useAudioAnalysis(
    audioRef,
    sceneRef
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
      initialize();
    }
  }, [audioUrl, initialize]);

  // Handle audio play/pause events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      startAnalysis();
    };

    const handlePause = () => {
      stopAnalysis();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [startAnalysis, stopAnalysis]);

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
      <VisualizerCanvas palette={currentTheme} sceneRef={sceneRef} />

      {/* Audio element (hidden) */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
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

      {/* Keyboard shortcuts hint */}
      {audioUrl && (
        <div className="shortcuts-hint">
          <div className="shortcut">
            <kbd>Space</kbd> Play/Pause
          </div>
          <div className="shortcut">
            <kbd>F</kbd> Plein écran
          </div>
          <div className="shortcut">
            <kbd>1-5</kbd> Thèmes
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
