/**
 * Performance monitoring utilities
 * Tracks FPS and provides adaptive quality settings
 */

class PerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.historySize = 60; // Store last 60 fps readings
    this.updateInterval = 1000; // Update every second
    this.callbacks = [];
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

      // Notify callbacks
      this.callbacks.forEach((callback) => callback(this.fps));

      // Reset counters
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.update());
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
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
