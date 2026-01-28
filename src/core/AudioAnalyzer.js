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
    this.channelMerger = null;
    
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
   * @param {boolean} stereoEnabled - Enable stereo analysis (default: true)
   */
  initialize(audioElement, stereoEnabled = true) {
    if (this.isInitialized) {
      console.warn('AudioAnalyzer already initialized');
      return;
    }

    this.stereoEnabled = stereoEnabled;

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create main analyser node (for combined/mono analysis)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create media element source
      this.source = this.audioContext.createMediaElementSource(audioElement);

      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      if (this.stereoEnabled) {
        // Create stereo analysis nodes
        // ChannelSplitter to split L/R
        this.channelSplitter = this.audioContext.createChannelSplitter(2);
        
        // Left channel analyser
        this.analyserLeft = this.audioContext.createAnalyser();
        this.analyserLeft.fftSize = 2048;
        this.analyserLeft.smoothingTimeConstant = 0.8;
        this.leftDataArray = new Uint8Array(this.analyserLeft.frequencyBinCount);
        
        // Right channel analyser
        this.analyserRight = this.audioContext.createAnalyser();
        this.analyserRight.fftSize = 2048;
        this.analyserRight.smoothingTimeConstant = 0.8;
        this.rightDataArray = new Uint8Array(this.analyserRight.frequencyBinCount);
        
        // ChannelMerger to recombine for output
        this.channelMerger = this.audioContext.createChannelMerger(2);
        
        // Audio routing with stereo:
        // source -> splitter -> L analyser -> merger -> destination
        //                    -> R analyser -> merger
        // source -> main analyser (for combined analysis)
        
        this.source.connect(this.channelSplitter);
        this.source.connect(this.analyser); // Also connect to main for combined analysis
        
        // Connect splitter outputs to individual analysers
        this.channelSplitter.connect(this.analyserLeft, 0);
        this.channelSplitter.connect(this.analyserRight, 1);
        
        // Connect analysers to merger
        this.analyserLeft.connect(this.channelMerger, 0, 0);
        this.analyserRight.connect(this.channelMerger, 0, 1);
        
        // Connect merger to destination
        this.channelMerger.connect(this.audioContext.destination);
        
        console.log('AudioAnalyzer initialized with stereo support');
      } else {
        // Mono mode: simple routing
        // source -> analyser -> destination
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        console.log('AudioAnalyzer initialized (mono mode)');
      }

      this.audioElement = audioElement;
      this.isInitialized = true;

    } catch (error) {
      console.error('Failed to initialize AudioAnalyzer:', error);
      throw error;
    }
  }

  /**
   * Resume audio context if suspended (required for autoplay policies)
   */
  async resumeContext() {
    if (this.audioContext) {
      console.log('[AudioAnalyzer] AudioContext state:', this.audioContext.state);
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('[AudioAnalyzer] AudioContext resumed successfully');
        } catch (error) {
          console.error('[AudioAnalyzer] Failed to resume AudioContext:', error);
        }
      }
    } else {
      console.warn('[AudioAnalyzer] No AudioContext to resume');
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

    this.analyser.getByteFrequencyData(this.dataArray);
    
    return this.dataArray;
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
   * Clean up resources
   */
  destroy() {
    // Disconnect stereo nodes
    if (this.channelSplitter) {
      this.channelSplitter.disconnect();
      this.channelSplitter = null;
    }
    
    if (this.analyserLeft) {
      this.analyserLeft.disconnect();
      this.analyserLeft = null;
    }
    
    if (this.analyserRight) {
      this.analyserRight.disconnect();
      this.analyserRight = null;
    }
    
    if (this.channelMerger) {
      this.channelMerger.disconnect();
      this.channelMerger = null;
    }
    
    this.leftDataArray = null;
    this.rightDataArray = null;

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.dataArray = null;
    this.audioElement = null;
    this.isInitialized = false;
    this.stereoEnabled = true;
    
    resetSmoothing();
    resetAdvancedAnalysis();
    resetStereoAnalysis();

    console.log('AudioAnalyzer destroyed');
  }
}

export default AudioAnalyzer;
