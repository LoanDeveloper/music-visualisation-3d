/**
 * Advanced Audio Processing Module
 * 
 * Provides sophisticated audio analysis algorithms for music visualization:
 * - Spectral Centroid: "brightness" of sound
 * - Spectral Flux: rate of spectral change (onset detection)
 * - RMS Energy: overall loudness
 * - Beat Detection: rhythm/tempo tracking
 * - Zero Crossing Rate: percussiveness indicator
 * - Spectral Rolloff: frequency distribution
 * - Chroma Features: pitch class detection (12 notes)
 */

// Configuration
const SAMPLE_RATE = 44100; // Assumed sample rate
const FFT_SIZE = 2048;
const BIN_COUNT = FFT_SIZE / 2;
const HZ_PER_BIN = SAMPLE_RATE / FFT_SIZE; // ~21.5 Hz per bin

// State for temporal analysis
let previousSpectrum = null;
let previousRMS = 0;
let previousSpectralCentroid = 0;
let previousSpectralFlux = 0;

// Beat detection state
const beatHistory = [];
const BEAT_HISTORY_LENGTH = 43; // ~0.7 seconds at 60fps
let beatThreshold = 0.3;
let lastBeatTime = 0;
const MIN_BEAT_INTERVAL = 200; // ms between beats (300 BPM max)

// Onset detection state
let onsetHistory = [];
const ONSET_HISTORY_LENGTH = 10;
let onsetThreshold = 0.15;
// Pre-allocated sorted buffer for onset detection (avoids allocation per frame)
let onsetSortBuffer = new Float32Array(ONSET_HISTORY_LENGTH);

// Pre-allocated chroma buffer (avoids allocation per frame)
const chromaBuffer = new Float32Array(12);

// Smoothing factors
const SMOOTHING = {
  spectralCentroid: 0.7,
  spectralFlux: 0.5,
  rms: 0.6,
  beat: 0.3,
  zcr: 0.7,
  rolloff: 0.7,
};

/**
 * Calculate Spectral Centroid
 * Represents the "center of mass" of the spectrum - higher = brighter sound
 * @param {Uint8Array} frequencyData - FFT frequency data (0-255)
 * @returns {number} Normalized spectral centroid (0-1)
 */
export const calculateSpectralCentroid = (frequencyData) => {
  if (!frequencyData || frequencyData.length === 0) return 0;

  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const magnitude = frequencyData[i];
    const frequency = i * HZ_PER_BIN;
    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  if (magnitudeSum === 0) return 0;

  const centroid = weightedSum / magnitudeSum;
  // Normalize to 0-1 (max frequency is ~22kHz)
  const normalized = Math.min(centroid / 8000, 1.0);
  
  // Apply smoothing
  const smoothed = previousSpectralCentroid * SMOOTHING.spectralCentroid + 
                   normalized * (1 - SMOOTHING.spectralCentroid);
  previousSpectralCentroid = smoothed;
  
  return smoothed;
};

/**
 * Calculate Spectral Flux
 * Measures the rate of change in spectral energy - useful for onset detection
 * @param {Uint8Array} frequencyData - FFT frequency data
 * @returns {number} Normalized spectral flux (0-1)
 */
export const calculateSpectralFlux = (frequencyData) => {
  if (!frequencyData || frequencyData.length === 0) return 0;

  // Initialize previous spectrum if needed
  if (!previousSpectrum || previousSpectrum.length !== frequencyData.length) {
    previousSpectrum = new Float32Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      previousSpectrum[i] = frequencyData[i];
    }
    return 0;
  }

  let flux = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const diff = frequencyData[i] - previousSpectrum[i];
    // Only count positive changes (energy increases)
    if (diff > 0) {
      flux += diff;
    }
    previousSpectrum[i] = frequencyData[i];
  }

  // Normalize
  const normalized = Math.min(flux / 10000, 1.0);
  
  // Apply smoothing
  const smoothed = previousSpectralFlux * SMOOTHING.spectralFlux + 
                   normalized * (1 - SMOOTHING.spectralFlux);
  previousSpectralFlux = smoothed;
  
  return smoothed;
};

/**
 * Calculate RMS (Root Mean Square) Energy
 * Represents the overall loudness/energy of the signal
 * @param {Uint8Array} frequencyData - FFT frequency data
 * @returns {number} Normalized RMS energy (0-1)
 */
