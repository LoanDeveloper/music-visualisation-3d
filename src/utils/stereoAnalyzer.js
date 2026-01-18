/**
 * Stereo Audio Analysis Module
 * 
 * Provides stereo-specific audio analysis:
 * - Left/Right channel separation
 * - Stereo Width (difference between L and R)
 * - Panning Detection (where sound is positioned)
 * - Mid/Side Analysis (center vs sides)
 * - Phase Correlation (coherence between channels)
 */

// Smoothing state for stereo metrics
let previousStereoWidth = 0;
let previousPanning = 0;
let previousPhaseCorrelation = 1;
let previousMidEnergy = 0;
let previousSideEnergy = 0;

// Smoothing factors
const STEREO_SMOOTHING = 0.7;

/**
 * Calculate stereo width from L/R frequency data
 * 0 = mono (identical channels), 1 = full stereo (completely different)
 * @param {Uint8Array} leftData - Left channel frequency data
 * @param {Uint8Array} rightData - Right channel frequency data
 * @returns {number} Stereo width (0-1)
 */
export const calculateStereoWidth = (leftData, rightData) => {
  if (!leftData || !rightData || leftData.length === 0) return 0;
  
  const len = Math.min(leftData.length, rightData.length);
  let diffSum = 0;
  let totalSum = 0;
  
  for (let i = 0; i < len; i++) {
    const diff = Math.abs(leftData[i] - rightData[i]);
    const total = leftData[i] + rightData[i];
    diffSum += diff;
    totalSum += total;
  }
  
  if (totalSum === 0) return 0;
  
  // Normalize: difference as proportion of total
  const width = (diffSum / totalSum) * 2; // Scale to 0-1 range
  const normalized = Math.min(width, 1.0);
  
  // Apply smoothing
  const smoothed = previousStereoWidth * STEREO_SMOOTHING + normalized * (1 - STEREO_SMOOTHING);
  previousStereoWidth = smoothed;
  
  return smoothed;
};

/**
 * Calculate panning position from L/R frequency data
 * -1 = full left, 0 = center, +1 = full right
 * @param {Uint8Array} leftData - Left channel frequency data
 * @param {Uint8Array} rightData - Right channel frequency data
 * @returns {number} Panning position (-1 to +1)
 */
export const calculatePanning = (leftData, rightData) => {
  if (!leftData || !rightData || leftData.length === 0) return 0;
  
  const len = Math.min(leftData.length, rightData.length);
  let leftSum = 0;
  let rightSum = 0;
  
  for (let i = 0; i < len; i++) {
    leftSum += leftData[i];
    rightSum += rightData[i];
  }
  
  const total = leftSum + rightSum;
  if (total === 0) return 0;
  
  // Calculate balance: (R - L) / (R + L)
  const panning = (rightSum - leftSum) / total;
  
  // Apply smoothing
  const smoothed = previousPanning * STEREO_SMOOTHING + panning * (1 - STEREO_SMOOTHING);
  previousPanning = smoothed;
  
  return smoothed;
};

/**
 * Calculate Mid/Side energy
 * Mid = (L + R) / 2 = center content
 * Side = (L - R) / 2 = stereo content
 * @param {Uint8Array} leftData - Left channel frequency data
 * @param {Uint8Array} rightData - Right channel frequency data
 * @returns {Object} { mid: number, side: number, ratio: number }
 */
export const calculateMidSide = (leftData, rightData) => {
  if (!leftData || !rightData || leftData.length === 0) {
    return { mid: 0, side: 0, ratio: 0.5 };
  }
  
  const len = Math.min(leftData.length, rightData.length);
  let midSum = 0;
  let sideSum = 0;
  
  for (let i = 0; i < len; i++) {
    // Mid = average of L and R
    midSum += (leftData[i] + rightData[i]) / 2;
    // Side = absolute difference
    sideSum += Math.abs(leftData[i] - rightData[i]) / 2;
  }
  
  // Normalize to 0-1
  const midNorm = (midSum / len) / 255;
  const sideNorm = (sideSum / len) / 255;
  
  // Apply smoothing
  const midSmoothed = previousMidEnergy * STEREO_SMOOTHING + midNorm * (1 - STEREO_SMOOTHING);
  const sideSmoothed = previousSideEnergy * STEREO_SMOOTHING + sideNorm * (1 - STEREO_SMOOTHING);
  previousMidEnergy = midSmoothed;
  previousSideEnergy = sideSmoothed;
  
  // Ratio: how much is side vs mid (0 = all mid/mono, 1 = all side/stereo)
  const total = midSmoothed + sideSmoothed;
  const ratio = total > 0 ? sideSmoothed / total : 0;
  
  return {
    mid: midSmoothed,
    side: sideSmoothed,
    ratio: ratio,
  };
};

/**
 * Calculate phase correlation between L and R channels
 * +1 = perfectly in phase (mono compatible)
 * 0 = uncorrelated (stereo)
 * -1 = out of phase (phase issues)
 * @param {Uint8Array} leftData - Left channel frequency data
 * @param {Uint8Array} rightData - Right channel frequency data
 * @returns {number} Phase correlation (-1 to +1)
 */
