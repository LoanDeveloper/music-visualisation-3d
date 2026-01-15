import { useState, useEffect } from 'react';
import './ControlPanel.css';

/**
 * ControlPanel component
 * Provides audio playback controls (play/pause, progress, volume)
 */
const ControlPanel = ({ audioRef, audioName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="control-panel">
      <div className="audio-info">
        <div className="audio-name">{audioName || 'Aucun fichier'}</div>
      </div>

      <div className="controls">
        <button className="play-button" onClick={togglePlayPause}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="progress-container">
          <span className="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            step="0.1"
          />
          <span className="time">{formatTime(duration)}</span>
        </div>

        <div className="volume-container">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            className="volume-bar"
            min="0"
            max="1"
            value={volume}
            onChange={handleVolumeChange}
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
