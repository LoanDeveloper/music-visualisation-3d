import * as THREE from 'three';
import { lerpColor } from '../utils/colorPalettes';

/**
 * ParticleSystem class
 * Manages particles with various shapes, trails, and connections
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
      particleShape: 'circle',
      // Trail settings
      trails: false,
      trailLength: 8,
      trailDecay: 0.92,
      trailWidth: 1,
      // Connection settings
      connections: false,
      connectionDistance: 30,
      connectionOpacity: 0.3,
      connectionMaxCount: 500,
      connectionLineWidth: 1,
      ...settings,
    };

    // Trail frame counter for decay timing
    this.trailFrameCounter = 0;

    // Particles per group (roughly equal distribution)
    this.bassCount = Math.floor(particleCount * 0.33);
    this.midCount = Math.floor(particleCount * 0.34);
    this.highCount = particleCount - this.bassCount - this.midCount;

    // Particle data arrays
    this.basePositions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.particleGroups = new Uint8Array(particleCount); // 0=bass, 1=mid, 2=high
    this.particlePhases = new Float32Array(particleCount); // For animation

    // Trail history (for each particle, store last N positions)
    this.trailHistory = [];
    this.trailGeometry = null;
    this.trailMaterial = null;
    this.trailLines = null;

    // Connection lines
    this.connectionGeometry = null;
    this.connectionMaterial = null;
    this.connectionLines = null;

    // Three.js objects
    this.geometry = null;
    this.material = null;
    this.points = null;

    // Particle textures
    this.particleTextures = {};
    this.createParticleTextures();

    // Animation parameters
    this.time = 0;

    // Band-specific colors
    this.updateBandColors();

    this.createParticles();
    
    if (this.settings.trails) {
      this.createTrailSystem();
    }
    
    if (this.settings.connections) {
      this.createConnectionSystem();
    }
  }

  /**
   * Create canvas textures for different particle shapes
   */
  createParticleTextures() {
    const size = 64;
    const shapes = ['circle', 'square', 'star', 'triangle', 'ring'];

    shapes.forEach(shape => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const center = size / 2;
      const radius = size / 2 - 4;

      ctx.clearRect(0, 0, size, size);

      // Create gradient for glow effect
      const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;

      switch (shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'square':
          const squareSize = radius * 1.4;
          ctx.fillRect(center - squareSize/2, center - squareSize/2, squareSize, squareSize);
          break;

        case 'star':
          this.drawStar(ctx, center, center, 5, radius, radius * 0.5);
          ctx.fill();
          break;

        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(center, center - radius);
          ctx.lineTo(center + radius * 0.866, center + radius * 0.5);
          ctx.lineTo(center - radius * 0.866, center + radius * 0.5);
          ctx.closePath();
          ctx.fill();
          break;

        case 'ring':
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.arc(center, center, radius * 0.5, 0, Math.PI * 2, true);
          ctx.fill();
          break;
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      this.particleTextures[shape] = texture;
    });
  }

  /**
   * Helper to draw a star shape
   */
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  /**
   * Update band colors based on current palette
   */
  updateBandColors() {
    this.bandColors = {
      bass: this.palette.primary,
      mid: this.palette.secondary,
      high: this.palette.accent,
    };
  }

  /**
   * Generate atom/molecular distribution positions
   */
  generateAtomPositions(positions, colors, expansion = 1.0) {
    let currentIndex = 0;
    const nucleusRadius = 40 * expansion;
    const orbitRadii = [80, 120, 160].map(r => r * expansion);

    // ============ BASS PARTICLES (nucleus - dense core) ============
    for (let i = 0; i < this.bassCount; i++) {
      const i3 = currentIndex * 3;
      
      // Dense nucleus cluster
      const r = Math.random() * nucleusRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

      this.velocities[i3] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

      this.particleGroups[currentIndex] = 0;
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      const color = this.bandColors.bass;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ MID PARTICLES (electron orbits) ============
    for (let i = 0; i < this.midCount; i++) {
      const i3 = currentIndex * 3;
      
      // Distribute across 3 orbital shells
      const orbitIndex = i % 3;
      const orbitRadius = orbitRadii[orbitIndex];
      const angle = (i / this.midCount) * Math.PI * 2 * 8 + Math.random() * 0.5;
      
      // Tilted orbits for 3D effect
      const tilt = (orbitIndex * Math.PI) / 3;
      
      positions[i3] = orbitRadius * Math.cos(angle);
      positions[i3 + 1] = orbitRadius * Math.sin(angle) * Math.cos(tilt);
      positions[i3 + 2] = orbitRadius * Math.sin(angle) * Math.sin(tilt);

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

      // Store orbit info in velocity for animation
      this.velocities[i3] = orbitRadius;
      this.velocities[i3 + 1] = tilt;
      this.velocities[i3 + 2] = angle;

      this.particleGroups[currentIndex] = 1;
      this.particlePhases[currentIndex] = angle;

      const color = this.bandColors.mid;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ HIGH PARTICLES (outer electron cloud) ============
    for (let i = 0; i < this.highCount; i++) {
      const i3 = currentIndex * 3;
      
      // Probability cloud (quantum-like distribution)
      const r = (150 + Math.random() * 50) * expansion;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

      this.velocities[i3] = (Math.random() - 0.5) * 0.2;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      this.particleGroups[currentIndex] = 2;
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      const color = this.bandColors.high;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }
  }

  /**
   * Generate quantum/probability cloud distribution
   */
  generateQuantumPositions(positions, colors, expansion = 1.0) {
    let currentIndex = 0;

    // Quantum probability distributions (s, p, d orbitals inspired)
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = currentIndex * 3;
      
      // Choose orbital type based on group
      let x, y, z;
      const group = i < this.bassCount ? 0 : (i < this.bassCount + this.midCount ? 1 : 2);
      
      if (group === 0) {
        // S-orbital (spherical, dense center)
        const r = Math.pow(Math.random(), 0.5) * 60 * expansion;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else if (group === 1) {
        // P-orbital (dumbbell shape)
        const lobe = Math.random() > 0.5 ? 1 : -1;
        const r = (40 + Math.random() * 80) * expansion;
        const spread = Math.random() * 30 * expansion;
        const axis = i % 3; // x, y, or z axis
        
        if (axis === 0) {
          x = lobe * r;
          y = (Math.random() - 0.5) * spread;
          z = (Math.random() - 0.5) * spread;
        } else if (axis === 1) {
          x = (Math.random() - 0.5) * spread;
          y = lobe * r;
          z = (Math.random() - 0.5) * spread;
        } else {
          x = (Math.random() - 0.5) * spread;
          y = (Math.random() - 0.5) * spread;
          z = lobe * r;
        }
      } else {
        // D-orbital (cloverleaf pattern)
        const angle = Math.random() * Math.PI * 2;
        const r = (80 + Math.random() * 100) * expansion;
        const lobeAngle = Math.floor(Math.random() * 4) * (Math.PI / 2);
        const finalAngle = lobeAngle + (Math.random() - 0.5) * 0.8;
        
        x = r * Math.cos(finalAngle) * Math.cos(angle * 0.3);
        y = r * Math.sin(finalAngle) * Math.cos(angle * 0.3);
        z = r * Math.sin(angle * 0.5) * 0.5;
      }

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      this.particleGroups[currentIndex] = group;
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      const color = group === 0 ? this.bandColors.bass : (group === 1 ? this.bandColors.mid : this.bandColors.high);
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }
  }

  /**
   * Generate DNA double helix distribution
   */
  generateDNAPositions(positions, colors, expansion = 1.0) {
    let currentIndex = 0;
    const helixRadius = 60 * expansion;
    const helixHeight = 300 * expansion;
    const turns = 4;

    // ============ BASS PARTICLES (first helix strand) ============
    for (let i = 0; i < this.bassCount; i++) {
      const i3 = currentIndex * 3;
      
      const t = i / this.bassCount;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * helixHeight;
      
      positions[i3] = helixRadius * Math.cos(angle);
      positions[i3 + 1] = y;
      positions[i3 + 2] = helixRadius * Math.sin(angle);

      // Add some randomness
      positions[i3] += (Math.random() - 0.5) * 10;
      positions[i3 + 1] += (Math.random() - 0.5) * 5;
      positions[i3 + 2] += (Math.random() - 0.5) * 10;

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

      this.velocities[i3] = angle;
      this.velocities[i3 + 1] = t;
      this.velocities[i3 + 2] = 0; // strand 0

      this.particleGroups[currentIndex] = 0;
      this.particlePhases[currentIndex] = angle;

      const color = this.bandColors.bass;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ MID PARTICLES (second helix strand - offset by PI) ============
    for (let i = 0; i < this.midCount; i++) {
      const i3 = currentIndex * 3;
      
      const t = i / this.midCount;
      const angle = t * Math.PI * 2 * turns + Math.PI; // Offset by PI
      const y = (t - 0.5) * helixHeight;
      
      positions[i3] = helixRadius * Math.cos(angle);
      positions[i3 + 1] = y;
      positions[i3 + 2] = helixRadius * Math.sin(angle);

      positions[i3] += (Math.random() - 0.5) * 10;
      positions[i3 + 1] += (Math.random() - 0.5) * 5;
      positions[i3 + 2] += (Math.random() - 0.5) * 10;

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

      this.velocities[i3] = angle;
      this.velocities[i3 + 1] = t;
      this.velocities[i3 + 2] = 1; // strand 1

      this.particleGroups[currentIndex] = 1;
      this.particlePhases[currentIndex] = angle;

      const color = this.bandColors.mid;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ HIGH PARTICLES (connecting "rungs" between strands) ============
    for (let i = 0; i < this.highCount; i++) {
      const i3 = currentIndex * 3;
      
      const t = i / this.highCount;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * helixHeight;
      
      // Position along the rung (between the two strands)
      const rungPos = (i % 2 === 0) ? 0.3 : 0.7;
      const x1 = helixRadius * Math.cos(angle);
      const z1 = helixRadius * Math.sin(angle);
      const x2 = helixRadius * Math.cos(angle + Math.PI);
      const z2 = helixRadius * Math.sin(angle + Math.PI);
      
      positions[i3] = x1 + (x2 - x1) * rungPos;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z1 + (z2 - z1) * rungPos;

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

      this.velocities[i3] = angle;
      this.velocities[i3 + 1] = t;
      this.velocities[i3 + 2] = rungPos;

      this.particleGroups[currentIndex] = 2;
      this.particlePhases[currentIndex] = angle;

      const color = this.bandColors.high;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }
  }

  /**
   * Generate sphere distribution positions
   */
  generateSpherePositions(positions, colors, expansion = 1.0) {
    let currentIndex = 0;

    // ============ BASS PARTICLES (inner core) ============
    for (let i = 0; i < this.bassCount; i++) {
      const i3 = currentIndex * 3;
      
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

      this.velocities[i3] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.05;

      this.particleGroups[currentIndex] = 0;
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      const color = this.bandColors.bass;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ MID PARTICLES (middle layer) ============
    for (let i = 0; i < this.midCount; i++) {
      const i3 = currentIndex * 3;
      
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

      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      this.particleGroups[currentIndex] = 1;
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

      const color = this.bandColors.mid;
      colors[i3] = color[0];
      colors[i3 + 1] = color[1];
      colors[i3 + 2] = color[2];

      currentIndex++;
    }

    // ============ HIGH PARTICLES (outer layer) ============
    for (let i = 0; i < this.highCount; i++) {
      const i3 = currentIndex * 3;
      
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

      this.velocities[i3] = (Math.random() - 0.5) * 0.15;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.15;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.15;

      this.particleGroups[currentIndex] = 2;
      this.particlePhases[currentIndex] = Math.random() * Math.PI * 2;

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

    for (let i = 0; i < this.bassCount; i++) {
      const i3 = currentIndex * 3;
      const t = Math.random();
      const radius = (10 + t * 50) * expansion;
      const armIndex = Math.floor(Math.random() * numArms);
      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralAngle = armAngle + t * Math.PI * 0.5 + (Math.random() - 0.5) * armSpread * 2;
      
      positions[i3] = radius * Math.cos(spiralAngle);
      positions[i3 + 1] = (Math.random() - 0.5) * 20 * expansion;
      positions[i3 + 2] = radius * Math.sin(spiralAngle);

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

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

    for (let i = 0; i < this.midCount; i++) {
      const i3 = currentIndex * 3;
      const t = Math.random();
      const radius = (50 + t * 80) * expansion;
      const armIndex = Math.floor(Math.random() * numArms);
      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralAngle = armAngle + t * Math.PI * 1.5 + (Math.random() - 0.5) * armSpread;
      
      positions[i3] = radius * Math.cos(spiralAngle);
      positions[i3 + 1] = (Math.random() - 0.5) * 30 * expansion;
      positions[i3 + 2] = radius * Math.sin(spiralAngle);

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

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

    for (let i = 0; i < this.highCount; i++) {
      const i3 = currentIndex * 3;
      const t = Math.random();
      const radius = (130 + t * 70) * expansion;
      const armIndex = Math.floor(Math.random() * numArms);
      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralAngle = armAngle + t * Math.PI * 2.5 + (Math.random() - 0.5) * armSpread * 0.5;
      
      positions[i3] = radius * Math.cos(spiralAngle);
      positions[i3 + 1] = (Math.random() - 0.5) * 40 * expansion;
      positions[i3 + 2] = radius * Math.sin(spiralAngle);

      this.basePositions[i3] = positions[i3];
      this.basePositions[i3 + 1] = positions[i3 + 1];
      this.basePositions[i3 + 2] = positions[i3 + 2];

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
   */
  createParticles() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    // Generate positions based on shape
    const expansion = this.settings.expansion || 1.0;
    switch (this.settings.shape) {
      case 'spiral':
        this.generateSpiralPositions(positions, colors, expansion);
        break;
      case 'atom':
        this.generateAtomPositions(positions, colors, expansion);
        break;
      case 'quantum':
        this.generateQuantumPositions(positions, colors, expansion);
        break;
      case 'dna':
        this.generateDNAPositions(positions, colors, expansion);
        break;
      default:
        this.generateSpherePositions(positions, colors, expansion);
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create material with texture
    const texture = this.particleTextures[this.settings.particleShape] || this.particleTextures.circle;
    
    this.material = new THREE.PointsMaterial({
      size: this.settings.particleSize,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    // Initialize trail history
    if (this.settings.trails) {
      this.trailHistory = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.trailHistory.push([]);
      }
    }

    console.log(`[ParticleSystem] Created ${this.particleCount} particles (Shape: ${this.settings.shape}, Particle: ${this.settings.particleShape})`);
  }

  /**
   * Create trail system for particles
   */
  createTrailSystem() {
    // Use a subset of particles for trails (performance)
    const trailParticleCount = Math.min(800, Math.floor(this.particleCount * 0.08));
    const trailLength = this.settings.trailLength;
    
    // Each trail needs (trailLength - 1) * 2 vertices for line segments
    const maxVertices = trailParticleCount * trailLength * 2 * 3;
    
    this.trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(maxVertices);
    const trailColors = new Float32Array(maxVertices);
    const trailAlphas = new Float32Array(maxVertices / 3); // Per-vertex alpha
    
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    
    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      linewidth: this.settings.trailWidth,
    });
    
    this.trailLines = new THREE.LineSegments(this.trailGeometry, this.trailMaterial);
    this.scene.add(this.trailLines);
    
    // Store which particles have trails
    this.trailParticleIndices = [];
    const step = Math.floor(this.particleCount / trailParticleCount);
    for (let i = 0; i < trailParticleCount; i++) {
      this.trailParticleIndices.push(i * step);
    }
    
    // Initialize trail history for all particles
    this.trailHistory = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.trailHistory.push([]);
    }
    
    // Trail alphas for decay
    this.trailAlphas = new Float32Array(trailParticleCount * trailLength);
    this.trailAlphas.fill(1.0);
    
    console.log(`[ParticleSystem] Trail system created for ${trailParticleCount} particles`);
  }

  /**
   * Create connection lines between nearby particles
   */
  createConnectionSystem() {
    // Max connections (configurable)
    const maxConnections = this.settings.connectionMaxCount || 500;
    
    this.connectionGeometry = new THREE.BufferGeometry();
    const connectionPositions = new Float32Array(maxConnections * 6); // 2 vertices per line, 3 components each
    const connectionColors = new Float32Array(maxConnections * 6);
    
    this.connectionGeometry.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));
    this.connectionGeometry.setAttribute('color', new THREE.BufferAttribute(connectionColors, 3));
    
    this.connectionMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: this.settings.connectionOpacity,
      blending: THREE.AdditiveBlending,
      linewidth: this.settings.connectionLineWidth,
    });
    
    this.connectionLines = new THREE.LineSegments(this.connectionGeometry, this.connectionMaterial);
    this.scene.add(this.connectionLines);
    
    console.log(`[ParticleSystem] Connection system created (max: ${maxConnections})`);
  }

  /**
   * Update particle system based on audio data
   */
  update(frequencyBands) {
    if (!this.geometry) return;

    const { bass, mid, high } = frequencyBands;
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;

    const animSpeed = this.settings.animationSpeed;
    const expansion = this.settings.expansion;
    const shape = this.settings.shape;
    
    this.time += 0.016 * animSpeed;

    // Global rotation
    const rotSpeed = this.settings.rotationSpeed;
    this.points.rotation.y += rotSpeed + mid * rotSpeed * 5;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const group = this.particleGroups[i];
      const phase = this.particlePhases[i];

      const baseX = this.basePositions[i3];
      const baseY = this.basePositions[i3 + 1];
      const baseZ = this.basePositions[i3 + 2];

      const distance = Math.sqrt(baseX * baseX + baseY * baseY + baseZ * baseZ);
      const normalizedX = distance > 0 ? baseX / distance : 0;
      const normalizedY = distance > 0 ? baseY / distance : 0;
      const normalizedZ = distance > 0 ? baseZ / distance : 0;

      let offsetX = 0, offsetY = 0, offsetZ = 0;
      let colorIntensity = 0;
      let baseColor;

      // Special animation for atom shape - orbital motion
      if (shape === 'atom' && group === 1) {
        const orbitRadius = this.velocities[i3];
        const tilt = this.velocities[i3 + 1];
        const baseAngle = this.velocities[i3 + 2];
        const angle = baseAngle + this.time * (1 + mid * 3);
        
        positions[i3] = orbitRadius * Math.cos(angle) * (1 + mid * 0.3);
        positions[i3 + 1] = orbitRadius * Math.sin(angle) * Math.cos(tilt) * (1 + mid * 0.3);
        positions[i3 + 2] = orbitRadius * Math.sin(angle) * Math.sin(tilt) * (1 + mid * 0.3);
        
        colorIntensity = mid;
        baseColor = this.bandColors.mid;
      } 
      // DNA helix animation
      else if (shape === 'dna') {
        const baseAngle = this.velocities[i3];
        const t = this.velocities[i3 + 1];
        const strand = this.velocities[i3 + 2];
        
        const waveOffset = Math.sin(this.time * 2 + t * Math.PI * 4) * 10 * (bass + mid);
        const twistSpeed = this.time * 0.5;
        
        if (group === 0 || group === 1) {
          const newAngle = baseAngle + twistSpeed;
          const helixRadius = 60 * expansion * (1 + bass * 0.3);
          positions[i3] = helixRadius * Math.cos(newAngle) + waveOffset;
          positions[i3 + 2] = helixRadius * Math.sin(newAngle);
        }
        
        colorIntensity = group === 0 ? bass : (group === 1 ? mid : high);
        baseColor = group === 0 ? this.bandColors.bass : (group === 1 ? this.bandColors.mid : this.bandColors.high);
      }
      // Standard animation for other shapes
      else {
        if (group === 0) {
          const bassEffect = bass * 100 * expansion;
          const pulse = Math.sin(this.time * 3 * animSpeed + phase) * 0.5 + 0.5;
          const radialOffset = bassEffect * pulse;
          const waveOffset = Math.sin(this.time * 2 + distance * 0.02) * bass * 30;

          offsetX = normalizedX * (radialOffset + waveOffset);
          offsetY = normalizedY * (radialOffset + waveOffset);
          offsetZ = normalizedZ * (radialOffset + waveOffset);

          colorIntensity = bass;
          baseColor = this.bandColors.bass;
        }
        else if (group === 1) {
          const midEffect = mid * 60 * expansion;
          const swirl = this.time * 2 * animSpeed + phase;
          
          offsetX = Math.sin(swirl) * midEffect * this.velocities[i3] * 15;
          offsetY = Math.cos(swirl * 0.7) * midEffect * this.velocities[i3 + 1] * 15;
          offsetZ = Math.sin(swirl * 1.3) * midEffect * this.velocities[i3 + 2] * 15;

          const radialOffset = mid * 50 * (Math.sin(this.time * animSpeed + phase) * 0.5 + 0.5);
          offsetX += normalizedX * radialOffset;
          offsetY += normalizedY * radialOffset;
          offsetZ += normalizedZ * radialOffset;

          colorIntensity = mid;
          baseColor = this.bandColors.mid;
        }
        else {
          const highEffect = high * 70 * expansion;
          const sparkle = Math.sin(this.time * 10 * animSpeed + phase);
          const twinkle = Math.random() < high * 0.4 ? 2.5 : 1;

          offsetX = this.velocities[i3] * highEffect * sparkle * twinkle;
          offsetY = this.velocities[i3 + 1] * highEffect * sparkle * twinkle;
          offsetZ = this.velocities[i3 + 2] * highEffect * sparkle * twinkle;

          const radialOffset = high * 40 * (Math.sin(this.time * 5 * animSpeed + phase) * 0.5 + 0.5);
          offsetX += normalizedX * radialOffset;
          offsetY += normalizedY * radialOffset;
          offsetZ += normalizedZ * radialOffset;

          colorIntensity = high;
          baseColor = this.bandColors.high;
        }

        positions[i3] = baseX + offsetX;
        positions[i3 + 1] = baseY + offsetY;
        positions[i3 + 2] = baseZ + offsetZ;
      }

      // Apply color
      const brightness = 0.4 + colorIntensity * 1.8;
      colors[i3] = Math.min(baseColor[0] * brightness, 1.0);
      colors[i3 + 1] = Math.min(baseColor[1] * brightness, 1.0);
      colors[i3 + 2] = Math.min(baseColor[2] * brightness, 1.0);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    // Update material size
    if (this.settings.reactiveSize) {
      const energy = (bass + mid + high) / 3;
      this.material.size = this.settings.particleSize + energy * 5;
    } else {
      this.material.size = this.settings.particleSize;
    }

    // Update trails
    if (this.settings.trails && this.trailLines) {
      this.updateTrails(positions, colors);
    }

    // Update connections
    if (this.settings.connections && this.connectionLines) {
      this.updateConnections(positions, colors, bass + mid + high);
    }
  }

  /**
   * Update trail positions with decay effect
   */
  updateTrails(positions, colors) {
    if (!this.trailGeometry || !this.trailParticleIndices) return;
    
    const trailLength = this.settings.trailLength;
    const trailDecay = this.settings.trailDecay;
    const trailPositions = this.trailGeometry.attributes.position.array;
    const trailColors = this.trailGeometry.attributes.color.array;
    
    // Increment frame counter - only add new positions every few frames for smoother trails
    this.trailFrameCounter = (this.trailFrameCounter || 0) + 1;
    const addNewPosition = this.trailFrameCounter % 2 === 0; // Add every 2 frames
    
    let vertexIndex = 0;
    
    for (let i = 0; i < this.trailParticleIndices.length; i++) {
      const particleIndex = this.trailParticleIndices[i];
      const i3 = particleIndex * 3;
      
      // Get or create history array
      if (!this.trailHistory[particleIndex]) {
        this.trailHistory[particleIndex] = [];
      }
      const history = this.trailHistory[particleIndex];
      
      // Add current position to history (with timestamp for decay)
      if (addNewPosition) {
        history.unshift({
          pos: [positions[i3], positions[i3 + 1], positions[i3 + 2]],
          alpha: 1.0,
        });
      }
      
      // Apply decay to all trail points
      for (let j = 0; j < history.length; j++) {
        history[j].alpha *= trailDecay;
      }
      
      // Remove points that are too faded
      while (history.length > 0 && history[history.length - 1].alpha < 0.05) {
        history.pop();
      }
      
      // Limit history length
      while (history.length > trailLength) {
        history.pop();
      }
      
      // Create line segments from history
      for (let j = 0; j < history.length - 1; j++) {
        const p1 = history[j];
        const p2 = history[j + 1];
        
        // Skip if positions are the same (no movement)
        const dx = p1.pos[0] - p2.pos[0];
        const dy = p1.pos[1] - p2.pos[1];
        const dz = p1.pos[2] - p2.pos[2];
        if (dx * dx + dy * dy + dz * dz < 0.01) continue;
        
        trailPositions[vertexIndex] = p1.pos[0];
        trailPositions[vertexIndex + 1] = p1.pos[1];
        trailPositions[vertexIndex + 2] = p1.pos[2];
        
        trailPositions[vertexIndex + 3] = p2.pos[0];
        trailPositions[vertexIndex + 4] = p2.pos[1];
        trailPositions[vertexIndex + 5] = p2.pos[2];
        
        // Get color based on particle group with alpha decay
        const color = this.particleGroups[particleIndex] === 0 ? this.bandColors.bass :
                     (this.particleGroups[particleIndex] === 1 ? this.bandColors.mid : this.bandColors.high);
        
        const alpha1 = p1.alpha;
        const alpha2 = p2.alpha;
        
        trailColors[vertexIndex] = color[0] * alpha1;
        trailColors[vertexIndex + 1] = color[1] * alpha1;
        trailColors[vertexIndex + 2] = color[2] * alpha1;
        
        trailColors[vertexIndex + 3] = color[0] * alpha2;
        trailColors[vertexIndex + 4] = color[1] * alpha2;
        trailColors[vertexIndex + 5] = color[2] * alpha2;
        
        vertexIndex += 6;
      }
    }
    
    // Clear remaining vertices
    for (let i = vertexIndex; i < trailPositions.length; i++) {
      trailPositions[i] = 0;
    }
    
    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailGeometry.attributes.color.needsUpdate = true;
    this.trailGeometry.setDrawRange(0, vertexIndex / 3);
  }

  /**
   * Update connection lines between nearby particles
   */
  updateConnections(positions, colors, energy) {
    if (!this.connectionGeometry) return;
    
    const connectionPositions = this.connectionGeometry.attributes.position.array;
    const connectionColors = this.connectionGeometry.attributes.color.array;
    const maxDist = this.settings.connectionDistance * (1 + energy * 0.3);
    const maxDistSq = maxDist * maxDist;
    const maxConnections = this.settings.connectionMaxCount || 500;
    
    let lineIndex = 0;
    
    // Calculate check count based on max connections for performance
    const checkCount = Math.min(Math.ceil(Math.sqrt(maxConnections * 2)), 300, this.particleCount);
    const step = Math.max(1, Math.floor(this.particleCount / checkCount));
    
    for (let i = 0; i < checkCount && lineIndex < maxConnections; i++) {
      const idx1 = i * step;
      if (idx1 >= this.particleCount) break;
      const i3_1 = idx1 * 3;
      
      for (let j = i + 1; j < checkCount && lineIndex < maxConnections; j++) {
        const idx2 = j * step;
        if (idx2 >= this.particleCount) break;
        const i3_2 = idx2 * 3;
        
        const dx = positions[i3_1] - positions[i3_2];
        const dy = positions[i3_1 + 1] - positions[i3_2 + 1];
        const dz = positions[i3_1 + 2] - positions[i3_2 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        
        if (distSq < maxDistSq && distSq > 0) {
          const alpha = 1 - Math.sqrt(distSq) / maxDist;
          const lineOffset = lineIndex * 6;
          
          connectionPositions[lineOffset] = positions[i3_1];
          connectionPositions[lineOffset + 1] = positions[i3_1 + 1];
          connectionPositions[lineOffset + 2] = positions[i3_1 + 2];
          
          connectionPositions[lineOffset + 3] = positions[i3_2];
          connectionPositions[lineOffset + 4] = positions[i3_2 + 1];
          connectionPositions[lineOffset + 5] = positions[i3_2 + 2];
          
          // Blend colors of connected particles
          const c1 = [colors[i3_1], colors[i3_1 + 1], colors[i3_1 + 2]];
          const c2 = [colors[i3_2], colors[i3_2 + 1], colors[i3_2 + 2]];
          
          connectionColors[lineOffset] = c1[0] * alpha;
          connectionColors[lineOffset + 1] = c1[1] * alpha;
          connectionColors[lineOffset + 2] = c1[2] * alpha;
          
          connectionColors[lineOffset + 3] = c2[0] * alpha;
          connectionColors[lineOffset + 4] = c2[1] * alpha;
          connectionColors[lineOffset + 5] = c2[2] * alpha;
          
          lineIndex++;
        }
      }
    }
    
    // Clear remaining
    for (let i = lineIndex * 6; i < connectionPositions.length; i++) {
      connectionPositions[i] = 0;
      connectionColors[i] = 0;
    }
    
    this.connectionGeometry.attributes.position.needsUpdate = true;
    this.connectionGeometry.attributes.color.needsUpdate = true;
    this.connectionGeometry.setDrawRange(0, lineIndex * 2);
  }

  /**
   * Update visualization settings
   */
  updateSettings(newSettings) {
    const oldShape = this.settings.shape;
    const oldParticleShape = this.settings.particleShape;
    const oldExpansion = this.settings.expansion;
    const oldTrails = this.settings.trails;
    const oldConnections = this.settings.connections;
    
    this.settings = { ...this.settings, ...newSettings };

    // Update material
    if (this.material) {
      this.material.size = this.settings.particleSize;
      
      // Update texture if particle shape changed
      if (oldParticleShape !== this.settings.particleShape) {
        const texture = this.particleTextures[this.settings.particleShape] || this.particleTextures.circle;
        this.material.map = texture;
        this.material.needsUpdate = true;
      }
    }

    // Regenerate particles if distribution shape changed
    if (oldShape !== this.settings.shape || 
        Math.abs(oldExpansion - this.settings.expansion) > 0.2) {
      this.regenerateParticles();
    }

    // Handle trails toggle
    if (oldTrails !== this.settings.trails) {
      if (this.settings.trails && !this.trailLines) {
        this.createTrailSystem();
      } else if (!this.settings.trails && this.trailLines) {
        this.scene.remove(this.trailLines);
        this.trailGeometry.dispose();
        this.trailMaterial.dispose();
        this.trailLines = null;
        this.trailHistory = [];
      }
    }

    // Handle connections toggle
    if (oldConnections !== this.settings.connections) {
      if (this.settings.connections && !this.connectionLines) {
        this.createConnectionSystem();
      } else if (!this.settings.connections && this.connectionLines) {
        this.scene.remove(this.connectionLines);
        this.connectionGeometry.dispose();
        this.connectionMaterial.dispose();
        this.connectionLines = null;
      }
    }

    // Update connection material opacity
    if (this.connectionMaterial) {
      this.connectionMaterial.opacity = this.settings.connectionOpacity;
    }

    console.log('[ParticleSystem] Settings updated:', this.settings);
  }

  /**
   * Regenerate particles with current settings
   */
  regenerateParticles() {
    if (this.points) {
      this.scene.remove(this.points);
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }

    this.createParticles();
    
    if (this.settings.trails) {
      if (this.trailLines) {
        this.scene.remove(this.trailLines);
        this.trailGeometry.dispose();
        this.trailMaterial.dispose();
      }
      this.createTrailSystem();
    }
    
    console.log('[ParticleSystem] Particles regenerated');
  }

  /**
   * Update theme/palette
   */
  updateTheme(palette) {
    this.palette = palette;
    this.updateBandColors();

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
   * Set particle count
   */
  setParticleCount(count) {
    if (count === this.particleCount) return;

    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();

    this.particleCount = count;
    this.bassCount = Math.floor(count * 0.33);
    this.midCount = Math.floor(count * 0.34);
    this.highCount = count - this.bassCount - this.midCount;

    this.basePositions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.particleGroups = new Uint8Array(count);
    this.particlePhases = new Float32Array(count);

    this.createParticles();
    
    if (this.settings.trails && this.trailLines) {
      this.scene.remove(this.trailLines);
      this.trailGeometry.dispose();
      this.trailMaterial.dispose();
      this.createTrailSystem();
    }
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
    
    // Dispose textures
    Object.values(this.particleTextures).forEach(texture => {
      texture.dispose();
    });
    
    // Dispose trails
    if (this.trailLines) {
      this.scene.remove(this.trailLines);
      this.trailGeometry.dispose();
      this.trailMaterial.dispose();
    }
    
    // Dispose connections
    if (this.connectionLines) {
      this.scene.remove(this.connectionLines);
      this.connectionGeometry.dispose();
      this.connectionMaterial.dispose();
    }
  }
}

export default ParticleSystem;
