/**
 * Performance monitoring utilities
 * Tracks FPS and provides adaptive quality settings
 * Supports automatic low power mode with manual override
 */

// Low power mode thresholds
const LOW_POWER_THRESHOLDS = {
  fps: 35,                    // Enable low power if avg FPS drops below this
  fpsRecovery: 50,            // Disable low power if avg FPS rises above this
  consecutiveFrames: 5,       // Frames below threshold before enabling
};

// Quality presets for low power mode
const QUALITY_PRESETS = {
  high: {
    particleCount: 15000,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    trails: true,
    connections: true,
  },
  medium: {
    particleCount: 10000,
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    trails: true,
    connections: true,
  },
  low: {
    particleCount: 5000,
    pixelRatio: 1,
    trails: false,
    connections: false,
  },
  veryLow: {
    particleCount: 3000,
    pixelRatio: 1,
    trails: false,
    connections: false,
  },
};

class PerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.historySize = 60; // Store last 60 fps readings
    this.updateInterval = 1000; // Update every second
    this.callbacks = [];
    
    // Low power mode state
    this.lowPowerMode = false;
    this.lowPowerForced = false; // Manual override
    this.lowFrameCount = 0; // Consecutive low FPS frames
    this.qualityLevel = 'high';
    this.lowPowerCallbacks = [];
    
    // Auto-adaptation enabled by default
    this.autoAdapt = true;
  }

  /**
   * Start monitoring performance
   */
  start() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.update();
  }

  /**
   * Update FPS calculation
   */
  update() {
    this.frameCount++;

    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= this.updateInterval) {
      // Calculate FPS
      this.fps = Math.round((this.frameCount * 1000) / elapsed);

      // Add to history
      this.fpsHistory.push(this.fps);
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift();
      }

      // Check for auto-adaptation
      if (this.autoAdapt && !this.lowPowerForced) {
        this._checkAdaptation();
      }

      // Notify callbacks
      this.callbacks.forEach((callback) => callback(this.fps));

      // Reset counters
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.update());
  }

  /**
   * Check if we need to adapt quality based on FPS
   * @private
   */
  _checkAdaptation() {
    const avgFPS = this.getAverageFPS();
    
    if (avgFPS < LOW_POWER_THRESHOLDS.fps) {
      this.lowFrameCount++;
      if (this.lowFrameCount >= LOW_POWER_THRESHOLDS.consecutiveFrames && !this.lowPowerMode) {
        this._enableLowPowerMode();
      }
    } else if (avgFPS > LOW_POWER_THRESHOLDS.fpsRecovery) {
      this.lowFrameCount = 0;
      if (this.lowPowerMode && !this.lowPowerForced) {
        this._disableLowPowerMode();
      }
    }
  }

  /**
   * Enable low power mode
   * @private
   */
  _enableLowPowerMode() {
    this.lowPowerMode = true;
    this.qualityLevel = 'low';
    console.log('[PerformanceMonitor] Low power mode enabled (auto)');
    this._notifyLowPowerChange();
  }

  /**
   * Disable low power mode
   * @private
   */
  _disableLowPowerMode() {
    this.lowPowerMode = false;
    this.qualityLevel = 'high';
    console.log('[PerformanceMonitor] Low power mode disabled (auto)');
    this._notifyLowPowerChange();
  }

  /**
   * Notify low power mode callbacks
   * @private
   */
  _notifyLowPowerChange() {
    const settings = this.getQualitySettings();
    this.lowPowerCallbacks.forEach((callback) => callback(this.lowPowerMode, settings));
  }

  /**
   * Force low power mode on/off (manual override)
   * @param {boolean} enabled - Whether to force low power mode
   */
  setLowPowerMode(enabled) {
    this.lowPowerForced = enabled;
    this.lowPowerMode = enabled;
    this.qualityLevel = enabled ? 'low' : 'high';
    console.log(`[PerformanceMonitor] Low power mode ${enabled ? 'forced on' : 'forced off'}`);
    this._notifyLowPowerChange();
  }

  /**
   * Toggle low power mode
   * @returns {boolean} New low power mode state
   */
  toggleLowPowerMode() {
    this.setLowPowerMode(!this.lowPowerMode);
    return this.lowPowerMode;
  }

  /**
   * Check if low power mode is active
   * @returns {boolean}
   */
  isLowPowerMode() {
    return this.lowPowerMode;
  }

  /**
   * Check if low power mode was forced by user
   * @returns {boolean}
   */
  isLowPowerForced() {
    return this.lowPowerForced;
  }

  /**
   * Enable/disable auto adaptation
   * @param {boolean} enabled
   */
  setAutoAdapt(enabled) {
    this.autoAdapt = enabled;
  }

  /**
   * Get current quality settings based on performance
   * @returns {Object} Quality settings
   */
  getQualitySettings() {
    return { ...QUALITY_PRESETS[this.qualityLevel] };
  }

  /**
   * Subscribe to low power mode changes
   * @param {Function} callback - Callback function (receives isLowPower and settings)
   */
  onLowPowerChange(callback) {
    this.lowPowerCallbacks.push(callback);
  }

  /**
   * Unsubscribe from low power mode changes
   * @param {Function} callback
   */
  offLowPowerChange(callback) {
    this.lowPowerCallbacks = this.lowPowerCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.fps;
  }

  /**
   * Get average FPS over history
   * @returns {number} Average FPS
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 60;

    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  /**
   * Get minimum FPS from history
   * @returns {number} Minimum FPS
   */
  getMinFPS() {
    if (this.fpsHistory.length === 0) return 60;
    return Math.min(...this.fpsHistory);
  }

  /**
   * Check if performance is good
   * @param {number} threshold - FPS threshold (default: 45)
   * @returns {boolean}
   */
  isPerformanceGood(threshold = 45) {
    return this.getAverageFPS() >= threshold;
  }

  /**
   * Get recommended particle count based on performance
   * @returns {number} Recommended particle count
   */
  getRecommendedParticleCount() {
    const avgFPS = this.getAverageFPS();

    if (avgFPS >= 55) {
      return 15000; // High quality
    } else if (avgFPS >= 45) {
      return 10000; // Medium quality
    } else if (avgFPS >= 30) {
      return 5000; // Low quality
    } else {
      return 3000; // Very low quality
    }
  }

  /**
   * Subscribe to FPS updates
   * @param {Function} callback - Callback function (receives FPS as parameter)
   */
  onUpdate(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Unsubscribe from FPS updates
   * @param {Function} callback - Callback to remove
   */
  offUpdate(callback) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  /**
   * Reset monitoring
   */
  reset() {
    this.fps = 60;
    this.frameCount = 0;
    this.fpsHistory = [];
    this.lastTime = performance.now();
    this.lowFrameCount = 0;
    // Don't reset lowPowerForced - user preference persists
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
