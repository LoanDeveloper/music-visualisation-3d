import { useState, useEffect } from 'react';
import './FullscreenButton.css';

/**
 * FullscreenButton component
 * Toggles fullscreen mode
 */
const FullscreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Erreur lors du basculement en plein écran:', error);
    }
  };

  return (
    <button
      className="fullscreen-button"
      onClick={toggleFullscreen}
      title={isFullscreen ? 'Quitter le plein écran (F)' : 'Plein écran (F)'}
    >
      {isFullscreen ? '⤓' : '⤢'}
    </button>
  );
};

export default FullscreenButton;
