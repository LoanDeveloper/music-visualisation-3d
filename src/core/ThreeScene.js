import * as THREE from 'three';
import ParticleSystem from './ParticleSystem';
import CameraController from './CameraController';
import { getPalette } from '../utils/colorPalettes';

/**
 * ThreeScene class
 * Manages the Three.js scene, renderer, camera, and all 3D objects
 */
class ThreeScene {
  constructor(canvas, paletteName = 'neon') {
    this.canvas = canvas;
    this.palette = getPalette(paletteName);

    // Three.js core objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Custom objects
    this.particleSystem = null;
    this.cameraController = null;

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

    // Create particle system
    this.particleSystem = new ParticleSystem(this.scene, 10000, this.palette);

    // Create camera controller
    this.cameraController = new CameraController(this.camera, this.canvas);

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
   * Enable/disable camera auto-rotation
   * @param {boolean} enabled
   */
  setAutoRotate(enabled) {
    if (this.cameraController) {
      this.cameraController.setAutoRotate(enabled);
    }
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
