import { useEffect, useRef, useCallback } from 'react';
import AudioAnalyzer from '../core/AudioAnalyzer';

/**
 * Custom hook for managing audio analysis
 * Includes both basic frequency bands and advanced spectral analysis
 * @param {React.RefObject} audioRef - Reference to audio element
 * @param {React.RefObject} sceneRef - Reference to ThreeScene instance
 * @param {Object} visualSettings - Visualization settings
 * @returns {Object} Audio analyzer methods
 */
export const useAudioAnalysis = (audioRef, sceneRef, visualSettings) => {
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isRunningRef = useRef(false);
  const settingsRef = useRef(visualSettings);

  // Keep settings ref updated
  useEffect(() => {
    settingsRef.current = visualSettings;
    
    // Update analyzer advanced options when settings change
    if (analyzerRef.current) {
      analyzerRef.current.setAdvancedOptions({
        beatSensitivity: visualSettings.beatSensitivity || 1.0,
        onsetSensitivity: visualSettings.onsetSensitivity || 1.0,
        enableChroma: visualSettings.enableChroma || false,
      });
    }
  }, [visualSettings]);

  // Initialize audio analyzer
  const initialize = useCallback(() => {
    if (!audioRef.current) {
      console.log('[AudioAnalysis] No audio element, skipping init');
      return;
    }

    // If analyzer already exists and is initialized, don't reinitialize
    if (analyzerRef.current?.isInitialized) {
      console.log('[AudioAnalysis] Already initialized');
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
      console.log('[AudioAnalysis] Audio analyzer initialized successfully');
    } catch (error) {
      console.error('[AudioAnalysis] Failed to initialize audio analyzer:', error);
      // If initialization fails, clean up
      if (analyzerRef.current) {
        analyzerRef.current = null;
      }
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
        return;
      }
      
      if (!analyzerRef.current) {
        console.warn('[AudioAnalysis] Analyzer lost during loop');
        isRunningRef.current = false;
        return;
      }

      // Get full analysis including advanced metrics
      const fullAnalysis = analyzerRef.current.getFullAnalysis();
      
      // Apply sensitivity settings to basic frequency bands
      const settings = settingsRef.current;
      const adjustedBands = {
        // Basic frequency bands with intensity modifiers
        bass: fullAnalysis.bass * settings.sensitivity * settings.bassIntensity,
        mid: fullAnalysis.mid * settings.sensitivity * settings.midIntensity,
        high: fullAnalysis.high * settings.sensitivity * settings.highIntensity,
        
        // Advanced spectral features (already normalized 0-1)
        spectralCentroid: fullAnalysis.spectralCentroid,
        spectralFlux: fullAnalysis.spectralFlux,
        spectralRolloff: fullAnalysis.spectralRolloff,
        zeroCrossingRate: fullAnalysis.zeroCrossingRate,
        rms: fullAnalysis.rms,
        
        // Beat detection
        isBeat: fullAnalysis.isBeat,
        beatIntensity: fullAnalysis.beatIntensity,
        bpm: fullAnalysis.bpm,
        bassEnergy: fullAnalysis.bassEnergy,
        
        // Onset detection  
        isOnset: fullAnalysis.isOnset,
        onsetIntensity: fullAnalysis.onsetIntensity,
        
        // Optional chroma features
        chroma: fullAnalysis.chroma,
        dominantPitch: fullAnalysis.dominantPitch,
        
        // Stereo analysis
        stereo: fullAnalysis.stereo,
      };

      // Log every 120 frames (~2 seconds at 60fps)
      frameCount++;
      if (frameCount % 120 === 0) {
        const hasData = adjustedBands.bass > 0 || adjustedBands.mid > 0 || adjustedBands.high > 0;
        console.log('[AudioAnalysis] Frequency bands:', {
          bass: adjustedBands.bass.toFixed(2),
          mid: adjustedBands.mid.toFixed(2),
          high: adjustedBands.high.toFixed(2),
          centroid: adjustedBands.spectralCentroid.toFixed(2),
          rms: adjustedBands.rms.toFixed(2),
          bpm: adjustedBands.bpm,
        });
      }

      // Update scene with frequency data - read ref directly each time
      if (sceneRef.current) {
        sceneRef.current.updateFrequencyBands(adjustedBands);
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
