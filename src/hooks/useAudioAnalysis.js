import { useEffect, useRef, useCallback } from 'react';
import AudioAnalyzer from '../core/AudioAnalyzer';

/**
 * Custom hook for managing audio analysis
 * @param {React.RefObject} audioRef - Reference to audio element
 * @param {React.RefObject} sceneRef - Reference to ThreeScene instance
 * @returns {Object} Audio analyzer methods
 */
export const useAudioAnalysis = (audioRef, sceneRef) => {
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize audio analyzer
  const initialize = useCallback(() => {
    if (!audioRef.current) return;

    // If analyzer already exists and is initialized, don't reinitialize
    if (analyzerRef.current?.isInitialized) {
      return;
    }

    try {
      // Clean up old analyzer if it exists but failed to initialize
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
        analyzerRef.current = null;
      }

      analyzerRef.current = new AudioAnalyzer();
      analyzerRef.current.initialize(audioRef.current);
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      // If initialization fails, clean up
      if (analyzerRef.current) {
        analyzerRef.current = null;
      }
    }
  }, [audioRef]);

  // Start audio analysis loop
  const startAnalysis = useCallback(() => {
    if (!analyzerRef.current || !sceneRef.current) {
      return;
    }

    // Resume audio context if needed
    analyzerRef.current.resumeContext();

    const updateAudioData = () => {
      if (!analyzerRef.current || !sceneRef.current) return;

      // Get frequency bands
      const frequencyBands = analyzerRef.current.getFrequencyBands();

      // Update scene with frequency data
      sceneRef.current.updateFrequencyBands(frequencyBands);

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(updateAudioData);
    };

    updateAudioData();
  }, [sceneRef]);

  // Stop audio analysis loop
  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Reset analyzer
  const reset = useCallback(() => {
    if (analyzerRef.current) {
      analyzerRef.current.reset();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
        analyzerRef.current = null;
      }
    };
  }, [stopAnalysis]);

  return {
    initialize,
    startAnalysis,
    stopAnalysis,
    reset,
  };
};

export default useAudioAnalysis;
