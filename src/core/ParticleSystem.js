import * as THREE from 'three';
import { lerpColor } from '../utils/colorPalettes';

/**
 * ParticleSystem class
 * Manages particles separated into 3 groups by frequency band:
 * - Bass (basses) - Center core, pulsates with bass
 * - Mid (mediums/instruments) - Middle layer, moves with mids
 * - High (aigus/voix) - Outer layer, sparkles with highs
 */
class ParticleSystem {
  constructor(scene, particleCount = 10000, palette, settings = {}) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.palette = palette;
    
    // Settings with defaults
    this.settings = {
      particleSize: 2.5,
      reactiveSize: true,
      rotationSpeed: 0.002,
      animationSpeed: 1.0,
      shape: 'sphere',
      expansion: 1.0,
      ...settings,
    };

    // Particles per group (roughly equal distribution)
    this.bassCount = Math.floor(particleCount * 0.33);
    this.midCount = Math.floor(particleCount * 0.34);
    this.highCount = particleCount - this.bassCount - this.midCount;

    // Particle data arrays
    this.basePositions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.particleGroups = new Uint8Array(particleCount); // 0=bass, 1=mid, 2=high
    this.particlePhases = new Float32Array(particleCount); // For spiral animation

    // Three.js objects
    this.geometry = null;
    this.material = null;
    this.points = null;

    // Animation parameters
    this.time = 0;

    // Band-specific colors (will be set based on palette)
    this.updateBandColors();

