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
  const isRunningRef = useRef(false);

  // Initialize audio analyzer
  const initialize = useCallback(() => {
    console.log('[AudioAnalysis] initialize called');
    console.log('[AudioAnalysis] audioRef.current:', !!audioRef.current);
    console.log('[AudioAnalysis] analyzerRef.current:', !!analyzerRef.current);
    
    if (!audioRef.current) {
      console.warn('[AudioAnalysis] No audio element, skipping initialization');
      return;
    }
    
    // If already initialized, skip
    if (analyzerRef.current) {
      console.log('[AudioAnalysis] Already initialized');
      return;
    }

    try {
      analyzerRef.current = new AudioAnalyzer();
      analyzerRef.current.initialize(audioRef.current);
      console.log('[AudioAnalysis] Audio analyzer initialized successfully');
    } catch (error) {
      console.error('[AudioAnalysis] Failed to initialize audio analyzer:', error);
    }
  }, []); // No deps - we read refs directly

  // Start audio analysis loop
  const startAnalysis = useCallback(() => {
    console.log('[AudioAnalysis] startAnalysis called');
    console.log('[AudioAnalysis] analyzerRef.current:', !!analyzerRef.current);
    console.log('[AudioAnalysis] sceneRef.current:', !!sceneRef.current);
    console.log('[AudioAnalysis] isRunningRef.current:', isRunningRef.current);
    
    // Prevent multiple loops
    if (isRunningRef.current) {
      console.log('[AudioAnalysis] Already running, skipping');
      return;
    }
    
    // Try to initialize if not done yet
    if (!analyzerRef.current) {
      console.warn('[AudioAnalysis] No analyzer, attempting to initialize...');
      if (audioRef.current) {
        try {
          analyzerRef.current = new AudioAnalyzer();
          analyzerRef.current.initialize(audioRef.current);
          console.log('[AudioAnalysis] Late initialization successful');
        } catch (error) {
          console.error('[AudioAnalysis] Late initialization failed:', error);
          return;
        }
      } else {
        console.error('[AudioAnalysis] No audio element available');
        return;
      }
    }

    // Resume audio context if needed (important for browser autoplay policy)
    analyzerRef.current.resumeContext();
    
    isRunningRef.current = true;

    let frameCount = 0;
    const updateAudioData = () => {
      if (!isRunningRef.current) {
        console.log('[AudioAnalysis] Loop stopped');
        return;
      }
      
      if (!analyzerRef.current) {
        console.warn('[AudioAnalysis] Analyzer lost during loop');
        isRunningRef.current = false;
        return;
      }

      // Get frequency bands
      const frequencyBands = analyzerRef.current.getFrequencyBands();

      // Log every 120 frames (~2 seconds at 60fps)
      frameCount++;
      if (frameCount % 120 === 0) {
        const hasData = frequencyBands.bass > 0 || frequencyBands.mid > 0 || frequencyBands.high > 0;
        console.log('[AudioAnalysis] Frequency bands:', frequencyBands, '| Has data:', hasData);
        console.log('[AudioAnalysis] Scene available:', !!sceneRef.current);
      }

      // Update scene with frequency data - read ref directly each time
      if (sceneRef.current) {
        sceneRef.current.updateFrequencyBands(frequencyBands);
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(updateAudioData);
    };

    console.log('[AudioAnalysis] Starting analysis loop');
    updateAudioData();
  }, []); // No deps - we read refs directly

  // Stop audio analysis loop
  const stopAnalysis = useCallback(() => {
    console.log('[AudioAnalysis] stopAnalysis called');
    isRunningRef.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Reset analyzer
  const reset = useCallback(() => {
    console.log('[AudioAnalysis] reset called');
    stopAnalysis();
    
    if (analyzerRef.current) {
      analyzerRef.current.destroy();
      analyzerRef.current = null;
    }
  }, [stopAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[AudioAnalysis] Cleanup on unmount');
      isRunningRef.current = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
        analyzerRef.current = null;
      }
    };
  }, []);

  return {
    initialize,
    startAnalysis,
    stopAnalysis,
    reset,
  };
};

export default useAudioAnalysis;