export const calculatePhaseCorrelation = (leftData, rightData) => {
  if (!leftData || !rightData || leftData.length === 0) return 1;
  
  const len = Math.min(leftData.length, rightData.length);
  
  // Calculate means
  let leftMean = 0, rightMean = 0;
  for (let i = 0; i < len; i++) {
    leftMean += leftData[i];
    rightMean += rightData[i];
  }
  leftMean /= len;
  rightMean /= len;
  
  // Calculate correlation coefficient
  let numerator = 0;
  let leftVar = 0;
  let rightVar = 0;
  
  for (let i = 0; i < len; i++) {
    const leftDiff = leftData[i] - leftMean;
    const rightDiff = rightData[i] - rightMean;
    numerator += leftDiff * rightDiff;
    leftVar += leftDiff * leftDiff;
    rightVar += rightDiff * rightDiff;
  }
  
  const denominator = Math.sqrt(leftVar * rightVar);
  if (denominator === 0) return 1;
  
  const correlation = numerator / denominator;
  
  // Apply smoothing (less smoothing for phase to be more responsive)
  const smoothed = previousPhaseCorrelation * 0.5 + correlation * 0.5;
  previousPhaseCorrelation = smoothed;
  
  return smoothed;
};

/**
 * Get frequency bands for a single channel
 * @param {Uint8Array} channelData - Channel frequency data
 * @returns {Object} { bass, mid, high }
 */
export const getChannelBands = (channelData) => {
  if (!channelData || channelData.length === 0) {
    return { bass: 0, mid: 0, high: 0 };
  }
  
  const len = channelData.length;
  
  // Band boundaries (assuming 1024 bins)
  const bassEnd = Math.floor(len * 0.08);   // ~0-250 Hz
  const midEnd = Math.floor(len * 0.5);     // ~250-4000 Hz
  
  let bassSum = 0, midSum = 0, highSum = 0;
  let bassCount = 0, midCount = 0, highCount = 0;
  
  for (let i = 0; i < len; i++) {
    if (i < bassEnd) {
      bassSum += channelData[i];
      bassCount++;
    } else if (i < midEnd) {
      midSum += channelData[i];
      midCount++;
    } else {
      highSum += channelData[i];
      highCount++;
    }
  }
  
  return {
    bass: bassCount > 0 ? (bassSum / bassCount) / 255 : 0,
    mid: midCount > 0 ? (midSum / midCount) / 255 : 0,
    high: highCount > 0 ? (highSum / highCount) / 255 : 0,
  };
};

/**
 * Perform complete stereo analysis
 * @param {Uint8Array} leftData - Left channel frequency data
 * @param {Uint8Array} rightData - Right channel frequency data
 * @param {boolean} enabled - Whether stereo analysis is enabled
 * @returns {Object} Complete stereo analysis results
 */
export const analyzeStereo = (leftData, rightData, enabled = true) => {
  // If disabled or no data, return mono defaults
  if (!enabled || !leftData || !rightData || leftData.length === 0) {
    return {
      stereoEnabled: false,
      stereoWidth: 0,
      panning: 0,
      phaseCorrelation: 1,
      mid: 0,
      side: 0,
      midSideRatio: 0,
      left: { bass: 0, mid: 0, high: 0 },
      right: { bass: 0, mid: 0, high: 0 },
    };
  }
  
  // Calculate all stereo metrics
  const stereoWidth = calculateStereoWidth(leftData, rightData);
  const panning = calculatePanning(leftData, rightData);
  const phaseCorrelation = calculatePhaseCorrelation(leftData, rightData);
  const midSide = calculateMidSide(leftData, rightData);
  
  // Get per-channel frequency bands
  const leftBands = getChannelBands(leftData);
  const rightBands = getChannelBands(rightData);
  
  return {
    stereoEnabled: true,
    stereoWidth,                    // 0-1: mono to full stereo
    panning,                        // -1 to +1: left to right
    phaseCorrelation,              // -1 to +1: out of phase to in phase
    mid: midSide.mid,              // 0-1: center content energy
    side: midSide.side,            // 0-1: side content energy
    midSideRatio: midSide.ratio,   // 0-1: how much is stereo vs mono
    left: leftBands,               // { bass, mid, high } for left channel
    right: rightBands,             // { bass, mid, high } for right channel
  };
};

/**
 * Reset stereo analysis state
 */
export const resetStereoAnalysis = () => {
  previousStereoWidth = 0;
  previousPanning = 0;
  previousPhaseCorrelation = 1;
  previousMidEnergy = 0;
  previousSideEnergy = 0;
};

export default {
  calculateStereoWidth,
  calculatePanning,
  calculateMidSide,
  calculatePhaseCorrelation,
  getChannelBands,
  analyzeStereo,
  resetStereoAnalysis,
};
