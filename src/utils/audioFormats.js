/**
 * Audio format utilities for cross-platform compatibility
 */

// Supported audio formats by platform
const platformFormats = {
  linux: ['audio/mp3', 'audio/ogg', 'audio/wav'],
  macos: ['audio/mp3', 'audio/m4a', 'audio/wav', 'audio/ogg'],
  windows: ['audio/mp3', 'audio/wav', 'audio/m4a'],
  unknown: ['audio/mp3', 'audio/wav', 'audio/ogg'],
};

// Format quality preferences (highest to lowest)
const formatPreferences = {
  linux: ['audio/ogg', 'audio/mp3', 'audio/wav'],
  macos: ['audio/m4a', 'audio/mp3', 'audio/wav'],
  windows: ['audio/m4a', 'audio/mp3', 'audio/wav'],
  unknown: ['audio/mp3', 'audio/wav', 'audio/ogg'],
};

/**
 * Get the best format for current platform
 */
export const getOptimalFormat = (os) => {
  const preferences = formatPreferences[os] || formatPreferences.unknown;
  return preferences[0]; // Return the most preferred format
};

/**
 * Check if a format is supported on current platform
 */
export const isFormatSupported = (mimeType, os) => {
  const supported = platformFormats[os] || platformFormats.unknown;
  return supported.includes(mimeType);
};

/**
 * Get all supported formats for a platform
 */
export const getSupportedFormats = (os) => {
  return platformFormats[os] || platformFormats.unknown;
};

/**
 * Convert audio to optimal format (placeholder for future implementation)
 */
export const convertToOptimalFormat = async (audioBlob, targetFormat) => {
  // This would require audio processing library like ffmpeg.wasm
  // For now, just return the original blob
  console.log('[AudioFormat] Converting to', targetFormat, '(not implemented yet)');
  return audioBlob;
};

/**
 * Get MIME type from file extension
 */
export const getMimeTypeFromExtension = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    mp3: 'audio/mp3',
    m4a: 'audio/m4a',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac',
  };
  return mimeTypes[ext] || 'audio/mp3';
};

/**
 * Validate audio file before processing
 */
export const validateAudioFile = async (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB max
  const minSize = 1024; // 1KB min
  
  if (file.size > maxSize) {
    throw new Error(`File too large: ${Math.round(file.size / 1024 / 1024)}MB (max: 50MB)`);
  }
  
  if (file.size < minSize) {
    throw new Error('File too small or empty');
  }
  
  // Check if file type is audio
  if (!file.type.startsWith('audio/')) {
    throw new Error(`Invalid file type: ${file.type} (must be audio)`);
  }
  
  return true;
};

export default {
  getOptimalFormat,
  isFormatSupported,
  getSupportedFormats,
  convertToOptimalFormat,
  getMimeTypeFromExtension,
  validateAudioFile,
};