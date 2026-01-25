import { getFrequencyBands, resetSmoothing } from '../utils/audioProcessor';
import { analyzeAudio, resetAdvancedAnalysis } from '../utils/advancedAudioProcessor';
import { analyzeStereo, resetStereoAnalysis } from '../utils/stereoAnalyzer';

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
    
    // Stereo analysis nodes
    this.stereoEnabled = true;
    this.channelSplitter = null;
    this.analyserLeft = null;
    this.analyserRight = null;
    this.leftDataArray = null;
    this.rightDataArray = null;
    this.outputGain = null; // Used for reliable audio output in stereo mode
    
    // Advanced analysis options
    this.advancedOptions = {
      beatSensitivity: 1.0,
      onsetSensitivity: 1.0,
      enableChroma: false,
    };
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

    // Force mono mode on Linux/Fedora for stability
    this.stereoEnabled = false;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      console.log('[AudioAnalyzer] AudioContext created, state:', this.audioContext.state);

      // Create main analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create media element source
      this.source = this.audioContext.createMediaElementSource(audioElement);

      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // ULTRA MINIMAL ROUTING - Only what's absolutely necessary
      console.log('[AudioAnalyzer] Connecting audio nodes...');
      
      // Direct routing: source -> analyser -> destination
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      console.log('[AudioAnalyzer] Audio routing complete');

      this.audioElement = audioElement;
      this.isInitialized = true;
      console.log('[AudioAnalyzer] Initialized successfully (minimal mono mode)');

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
   * Get raw frequency data
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
      
      if (average > 0 && Math.random() < 0.01) { // Only log 1% of the time to avoid spam
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
   * Clean up resources - minimal approach to prevent sink corruption
   */
  destroy() {
    console.log('[AudioAnalyzer] Destroying audio analyzer...');
    
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
    
    // Reset processors
    resetSmoothing();
    resetAdvancedAnalysis();
    resetStereoAnalysis();

    console.log('[AudioAnalyzer] Destroy complete');
  }
}

export default AudioAnalyzer;
