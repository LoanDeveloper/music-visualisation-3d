/**
 * Platform detection utilities for cross-platform audio optimization
 */

export const platform = {
  // Operating System detection
  os: (() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('linux')) return 'linux';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('win')) return 'windows';
    return 'unknown';
  })(),
  
  // Browser detection
  browser: (() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'unknown';
  })(),
  
  // Audio backend detection
  audioBackend: (() => {
    // Try to detect the audio backend
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return 'none';
    
    try {
      const ctx = new AudioContext();
      const backend = ctx.baseLatency ? 'web-audio-api' : 'fallback';
      ctx.close();
      return backend;
    } catch {
      return 'none';
    }
  })(),
  
  // Check if running on a problematic combination
  isProblematicPlatform: () => {
    return (
      (platform.os === 'linux' && platform.browser === 'firefox') ||
      (platform.os === 'linux' && platform.audioBackend === 'none')
    );
  },
  
  // Get platform-specific audio settings
  getAudioSettings: () => {
    const baseSettings = {
      bufferSize: 2048,
      smoothingTimeConstant: 0.8,
      fftSize: 2048,
      maxAnalysisRate: 60, // Hz
      autoRecovery: false,
      useFallback: false,
    };
    
    // Linux-specific optimizations
    if (platform.os === 'linux') {
      return {
        ...baseSettings,
        bufferSize: 1024, // Smaller buffer for Linux
        smoothingTimeConstant: 0.6, // More responsive
        maxAnalysisRate: 30, // Reduce CPU load
        autoRecovery: true, // Enable auto-recovery
        useFallback: platform.isProblematicPlatform(),
      };
    }
    
    // macOS optimizations
    if (platform.os === 'macos') {
      return {
        ...baseSettings,
        bufferSize: 4096, // Larger buffer for smoother audio
        smoothingTimeConstant: 0.9,
        maxAnalysisRate: 60,
        autoRecovery: false,
        useFallback: false,
      };
    }
    
    // Windows optimizations
    if (platform.os === 'windows') {
      return {
        ...baseSettings,
        bufferSize: 2048,
        smoothingTimeConstant: 0.8,
        maxAnalysisRate: 60,
        autoRecovery: true, // Windows can have audio issues
        useFallback: false,
      };
    }
    
    return baseSettings;
  },
  
  // Log platform info
  logInfo: () => {
    console.log('[Platform] OS:', platform.os);
    console.log('[Platform] Browser:', platform.browser);
    console.log('[Platform] Audio Backend:', platform.audioBackend);
    console.log('[Platform] Is Problematic:', platform.isProblematicPlatform());
    console.log('[Platform] Audio Settings:', platform.getAudioSettings());
  },
};

export default platform;