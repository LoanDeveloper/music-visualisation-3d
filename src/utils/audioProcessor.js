// Audio processing utilities for FFT data analysis

// Frequency band indices for a 2048 FFT size (1024 frequency bins)
// Assuming sample rate of 44.1kHz (typical for audio)
// Each bin represents ~21.5 Hz (44100 / 2048)

const FREQUENCY_BANDS = {
  bass: { start: 0, end: 85 },        // ~20-250 Hz
  mid: { start: 85, end: 512 },       // ~250-4000 Hz
  high: { start: 512, end: 1024 },    // ~4000-20000 Hz
};

// Previous values for smoothing
let previousBass = 0;
let previousMid = 0;
let previousHigh = 0;

// Smoothing factor (0-1, higher = more smoothing)
const SMOOTHING = 0.7;

/**
 * Calculate average frequency value for a band
 * @param {Uint8Array} dataArray - FFT frequency data
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {number} Average value (0-255)
 */
const getAverageBand = (dataArray, start, end) => {
  let sum = 0;
  let count = 0;

  for (let i = start; i < end && i < dataArray.length; i++) {
    sum += dataArray[i];
    count++;
  }

  return count > 0 ? sum / count : 0;
};

/**
 * Apply exponential moving average smoothing
 * @param {number} current - Current value
 * @param {number} previous - Previous smoothed value
 * @param {number} factor - Smoothing factor (0-1)
 * @returns {number} Smoothed value
 */
const smooth = (current, previous, factor) => {
  return previous * factor + current * (1 - factor);
};

/**
 * Extract and process frequency bands from FFT data
 * @param {Uint8Array} dataArray - Raw FFT frequency data (0-255)
 * @returns {Object} Processed frequency bands with normalized values (0-1)
 */
export const getFrequencyBands = (dataArray) => {
  if (!dataArray || dataArray.length === 0) {
    return { bass: 0, mid: 0, high: 0 };
  }

  // Calculate raw averages for each band
  const rawBass = getAverageBand(dataArray, FREQUENCY_BANDS.bass.start, FREQUENCY_BANDS.bass.end);
  const rawMid = getAverageBand(dataArray, FREQUENCY_BANDS.mid.start, FREQUENCY_BANDS.mid.end);
  const rawHigh = getAverageBand(dataArray, FREQUENCY_BANDS.high.start, FREQUENCY_BANDS.high.end);

  // Normalize to 0-1 range (255 is max FFT value)
  const normalizedBass = rawBass / 255;
  const normalizedMid = rawMid / 255;
  const normalizedHigh = rawHigh / 255;

  // Apply smoothing
  previousBass = smooth(normalizedBass, previousBass, SMOOTHING);
  previousMid = smooth(normalizedMid, previousMid, SMOOTHING);
  previousHigh = smooth(normalizedHigh, previousHigh, SMOOTHING);

  return {
    bass: previousBass,
    mid: previousMid,
    high: previousHigh,
  };
};

/**
 * Get overall audio energy/intensity
 * @param {Uint8Array} dataArray - Raw FFT frequency data
 * @returns {number} Overall intensity (0-1)
 */
export const getOverallIntensity = (dataArray) => {
  if (!dataArray || dataArray.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }

  const average = sum / dataArray.length;
  return average / 255; // Normalize to 0-1
};

/**
 * Reset smoothing values (call when audio stops/changes)
 */
export const resetSmoothing = () => {
  previousBass = 0;
  previousMid = 0;
  previousHigh = 0;
};

/**
 * Get frequency data with enhanced bass response
 * Useful for making bass hits more prominent
 * @param {Uint8Array} dataArray - Raw FFT frequency data
 * @param {number} bassBoost - Bass boost multiplier (1.0 = no boost, 2.0 = double, etc.)
 * @returns {Object} Frequency bands with boosted bass
 */
export const getFrequencyBandsWithBassBoost = (dataArray, bassBoost = 1.5) => {
  const bands = getFrequencyBands(dataArray);

  return {
    ...bands,
    bass: Math.min(bands.bass * bassBoost, 1.0), // Clamp to 1.0
  };
};
