import { getFrequencyBands, resetSmoothing } from '../utils/audioProcessor';

/**
 * AudioAnalyzer class
 * Wrapper for Web Audio API to analyze audio frequencies in real-time
 */
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.audioElement = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the audio analyzer with an audio element
   * @param {HTMLAudioElement} audioElement - The audio element to analyze
   */
  initialize(audioElement) {
    if (this.isInitialized) {
      console.warn('AudioAnalyzer already initialized');
      return;
    }

    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create media element source
      this.source = this.audioContext.createMediaElementSource(audioElement);

      // Connect nodes: source -> analyser -> destination
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.audioElement = audioElement;
      this.isInitialized = true;

      console.log('AudioAnalyzer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioAnalyzer:', error);
      throw error;
    }
  }

  /**
   * Resume audio context if suspended (required for autoplay policies)
   */
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
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
  }

  /**
   * Clean up resources
   */
  destroy() {
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
    resetSmoothing();

    console.log('AudioAnalyzer destroyed');
  }
}

export default AudioAnalyzer;
