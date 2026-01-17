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
  constructor(scene, particleCount = 10000, palette) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.palette = palette;

    // Particles per group (roughly equal distribution)
    this.bassCount = Math.floor(particleCount * 0.33);
    this.midCount = Math.floor(particleCount * 0.34);
    this.highCount = particleCount - this.bassCount - this.midCount;

    // Particle data arrays
    this.basePositions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.particleGroups = new Uint8Array(particleCount); // 0=bass, 1=mid, 2=high

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
   * Create particle system with BufferGeometry
   * Particles are distributed in layers by frequency band
   */
  createParticles() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    let currentIndex = 0;

    // ============ BASS PARTICLES (inner core) ============
    for (let i = 0; i < this.bassCount; i++) {
      const i3 = currentIndex * 3;
      
      // Inner sphere (radius 30-80)
      const radius = 30 + Math.random() * 50;
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
      const radius = 80 + Math.random() * 60;
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
      const radius = 140 + Math.random() * 60;
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

      // Initial color - high color
      const color = this.bandColors.high;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material
    this.material = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    console.log(`[ParticleSystem] Created ${this.particleCount} particles (Bass: ${this.bassCount}, Mid: ${this.midCount}, High: ${this.highCount})`);
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

    this.time += 0.016; // ~60fps timing

    // Slow global rotation
    this.points.rotation.y += 0.002 + mid * 0.01;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const group = this.particleGroups[i];

      // Get base position
      const baseX = this.basePositions[i3];
      const baseY = this.basePositions[i3 + 1];
      const baseZ = this.basePositions[i3 + 2];

      // Calculate distance from center
      const distance = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
      const normalizedX = baseX / distance;
      const normalizedY = baseY / distance;
      const normalizedZ = baseZ / distance;

      let offsetX = 0, offsetY = 0, offsetZ = 0;
      let colorIntensity = 0;
      let baseColor;

      // ============ BASS GROUP (pulsing, breathing) ============
      if (group === 0) {
        // Strong radial pulse with bass
        const bassEffect = bass * 80;
        const pulse = Math.sin(this.time * 3 + i * 0.02) * 0.5 + 0.5;
        const radialOffset = bassEffect * pulse;

        offsetX = normalizedX * radialOffset;
        offsetY = normalizedY * radialOffset;
        offsetZ = normalizedZ * radialOffset;

        colorIntensity = bass;
        baseColor = this.bandColors.bass;
      }
      // ============ MID GROUP (swirling, flowing) ============
      else if (group === 1) {
        // Orbital movement with mid frequencies
        const midEffect = mid * 40;
        const swirl = this.time * 2 + i * 0.01;
        
        offsetX = Math.sin(swirl) * midEffect * this.velocities[i3] * 10;
        offsetY = Math.cos(swirl * 0.7) * midEffect * this.velocities[i3 + 1] * 10;
        offsetZ = Math.sin(swirl * 1.3) * midEffect * this.velocities[i3 + 2] * 10;

        // Also some radial movement
        const radialOffset = mid * 30 * (Math.sin(this.time + i * 0.03) * 0.5 + 0.5);
        offsetX += normalizedX * radialOffset;
        offsetY += normalizedY * radialOffset;
        offsetZ += normalizedZ * radialOffset;

        colorIntensity = mid;
        baseColor = this.bandColors.mid;
      }
      // ============ HIGH GROUP (sparkling, twinkling) ============
      else {
        // Quick, erratic movement with high frequencies
        const highEffect = high * 50;
        const sparkle = Math.sin(this.time * 8 + i * 0.1);
        const twinkle = Math.random() < high * 0.3 ? 2 : 1; // Random extra movement

        offsetX = this.velocities[i3] * highEffect * sparkle * twinkle;
        offsetY = this.velocities[i3 + 1] * highEffect * sparkle * twinkle;
        offsetZ = this.velocities[i3 + 2] * highEffect * sparkle * twinkle;

        // Slight radial pulse
        const radialOffset = high * 20 * (Math.sin(this.time * 4 + i * 0.05) * 0.5 + 0.5);
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
      const brightness = 0.5 + colorIntensity * 1.5;
      colors[i3] = Math.min(baseColor[0] * brightness, 1.0);
      colors[i3 + 1] = Math.min(baseColor[1] * brightness, 1.0);
      colors[i3 + 2] = Math.min(baseColor[2] * brightness, 1.0);
    }

    // Mark attributes as needing update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    // Update material size based on overall energy
    const energy = (bass + mid + high) / 3;
    this.material.size = 2 + energy * 4;
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
