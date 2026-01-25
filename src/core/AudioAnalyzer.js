import { getFrequencyBands, resetSmoothing } from '../utils/audioProcessor';
import { analyzeAudio, resetAdvancedAnalysis } from '../utils/advancedAudioProcessor';
import { analyzeStereo, resetStereoAnalysis } from '../utils/stereoAnalyzer';
import { platform } from '../utils/platform';

/**
 * AudioAnalyzer class
 * Wrapper for Web Audio API to analyze audio frequencies in real-time
 * Includes advanced spectral analysis and stereo analysis features
 */
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.audioElement = null;
    this.isInitialized = false;
    
    // Platform-specific settings
    this.settings = platform.getAudioSettings();
    this.lastAudioCheck = 0;
    this.audioStuckCounter = 0;
    
    // Stereo analysis nodes (always disabled on Linux)
    this.stereoEnabled = false; // Always false for stability
    this.channelSplitter = null;
    this.analyserLeft = null;
    this.analyserRight = null;
    this.leftDataArray = null;
    this.rightDataArray = null;
    this.outputGain = null;
    
    // Advanced analysis options
    this.advancedOptions = {
      beatSensitivity: 1.0,
      onsetSensitivity: 1.0,
      enableChroma: false,
    };
    
    // Auto-recovery system
    this.recoveryTimer = null;
    this.isRecovering = false;
  }

  /**
   * Initialize the audio analyzer with an audio element
   * @param {HTMLAudioElement} audioElement - The audio element to analyze
   * @param {boolean} stereoEnabled - Always false - not supported on Linux
   */
  initialize(audioElement, stereoEnabled = false) {
    if (this.isInitialized) {
      console.warn('[AudioAnalyzer] Already initialized');
      return;
    }

    // Log platform info
    platform.logInfo();

    // Force mono mode always for stability
    this.stereoEnabled = false;

    try {
      // Create audio context with platform settings
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      console.log('[AudioAnalyzer] AudioContext created, state:', this.audioContext.state);

      // Create main analyser node with platform settings
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.settings.fftSize;
      this.analyser.smoothingTimeConstant = this.settings.smoothingTimeConstant;

      // Create media element source
      this.source = this.audioContext.createMediaElementSource(audioElement);

      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Platform-specific routing
      console.log('[AudioAnalyzer] Connecting audio nodes with platform optimizations...');
      
      // Direct routing: source -> analyser -> destination
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      // Setup auto-recovery for problematic platforms
      if (this.settings.autoRecovery) {
        this.setupAutoRecovery();
      }
      
      console.log('[AudioAnalyzer] Audio routing complete');

      this.audioElement = audioElement;
      this.isInitialized = true;
      console.log('[AudioAnalyzer] Initialized successfully (platform-optimized mono mode)');

    } catch (error) {
      console.error('[AudioAnalyzer] Failed to initialize:', error);
      // Cleanup on error
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      throw error;
    }
  }

  /**
   * Resume audio context if suspended (required for autoplay policies)
   */
  async resumeContext() {
    if (!this.audioContext) {
      console.warn('[AudioAnalyzer] No AudioContext to resume');
      return false;
    }

    console.log('[AudioAnalyzer] AudioContext state before resume:', this.audioContext.state);
    
    if (this.audioContext.state === 'suspended') {
      try {
        console.log('[AudioAnalyzer] Attempting to resume AudioContext...');
        await this.audioContext.resume();
        console.log('[AudioAnalyzer] AudioContext resumed successfully, new state:', this.audioContext.state);
        return true;
      } catch (error) {
        console.error('[AudioAnalyzer] Failed to resume AudioContext:', error);
        return false;
      }
    } else if (this.audioContext.state === 'running') {
      console.log('[AudioAnalyzer] AudioContext already running');
      return true;
    } else {
      console.warn('[AudioAnalyzer] AudioContext in unexpected state:', this.audioContext.state);
      return false;
    }
  }

  /**
   * Setup auto-recovery mechanism for problematic platforms
   */
  setupAutoRecovery() {
    console.log('[AudioAnalyzer] Setting up auto-recovery for platform:', platform.os);
    
    // Check audio health every 2 seconds
    this.recoveryTimer = setInterval(() => {
      if (!this.audioElement || this.isRecovering) return;
      
      const now = Date.now();
      const timeSinceLastCheck = now - this.lastAudioCheck;
      
      // Check if audio appears stuck (not progressing)
      if (this.audioElement.currentTime > 0 && !this.audioElement.paused) {
        const expectedProgress = (timeSinceLastCheck / 1000); // Expected progress in seconds
        const actualProgress = this.audioElement.currentTime - this.lastAudioCheck;
        
        // If audio should have progressed but didn't, it's stuck
        if (actualProgress < expectedProgress * 0.1) {
          this.audioStuckCounter++;
          console.warn(`[AudioAnalyzer] Audio appears stuck (counter: ${this.audioStuckCounter})`);
          
          if (this.audioStuckCounter >= 3) {
            this.attemptRecovery();
          }
        } else {
          this.audioStuckCounter = 0; // Reset counter if progressing normally
        }
      }
      
      this.lastAudioCheck = this.audioElement.currentTime;
    }, 2000);
  }

  /**
   * Attempt to recover from audio issues
   */
  async attemptRecovery() {
    if (this.isRecovering) return;
    
    console.log('[AudioAnalyzer] Attempting audio recovery...');
    this.isRecovering = true;
    
    try {
      const currentTime = this.audioElement.currentTime;
      
      // Pause briefly
      this.audioElement.pause();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Resume playback
      await this.audioElement.play();
      
      console.log('[AudioAnalyzer] Recovery successful, resuming at:', currentTime);
      this.audioStuckCounter = 0;
    } catch (error) {
      console.error('[AudioAnalyzer] Recovery failed:', error);
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Get raw frequency data with platform-specific optimizations
   * @returns {Uint8Array} Raw frequency data (0-255)
   */
  getFrequencyData() {
    if (!this.isInitialized || !this.analyser) {
      console.warn('[AudioAnalyzer] Not initialized, returning empty array');
      return new Uint8Array(0);
    }

    // Check audio context state
    if (this.audioContext.state !== 'running') {
      console.warn('[AudioAnalyzer] AudioContext not running, state:', this.audioContext.state);
      return new Uint8Array(0);
    }

    try {
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Check if we have actual audio data
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const average = sum / this.dataArray.length;
      
      // Platform-specific logging
      if (average > 0 && Math.random() < 0.005) { // Even less frequent logging
        console.log('[AudioAnalyzer] Audio data detected, average level:', average.toFixed(2));
      }
      
      return this.dataArray;
    } catch (error) {
      console.error('[AudioAnalyzer] Error getting frequency data:', error);
      return new Uint8Array(0);
    }
  }

  /**
   * Get stereo frequency data (left and right channels)
   * @returns {Object} { left: Uint8Array, right: Uint8Array }
   */
  getStereoFrequencyData() {
    if (!this.stereoEnabled || !this.analyserLeft || !this.analyserRight) {
      return { left: null, right: null };
    }
    
    this.analyserLeft.getByteFrequencyData(this.leftDataArray);
    this.analyserRight.getByteFrequencyData(this.rightDataArray);
    
    return {
      left: this.leftDataArray,
      right: this.rightDataArray,
    };
  }

  /**
   * Get processed frequency bands (bass, mid, high)
   * @returns {Object} Frequency bands with normalized values (0-1)
   */
  getFrequencyBands() {
    const frequencyData = this.getFrequencyData();
    return getFrequencyBands(frequencyData);
  }

  /**
   * Get advanced audio analysis metrics
   * @returns {Object} Advanced metrics (spectral centroid, flux, beat, etc.)
   */
  getAdvancedAnalysis() {
    const frequencyData = this.getFrequencyData();
    return analyzeAudio(frequencyData, this.advancedOptions);
  }

  /**
   * Get both basic frequency bands and advanced analysis in one call
   * Includes stereo analysis when enabled
   * @returns {Object} Combined audio analysis data
   */
  getFullAnalysis() {
    const frequencyData = this.getFrequencyData();
    const bands = getFrequencyBands(frequencyData);
    const advanced = analyzeAudio(frequencyData, this.advancedOptions);
    
    // Get stereo analysis if enabled
    let stereo = null;
    if (this.stereoEnabled) {
      const { left, right } = this.getStereoFrequencyData();
      stereo = analyzeStereo(left, right, true);
    } else {
      stereo = analyzeStereo(null, null, false);
    }
    
    return {
      ...bands,
      ...advanced,
      stereo,
    };
  }

  /**
   * Update advanced analysis options
   * @param {Object} options - Analysis options
   */
  setAdvancedOptions(options) {
    this.advancedOptions = { ...this.advancedOptions, ...options };
  }

  /**
   * Check if audio is currently playing
   * @returns {boolean}
   */
  isPlaying() {
    return this.audioElement && !this.audioElement.paused;
  }

  /**
   * Reset the analyzer (call when audio changes)
   */
  reset() {
    resetSmoothing();
    resetAdvancedAnalysis();
    resetStereoAnalysis();
  }

  /**
   * Enable or disable stereo analysis at runtime
   * Note: Requires re-initialization to take effect
   * @param {boolean} enabled
   */
  setStereoEnabled(enabled) {
    this.stereoEnabled = enabled;
  }

  /**
   * Clean up resources with platform-specific approach
   */
  destroy() {
    console.log('[AudioAnalyzer] Destroying audio analyzer...');
    
    // Clear auto-recovery timer
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    
    // Disconnect source first (stops audio flow)
    if (this.source) {
      try {
        this.source.disconnect();
        console.log('[AudioAnalyzer] Source disconnected');
      } catch (error) {
        console.warn('[AudioAnalyzer] Error disconnecting source:', error);
      }
      this.source = null;
    }

    // Disconnect analyser
    if (this.analyser) {
      try {
        this.analyser.disconnect();
        console.log('[AudioAnalyzer] Analyser disconnected');
      } catch (error) {
        console.warn('[AudioAnalyzer] Error disconnecting analyser:', error);
      }
      this.analyser = null;
    }

    // Close audio context
    if (this.audioContext) {
      try {
        const state = this.audioContext.state;
        this.audioContext.close();
        console.log('[AudioAnalyzer] AudioContext closed, was:', state);
      } catch (error) {
        console.warn('[AudioAnalyzer] Error closing AudioContext:', error);
      }
      this.audioContext = null;
    }

    // Clear data arrays
    this.dataArray = null;
    this.leftDataArray = null;
    this.rightDataArray = null;

    this.audioElement = null;
    this.isInitialized = false;
    this.stereoEnabled = false;
    this.isRecovering = false;
    this.audioStuckCounter = 0;
    
    // Reset processors
    resetSmoothing();
    resetAdvancedAnalysis();
    resetStereoAnalysis();

    console.log('[AudioAnalyzer] Destroy complete');
  }
}

export default AudioAnalyzer;
