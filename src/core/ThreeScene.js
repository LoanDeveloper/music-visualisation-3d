import * as THREE from 'three';
import ParticleSystem from './ParticleSystem';
import CameraController from './CameraController';
import HumanLayer from './HumanLayer';
import { getPalette } from '../utils/colorPalettes';

/**
 * ThreeScene class
 * Manages the Three.js scene, renderer, camera, and all 3D objects
 */
class ThreeScene {
  constructor(canvas, paletteName = 'neon', visualSettings = {}) {
    this.canvas = canvas;
    this.palette = getPalette(paletteName);
    this.visualSettings = visualSettings;

    // Three.js core objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Custom objects
    this.particleSystem = null;
    this.cameraController = null;
    this.humanLayer = null;

    // Animation
    this.animationFrameId = null;
    this.isAnimating = false;

    // Audio data
    this.currentFrequencyBands = { bass: 0, mid: 0, high: 0 };

    this.initialize();
  }

  /**
   * Initialize the scene
   */
  initialize() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.palette.background);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 0, 300);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Add lighting
    this.addLighting();

    // Create particle system with settings
    const particleCount = this.visualSettings.particleCount || 10000;
    this.particleSystem = new ParticleSystem(this.scene, particleCount, this.palette, this.visualSettings);

    // Create camera controller
    this.cameraController = new CameraController(this.camera, this.canvas);

    // Create human layer (matrix vibe - lazy loaded on enable)
    this.humanLayer = new HumanLayer(this.scene);

    // Start animation loop
    this.startAnimation();

    console.log('ThreeScene initialized');
  }

  /**
   * Add lighting to the scene
   */
  addLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Point lights for depth
    const pointLight1 = new THREE.PointLight(0xffffff, 1, 500);
    pointLight1.position.set(100, 100, 100);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 500);
    pointLight2.position.set(-100, -100, -100);
    this.scene.add(pointLight2);
  }

  /**
   * Update frequency bands from audio analyzer
   * @param {Object} frequencyBands - { bass, mid, high }
   */
  updateFrequencyBands(frequencyBands) {
    this.currentFrequencyBands = frequencyBands;
    
    // Update human layer with frequency bands
    if (this.humanLayer) {
      this.humanLayer.updateFrequencyBands(
        frequencyBands.bass,
        frequencyBands.mid,
        frequencyBands.high
      );
    }
    
    // Log significant audio activity
    const total = frequencyBands.bass + frequencyBands.mid + frequencyBands.high;
    if (total > 0.1) {
      // Only log when there's actual audio
      this.lastLogTime = this.lastLogTime || 0;
      const now = Date.now();
      if (now - this.lastLogTime > 1000) {
        console.log('[ThreeScene] Receiving audio data:', frequencyBands);
        this.lastLogTime = now;
      }
    }
  }

  /**
   * Animation loop
   */
  animate = () => {
    if (!this.isAnimating) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    // Update camera controller
    if (this.cameraController) {
      this.cameraController.update();
    }

    // Update particle system with audio data
    if (this.particleSystem) {
      this.particleSystem.update(this.currentFrequencyBands);
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Start the animation loop
   */
  startAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  stopAnimation() {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.camera || !this.renderer || !this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Update theme/palette
   * @param {string} paletteName - Name of the palette
   */
  updatePalette(paletteName) {
    this.palette = getPalette(paletteName);

    // Update scene background
    this.scene.background = new THREE.Color(this.palette.background);

    // Update particle system theme
    if (this.particleSystem) {
      this.particleSystem.updateTheme(this.palette);
    }

    console.log(`Theme updated to: ${paletteName}`);
  }

/**
   * Set particle count for performance optimization
   * @param {number} count - Number of particles
   */
  setParticleCount(count) {
    if (this.particleSystem) {
      this.particleSystem.setParticleCount(count);
    }
  }

  /**
   * Update visualization settings
   * @param {Object} settings - New visualization settings
   */
  updateSettings(settings) {
    this.visualSettings = settings;

    if (this.particleSystem) {
      // Update particle count if changed
      if (settings.particleCount !== this.particleSystem.particleCount) {
        this.particleSystem.setParticleCount(settings.particleCount);
      }

      // Update other settings
      this.particleSystem.updateSettings(settings);
    }

    console.log('[ThreeScene] Settings updated:', settings);
  }

  /**
   * Enable/disable camera auto-rotation
   * @param {boolean} enabled
   */
  setAutoRotate(enabled) {
    if (this.cameraController) {
      this.cameraController.setAutoRotate(enabled);
    }
  }

  /**
   * Get current zoom level (0-1)
   * @returns {number}
   */
  getZoom() {
    if (this.cameraController) {
      return this.cameraController.getZoom();
    }
    return 0.5;
  }

  /**
   * Set zoom level (0-1)
   * @param {number} value
   */
  setZoom(value) {
    if (this.cameraController) {
      this.cameraController.setZoom(value);
    }
  }

  // ============ Human Layer Methods ============

  /**
   * Enable/disable human layer
   * @param {boolean} enabled
   * @returns {Promise<boolean>} - Success status
   */
  async setHumanLayerEnabled(enabled) {
    if (this.humanLayer) {
      return await this.humanLayer.setEnabled(enabled);
    }
    return false;
  }

  /**
   * Set human layer preset
   * @param {string} presetId - Preset ID from humanPresets
   */
  setHumanPreset(presetId) {
    if (this.humanLayer) {
      this.humanLayer.setPreset(presetId);
    }
  }

  /**
   * Set human layer pose
   * @param {string} poseId - 'open' or 'closed'
   */
  async setHumanPose(poseId) {
    if (this.humanLayer) {
      await this.humanLayer.setPose(poseId);
    }
  }

  /**
   * Get human layer state
   * @returns {object|null}
   */
  getHumanLayerState() {
    if (this.humanLayer) {
      return this.humanLayer.getState();
    }
    return null;
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Stop animation
    this.stopAnimation();

    // Destroy particle system
    if (this.particleSystem) {
      this.particleSystem.destroy();
      this.particleSystem = null;
    }

    // Destroy human layer
    if (this.humanLayer) {
      this.humanLayer.dispose();
      this.humanLayer = null;
    }

    // Destroy camera controller
    if (this.cameraController) {
      this.cameraController.destroy();
      this.cameraController = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    // Clear scene
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }

    this.camera = null;
    this.canvas = null;

    console.log('ThreeScene destroyed');
  }
}

export default ThreeScene;
