import * as THREE from 'three';
import { lerpColor, getIntensityColor } from '../utils/colorPalettes';

/**
 * ParticleSystem class
 * Manages a system of particles that react to audio frequencies
 */
class ParticleSystem {
  constructor(scene, particleCount = 10000, palette) {
    this.scene = scene;
    this.particleCount = particleCount;
    this.palette = palette;

    // Particle data arrays
    this.basePositions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);

    // Three.js objects
    this.geometry = null;
    this.material = null;
    this.points = null;

    // Animation parameters
    this.rotationSpeed = 0;
    this.time = 0;

    this.createParticles();
  }

  /**
   * Create particle system with BufferGeometry
   */
  createParticles() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    // Initialize particles in a spherical distribution
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Spherical distribution
      const radius = 100 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Store base positions
      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      // Initialize velocities
      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      // Initial colors
      const color = this.palette.primary;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material
    this.material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  /**
   * Update particle system based on audio data
   * @param {Object} frequencyBands - { bass, mid, high } (0-1)
   */
  update(frequencyBands) {
    if (!this.geometry) return;

    const { bass, mid, high } = frequencyBands;
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;

    this.time += 0.01;

    // Update rotation speed based on mid frequencies
    this.rotationSpeed = mid * 0.02;
    this.points.rotation.y += this.rotationSpeed;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Get base position
      const baseX = this.basePositions[i3];
      const baseY = this.basePositions[i3 + 1];
      const baseZ = this.basePositions[i3 + 2];

      // Calculate distance from center
      const distance = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
      const normalizedX = baseX / distance;
      const normalizedY = baseY / distance;
      const normalizedZ = baseZ / distance;

      // Bass: Radial expansion/contraction
      const bassEffect = bass * 50;
      const radialOffset = bassEffect * (0.5 + Math.sin(this.time + i * 0.01) * 0.5);

      // Mid: Additional movement
      const midEffect = mid * 20 * Math.sin(this.time * 2 + i * 0.02);

      // Apply effects to position
      positions[i3] = baseX + normalizedX * radialOffset + this.velocities[i3] * midEffect;
      positions[i3 + 1] = baseY + normalizedY * radialOffset + this.velocities[i3 + 1] * midEffect;
      positions[i3 + 2] = baseZ + normalizedZ * radialOffset + this.velocities[i3 + 2] * midEffect;

      // High: Color intensity
      const overallIntensity = (bass + mid + high) / 3;
      const color = getIntensityColor(this.palette, overallIntensity);

      // Apply color with high frequency brightness boost
      const brightness = 1.0 + high * 0.5;
      colors[i3] = Math.min(color[0] * brightness, 1.0);
      colors[i3 + 1] = Math.min(color[1] * brightness, 1.0);
      colors[i3 + 2] = Math.min(color[2] * brightness, 1.0);
    }

    // Mark attributes as needing update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    // Update material size based on bass
    this.material.size = 2 + bass * 3;
  }

  /**
   * Update theme/palette
   * @param {Object} palette - New color palette
   */
  updateTheme(palette) {
    this.palette = palette;

    // Smoothly transition colors
    const colors = this.geometry.attributes.color.array;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const color = this.palette.primary;

      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];
    }

    this.geometry.attributes.color.needsUpdate = true;
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
    this.basePositions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);

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
