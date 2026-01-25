import { useEffect, useRef, useCallback } from 'react';
import AudioAnalyzer from '../core/AudioAnalyzer';
import SimpleAudioAnalyzer from '../core/SimpleAudioAnalyzer';
import { platform } from '../utils/platform';

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
  const useFallbackRef = useRef(false); // Use SimpleAudioAnalyzer if Web Audio API fails
  
  // Platform-specific settings
  const platformSettings = platform.getAudioSettings();
  const lastFrameTime = useRef(0);
  const frameCount = useRef(0);

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
      // Check platform recommendations
      if (platformSettings.useFallback) {
        console.log('[AudioAnalysis] Platform recommends fallback mode');
        throw new Error('Using fallback for platform stability');
      }
      
      // Try Web Audio API first
      if (!useFallbackRef.current) {
        console.log('[AudioAnalysis] Attempting Web Audio API initialization for', platform.os);
        analyzerRef.current = new AudioAnalyzer();
        analyzerRef.current.initialize(audioRef.current);
        console.log('[AudioAnalysis] Web Audio API initialized successfully');
      } else {
        throw new Error('Using fallback mode');
      }
    } catch (error) {
      console.error('[AudioAnalysis] Web Audio API failed, falling back to simple mode:', error.message);
      
      // Fall back to simple analyzer
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
      }
      
      analyzerRef.current = new SimpleAudioAnalyzer();
      analyzerRef.current.initialize(audioRef.current);
      useFallbackRef.current = true;
      console.log('[AudioAnalysis] Fallback audio analyzer initialized');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No deps - we read refs directly

  // Start audio analysis loop
  const startAnalysis = useCallback(async () => {
    console.log('[AudioAnalysis] === START ANALYSIS CALLED ===');
    
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
          if (!useFallbackRef.current) {
            console.log('[AudioAnalysis] Late init with Web Audio API...');
            analyzerRef.current = new AudioAnalyzer();
            analyzerRef.current.initialize(audioRef.current);
            console.log('[AudioAnalysis] Late Web Audio API initialization successful');
          } else {
            throw new Error('Using fallback mode');
          }
        } catch (error) {
          console.error('[AudioAnalysis] Late Web Audio API failed, using fallback:', error.message);
          
          if (analyzerRef.current) {
            analyzerRef.current.destroy();
          }
          
          analyzerRef.current = new SimpleAudioAnalyzer();
          analyzerRef.current.initialize(audioRef.current);
          useFallbackRef.current = true;
          console.log('[AudioAnalysis] Late fallback initialization successful');
        }
      } else {
        console.error('[AudioAnalysis] No audio element available');
        return;
      }
    }

    // Resume audio context if needed (critical for browser autoplay policy)
    // This must happen before starting the analysis loop
    const resumed = await analyzerRef.current.resumeContext();
    if (!resumed) {
      console.error('[AudioAnalysis] Failed to resume AudioContext - audio will not work');
      return;
    }
    
    isRunningRef.current = true;
    console.log('[AudioAnalysis] Analysis loop starting...');

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

      // Get raw frequency data first
      const frequencyData = analyzerRef.current.getFrequencyData();
      
      // Check if we have actual audio data
      if (frequencyData.length === 0) {
        console.warn('[AudioAnalysis] No frequency data available');
        // Continue loop anyway, might get data later
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
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
        
        // Stereo analysis (always false now)
        stereo: fullAnalysis.stereo,
      };

      // Log every 120 frames (~2 seconds at 60fps) - only in dev
      frameCount++;
      if (frameCount % 120 === 0 && import.meta.env.DEV) {
        const hasData = adjustedBands.bass > 0 || adjustedBands.mid > 0 || adjustedBands.high > 0;
        console.log('[AudioAnalysis] Frame', frameCount, '- Has data:', hasData, '- Bands:', {
          bass: adjustedBands.bass.toFixed(2),
          mid: adjustedBands.mid.toFixed(2),
          high: adjustedBands.high.toFixed(2),
        });
      }

      // Update scene with frequency data - read ref directly each time
      if (sceneRef.current) {
        sceneRef.current.updateFrequencyBands(adjustedBands);
      }

      // Platform-specific frame rate limiting
      const now = performance.now();
      const targetFrameInterval = 1000 / platformSettings.maxAnalysisRate;
      
      frameCount.current++;
      const timeSinceLastFrame = now - lastFrameTime.current;
      
      // Only update if enough time has passed (reduces CPU load on Linux)
      if (timeSinceLastFrame >= targetFrameInterval) {
        // Update scene with frequency data - read ref directly each time
        if (sceneRef.current) {
          sceneRef.current.updateFrequencyBands(adjustedBands);
        }
        
        lastFrameTime.current = now;
      }

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(updateAudioData);
    };

    console.log('[AudioAnalysis] Starting analysis loop');
    updateAudioData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    // Reset fallback flag
    useFallbackRef.current = false;
    console.log('[AudioAnalysis] Reset complete, will try Web Audio API next time');
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
