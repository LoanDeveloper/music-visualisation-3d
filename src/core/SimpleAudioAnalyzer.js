import { getFrequencyBands, resetSmoothing } from '../utils/audioProcessor';

/**
 * Fallback audio analyzer that works without Web Audio API
 * Uses basic audio element properties for visualization
 */
class SimpleAudioAnalyzer {
  constructor() {
    this.audioElement = null;
    this.isInitialized = false;
    this.lastAnalysisTime = 0;
    this.analysisInterval = 50; // 20 FPS analysis
  }

  /**
   * Initialize with audio element
   * @param {HTMLAudioElement} audioElement 
   */
  initialize(audioElement) {
    if (this.isInitialized) {
      console.warn('[SimpleAudioAnalyzer] Already initialized');
      return;
    }

    this.audioElement = audioElement;
    this.isInitialized = true;
    console.log('[SimpleAudioAnalyzer] Initialized (fallback mode - no Web Audio API)');
  }

  /**
   * Resume context - not needed for simple mode
   */
  async resumeContext() {
    return true;
  }

  /**
   * Get simulated frequency data based on audio element properties
   * @returns {Uint8Array} Simulated frequency data
   */
  getFrequencyData() {
    if (!this.isInitialized || !this.audioElement) {
      return new Uint8Array(1024);
    }

    // Simulate frequency data based on audio element time and playback state
    const isPlaying = !this.audioElement.paused;
    const currentTime = this.audioElement.currentTime || 0;
    
    // Create simple simulation based on time
    const dataArray = new Uint8Array(1024);
    if (isPlaying) {
      // Generate some movement based on time
      const timeFactor = Math.sin(currentTime * 2) * 0.5 + 0.5;
      
      // Simulate bass (low frequencies)
      for (let i = 0; i < 85; i++) {
        dataArray[i] = timeFactor * 128 + Math.random() * 64;
      }
      
      // Simulate mids 
      for (let i = 85; i < 512; i++) {
        dataArray[i] = timeFactor * 96 + Math.random() * 32;
      }
      
      // Simulate highs
      for (let i = 512; i < 1024; i++) {
        dataArray[i] = timeFactor * 64 + Math.random() * 16;
      }
    }
    
    return dataArray;
  }

  /**
   * Get frequency bands
   * @returns {Object} Frequency bands data
   */
  getFrequencyBands() {
    const frequencyData = this.getFrequencyData();
    return getFrequencyBands(frequencyData);
  }

  /**
   * Get full analysis (simplified)
   * @returns {Object} Full analysis data
   */
  getFullAnalysis() {
    const frequencyData = this.getFrequencyData();
    const bands = getFrequencyBands(frequencyData);
    
    return {
      ...bands,
      // Advanced features set to defaults
      spectralCentroid: 0.5,
      spectralFlux: 0.1,
      spectralRolloff: 0.8,
      zeroCrossingRate: 0.05,
      rms: (bands.bass + bands.mid + bands.high) / 3,
      isBeat: bands.bass > 0.6,
      beatIntensity: bands.bass,
      bpm: 120,
      bassEnergy: bands.bass,
      isOnset: false,
      onsetIntensity: 0,
      chroma: null,
      dominantPitch: 'C',
      stereo: null,
    };
  }

  /**
   * Check if audio is playing
   * @returns {boolean}
   */
  isPlaying() {
    return this.audioElement && !this.audioElement.paused;
  }

  /**
   * Reset the analyzer
   */
  reset() {
    resetSmoothing();
  }

  /**
   * Clean up (minimal for fallback)
   */
  destroy() {
    this.audioElement = null;
    this.isInitialized = false;
    console.log('[SimpleAudioAnalyzer] Destroyed');
  }
}

export default SimpleAudioAnalyzer;