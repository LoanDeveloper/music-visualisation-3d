import { getFrequencyBands, resetSmoothing } from '../utils/audioProcessor';
import { analyzeAudio, resetAdvancedAnalysis } from '../utils/advancedAudioProcessor';
import { analyzeStereo, resetStereoAnalysis } from '../utils/stereoAnalyzer';

/**
 * Global AudioContext singleton
 * Never closed during the session to prevent PipeWire/PulseAudio corruption on Linux
 */
let globalAudioContext = null;

/**
 * Track which audio elements have been connected to avoid double-connection
 * MediaElementSource can only be created once per audio element
 */
const connectedElements = new WeakSet();

/**
 * AudioAnalyzer class
 * Wrapper for Web Audio API to analyze audio frequencies in real-time
 * Uses singleton AudioContext pattern for Linux/PipeWire stability
 */
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.outputGain = null; // Buffer node to isolate destination
    this.audioElement = null;
    this.isInitialized = false;
    
    // Advanced analysis options
    this.advancedOptions = {
      beatSensitivity: 1.0,
      onsetSensitivity: 1.0,
      enableChroma: false,
    };
  }

  /**
   * Get or create the global AudioContext singleton
   * @returns {AudioContext}
   */
  static getAudioContext() {
    if (!globalAudioContext || globalAudioContext.state === 'closed') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      globalAudioContext = new AudioContext();
      console.log('[AudioAnalyzer] Created new global AudioContext');
    }
    return globalAudioContext;
  }

  /**
   * Initialize the audio analyzer with an audio element
   * Uses simplified mono routing for maximum compatibility
   * @param {HTMLAudioElement} audioElement - The audio element to analyze
   */
  initialize(audioElement) {
    if (!audioElement) {
      console.warn('[AudioAnalyzer] No audio element provided');
      return;
    }

    // If already initialized with the same element, just ensure connection
    if (this.isInitialized && this.audioElement === audioElement) {
      console.log('[AudioAnalyzer] Already initialized with this element');
      return;
    }

    // If initialized with a different element, disconnect first
    if (this.isInitialized) {
      console.log('[AudioAnalyzer] Switching to new audio element, disconnecting...');
      this.disconnect();
    }

    try {
      // Get singleton AudioContext
      this.audioContext = AudioAnalyzer.getAudioContext();
      console.log('[AudioAnalyzer] Using AudioContext, state:', this.audioContext.state);

      // Create main analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create output gain node as buffer (prevents routing issues)
      this.outputGain = this.audioContext.createGain();
      this.outputGain.gain.value = 1.0;

      // Create media element source only if not already connected
      // MediaElementSource can only be created ONCE per audio element
      if (!connectedElements.has(audioElement)) {
        this.source = this.audioContext.createMediaElementSource(audioElement);
        connectedElements.add(audioElement);
        console.log('[AudioAnalyzer] Created new MediaElementSource');
      } else {
        // Element was previously connected - we need to reuse existing connection
        // This happens when changing tracks on the same audio element
        console.warn('[AudioAnalyzer] Audio element was previously connected');
        console.warn('[AudioAnalyzer] This may cause issues - consider page refresh if audio fails');
        
        // Try to create anyway (will throw if already connected)
        try {
          this.source = this.audioContext.createMediaElementSource(audioElement);
        } catch (e) {
          console.error('[AudioAnalyzer] Cannot reconnect audio element:', e.message);
          // Element is already connected somewhere, we can't use it
          throw new Error('Audio element already connected to another context');
        }
      }

      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Simplified mono routing for Linux/PipeWire stability:
      // source → analyser → outputGain → destination
      this.source.connect(this.analyser);
      this.analyser.connect(this.outputGain);
      this.outputGain.connect(this.audioContext.destination);

      this.audioElement = audioElement;
      this.isInitialized = true;

      console.log('[AudioAnalyzer] Initialized successfully (mono mode, singleton context)');

    } catch (error) {
      console.error('[AudioAnalyzer] Failed to initialize:', error);
      this.disconnect();
      throw error;
    }
  }

  /**
   * Resume audio context if suspended (required for autoplay policies)
   * @returns {Promise<boolean>} Whether resume was successful
   */
  async resumeContext() {
    if (!this.audioContext) {
      console.warn('[AudioAnalyzer] No AudioContext to resume');
      return false;
    }

    console.log('[AudioAnalyzer] AudioContext state:', this.audioContext.state);
    
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('[AudioAnalyzer] AudioContext resumed successfully');
        return true;
      } catch (error) {
        console.error('[AudioAnalyzer] Failed to resume AudioContext:', error);
        return false;
      }
    }
    
    return this.audioContext.state === 'running';
  }

  /**
   * Get raw frequency data
   * @returns {Uint8Array} Raw frequency data (0-255)
   */
  getFrequencyData() {
    if (!this.isInitialized || !this.analyser) {
      return new Uint8Array(0);
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
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
   * @returns {Object} Combined audio analysis data
   */
  getFullAnalysis() {
    const frequencyData = this.getFrequencyData();
    const bands = getFrequencyBands(frequencyData);
    const advanced = analyzeAudio(frequencyData, this.advancedOptions);
    
    // Stereo analysis disabled for stability (always returns null/defaults)
    const stereo = analyzeStereo(null, null, false);
    
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
   * Disconnect audio nodes without closing the AudioContext
   * Use this when switching tracks or temporarily stopping
   */
  disconnect() {
    console.log('[AudioAnalyzer] Disconnecting nodes...');
    
    // Disconnect in reverse order of connection
    if (this.outputGain) {
      try {
        this.outputGain.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this.outputGain = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this.analyser = null;
    }

    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {
        // Already disconnected
      }
      // Note: We don't null the source reference if we want to reconnect
      // But we do null it here since we're fully disconnecting
      this.source = null;
    }

    this.dataArray = null;
    this.isInitialized = false;
    
    // Reset analysis state
    resetSmoothing();
    resetAdvancedAnalysis();
    resetStereoAnalysis();
    
    console.log('[AudioAnalyzer] Disconnected');
  }

  /**
   * Clean up resources
   * Note: Does NOT close the global AudioContext (intentional for Linux stability)
   */
  destroy() {
    console.log('[AudioAnalyzer] Destroying...');
    
    this.disconnect();
    this.audioElement = null;
    
    // DO NOT close the global AudioContext
    // This prevents PipeWire/PulseAudio corruption on Linux
    // The context will be reused for future audio
    
    console.log('[AudioAnalyzer] Destroyed (AudioContext preserved)');
  }
}

export default AudioAnalyzer;