export const calculateRMS = (frequencyData) => {
  if (!frequencyData || frequencyData.length === 0) return 0;

  let sumSquares = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    const normalized = frequencyData[i] / 255;
    sumSquares += normalized * normalized;
  }

  const rms = Math.sqrt(sumSquares / frequencyData.length);
  
  // Apply smoothing
  const smoothed = previousRMS * SMOOTHING.rms + rms * (1 - SMOOTHING.rms);
  previousRMS = smoothed;
  
  return smoothed;
};

/**
 * Detect beats based on energy peaks in bass frequencies
 * Uses adaptive threshold based on recent history
 * @param {Uint8Array} frequencyData - FFT frequency data
 * @param {number} sensitivity - Beat detection sensitivity (0.5-2.0)
 * @returns {Object} { isBeat: boolean, beatIntensity: number, bpm: number }
 */
export const detectBeat = (frequencyData, sensitivity = 1.0) => {
  if (!frequencyData || frequencyData.length === 0) {
    return { isBeat: false, beatIntensity: 0, bpm: 0 };
  }

  // Focus on bass frequencies (0-200 Hz, roughly first 10 bins)
  let bassEnergy = 0;
  const bassEnd = Math.min(12, frequencyData.length);
  for (let i = 0; i < bassEnd; i++) {
    bassEnergy += frequencyData[i];
  }
  bassEnergy /= bassEnd;
  bassEnergy /= 255; // Normalize

  // Add to history
  beatHistory.push(bassEnergy);
  if (beatHistory.length > BEAT_HISTORY_LENGTH) {
    beatHistory.shift();
  }

  // Calculate average and variance of history
  let avg = 0;
  for (let i = 0; i < beatHistory.length; i++) {
    avg += beatHistory[i];
  }
  avg /= beatHistory.length;

  let variance = 0;
  for (let i = 0; i < beatHistory.length; i++) {
    const diff = beatHistory[i] - avg;
    variance += diff * diff;
  }
  variance /= beatHistory.length;

  // Adaptive threshold: mean + C * variance
  // Higher variance = more dynamic music = lower C needed
  const C = 1.5 / sensitivity;
  beatThreshold = avg + C * Math.sqrt(variance);
  beatThreshold = Math.max(beatThreshold, 0.15); // Minimum threshold

  // Detect beat
  const now = performance.now();
  const timeSinceLastBeat = now - lastBeatTime;
  const isBeat = bassEnergy > beatThreshold && 
                 timeSinceLastBeat > MIN_BEAT_INTERVAL;

  if (isBeat) {
    lastBeatTime = now;
  }

  // Calculate approximate BPM from beat history
  let bpm = 0;
  if (beatHistory.length >= BEAT_HISTORY_LENGTH) {
    // Count peaks in history
    let peakCount = 0;
    for (let i = 1; i < beatHistory.length - 1; i++) {
      if (beatHistory[i] > beatHistory[i-1] && 
          beatHistory[i] > beatHistory[i+1] &&
          beatHistory[i] > avg) {
        peakCount++;
      }
    }
    // Estimate BPM (history is ~0.7s)
    bpm = Math.round((peakCount / 0.7) * 60);
    bpm = Math.min(Math.max(bpm, 60), 200); // Clamp to reasonable range
  }

  // Beat intensity: how much above threshold
  const beatIntensity = isBeat ? Math.min((bassEnergy - beatThreshold) / 0.3, 1.0) : 0;

  return {
    isBeat,
    beatIntensity,
    bpm,
    bassEnergy,
    threshold: beatThreshold,
  };
};

/**
 * Detect onsets (note attacks, transients)
 * More sensitive than beat detection, catches individual notes
 * Uses insertion sort on pre-allocated buffer to avoid allocations
 * @param {number} spectralFlux - Current spectral flux value
 * @param {number} sensitivity - Detection sensitivity (0.5-2.0)
 * @returns {Object} { isOnset: boolean, onsetIntensity: number }
 */
export const detectOnset = (spectralFlux, sensitivity = 1.0) => {
  onsetHistory.push(spectralFlux);
  if (onsetHistory.length > ONSET_HISTORY_LENGTH) {
    onsetHistory.shift();
  }

  // Calculate median using pre-allocated buffer with insertion sort
  // This avoids creating new arrays every frame
  const len = onsetHistory.length;
  for (let i = 0; i < len; i++) {
    onsetSortBuffer[i] = onsetHistory[i];
  }
  
  // Insertion sort (faster for small arrays, no allocation)
  for (let i = 1; i < len; i++) {
    const key = onsetSortBuffer[i];
    let j = i - 1;
    while (j >= 0 && onsetSortBuffer[j] > key) {
      onsetSortBuffer[j + 1] = onsetSortBuffer[j];
      j--;
    }
    onsetSortBuffer[j + 1] = key;
  }
  
  const median = onsetSortBuffer[Math.floor(len / 2)];

  // Adaptive threshold
  const threshold = median * (1.5 / sensitivity) + 0.05;
  
  const isOnset = spectralFlux > threshold && spectralFlux > onsetThreshold;
  const onsetIntensity = isOnset ? Math.min((spectralFlux - threshold) / 0.2, 1.0) : 0;

  return { isOnset, onsetIntensity };
};