    this.createParticles();
  }

  /**
   * Update band colors based on current palette
   */
  updateBandColors() {
    // Bass: primary color (core)
    // Mid: secondary color (instruments)  
    // High: accent color (vocals/highs)
    this.bandColors = {
      bass: this.palette.primary,
      mid: this.palette.secondary,
      high: this.palette.accent,
    };
  }

  /**
   * Generate sphere distribution positions
   */
  generateSpherePositions(positions, colors, expansion = 1.0) {
    let currentIndex = 0;

    // ============ BASS PARTICLES (inner core) ============
    for (let i = 0; i < this.bassCount; i++) {
      const i3 = currentIndex * 3;
      
      // Inner sphere (radius 30-80)
      const radius = (30 + Math.random() * 50) * expansion;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      // Slower velocities for bass (heavier feel)
      this.velocities[i3] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.05;

      this.particleGroups[currentIndex] = 0; // bass group
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      // Initial color - bass color
      const color = this.bandColors.bass;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ MID PARTICLES (middle layer) ============
    for (let i = 0; i < this.midCount; i++) {
      const i3 = currentIndex * 3;
      
      // Middle sphere (radius 80-140)
      const radius = (80 + Math.random() * 60) * expansion;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      // Medium velocities for mids
      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      this.particleGroups[currentIndex] = 1; // mid group
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      // Initial color - mid color
      const color = this.bandColors.mid;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ HIGH PARTICLES (outer layer) ============
    for (let i = 0; i < this.highCount; i++) {
      const i3 = currentIndex * 3;
      
      // Outer sphere (radius 140-200)
      const radius = (140 + Math.random() * 60) * expansion;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      // Faster velocities for highs (lighter, sparkly feel)
      this.velocities[i3] = (Math.random() - 0.5) * 0.15;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.15;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.15;

      this.particleGroups[currentIndex] = 2; // high group
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      // Initial color - high color
      const color = this.bandColors.high;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }
  }

  /**
   * Generate spiral/galaxy distribution positions
   */
  generateSpiralPositions(positions, colors, expansion = 1.0) {
    let currentIndex = 0;
    const numArms = 4;
    const armSpread = 0.5;

    // ============ BASS PARTICLES (dense center) ============
    for (let i = 0; i < this.bassCount; i++) {
      const i3 = currentIndex * 3;
      
      // Dense core with slight spiral
      const t = Math.random();
      const radius = (10 + t * 50) * expansion;
      const armIndex = Math.floor(Math.random() * numArms);
      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralAngle = armAngle + t * Math.PI * 0.5 + (Math.random() - 0.5) * armSpread * 2;
      
      const x = radius * Math.cos(spiralAngle);
      const y = (Math.random() - 0.5) * 20 * expansion; // Flat disk
      const z = radius * Math.sin(spiralAngle);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      this.velocities[i3] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.05;

      this.particleGroups[currentIndex] = 0;
      this.particlePhases[currentIndex] = spiralAngle;

      const color = this.bandColors.bass;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ MID PARTICLES (spiral arms middle) ============
    for (let i = 0; i < this.midCount; i++) {
      const i3 = currentIndex * 3;
      
      const t = Math.random();
      const radius = (50 + t * 80) * expansion;
      const armIndex = Math.floor(Math.random() * numArms);
      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralAngle = armAngle + t * Math.PI * 1.5 + (Math.random() - 0.5) * armSpread;
      
      const x = radius * Math.cos(spiralAngle);
      const y = (Math.random() - 0.5) * 30 * expansion;
      const z = radius * Math.sin(spiralAngle);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.03;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      this.particleGroups[currentIndex] = 1;
      this.particlePhases[currentIndex] = spiralAngle;

      const color = this.bandColors.mid;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ HIGH PARTICLES (outer spiral tips) ============
    for (let i = 0; i < this.highCount; i++) {
      const i3 = currentIndex * 3;
      
      const t = Math.random();
      const radius = (130 + t * 70) * expansion;
      const armIndex = Math.floor(Math.random() * numArms);
      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralAngle = armAngle + t * Math.PI * 2.5 + (Math.random() - 0.5) * armSpread * 0.5;
      
      const x = radius * Math.cos(spiralAngle);
      const y = (Math.random() - 0.5) * 40 * expansion;
      const z = radius * Math.sin(spiralAngle);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      this.velocities[i3] = (Math.random() - 0.5) * 0.15;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.15;

      this.particleGroups[currentIndex] = 2;
      this.particlePhases[currentIndex] = spiralAngle;

      const color = this.bandColors.high;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }
  }

  /**
   * Create particle system with BufferGeometry
   * Particles are distributed in layers by frequency band
   */
  createParticles() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    // Generate positions based on shape
    const expansion = this.settings.expansion || 1.0;
    if (this.settings.shape === 'spiral') {
      this.generateSpiralPositions(positions, colors, expansion);
    } else {
      this.generateSpherePositions(positions, colors, expansion);
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material
    this.material = new THREE.PointsMaterial({
      size: this.settings.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    console.log(`[ParticleSystem] Created ${this.particleCount} particles (Shape: ${this.settings.shape}, Bass: ${this.bassCount}, Mid: ${this.midCount}, High: ${this.highCount})`);
  }

  /**
   * Update particle system based on audio data
   * Each particle group reacts to its corresponding frequency band
   * @param {Object} frequencyBands - { bass, mid, high } (0-1)
   */
  update(frequencyBands) {
    if (!this.geometry) return;

    const { bass, mid, high } = frequencyBands;
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;

    const animSpeed = this.settings.animationSpeed;
    const expansion = this.settings.expansion;
    
    this.time += 0.016 * animSpeed; // ~60fps timing

    // Global rotation
    const rotSpeed = this.settings.rotationSpeed;
    this.points.rotation.y += rotSpeed + mid * rotSpeed * 5;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const group = this.particleGroups[i];
      const phase = this.particlePhases[i];

      // Get base position
      const baseX = this.basePositions[i3];
      const baseY = this.basePositions[i3 + 1];
      const baseZ = this.basePositions[i3 + 2];

      // Calculate distance from center
      const distance = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
      const normalizedX = distance > 0 ? baseX / distance : 0;
      const normalizedY = distance > 0 ? baseY / distance : 0;
      const normalizedZ = distance > 0 ? baseZ / distance : 0;

      let offsetX = 0, offsetY = 0, offsetZ = 0;
      let colorIntensity = 0;
      let baseColor;

      // ============ BASS GROUP (pulsing, breathing) ============
      if (group === 0) {
        // Strong radial pulse with bass - amplified for all particles
        const bassEffect = bass * 100 * expansion;
        const pulse = Math.sin(this.time * 3 * animSpeed + phase) * 0.5 + 0.5;
        const radialOffset = bassEffect * pulse;

        // Add wave propagation effect
        const waveOffset = Math.sin(this.time * 2 + distance * 0.02) * bass * 30;

        offsetX = normalizedX * (radialOffset + waveOffset);
        offsetY = normalizedY * (radialOffset + waveOffset);
        offsetZ = normalizedZ * (radialOffset + waveOffset);

        colorIntensity = bass;
        baseColor = this.bandColors.bass;
      }
      // ============ MID GROUP (swirling, flowing) ============
      else if (group === 1) {
        // Orbital movement with mid frequencies - more dramatic
        const midEffect = mid * 60 * expansion;
        const swirl = this.time * 2 * animSpeed + phase;
        
        offsetX = Math.sin(swirl) * midEffect * this.velocities[i3] * 15;
        offsetY = Math.cos(swirl * 0.7) * midEffect * this.velocities[i3 + 1] * 15;
        offsetZ = Math.sin(swirl * 1.3) * midEffect * this.velocities[i3 + 2] * 15;

        // Radial breathing
        const radialOffset = mid * 50 * (Math.sin(this.time * animSpeed + phase) * 0.5 + 0.5);
        offsetX += normalizedX * radialOffset;
        offsetY += normalizedY * radialOffset;
        offsetZ += normalizedZ * radialOffset;

        colorIntensity = mid;
        baseColor = this.bandColors.mid;
      }
      // ============ HIGH GROUP (sparkling, twinkling) ============
      else {
        // Quick, erratic movement with high frequencies - more visible
        const highEffect = high * 70 * expansion;
        const sparkle = Math.sin(this.time * 10 * animSpeed + phase);
        const twinkle = Math.random() < high * 0.4 ? 2.5 : 1;

        offsetX = this.velocities[i3] * highEffect * sparkle * twinkle;
        offsetY = this.velocities[i3 + 1] * highEffect * sparkle * twinkle;
        offsetZ = this.velocities[i3 + 2] * highEffect * sparkle * twinkle;

        // Radial pulse
        const radialOffset = high * 40 * (Math.sin(this.time * 5 * animSpeed + phase) * 0.5 + 0.5);
        offsetX += normalizedX * radialOffset;
        offsetY += normalizedY * radialOffset;
        offsetZ += normalizedZ * radialOffset;

        colorIntensity = high;
        baseColor = this.bandColors.high;
      }

      // Apply position
      positions[i3] = baseX + offsetX;
      positions[i3 + 1] = baseY + offsetY;
      positions[i3 + 2] = baseZ + offsetZ;

      // Apply color with intensity variation
      const brightness = 0.4 + colorIntensity * 1.8;
      colors[i3] = Math.min(baseColor[0] * brightness, 1.0);
      colors[i3 + 1] = Math.min(baseColor[1] * brightness, 1.0);
      colors[i3 + 2] = Math.min(baseColor[2] * brightness, 1.0);
    }

    // Mark attributes as needing update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    // Update material size based on overall energy
    if (this.settings.reactiveSize) {
      const energy = (bass + mid + high) / 3;
      this.material.size = this.settings.particleSize + energy * 5;
    } else {
      this.material.size = this.settings.particleSize;
    }
  }

  /**
   * Update visualization settings
   * @param {Object} newSettings - New settings object
   */
  updateSettings(newSettings) {
    const oldShape = this.settings.shape;
    const oldExpansion = this.settings.expansion;
    
    this.settings = { ...this.settings, ...newSettings };

    // Update material size
    if (this.material) {
      this.material.size = this.settings.particleSize;
    }

    // Regenerate particles if shape or expansion changed significantly
    if (oldShape !== this.settings.shape || 
        Math.abs(oldExpansion - this.settings.expansion) > 0.2) {
      this.regenerateParticles();
    }

    console.log('[ParticleSystem] Settings updated:', this.settings);
  }

  /**
   * Regenerate particles with current settings
   */
  regenerateParticles() {
    // Remove old particles
    if (this.points) {
      this.scene.remove(this.points);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }

    // Recreate
    this.createParticles();
    console.log('[ParticleSystem] Particles regenerated');
  }

  /**
   * Update theme/palette
   * @param {Object} palette - New color palette
   */
  updateTheme(palette) {
    this.palette = palette;
    this.updateBandColors();

    // Update all particle colors to their new band colors
    const colors = this.geometry.attributes.color.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const group = this.particleGroups[i];

      let color;
      if (group === 0) {
        color = this.bandColors.bass;
      } else if (group === 1) {
        color = this.bandColors.mid;
      } else {
        color = this.bandColors.high;
      }

      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];
    }

    this.geometry.attributes.color.needsUpdate = true;
    console.log('[ParticleSystem] Theme updated');
  }

  /**
   * Set particle count (for performance optimization)
   * @param {number} count - New particle count
   */
  setParticleCount(count) {
    if (count === this.particleCount) return;

    // Remove old particles
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();

    // Create new particles with new count
    this.particleCount = count;
    this.bassCount = Math.floor(count * 0.33);
    this.midCount = Math.floor(count * 0.34);
    this.highCount = count - this.bassCount - this.midCount;

    this.basePositions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.particleGroups = new Uint8Array(count);
    this.particlePhases = new Float32Array(count);

    this.createParticles();
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.points) {
      this.scene.remove(this.points);
    }

    if (this.geometry) {
      this.geometry.dispose();
    }

    if (this.material) {
      this.material.dispose();
    }
  }
}

export default ParticleSystem;
