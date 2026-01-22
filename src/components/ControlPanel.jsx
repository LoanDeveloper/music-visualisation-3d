import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useDraggable } from '@/hooks/useDraggable';

/**
 * ControlPanel component
 * Provides audio playback controls (play/pause, progress, volume)
 */
const ControlPanel = ({ audioRef, audioName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Draggable hook - bottom-center default position
  const { isDragging, dragHandleProps, containerStyle, setRef } = useDraggable(
    'control-panel',
    { x: typeof window !== 'undefined' ? (window.innerWidth - 560) / 2 : 200, y: typeof window !== 'undefined' ? window.innerHeight - 100 : 600 }
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Sync initial state
    setIsPlaying(!audio.paused);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioRef]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('[ControlPanel] Failed to play audio:', error);
        // Most common error: user hasn't interacted with the page yet
        // The audio will play once they click again
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressChange = (value) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
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
    <div 
      ref={setRef}
      className={`w-[560px] max-w-[calc(100%-2rem)] p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl ${isDragging ? 'shadow-2xl scale-[1.01]' : ''}`}
      style={{ ...containerStyle, zIndex: isDragging ? 1000 : 10 }}
    >
      {/* Drag Handle */}
      <div 
        {...dragHandleProps}
        className="flex items-center justify-center py-1 -mt-2 mb-2 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-t-2xl transition-colors"
      >
        <GripVertical className="h-4 w-4 text-foreground/30 rotate-90" />
      </div>

      <div className="mb-3 text-center">
        <div className="text-sm text-muted-foreground truncate">
          {audioName || 'Aucun fichier'}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full shrink-0"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs text-muted-foreground min-w-[36px] text-right font-mono tabular-nums">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground min-w-[36px] font-mono tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