/**
 * Calculate Zero Crossing Rate (approximation from frequency data)
 * Higher values indicate more percussive/noisy sounds
 * @param {Uint8Array} frequencyData - FFT frequency data
 * @returns {number} Normalized ZCR indicator (0-1)
 */
export const calculateZeroCrossingRate = (frequencyData) => {
  if (!frequencyData || frequencyData.length === 0) return 0;

  // Approximate ZCR from high frequency content ratio
  // High ZCR = more high frequency energy relative to total
  let totalEnergy = 0;
  let highEnergy = 0;
  const highStart = Math.floor(frequencyData.length * 0.5);

  for (let i = 0; i < frequencyData.length; i++) {
    totalEnergy += frequencyData[i];
    if (i >= highStart) {
      highEnergy += frequencyData[i];
    }
  }

  if (totalEnergy === 0) return 0;

  const zcr = highEnergy / totalEnergy;
  return zcr;
};

/**
 * Calculate Spectral Rolloff
 * Frequency below which X% of spectral energy is contained
 * Lower = warmer sound, Higher = brighter sound
 * @param {Uint8Array} frequencyData - FFT frequency data
 * @param {number} rolloffPercent - Percentage threshold (default 0.85)
 * @returns {number} Normalized rolloff frequency (0-1)
 */
export const calculateSpectralRolloff = (frequencyData, rolloffPercent = 0.85) => {
  if (!frequencyData || frequencyData.length === 0) return 0;

  let totalEnergy = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    totalEnergy += frequencyData[i];
  }

  if (totalEnergy === 0) return 0;

  const threshold = totalEnergy * rolloffPercent;
  let cumulativeEnergy = 0;
  let rolloffBin = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    cumulativeEnergy += frequencyData[i];
    if (cumulativeEnergy >= threshold) {
      rolloffBin = i;
      break;
    }
  }

  // Normalize to 0-1
  return rolloffBin / frequencyData.length;
};

/**
 * Calculate Chroma Features (12-note pitch class energy)
 * Maps all frequencies to their corresponding pitch class (C, C#, D, etc.)
 * Uses pre-allocated buffer to avoid per-frame allocations
 * @param {Uint8Array} frequencyData - FFT frequency data
 * @returns {Float32Array} 12-element array with energy for each pitch class
 */
export const calculateChromaFeatures = (frequencyData) => {
  // Reset pre-allocated buffer
  chromaBuffer.fill(0);
  
  if (!frequencyData || frequencyData.length === 0) {
    return chromaBuffer;
  }

  // For each frequency bin, determine which pitch class it belongs to
  for (let i = 1; i < frequencyData.length; i++) {
    const frequency = i * HZ_PER_BIN;
    
    // Skip very low frequencies (< 60 Hz) and very high (> 5000 Hz)
    if (frequency < 60 || frequency > 5000) continue;

    // Convert frequency to MIDI note number
    const midiNote = 12 * Math.log2(frequency / 440) + 69;
    
    // Get pitch class (0-11, where 0=C, 1=C#, etc.)
    const pitchClass = Math.round(midiNote) % 12;
    
    // Add energy to this pitch class
    if (pitchClass >= 0 && pitchClass < 12) {
      chromaBuffer[pitchClass] += frequencyData[i];
    }
  }

  // Normalize chroma vector
  let maxChroma = 0;
  for (let i = 0; i < 12; i++) {
    if (chromaBuffer[i] > maxChroma) maxChroma = chromaBuffer[i];
  }
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) {
      chromaBuffer[i] /= maxChroma;
    }
  }

  return chromaBuffer;
};

/**
 * Get the dominant pitch class from chroma features
 * @param {Float32Array} chroma - 12-element chroma array
 * @returns {Object} { pitchClass: number, noteName: string, strength: number }
 */
export const getDominantPitch = (chroma) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  let maxIndex = 0;
  let maxValue = 0;
  
  for (let i = 0; i < 12; i++) {
    if (chroma[i] > maxValue) {
      maxValue = chroma[i];
      maxIndex = i;
    }
  }

  return {
    pitchClass: maxIndex,
    noteName: noteNames[maxIndex],
    strength: maxValue,
  };
};

/**
 * Calculate all advanced audio metrics at once
 * Optimized to avoid redundant calculations
 * @param {Uint8Array} frequencyData - FFT frequency data
 * @param {Object} options - Analysis options
 * @returns {Object} All audio metrics
 */
export const analyzeAudio = (frequencyData, options = {}) => {
  const {
    beatSensitivity = 1.0,
    onsetSensitivity = 1.0,
    enableChroma = false, // Chroma is expensive, disabled by default
  } = options;

  // Calculate base metrics
  const spectralCentroid = calculateSpectralCentroid(frequencyData);
  const spectralFlux = calculateSpectralFlux(frequencyData);
  const rms = calculateRMS(frequencyData);
  const spectralRolloff = calculateSpectralRolloff(frequencyData);
  const zeroCrossingRate = calculateZeroCrossingRate(frequencyData);

  // Beat and onset detection
  const beatInfo = detectBeat(frequencyData, beatSensitivity);
  const onsetInfo = detectOnset(spectralFlux, onsetSensitivity);

  // Optional chroma
  let chroma = null;
  let dominantPitch = null;
  if (enableChroma) {
    chroma = calculateChromaFeatures(frequencyData);
    dominantPitch = getDominantPitch(chroma);
  }

  return {
    // Spectral features
    spectralCentroid,      // 0-1, brightness
    spectralFlux,          // 0-1, rate of change
    spectralRolloff,       // 0-1, frequency distribution
    zeroCrossingRate,      // 0-1, percussiveness
    
    // Energy
    rms,                   // 0-1, overall loudness
    
    // Rhythm
    isBeat: beatInfo.isBeat,
    beatIntensity: beatInfo.beatIntensity,
    bpm: beatInfo.bpm,
    bassEnergy: beatInfo.bassEnergy,
    
    // Onsets
    isOnset: onsetInfo.isOnset,
    onsetIntensity: onsetInfo.onsetIntensity,
    
    // Pitch (optional)
    chroma,
    dominantPitch,
  };
};

/**
 * Reset all analysis state
 * Call when audio changes or stops
 */
export const resetAdvancedAnalysis = () => {
  previousSpectrum = null;
  previousRMS = 0;
  previousSpectralCentroid = 0;
  previousSpectralFlux = 0;
  beatHistory.length = 0;
  onsetHistory.length = 0;
  lastBeatTime = 0;
};

/**
 * Map spectral centroid to a color temperature
 * Low centroid = warm colors (red/orange), High = cool colors (blue/purple)
 * @param {number} centroid - Normalized spectral centroid (0-1)
 * @returns {Array} RGB color array [r, g, b] (0-1)
 */
export const centroidToColor = (centroid) => {
  // Color gradient: warm (low centroid) -> cool (high centroid)
  // Red -> Orange -> Yellow -> Cyan -> Blue -> Purple
  
  if (centroid < 0.2) {
    // Red to Orange
    const t = centroid / 0.2;
    return [1.0, 0.3 * t, 0.0];
  } else if (centroid < 0.4) {
    // Orange to Yellow
    const t = (centroid - 0.2) / 0.2;
    return [1.0, 0.3 + 0.7 * t, 0.0];
  } else if (centroid < 0.6) {
    // Yellow to Cyan
    const t = (centroid - 0.4) / 0.2;
    return [1.0 - t, 1.0, t];
  } else if (centroid < 0.8) {
    // Cyan to Blue
    const t = (centroid - 0.6) / 0.2;
    return [0.0, 1.0 - 0.5 * t, 1.0];
  } else {
    // Blue to Purple
    const t = (centroid - 0.8) / 0.2;
    return [0.5 * t, 0.5 - 0.3 * t, 1.0];
  }
};

/**
 * Map pitch class to a color (chromatic circle)
 * @param {number} pitchClass - 0-11 pitch class
 * @returns {Array} RGB color array [r, g, b] (0-1)
 */
export const pitchClassToColor = (pitchClass) => {
  // Map 12 pitch classes to hue values
  const hue = (pitchClass / 12) * 360;
  return hslToRgb(hue, 0.8, 0.6);
};

/**
 * HSL to RGB conversion helper
 */
const hslToRgb = (h, s, l) => {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r, g, b];
};

export default {
  calculateSpectralCentroid,
  calculateSpectralFlux,
  calculateRMS,
  detectBeat,
  detectOnset,
  calculateZeroCrossingRate,
  calculateSpectralRolloff,
  calculateChromaFeatures,
  getDominantPitch,
  analyzeAudio,
  resetAdvancedAnalysis,
  centroidToColor,
  pitchClassToColor,
};
