import * as THREE from 'three';
import { centroidToColor, pitchClassToColor } from '../utils/advancedAudioProcessor';

const VEIN_POINT_SAMPLES = 56;

const VEIN_PATH_DEFINITIONS = [
  [[0, -82, 0], [0, -54, 1], [0, -24, 2], [0, 14, 1], [0, 46, 0], [0, 86, 0]],
  [[0, 48, 0], [-8, 62, 4], [-12, 74, 8], [-6, 86, 8], [0, 92, 4]],
  [[0, 48, 0], [8, 62, 4], [12, 74, 8], [6, 86, 8], [0, 92, 4]],
  [[0, 34, 2], [-14, 36, 4], [-30, 36, 6], [-48, 34, 9], [-64, 30, 12], [-76, 24, 14]],
  [[0, 34, 2], [14, 36, 4], [30, 36, 6], [48, 34, 9], [64, 30, 12], [76, 24, 14]],
  [[-58, 28, 13], [-68, 16, 14], [-74, 2, 14], [-72, -14, 12], [-66, -28, 10]],
  [[58, 28, 13], [68, 16, 14], [74, 2, 14], [72, -14, 12], [66, -28, 10]],
  [[0, 8, 2], [-8, 4, 6], [-18, -4, 10], [-28, -16, 12], [-36, -30, 14], [-44, -44, 15]],
  [[0, 8, 2], [8, 4, 6], [18, -4, 10], [28, -16, 12], [36, -30, 14], [44, -44, 15]],
  [[0, -10, 1], [-8, -20, 4], [-14, -34, 6], [-18, -52, 8], [-20, -72, 9], [-18, -92, 10]],
  [[0, -10, 1], [8, -20, 4], [14, -34, 6], [18, -52, 8], [20, -72, 9], [18, -92, 10]],
  [[-18, -48, 9], [-26, -62, 11], [-30, -78, 12], [-28, -94, 13], [-24, -108, 13]],
  [[18, -48, 9], [26, -62, 11], [30, -78, 12], [28, -94, 13], [24, -108, 13]],
  [[0, 20, 3], [-6, 14, 8], [-14, 8, 12], [-20, 0, 13], [-22, -14, 13]],
  [[0, 20, 3], [6, 14, 8], [14, 8, 12], [20, 0, 13], [22, -14, 13]],
  [[-6, 58, 4], [-14, 66, 8], [-16, 76, 10], [-10, 86, 9], [-2, 90, 6]],
  [[6, 58, 4], [14, 66, 8], [16, 76, 10], [10, 86, 9], [2, 90, 6]],
  [[0, -80, 8], [-8, -92, 12], [-12, -104, 14], [-10, -114, 15]],
  [[0, -80, 8], [8, -92, 12], [12, -104, 14], [10, -114, 15]],
];

const VEIN_PATH_GROUPS = {
  bass: [0, 1, 2, 7, 8, 13, 14],
  mid: [0, 3, 4, 5, 6, 9, 10],
  high: [1, 2, 5, 6, 11, 12, 15, 16, 17, 18],
};

const TAU = Math.PI * 2;
const HUMAN_DEFAULT_PRESET_ID = 'reseau-complet';

const HUMAN_TUNING_DEFAULTS = {
  density: 1,
  speed: 1,
  pulse: 1,
  sparkle: 1,
  brightness: 1,
  turbulence: 1,
};

const BODY_CAPSULE_DEFINITIONS = [
  { id: 'head', a: [0, 74, 5], b: [0, 96, 5], radius: 15 },
  { id: 'neck', a: [0, 58, 4], b: [0, 72, 4], radius: 9 },
  { id: 'torso-upper', a: [0, 48, 2], b: [0, 14, 2], radius: 27 },
  { id: 'torso-lower', a: [0, 14, 2], b: [0, -24, 2], radius: 24 },
  { id: 'pelvis', a: [0, -24, 2], b: [0, -44, 2], radius: 21 },
  { id: 'upper-arm-l', a: [-10, 34, 7], b: [-56, 28, 12], radius: 10 },
  { id: 'forearm-l', a: [-56, 28, 12], b: [-72, -16, 11], radius: 8.5 },
  { id: 'upper-arm-r', a: [10, 34, 7], b: [56, 28, 12], radius: 10 },
  { id: 'forearm-r', a: [56, 28, 12], b: [72, -16, 11], radius: 8.5 },
  { id: 'thigh-l', a: [-9, -30, 5], b: [-18, -80, 9], radius: 13 },
  { id: 'calf-l', a: [-18, -80, 9], b: [-12, -114, 11], radius: 10.5 },
  { id: 'thigh-r', a: [9, -30, 5], b: [18, -80, 9], radius: 13 },
  { id: 'calf-r', a: [18, -80, 9], b: [12, -114, 11], radius: 10.5 },
];

const HUMAN_PARTICLE_PRESETS = {
  'coeur-core': {
    id: 'coeur-core',
    label: 'Coeur Core',
    mode: 'heart',
    density: 0.54,
    speedBase: 0.34,
    speedGainMid: 1.05,
    pulseGainBass: 1.8,
    turbulenceGainMid: 0.42,
    sparkleGainHigh: 0.55,
    brightnessBase: 0.34,
    brightnessGainHigh: 1.08,
    smoothingBass: 0.20,
    smoothingMid: 0.16,
    smoothingHigh: 0.18,
    pathPool: [13, 14, 15, 16, 1, 2],
    secondaryPathPool: [0, 7, 8],
    containmentCapsules: ['torso-upper', 'torso-lower', 'neck'],
    containmentPadding: 0.91,
    containmentDamping: 1,
    centerX: 0,
    centerY: 26,
    centerZ: 5,
    regionRadiusX: 22,
    regionRadiusY: 28,
    regionRadiusZ: 15,
    swirlBase: 0.35,
    swirlGainMid: 1.8,
    sizeBase: 1.7,
    sizeBassGain: 1.8,
    sizeMidGain: 0.7,
    opacityBase: 0.56,
    opacityGain: 0.26,
    whiteMixBase: 0.44,
    whiteMixHighGain: 0.22,
  },
  'veines-flow': {
    id: 'veines-flow',
    label: 'Veines Flow',
    mode: 'veins',
    density: 0.72,
    speedBase: 0.62,
    speedGainMid: 2.35,
    pulseGainBass: 1.15,
    turbulenceGainMid: 0.78,
    sparkleGainHigh: 0.88,
    brightnessBase: 0.4,
    brightnessGainHigh: 1.24,
    smoothingBass: 0.16,
    smoothingMid: 0.21,
    smoothingHigh: 0.24,
    pathPool: [0, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14],
    secondaryPathPool: [1, 2, 11, 12, 15, 16, 17, 18],
    containmentCapsules: [
      'head',
      'neck',
      'torso-upper',
      'torso-lower',
      'pelvis',
      'upper-arm-l',
      'forearm-l',
      'upper-arm-r',
      'forearm-r',
      'thigh-l',
      'calf-l',
      'thigh-r',
      'calf-r',
    ],
    containmentPadding: 0.92,
    containmentDamping: 1,
    centerX: 0,
    centerY: 18,
    centerZ: 4,
    regionRadiusX: 34,
    regionRadiusY: 98,
    regionRadiusZ: 22,
    swirlBase: 0.68,
    swirlGainMid: 2.3,
    sizeBase: 1.45,
    sizeBassGain: 0.9,
    sizeMidGain: 2.2,
    opacityBase: 0.56,
    opacityGain: 0.3,
    whiteMixBase: 0.46,
    whiteMixHighGain: 0.33,
  },
  'reseau-complet': {
    id: 'reseau-complet',
    label: 'Reseau Complet',
    mode: 'network',
    density: 0.98,
    speedBase: 0.44,
    speedGainMid: 1.42,
    pulseGainBass: 0.96,
    turbulenceGainMid: 0.44,
    sparkleGainHigh: 0.38,
    brightnessBase: 0.26,
    brightnessGainHigh: 0.68,
    smoothingBass: 0.17,
    smoothingMid: 0.18,
    smoothingHigh: 0.2,
    pathPool: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    secondaryPathPool: [0, 3, 4, 5, 6, 9, 10, 13, 14, 15, 16],
    containmentCapsules: [
      'head',
      'neck',
      'torso-upper',
      'torso-lower',
      'pelvis',
      'upper-arm-l',
      'forearm-l',
      'upper-arm-r',
      'forearm-r',
      'thigh-l',
      'calf-l',
      'thigh-r',
      'calf-r',
    ],
    containmentPadding: 0.9,
    containmentDamping: 1,
    centerX: 0,
    centerY: 10,
    centerZ: 4,
    regionRadiusX: 38,
    regionRadiusY: 106,
    regionRadiusZ: 24,
    swirlBase: 0.24,
    swirlGainMid: 0.85,
    sizeBase: 1.32,
    sizeBassGain: 0.72,
    sizeMidGain: 1.34,
    opacityBase: 0.5,
    opacityGain: 0.18,
    whiteMixBase: 0.42,
    whiteMixHighGain: 0.2,
  },
  'cerveau-focus': {
    id: 'cerveau-focus',
    label: 'Cerveau Focus',
    mode: 'brain',
    density: 0.58,
    speedBase: 0.72,
    speedGainMid: 1.86,
    pulseGainBass: 0.34,
    turbulenceGainMid: 1.12,
    sparkleGainHigh: 1.48,
    brightnessBase: 0.4,
    brightnessGainHigh: 1.9,
    smoothingBass: 0.15,
    smoothingMid: 0.19,
    smoothingHigh: 0.24,
    pathPool: [1, 2, 15, 16],
    secondaryPathPool: [1, 2, 15, 16],
    containmentCapsules: ['head', 'neck'],
    containmentPadding: 0.9,
    containmentDamping: 1,
    centerX: 0,
    centerY: 83,
    centerZ: 6,
    regionRadiusX: 19,
    regionRadiusY: 14,
    regionRadiusZ: 15,
    swirlBase: 0.95,
    swirlGainMid: 2.8,
    sizeBase: 1.35,
    sizeBassGain: 0.35,
    sizeMidGain: 1.1,
    opacityBase: 0.58,
    opacityGain: 0.22,
    whiteMixBase: 0.4,
    whiteMixHighGain: 0.35,
  },
};

/**
 * ParticleSystem class
 * Manages particles with various shapes, trails, and connections
 * Supports advanced audio analysis for enhanced reactivity
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
      particleOpacity: 0.9,
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
      // Advanced analysis settings
      beatReactive: true,           // React to beat detection
      beatPulseIntensity: 1.0,      // How much particles pulse on beat
      spectralColorMode: 'none',    // 'none', 'centroid', 'chroma'
      spectralColorIntensity: 0.5,  // How much spectral color affects particles
      onsetFlash: true,             // Flash on note onsets
      rmsScale: true,               // Scale system based on RMS energy
      // Stereo settings
      stereoEnabled: true,          // Enable stereo visual effects
      stereoWidthEffect: 1.0,       // Intensity of stereo width expansion (0-2)
      stereoPanningEffect: 1.0,     // Intensity of panning rotation (0-2)
      stereoSeparation: true,       // Enable L/R particle separation
      stereoColorIntensity: 0.7,    // Intensity of L/R color tinting (0-1)
      ...settings,
    };

    // Trail frame counter for decay timing
    this.trailFrameCounter = 0;

    // Beat pulse state
    this.beatPulse = 0;
    this.beatDecay = 0.92;

    // Onset flash state
    this.onsetFlash = 0;
    this.onsetDecay = 0.85;

    // Stereo state
    this.stereoPan = 0;         // Current panning position (-1 to +1)
    this.stereoWidth = 0;       // Current stereo width (0 to 1)
    this.stereoRotation = 0;    // Cumulative rotation from panning

    // Particles per group (roughly equal distribution)
    this.bassCount = Math.floor(particleCount * 0.33);
    this.midCount = Math.floor(particleCount * 0.34);
    this.highCount = particleCount - this.bassCount - this.midCount;

    // Particle data arrays
    this.basePositions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.particleGroups = new Uint8Array(particleCount); // 0=bass, 1=mid, 2=high
    this.particlePhases = new Float32Array(particleCount); // For animation

    // Human layer particle mode
    this.humanLayerMode = false;
    this.humanPresetId = HUMAN_DEFAULT_PRESET_ID;
    this.humanPreset = HUMAN_PARTICLE_PRESETS[this.humanPresetId];
    this.humanActiveCount = particleCount;
    this.humanTuning = { ...HUMAN_TUNING_DEFAULTS };
    this.veinNetworkReady = false;
    this.veinPathPointCount = VEIN_POINT_SAMPLES;
    this.veinPathCount = 0;
    this.veinPathStride = 0;
    this.veinPathPositions = null;
    this.veinPathTangents = null;
    this.veinPathIndices = new Uint16Array(particleCount);
    this.veinPathSecondaryIndices = new Uint16Array(particleCount);
    this.veinProgress = new Float32Array(particleCount);
    this.veinSpeed = new Float32Array(particleCount);
    this.veinRadius = new Float32Array(particleCount);
    this.veinSwirlRate = new Float32Array(particleCount);
    this.veinPulseOffset = new Float32Array(particleCount);
    this.veinJitter = new Float32Array(particleCount);
    this.veinBass = 0;
    this.veinMid = 0;
    this.veinHigh = 0;
    this.bodyCapsules = [];
    this.bodyCapsuleLookup = {};
    this.activeContainmentCapsules = [];

    // Trail history (for each particle, store last N positions)
    // Note: Ring buffer arrays are created in createTrailSystem()
    this.trailPositionBuffers = null;
    this.trailAlphaBuffers = null;
    this.trailHeadIndices = null;
    this.trailLengths = null;
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
    this.initializeBodyCapsuleRig();
    this.applyHumanPresetConfig(this.humanPresetId);

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

  clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  initializeBodyCapsuleRig() {
    this.bodyCapsules.length = 0;
    this.bodyCapsuleLookup = {};

    for (let i = 0; i < BODY_CAPSULE_DEFINITIONS.length; i++) {
      const definition = BODY_CAPSULE_DEFINITIONS[i];
      const ax = definition.a[0];
      const ay = definition.a[1];
      const az = definition.a[2];
      const bx = definition.b[0];
      const by = definition.b[1];
      const bz = definition.b[2];
      const dx = bx - ax;
      const dy = by - ay;
      const dz = bz - az;
      const lengthSq = Math.max(dx * dx + dy * dy + dz * dz, 0.0001);
      const length = Math.sqrt(lengthSq);
      const tx = dx / length;
      const ty = dy / length;
      const tz = dz / length;

      let rx = 0;
      let ry = 1;
      let rz = 0;
      if (Math.abs(ty) > 0.88) {
        rx = 1;
        ry = 0;
        rz = 0;
      }

      let nx = ty * rz - tz * ry;
      let ny = tz * rx - tx * rz;
      let nz = tx * ry - ty * rx;
      let nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nLen < 0.0001) {
        nx = 1;
        ny = 0;
        nz = 0;
        nLen = 1;
      }
      nx /= nLen;
      ny /= nLen;
      nz /= nLen;

      let bxAxis = ty * nz - tz * ny;
      let byAxis = tz * nx - tx * nz;
      let bzAxis = tx * ny - ty * nx;
      let bLen = Math.sqrt(bxAxis * bxAxis + byAxis * byAxis + bzAxis * bzAxis);
      if (bLen < 0.0001) {
        bxAxis = 0;
        byAxis = 0;
        bzAxis = 1;
        bLen = 1;
      }
      bxAxis /= bLen;
      byAxis /= bLen;
      bzAxis /= bLen;

      this.bodyCapsules.push({
        id: definition.id,
        ax,
        ay,
        az,
        dx,
        dy,
        dz,
        lengthSq,
        radius: definition.radius,
        nx,
        ny,
        nz,
        bx: bxAxis,
        by: byAxis,
        bz: bzAxis,
      });
      this.bodyCapsuleLookup[definition.id] = i;
    }
  }

  applyHumanPresetConfig(presetId) {
    const preset = HUMAN_PARTICLE_PRESETS[presetId] || HUMAN_PARTICLE_PRESETS[HUMAN_DEFAULT_PRESET_ID];
    this.humanPresetId = preset.id;
    this.humanPreset = preset;
    this.activeContainmentCapsules.length = 0;

    for (let i = 0; i < preset.containmentCapsules.length; i++) {
      const capsuleName = preset.containmentCapsules[i];
      const capsuleIndex = this.bodyCapsuleLookup[capsuleName];
      if (typeof capsuleIndex === 'number') {
        this.activeContainmentCapsules.push(capsuleIndex);
      }
    }

    if (this.activeContainmentCapsules.length === 0) {
      for (let i = 0; i < this.bodyCapsules.length; i++) {
        this.activeContainmentCapsules.push(i);
      }
    }

    this.updateHumanActiveCount();
  }

  updateHumanActiveCount() {
    const presetDensity = this.humanPreset ? this.humanPreset.density : 1;
    const density = this.clamp01(presetDensity * this.humanTuning.density);
    this.humanActiveCount = Math.max(1, Math.floor(this.particleCount * Math.max(0.08, density)));

    if (this.geometry) {
      if (this.humanLayerMode) {
        this.geometry.setDrawRange(0, this.humanActiveCount);
      } else {
        this.geometry.setDrawRange(0, this.particleCount);
      }
    }
  }

  samplePointInCapsule(capsule, radiusScale, target, i3) {
    const t = Math.random();
    const cx = capsule.ax + capsule.dx * t;
    const cy = capsule.ay + capsule.dy * t;
    const cz = capsule.az + capsule.dz * t;
    const angle = Math.random() * TAU;
    const radialDistance = Math.sqrt(Math.random()) * capsule.radius * radiusScale;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const ox = (capsule.nx * cosA + capsule.bx * sinA) * radialDistance;
    const oy = (capsule.ny * cosA + capsule.by * sinA) * radialDistance;
    const oz = (capsule.nz * cosA + capsule.bz * sinA) * radialDistance;
    target[i3] = cx + ox;
    target[i3 + 1] = cy + oy;
    target[i3 + 2] = cz + oz;
  }

  clampParticleInsideHuman(i3, positions, damping, padding) {
    const x = positions[i3];
    const y = positions[i3 + 1];
    const z = positions[i3 + 2];
    const containment = this.activeContainmentCapsules;
    if (!containment || containment.length === 0) return;

    let nearestDistSq = Number.POSITIVE_INFINITY;
    let nearestRadius = 1;
    let nearestX = x;
    let nearestY = y;
    let nearestZ = z;
    let nearestQx = x;
    let nearestQy = y;
    let nearestQz = z;
    let isInside = false;

    for (let i = 0; i < containment.length; i++) {
      const capsule = this.bodyCapsules[containment[i]];
      const px = x - capsule.ax;
      const py = y - capsule.ay;
      const pz = z - capsule.az;
      let t = (px * capsule.dx + py * capsule.dy + pz * capsule.dz) / capsule.lengthSq;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;

      const qx = capsule.ax + capsule.dx * t;
      const qy = capsule.ay + capsule.dy * t;
      const qz = capsule.az + capsule.dz * t;
      const vx = x - qx;
      const vy = y - qy;
      const vz = z - qz;
      const distSq = vx * vx + vy * vy + vz * vz;
      const effectiveRadius = capsule.radius * padding;
      const effectiveRadiusSq = effectiveRadius * effectiveRadius;

      if (distSq <= effectiveRadiusSq) {
        isInside = true;
        break;
      }

      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearestRadius = effectiveRadius;
        nearestQx = qx;
        nearestQy = qy;
        nearestQz = qz;
        nearestX = vx;
        nearestY = vy;
        nearestZ = vz;
      }
    }

    if (isInside) return;

    if (nearestDistSq > 0.000001) {
      const insetRadius = Math.max(0, nearestRadius - 0.0015);
      const scale = insetRadius / Math.sqrt(nearestDistSq);
      positions[i3] = nearestQx + nearestX * scale;
      positions[i3 + 1] = nearestQy + nearestY * scale;
      positions[i3 + 2] = nearestQz + nearestZ * scale;
    } else {
      positions[i3] = nearestQx + Math.max(0, nearestRadius - 0.0015);
      positions[i3 + 1] = nearestQy;
      positions[i3 + 2] = nearestQz;
    }

    if (damping < 0.999) {
      this.velocities[i3] *= damping;
      this.velocities[i3 + 1] *= damping;
      this.velocities[i3 + 2] *= damping;
    }
  }

  /**
   * Precompute vein-like spline paths once for the human mode.
   */
  ensureVeinNetwork() {
    if (this.veinNetworkReady) return;

    const pathCount = VEIN_PATH_DEFINITIONS.length;
    const pointCount = this.veinPathPointCount;
    const stride = pointCount * 3;

    this.veinPathCount = pathCount;
    this.veinPathStride = stride;
    this.veinPathPositions = new Float32Array(pathCount * stride);
    this.veinPathTangents = new Float32Array(pathCount * stride);

    const samplePoint = new THREE.Vector3();
    const sampleTangent = new THREE.Vector3();

    for (let pathIndex = 0; pathIndex < pathCount; pathIndex++) {
      const controlPoints = VEIN_PATH_DEFINITIONS[pathIndex].map(
        ([x, y, z]) => new THREE.Vector3(x, y, z)
      );
      const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.35);
      const pathOffset = pathIndex * stride;

      for (let j = 0; j < pointCount; j++) {
        const t = j / (pointCount - 1);
        const index3 = pathOffset + j * 3;

        curve.getPointAt(t, samplePoint);
        this.veinPathPositions[index3] = samplePoint.x;
        this.veinPathPositions[index3 + 1] = samplePoint.y;
        this.veinPathPositions[index3 + 2] = samplePoint.z;

        curve.getTangentAt(t, sampleTangent);
        this.veinPathTangents[index3] = sampleTangent.x;
        this.veinPathTangents[index3 + 1] = sampleTangent.y;
        this.veinPathTangents[index3 + 2] = sampleTangent.z;
      }
    }

    this.veinNetworkReady = true;
  }

  /**
   * Populate standard distributions from user settings.
   */
  populateDefaultLayout(positions, colors) {
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
  }

  /**
   * Populate active layout based on whether human mode is enabled.
   */
  populateActiveLayout(positions, colors) {
    if (this.humanLayerMode) {
      this.generateVeinsWbcPositions(positions, colors);
      return;
    }
    this.populateDefaultLayout(positions, colors);
  }

  /**
   * Rebuild particle positions/colors in-place for current mode.
   */
  rebuildParticleLayout() {
    if (!this.geometry) return;

    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;
    this.populateActiveLayout(positions, colors);

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Generate particles for the active human preset.
   */
  generateVeinsWbcPositions(positions, colors) {
    this.ensureVeinNetwork();
    const preset = this.humanPreset || HUMAN_PARTICLE_PRESETS[HUMAN_DEFAULT_PRESET_ID];
    const pointCount = this.veinPathPointCount;
    const segmentCount = pointCount - 1;
    const stride = this.veinPathStride;
    const pathPositions = this.veinPathPositions;
    const pathTangents = this.veinPathTangents;
    const pathPool = preset.pathPool && preset.pathPool.length > 0 ? preset.pathPool : VEIN_PATH_GROUPS.mid;
    const secondaryPool = preset.secondaryPathPool && preset.secondaryPathPool.length > 0
      ? preset.secondaryPathPool
      : pathPool;
    const whiteMix = preset.whiteMixBase;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const group = i < this.bassCount ? 0 : (i < this.bassCount + this.midCount ? 1 : 2);
      this.particleGroups[i] = group;
      this.particlePhases[i] = Math.random() * TAU;
      this.veinProgress[i] = Math.random();
      this.veinSpeed[i] = 0.58 + Math.random() * (group === 2 ? 0.72 : 0.56);
      this.veinRadius[i] = (group === 0 ? 2.6 : (group === 1 ? 1.8 : 1.1)) + Math.random() * 0.95;
      this.veinSwirlRate[i] = 0.5 + Math.random() * (group === 2 ? 2.3 : 1.5);
      this.veinPulseOffset[i] = Math.random() * TAU;
      this.veinJitter[i] = 0.25 + Math.random() * 0.75;

      if (preset.mode === 'heart' || preset.mode === 'brain') {
        let rx = (Math.random() * 2 - 1) * preset.regionRadiusX;
        let ry = (Math.random() * 2 - 1) * preset.regionRadiusY;
        let rz = (Math.random() * 2 - 1) * preset.regionRadiusZ;
        const ellipsoid = (rx * rx) / (preset.regionRadiusX * preset.regionRadiusX)
          + (ry * ry) / (preset.regionRadiusY * preset.regionRadiusY)
          + (rz * rz) / (preset.regionRadiusZ * preset.regionRadiusZ);
        if (ellipsoid > 1) {
          const inv = 1 / Math.sqrt(ellipsoid);
          rx *= inv;
          ry *= inv;
          rz *= inv;
        }

        const centerX = preset.centerX + (preset.mode === 'brain' ? (Math.random() - 0.5) * 6 : 0);
        const centerY = preset.centerY + (preset.mode === 'heart' ? (Math.random() - 0.5) * 8 : 0);
        const centerZ = preset.centerZ + (Math.random() - 0.5) * 3;
        const px = centerX + rx;
        const py = centerY + ry;
        const pz = centerZ + rz;

        this.basePositions[i3] = centerX;
        this.basePositions[i3 + 1] = centerY;
        this.basePositions[i3 + 2] = centerZ;

        const dirLen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
        this.velocities[i3] = rx / dirLen;
        this.velocities[i3 + 1] = ry / dirLen;
        this.velocities[i3 + 2] = rz / dirLen;

        this.veinPathIndices[i] = pathPool[i % pathPool.length];
        this.veinPathSecondaryIndices[i] = secondaryPool[(i + group) % secondaryPool.length];

        positions[i3] = px;
        positions[i3 + 1] = py;
        positions[i3 + 2] = pz;
      } else {
        const pathIndex = pathPool[Math.floor(Math.random() * pathPool.length)];
        const secondaryPathIndex = secondaryPool[Math.floor(Math.random() * secondaryPool.length)];
        const progress = this.veinProgress[i];
        this.veinPathIndices[i] = pathIndex;
        this.veinPathSecondaryIndices[i] = secondaryPathIndex;

        const pathOffset = pathIndex * stride;
        const sampled = progress * segmentCount;
        let segment = sampled | 0;
        if (segment >= segmentCount) segment = segmentCount - 1;
        const localT = sampled - segment;
        const indexA = pathOffset + segment * 3;
        const indexB = indexA + 3;

        const px = pathPositions[indexA] + (pathPositions[indexB] - pathPositions[indexA]) * localT;
        const py = pathPositions[indexA + 1] + (pathPositions[indexB + 1] - pathPositions[indexA + 1]) * localT;
        const pz = pathPositions[indexA + 2] + (pathPositions[indexB + 2] - pathPositions[indexA + 2]) * localT;

        let tx = pathTangents[indexA] + (pathTangents[indexB] - pathTangents[indexA]) * localT;
        let ty = pathTangents[indexA + 1] + (pathTangents[indexB + 1] - pathTangents[indexA + 1]) * localT;
        let tz = pathTangents[indexA + 2] + (pathTangents[indexB + 2] - pathTangents[indexA + 2]) * localT;
        const tangentLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
        tx /= tangentLen;
        ty /= tangentLen;
        tz /= tangentLen;

        this.basePositions[i3] = px;
        this.basePositions[i3 + 1] = py;
        this.basePositions[i3 + 2] = pz;
        this.velocities[i3] = tx;
        this.velocities[i3 + 1] = ty;
        this.velocities[i3 + 2] = tz;

        positions[i3] = px;
        positions[i3 + 1] = py;
        positions[i3 + 2] = pz;
      }

      this.clampParticleInsideHuman(i3, positions, 0.98, preset.containmentPadding);

      const baseColor = group === 0 ? this.bandColors.bass : (group === 1 ? this.bandColors.mid : this.bandColors.high);
      colors[i3] = baseColor[0] * (1 - whiteMix) + whiteMix;
      colors[i3 + 1] = baseColor[1] * (1 - whiteMix) + whiteMix;
      colors[i3 + 2] = baseColor[2] * (1 - whiteMix) + whiteMix;
    }

    this.updateHumanActiveCount();
  }

  setHumanPreset(presetId) {
    this.applyHumanPresetConfig(presetId);
    if (this.humanLayerMode) {
      this.veinBass = 0;
      this.veinMid = 0;
      this.veinHigh = 0;
      this.rebuildParticleLayout();
    }
  }

  setHumanParticleTuning(tuning) {
    if (!tuning) return;
    if (typeof tuning.density === 'number') this.humanTuning.density = Math.max(0.2, Math.min(1.6, tuning.density));
    if (typeof tuning.speed === 'number') this.humanTuning.speed = Math.max(0.2, Math.min(2.2, tuning.speed));
    if (typeof tuning.pulse === 'number') this.humanTuning.pulse = Math.max(0.2, Math.min(2.2, tuning.pulse));
    if (typeof tuning.sparkle === 'number') this.humanTuning.sparkle = Math.max(0.2, Math.min(2.4, tuning.sparkle));
    if (typeof tuning.brightness === 'number') this.humanTuning.brightness = Math.max(0.2, Math.min(2.2, tuning.brightness));
    if (typeof tuning.turbulence === 'number') this.humanTuning.turbulence = Math.max(0.2, Math.min(2.2, tuning.turbulence));
    this.updateHumanActiveCount();
  }

  /**
   * Toggle human-mode particle rendering.
   */
  setHumanLayerMode(enabled) {
    const useHumanMode = !!enabled;
    if (this.humanLayerMode === useHumanMode) return;

    this.humanLayerMode = useHumanMode;
    this.veinBass = 0;
    this.veinMid = 0;
    this.veinHigh = 0;

    if (this.material) {
      const texture = useHumanMode
        ? this.particleTextures.circle
        : (this.particleTextures[this.settings.particleShape] || this.particleTextures.circle);
      this.material.map = texture;
      this.material.blending = useHumanMode ? THREE.NormalBlending : THREE.AdditiveBlending;
      this.material.needsUpdate = true;
    }

    if (this.trailLines) {
      this.trailLines.visible = this.settings.trails && !useHumanMode;
    }
    if (this.connectionLines) {
      this.connectionLines.visible = this.settings.connections && !useHumanMode;
    }

    if (this.points && useHumanMode) {
      this.points.rotation.set(0, 0, 0);
    }

    this.rebuildParticleLayout();
    this.updateHumanActiveCount();
  }

  /**
   * Create particle system with BufferGeometry
   */
  createParticles() {
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    this.populateActiveLayout(positions, colors);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setDrawRange(0, this.humanLayerMode ? this.humanActiveCount : this.particleCount);

    // Create material with texture
    const texture = this.humanLayerMode
      ? this.particleTextures.circle
      : (this.particleTextures[this.settings.particleShape] || this.particleTextures.circle);
    
    this.material = new THREE.PointsMaterial({
      size: this.settings.particleSize,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: this.settings.particleOpacity,
      blending: this.humanLayerMode ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.renderOrder = 2;
    this.scene.add(this.points);

    // Note: Trail ring buffers are now initialized in createTrailSystem()

    console.log(`[ParticleSystem] Created ${this.particleCount} particles (Shape: ${this.settings.shape}, Particle: ${this.settings.particleShape})`);
  }

  /**
   * Create trail system for particles
   * Uses pre-allocated ring buffers to avoid per-frame allocations
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
    this.trailLines.renderOrder = 2;
    this.trailLines.visible = !this.humanLayerMode;
    this.scene.add(this.trailLines);
    
    // Store which particles have trails
    this.trailParticleIndices = new Uint32Array(trailParticleCount);
    const step = Math.floor(this.particleCount / trailParticleCount);
    for (let i = 0; i < trailParticleCount; i++) {
      this.trailParticleIndices[i] = i * step;
    }
    
    // Pre-allocate trail ring buffers (allocation-free per frame)
    // Each trail particle has a fixed-size buffer for positions and alphas
    this.trailPositionBuffers = new Float32Array(trailParticleCount * trailLength * 3);
    this.trailAlphaBuffers = new Float32Array(trailParticleCount * trailLength);
    this.trailHeadIndices = new Uint8Array(trailParticleCount); // Ring buffer head
    this.trailLengths = new Uint8Array(trailParticleCount); // Current length per trail
    
    // Initialize all alphas to 0 (empty)
    this.trailAlphaBuffers.fill(0);
    this.trailHeadIndices.fill(0);
    this.trailLengths.fill(0);
    
    // Store trail length setting for update
    this.trailMaxLength = trailLength;
    
    console.log(`[ParticleSystem] Trail system created for ${trailParticleCount} particles (ring buffers)`);
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
    this.connectionLines.renderOrder = 2;
    this.connectionLines.visible = !this.humanLayerMode;
    this.scene.add(this.connectionLines);
    
    console.log(`[ParticleSystem] Connection system created (max: ${maxConnections})`);
  }

  /**
   * Allocation-free update for human-layer presets.
   */
  updateVeinsWbcParticles(bass, mid, high, positions, colors) {
    const preset = this.humanPreset || HUMAN_PARTICLE_PRESETS[HUMAN_DEFAULT_PRESET_ID];
    const activeCount = this.humanActiveCount;
    if (activeCount <= 0) return;

    this.veinBass += (bass - this.veinBass) * preset.smoothingBass;
    this.veinMid += (mid - this.veinMid) * preset.smoothingMid;
    this.veinHigh += (high - this.veinHigh) * preset.smoothingHigh;

    const speedScale = preset.speedBase + this.veinMid * preset.speedGainMid * this.humanTuning.speed;
    const pulseScale = this.veinBass * preset.pulseGainBass * this.humanTuning.pulse;
    const turbulenceScale = (0.3 + this.veinMid * preset.turbulenceGainMid) * this.humanTuning.turbulence;
    const sparkleScale = this.humanTuning.sparkle;
    const brightnessScale = this.humanTuning.brightness;
    const containmentPadding = preset.containmentPadding;
    const containmentDamping = preset.containmentDamping;
    const whiteMix = preset.whiteMixBase + this.veinHigh * preset.whiteMixHighGain * sparkleScale;

    if (preset.mode === 'heart') {
      this.updateHeartPresetParticles(
        activeCount,
        positions,
        colors,
        speedScale,
        pulseScale,
        turbulenceScale,
        sparkleScale,
        brightnessScale,
        whiteMix,
        containmentPadding,
        containmentDamping
      );
    } else if (preset.mode === 'brain') {
      this.updateBrainPresetParticles(
        activeCount,
        positions,
        colors,
        speedScale,
        pulseScale,
        turbulenceScale,
        sparkleScale,
        brightnessScale,
        whiteMix,
        containmentPadding,
        containmentDamping
      );
    } else {
      this.updateNetworkPresetParticles(
        activeCount,
        positions,
        colors,
        speedScale,
        pulseScale,
        turbulenceScale,
        sparkleScale,
        brightnessScale,
        whiteMix,
        containmentPadding,
        containmentDamping,
        preset.mode === 'network'
      );
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    if (this.material) {
      const size = preset.sizeBase
        + this.veinBass * preset.sizeBassGain * this.humanTuning.pulse
        + this.veinMid * preset.sizeMidGain * this.humanTuning.speed;
      this.material.size = size;

      const opacity = preset.opacityBase
        + this.veinHigh * preset.opacityGain * this.humanTuning.sparkle
        + this.veinBass * 0.08 * this.humanTuning.pulse;
      this.material.opacity = this.clamp01(opacity) * this.settings.particleOpacity;
    }

    if (this.points) {
      this.points.rotation.x *= 0.84;
      this.points.rotation.y *= 0.84;
      this.points.rotation.z *= 0.84;
    }
  }

  updateNetworkPresetParticles(
    activeCount,
    positions,
    colors,
    speedScale,
    pulseScale,
    turbulenceScale,
    sparkleScale,
    brightnessScale,
    whiteMix,
    containmentPadding,
    containmentDamping,
    isNetworkMode
  ) {
    const preset = this.humanPreset;
    const pathPositions = this.veinPathPositions;
    const pathTangents = this.veinPathTangents;
    const segmentCount = this.veinPathPointCount - 1;
    const stride = this.veinPathStride;
    const bassColor = this.bandColors.bass;
    const midColor = this.bandColors.mid;
    const highColor = this.bandColors.high;
    const breathing = 0.5 + 0.5 * Math.sin(this.time * (1.1 + this.veinBass * 1.4));

    for (let i = 0; i < activeCount; i++) {
      const i3 = i * 3;
      const group = this.particleGroups[i];
      const pathIndex = this.veinPathIndices[i];
      const secondaryPathIndex = this.veinPathSecondaryIndices[i];

      let progress = this.veinProgress[i] + this.veinSpeed[i] * speedScale * 0.016;
      progress -= Math.floor(progress);
      this.veinProgress[i] = progress;

      const pathOffset = pathIndex * stride;
      const sampled = progress * segmentCount;
      let segment = sampled | 0;
      if (segment >= segmentCount) segment = segmentCount - 1;
      const localT = sampled - segment;
      const indexA = pathOffset + segment * 3;
      const indexB = indexA + 3;

      let px = pathPositions[indexA] + (pathPositions[indexB] - pathPositions[indexA]) * localT;
      let py = pathPositions[indexA + 1] + (pathPositions[indexB + 1] - pathPositions[indexA + 1]) * localT;
      let pz = pathPositions[indexA + 2] + (pathPositions[indexB + 2] - pathPositions[indexA + 2]) * localT;

      let tx = pathTangents[indexA] + (pathTangents[indexB] - pathTangents[indexA]) * localT;
      let ty = pathTangents[indexA + 1] + (pathTangents[indexB + 1] - pathTangents[indexA + 1]) * localT;
      let tz = pathTangents[indexA + 2] + (pathTangents[indexB + 2] - pathTangents[indexA + 2]) * localT;

      if (isNetworkMode) {
        const secondaryProgress = progress + 0.17 + (group - 1) * 0.08;
        const wrappedSecondaryProgress = secondaryProgress - Math.floor(secondaryProgress);
        const secondaryOffset = secondaryPathIndex * stride;
        const secondarySampled = wrappedSecondaryProgress * segmentCount;
        let secondarySegment = secondarySampled | 0;
        if (secondarySegment >= segmentCount) secondarySegment = segmentCount - 1;
        const secondaryT = secondarySampled - secondarySegment;
        const secondaryA = secondaryOffset + secondarySegment * 3;
        const secondaryB = secondaryA + 3;

        const sx = pathPositions[secondaryA] + (pathPositions[secondaryB] - pathPositions[secondaryA]) * secondaryT;
        const sy = pathPositions[secondaryA + 1] + (pathPositions[secondaryB + 1] - pathPositions[secondaryA + 1]) * secondaryT;
        const sz = pathPositions[secondaryA + 2] + (pathPositions[secondaryB + 2] - pathPositions[secondaryA + 2]) * secondaryT;
        const stx = pathTangents[secondaryA] + (pathTangents[secondaryB] - pathTangents[secondaryA]) * secondaryT;
        const sty = pathTangents[secondaryA + 1] + (pathTangents[secondaryB + 1] - pathTangents[secondaryA + 1]) * secondaryT;
        const stz = pathTangents[secondaryA + 2] + (pathTangents[secondaryB + 2] - pathTangents[secondaryA + 2]) * secondaryT;

        const branchBlend = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(this.time * 0.7 + this.veinPulseOffset[i]));
        px = px * (1 - branchBlend) + sx * branchBlend;
        py = py * (1 - branchBlend) + sy * branchBlend;
        pz = pz * (1 - branchBlend) + sz * branchBlend;
        tx = tx * (1 - branchBlend) + stx * branchBlend;
        ty = ty * (1 - branchBlend) + sty * branchBlend;
        tz = tz * (1 - branchBlend) + stz * branchBlend;
      }

      const tangentLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      tx /= tangentLen;
      ty /= tangentLen;
      tz /= tangentLen;

      let nx = -tz;
      let ny = 0;
      let nz = tx;
      let normalLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (normalLen < 0.0001) {
        nx = 1;
        ny = 0;
        nz = 0;
        normalLen = 1;
      }
      nx /= normalLen;
      ny /= normalLen;
      nz /= normalLen;

      let bx = ty * nz - tz * ny;
      let by = tz * nx - tx * nz;
      let bz = tx * ny - ty * nx;
      const binormalLen = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      bx /= binormalLen;
      by /= binormalLen;
      bz /= binormalLen;

      const swirl = this.time * this.veinSwirlRate[i] * (preset.swirlBase + this.veinMid * preset.swirlGainMid)
        + this.particlePhases[i];
      const jitter = Math.sin(this.time * (7.2 + this.veinMid * 12.4) + this.veinPulseOffset[i])
        * this.veinJitter[i]
        * turbulenceScale;
      const vesselPulse = pulseScale * (0.55 + 0.45 * Math.sin(this.time * 2.7 + this.veinPulseOffset[i]));
      const radius = this.veinRadius[i] * (1 + vesselPulse) + jitter;
      const axialPulse = pulseScale * (isNetworkMode ? 1.1 : 1.7) * Math.sin(this.time * 2.3 + this.veinPulseOffset[i]);

      const cosA = Math.cos(swirl);
      const sinA = Math.sin(swirl);
      const radialX = nx * cosA + bx * sinA;
      const radialY = ny * cosA + by * sinA;
      const radialZ = nz * cosA + bz * sinA;

      positions[i3] = px + radialX * radius + tx * axialPulse;
      positions[i3 + 1] = py + radialY * radius + ty * axialPulse;
      positions[i3 + 2] = pz + radialZ * radius + tz * axialPulse;
      this.clampParticleInsideHuman(i3, positions, containmentDamping, containmentPadding);

      const baseColor = group === 0 ? bassColor : (group === 1 ? midColor : highColor);
      const bandDrive = group === 0 ? this.veinBass : (group === 1 ? this.veinMid : this.veinHigh);
      const sparkle = 0.5 + 0.5 * Math.sin(this.time * (11 + this.veinHigh * 20) + this.particlePhases[i] * 1.7);

      let brightness;
      if (isNetworkMode) {
        brightness = preset.brightnessBase * brightnessScale
          + this.veinMid * 0.74
          + breathing * this.veinBass * 0.6 * this.humanTuning.pulse
          + sparkle * this.veinHigh * preset.sparkleGainHigh * sparkleScale * 0.4;
      } else {
        brightness = preset.brightnessBase * brightnessScale
          + bandDrive * 1.02
          + pulseScale * (group === 0 ? 0.42 : 0.18)
          + sparkle * this.veinHigh * preset.sparkleGainHigh * sparkleScale;
      }

      const colorR = baseColor[0] * (1 - whiteMix) + whiteMix;
      const colorG = baseColor[1] * (1 - whiteMix) + whiteMix;
      const colorB = baseColor[2] * (1 - whiteMix) + whiteMix;
      colors[i3] = Math.min(1, colorR * brightness);
      colors[i3 + 1] = Math.min(1, colorG * brightness);
      colors[i3 + 2] = Math.min(1, colorB * brightness);
    }
  }

  updateHeartPresetParticles(
    activeCount,
    positions,
    colors,
    speedScale,
    pulseScale,
    turbulenceScale,
    sparkleScale,
    brightnessScale,
    whiteMix,
    containmentPadding,
    containmentDamping
  ) {
    const preset = this.humanPreset;
    const bassColor = this.bandColors.bass;
    const midColor = this.bandColors.mid;
    const highColor = this.bandColors.high;
    const heartbeat = 0.5 + 0.5 * Math.sin(this.time * (2.8 + this.veinBass * 4.0));

    for (let i = 0; i < activeCount; i++) {
      const i3 = i * 3;
      const group = this.particleGroups[i];

      const centerX = this.basePositions[i3];
      const centerY = this.basePositions[i3 + 1];
      const centerZ = this.basePositions[i3 + 2];
      const vx = this.velocities[i3];
      const vy = this.velocities[i3 + 1];
      const vz = this.velocities[i3 + 2];

      const swirl = this.particlePhases[i]
        + this.time * this.veinSwirlRate[i] * speedScale;
      const cosS = Math.cos(swirl);
      const sinS = Math.sin(swirl);
      const swirlX = vx * cosS - vz * sinS;
      const swirlZ = vx * sinS + vz * cosS;

      const pulseWave = 0.55 + 0.45 * Math.sin(this.time * (3.6 + this.veinBass * 4.3) + this.veinPulseOffset[i]);
      const pulseRadius = this.veinRadius[i] * (2.1 + pulseScale * pulseWave);
      const turbulence = Math.sin(this.time * (8.8 + this.veinMid * 12.8) + this.veinPulseOffset[i] * 1.7)
        * this.veinJitter[i]
        * turbulenceScale;
      const verticalPulse = pulseScale * 2.2 * heartbeat;

      positions[i3] = centerX + swirlX * (pulseRadius + turbulence);
      positions[i3 + 1] = centerY + vy * (pulseRadius * 0.8 + turbulence) + verticalPulse;
      positions[i3 + 2] = centerZ + swirlZ * (pulseRadius + turbulence);
      this.clampParticleInsideHuman(i3, positions, containmentDamping, containmentPadding);

      const baseColor = group === 0 ? bassColor : (group === 1 ? midColor : highColor);
      const sparkle = 0.5 + 0.5 * Math.sin(this.time * (16 + this.veinHigh * 24) + this.particlePhases[i] * 2.1);
      const brightness = preset.brightnessBase * brightnessScale
        + this.veinBass * 1.55 * this.humanTuning.pulse * heartbeat
        + this.veinMid * 0.32
        + sparkle * this.veinHigh * preset.sparkleGainHigh * sparkleScale;

      const colorR = baseColor[0] * (1 - whiteMix) + whiteMix;
      const colorG = baseColor[1] * (1 - whiteMix) + whiteMix;
      const colorB = baseColor[2] * (1 - whiteMix) + whiteMix;
      colors[i3] = Math.min(1, colorR * brightness);
      colors[i3 + 1] = Math.min(1, colorG * brightness);
      colors[i3 + 2] = Math.min(1, colorB * brightness);
    }
  }

  updateBrainPresetParticles(
    activeCount,
    positions,
    colors,
    speedScale,
    pulseScale,
    turbulenceScale,
    sparkleScale,
    brightnessScale,
    whiteMix,
    containmentPadding,
    containmentDamping
  ) {
    const preset = this.humanPreset;
    const bassColor = this.bandColors.bass;
    const midColor = this.bandColors.mid;
    const highColor = this.bandColors.high;

    for (let i = 0; i < activeCount; i++) {
      const i3 = i * 3;
      const group = this.particleGroups[i];

      const centerX = this.basePositions[i3];
      const centerY = this.basePositions[i3 + 1];
      const centerZ = this.basePositions[i3 + 2];
      const vx = this.velocities[i3];
      const vy = this.velocities[i3 + 1];
      const vz = this.velocities[i3 + 2];

      let nx = -vz;
      let ny = 0;
      let nz = vx;
      let normalLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (normalLen < 0.0001) {
        nx = 1;
        ny = 0;
        nz = 0;
        normalLen = 1;
      }
      nx /= normalLen;
      ny /= normalLen;
      nz /= normalLen;

      let bx = vy * nz - vz * ny;
      let by = vz * nx - vx * nz;
      let bz = vx * ny - vy * nx;
      const binormalLen = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      bx /= binormalLen;
      by /= binormalLen;
      bz /= binormalLen;

      const neuralSpeed = speedScale * this.veinSwirlRate[i] * (preset.swirlBase + this.veinMid * preset.swirlGainMid);
      const theta = this.particlePhases[i] + this.time * neuralSpeed;
      const loopRadius = this.veinRadius[i] * (2.0 + this.veinMid * 1.2);
      const flicker = 0.5 + 0.5 * Math.sin(this.time * (24 + this.veinHigh * 42) + this.veinPulseOffset[i] * 2.4);
      const turbulence = Math.sin(this.time * (12.5 + this.veinMid * 18.0) + this.veinPulseOffset[i])
        * this.veinJitter[i]
        * turbulenceScale
        * 0.8;

      positions[i3] = centerX
        + (nx * Math.cos(theta) + bx * Math.sin(theta)) * loopRadius
        + vx * turbulence;
      positions[i3 + 1] = centerY
        + (ny * Math.cos(theta) + by * Math.sin(theta * 1.3)) * loopRadius * 0.72
        + vy * (pulseScale * 0.9);
      positions[i3 + 2] = centerZ
        + (nz * Math.cos(theta) + bz * Math.sin(theta)) * loopRadius
        + vz * turbulence;
      this.clampParticleInsideHuman(i3, positions, containmentDamping, containmentPadding);

      const baseColor = group === 0 ? bassColor : (group === 1 ? midColor : highColor);
      const brightness = preset.brightnessBase * brightnessScale
        + this.veinHigh * (1.25 + preset.brightnessGainHigh) * sparkleScale * (0.35 + 0.65 * flicker)
        + this.veinMid * 0.42
        + this.veinBass * 0.16 * this.humanTuning.pulse;

      const colorR = baseColor[0] * (1 - whiteMix) + whiteMix;
      const colorG = baseColor[1] * (1 - whiteMix) + whiteMix;
      const colorB = baseColor[2] * (1 - whiteMix) + whiteMix;
      colors[i3] = Math.min(1, colorR * brightness);
      colors[i3 + 1] = Math.min(1, colorG * brightness);
      colors[i3 + 2] = Math.min(1, colorB * brightness);
    }
  }

  /**
   * Update particle system based on audio data
   * Supports both basic and advanced audio analysis
   */
  update(frequencyBands) {
    if (!this.geometry) return;

    // Extract basic frequency bands
    const {
      bass = 0,
      mid = 0,
      high = 0,
    } = frequencyBands;
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;

    if (this.humanLayerMode) {
      this.time += 0.016;
      this.updateVeinsWbcParticles(bass, mid, high, positions, colors);
      return;
    }

    if (this.geometry && this.geometry.drawRange.count !== this.particleCount) {
      this.geometry.setDrawRange(0, this.particleCount);
    }
    
    // Extract advanced metrics (with defaults for backwards compatibility)
    const spectralCentroid = frequencyBands.spectralCentroid || 0;
    const spectralFlux = frequencyBands.spectralFlux || 0;
    const rms = frequencyBands.rms || ((bass + mid + high) / 3);
    const isBeat = frequencyBands.isBeat || false;
    const beatIntensity = frequencyBands.beatIntensity || 0;
    const isOnset = frequencyBands.isOnset || false;
    const onsetIntensity = frequencyBands.onsetIntensity || 0;
    const dominantPitch = frequencyBands.dominantPitch || null;
    
    // Extract stereo metrics
    const stereo = frequencyBands.stereo || null;
    const stereoEnabled = stereo && stereo.stereoEnabled && this.settings.stereoEnabled;
    
    // Update stereo state with smoothing
    if (stereoEnabled) {
      const targetWidth = stereo.stereoWidth * this.settings.stereoWidthEffect;
      const targetPan = stereo.panning * this.settings.stereoPanningEffect;
      
      // Less smoothing for more reactive response
      this.stereoWidth = this.stereoWidth * 0.7 + targetWidth * 0.3;
      this.stereoPan = this.stereoPan * 0.7 + targetPan * 0.3;
      
      // Accumulate rotation from panning (more pronounced)
      this.stereoRotation += this.stereoPan * 0.05;
    } else {
      this.stereoWidth *= 0.95; // Decay to zero when disabled
      this.stereoPan *= 0.95;
    }
    
    // Store stereo channel energies for use in particle loop
    let leftEnergy = 0, rightEnergy = 0;
    let leftBass = 0, leftMid = 0, leftHigh = 0;
    let rightBass = 0, rightMid = 0, rightHigh = 0;
    
    if (stereoEnabled && stereo.left && stereo.right) {
      leftBass = stereo.left.bass || 0;
      leftMid = stereo.left.mid || 0;
      leftHigh = stereo.left.high || 0;
      rightBass = stereo.right.bass || 0;
      rightMid = stereo.right.mid || 0;
      rightHigh = stereo.right.high || 0;
      leftEnergy = (leftBass + leftMid + leftHigh) / 3;
      rightEnergy = (rightBass + rightMid + rightHigh) / 3;
    }
    
    const animSpeed = this.settings.animationSpeed;
    const expansion = this.settings.expansion;
    const shape = this.settings.shape;
    
    this.time += 0.016 * animSpeed;

    // ============ Beat Pulse Effect ============
    if (this.settings.beatReactive && isBeat) {
      this.beatPulse = Math.min(1.0, this.beatPulse + beatIntensity * this.settings.beatPulseIntensity);
    }
    this.beatPulse *= this.beatDecay;
    
    // ============ Onset Flash Effect ============
    if (this.settings.onsetFlash && isOnset) {
      this.onsetFlash = Math.min(1.0, this.onsetFlash + onsetIntensity * 0.8);
    }
    this.onsetFlash *= this.onsetDecay;

    // ============ RMS Scale Factor ============
    const rmsScale = this.settings.rmsScale ? (0.8 + rms * 0.4) : 1.0;

    // ============ Spectral Color ============
    let spectralColor = null;
    if (this.settings.spectralColorMode === 'centroid') {
      spectralColor = centroidToColor(spectralCentroid);
    } else if (this.settings.spectralColorMode === 'chroma' && dominantPitch) {
      spectralColor = pitchClassToColor(dominantPitch.pitchClass);
    }

    // Global rotation (enhanced by beat and stereo panning)
    const rotSpeed = this.settings.rotationSpeed;
    const beatRotBoost = this.beatPulse * 0.02;
    const stereoRotBoost = stereoEnabled ? this.stereoPan * 0.04 : 0;
    this.points.rotation.y += rotSpeed + mid * rotSpeed * 5 + beatRotBoost + stereoRotBoost;

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

      // ============ Beat Pulse Radial Expansion ============
      const beatPulseOffset = this.beatPulse * 30 * this.settings.beatPulseIntensity;

      // Special animation for atom shape - orbital motion
      if (shape === 'atom' && group === 1) {
        const orbitRadius = this.velocities[i3];
        const tilt = this.velocities[i3 + 1];
        const baseAngle = this.velocities[i3 + 2];
        const angle = baseAngle + this.time * (1 + mid * 3);
        
        const orbitScale = (1 + mid * 0.3) * rmsScale + this.beatPulse * 0.2;
        positions[i3] = orbitRadius * Math.cos(angle) * orbitScale;
        positions[i3 + 1] = orbitRadius * Math.sin(angle) * Math.cos(tilt) * orbitScale;
        positions[i3 + 2] = orbitRadius * Math.sin(angle) * Math.sin(tilt) * orbitScale;
        
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
          const helixRadius = 60 * expansion * (1 + bass * 0.3) * rmsScale;
          positions[i3] = helixRadius * Math.cos(newAngle) + waveOffset + normalizedX * beatPulseOffset;
          positions[i3 + 2] = helixRadius * Math.sin(newAngle) + normalizedZ * beatPulseOffset;
        }
        
        colorIntensity = group === 0 ? bass : (group === 1 ? mid : high);
        baseColor = group === 0 ? this.bandColors.bass : (group === 1 ? this.bandColors.mid : this.bandColors.high);
      }
      // Standard animation for other shapes
      else {
        if (group === 0) {
          const bassEffect = bass * 100 * expansion;
          const pulse = Math.sin(this.time * 3 * animSpeed + phase) * 0.5 + 0.5;
          const radialOffset = bassEffect * pulse * rmsScale;
          const waveOffset = Math.sin(this.time * 2 + distance * 0.02) * bass * 30;

          offsetX = normalizedX * (radialOffset + waveOffset + beatPulseOffset);
          offsetY = normalizedY * (radialOffset + waveOffset + beatPulseOffset);
          offsetZ = normalizedZ * (radialOffset + waveOffset + beatPulseOffset);

          colorIntensity = bass;
          baseColor = this.bandColors.bass;
        }
        else if (group === 1) {
          const midEffect = mid * 60 * expansion * rmsScale;
          const swirl = this.time * 2 * animSpeed + phase;
          
          offsetX = Math.sin(swirl) * midEffect * this.velocities[i3] * 15;
          offsetY = Math.cos(swirl * 0.7) * midEffect * this.velocities[i3 + 1] * 15;
          offsetZ = Math.sin(swirl * 1.3) * midEffect * this.velocities[i3 + 2] * 15;

          const radialOffset = mid * 50 * (Math.sin(this.time * animSpeed + phase) * 0.5 + 0.5);
          offsetX += normalizedX * (radialOffset + beatPulseOffset * 0.5);
          offsetY += normalizedY * (radialOffset + beatPulseOffset * 0.5);
          offsetZ += normalizedZ * (radialOffset + beatPulseOffset * 0.5);

          colorIntensity = mid;
          baseColor = this.bandColors.mid;
        }
        else {
          const highEffect = high * 70 * expansion * rmsScale;
          const sparkle = Math.sin(this.time * 10 * animSpeed + phase);
          const twinkle = Math.random() < high * 0.4 ? 2.5 : 1;

          offsetX = this.velocities[i3] * highEffect * sparkle * twinkle;
          offsetY = this.velocities[i3 + 1] * highEffect * sparkle * twinkle;
          offsetZ = this.velocities[i3 + 2] * highEffect * sparkle * twinkle;

          const radialOffset = high * 40 * (Math.sin(this.time * 5 * animSpeed + phase) * 0.5 + 0.5);
          offsetX += normalizedX * (radialOffset + beatPulseOffset * 0.3);
          offsetY += normalizedY * (radialOffset + beatPulseOffset * 0.3);
          offsetZ += normalizedZ * (radialOffset + beatPulseOffset * 0.3);

          colorIntensity = high;
          baseColor = this.bandColors.high;
        }

        positions[i3] = baseX + offsetX;
        positions[i3 + 1] = baseY + offsetY;
        positions[i3 + 2] = baseZ + offsetZ;
        
        // ============ Subtle Stereo Position Effect ============
        if (stereoEnabled && this.settings.stereoSeparation) {
          const isLeftSide = positions[i3] < 0;
          const stereoIntensity = this.settings.stereoWidthEffect * 0.3; // Reduced spatial effect
          
          // Gentle per-channel movement (not too spread out)
          if (isLeftSide) {
            positions[i3] -= leftEnergy * 15 * stereoIntensity;
          } else {
            positions[i3] += rightEnergy * 15 * stereoIntensity;
          }
          
          // Subtle panning drift
          positions[i3] += this.stereoPan * 10 * stereoIntensity;
        }
      }

      // ============ Apply Color with Advanced Features ============
      let brightness = 0.4 + colorIntensity * 1.8;
      
      // Add onset flash brightness
      brightness += this.onsetFlash * 0.6;
      
      // Calculate final color
      let finalR, finalG, finalB;
      
      if (spectralColor && this.settings.spectralColorIntensity > 0) {
        // Blend base color with spectral color
        const blend = this.settings.spectralColorIntensity;
        finalR = baseColor[0] * (1 - blend) + spectralColor[0] * blend;
        finalG = baseColor[1] * (1 - blend) + spectralColor[1] * blend;
        finalB = baseColor[2] * (1 - blend) + spectralColor[2] * blend;
      } else {
        finalR = baseColor[0];
        finalG = baseColor[1];
        finalB = baseColor[2];
      }
      
      // ============ Enhanced Stereo Color & Brightness Effects ============
      if (stereoEnabled && this.settings.stereoSeparation) {
        const isLeftSide = positions[i3] < 0;
        const stereoColorIntensity = this.settings.stereoColorIntensity || 0.7;
        
        // Calculate channel-specific intensity for reactive brightness
        const channelEnergy = isLeftSide ? leftEnergy : rightEnergy;
        const channelBass = isLeftSide ? leftBass : rightBass;
        const channelMid = isLeftSide ? leftMid : rightMid;
        const channelHigh = isLeftSide ? leftHigh : rightHigh;
        
        // Reactive brightness based on channel energy (opacity effect via brightness)
        const channelBrightness = 0.6 + channelEnergy * 1.5;
        brightness *= channelBrightness;
        
        // Color shifts based on frequencies
        if (isLeftSide) {
          // Left: Cyan/Blue palette - reacts to left channel
          const blueShift = stereoColorIntensity * (0.3 + channelEnergy * 0.7);
          const cyanShift = stereoColorIntensity * channelHigh * 0.5;
          const purpleShift = stereoColorIntensity * channelBass * 0.4;
          
          finalR *= (1 - blueShift * 0.5 + purpleShift);
          finalG *= (1 + cyanShift * 0.6 + channelMid * 0.3);
          finalB *= (1 + blueShift * 0.8);
        } else {
          // Right: Orange/Red palette - reacts to right channel
          const redShift = stereoColorIntensity * (0.3 + channelEnergy * 0.7);
          const yellowShift = stereoColorIntensity * channelHigh * 0.5;
          const orangeShift = stereoColorIntensity * channelMid * 0.4;
          
          finalR *= (1 + redShift * 0.8);
          finalG *= (1 + yellowShift * 0.5 + orangeShift * 0.3);
          finalB *= (1 - redShift * 0.5);
        }
        
        // Extra sparkle on high energy moments
        if (channelEnergy > 0.6) {
          const sparkle = 1 + (channelEnergy - 0.6) * 1.5;
          finalR *= sparkle;
          finalG *= sparkle;
          finalB *= sparkle;
        }
      }
      
      // Apply brightness and beat pulse color boost
      const beatColorBoost = 1 + this.beatPulse * 0.5;
      colors[i3] = Math.min(finalR * brightness * beatColorBoost, 1.0);
      colors[i3 + 1] = Math.min(finalG * brightness * beatColorBoost, 1.0);
      colors[i3 + 2] = Math.min(finalB * brightness * beatColorBoost, 1.0);
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    // Update material size with stereo reactivity
    if (this.settings.reactiveSize) {
      const energy = (bass + mid + high) / 3;
      const beatSizeBoost = this.beatPulse * 3;
      
      // Stereo size boost - particles grow with stereo width
      let stereoSizeBoost = 0;
      if (stereoEnabled) {
        const maxChannelEnergy = Math.max(leftEnergy, rightEnergy);
        stereoSizeBoost = this.stereoWidth * 2 + maxChannelEnergy * 2;
      }
      
      this.material.size = this.settings.particleSize + energy * 5 + beatSizeBoost + stereoSizeBoost;
    } else {
      this.material.size = this.settings.particleSize;
    }
    
    // Update material opacity based on stereo activity
    if (stereoEnabled && this.material) {
      const stereoOpacity = 0.7 + this.stereoWidth * 0.3 + Math.max(leftEnergy, rightEnergy) * 0.2;
      this.material.opacity = Math.min(stereoOpacity, 1.0) * this.settings.particleOpacity;
    } else if (this.material) {
      this.material.opacity = this.settings.particleOpacity;
    }

    // Update trails
    if (!this.humanLayerMode && this.settings.trails && this.trailLines && this.trailLines.visible) {
      this.updateTrails(positions, colors);
    }

    // Update connections
    if (!this.humanLayerMode && this.settings.connections && this.connectionLines && this.connectionLines.visible) {
      this.updateConnections(positions, colors, bass + mid + high);
    }
  }

  /**
   * Update trail positions with decay effect
   */
  updateTrails(positions, colors) {
    if (!this.trailGeometry || !this.trailParticleIndices) return;
    
    const trailLength = this.trailMaxLength;
    const trailDecay = this.settings.trailDecay;
    const trailPositions = this.trailGeometry.attributes.position.array;
    const trailColors = this.trailGeometry.attributes.color.array;
    const trailParticleCount = this.trailParticleIndices.length;
    
    // Increment frame counter - only add new positions every few frames for smoother trails
    this.trailFrameCounter = (this.trailFrameCounter || 0) + 1;
    const addNewPosition = this.trailFrameCounter % 2 === 0; // Add every 2 frames
    
    let vertexIndex = 0;
    
    for (let i = 0; i < trailParticleCount; i++) {
      const particleIndex = this.trailParticleIndices[i];
      const i3 = particleIndex * 3;
      
      // Ring buffer indices for this trail particle
      const bufferOffset = i * trailLength;
      const bufferOffset3 = bufferOffset * 3;
      
      // Apply decay to all trail points in this particle's buffer
      for (let j = 0; j < trailLength; j++) {
        const alphaIdx = bufferOffset + j;
        if (this.trailAlphaBuffers[alphaIdx] > 0) {
          this.trailAlphaBuffers[alphaIdx] *= trailDecay;
          if (this.trailAlphaBuffers[alphaIdx] < 0.05) {
            this.trailAlphaBuffers[alphaIdx] = 0;
            if (this.trailLengths[i] > 0) this.trailLengths[i]--;
          }
        }
      }
      
      // Add current position to ring buffer
      if (addNewPosition) {
        const head = this.trailHeadIndices[i];
        const posOffset = bufferOffset3 + head * 3;
        
        // Store new position at head
        this.trailPositionBuffers[posOffset] = positions[i3];
        this.trailPositionBuffers[posOffset + 1] = positions[i3 + 1];
        this.trailPositionBuffers[posOffset + 2] = positions[i3 + 2];
        this.trailAlphaBuffers[bufferOffset + head] = 1.0;
        
        // Advance head (ring buffer wrap)
        this.trailHeadIndices[i] = (head + 1) % trailLength;
        if (this.trailLengths[i] < trailLength) this.trailLengths[i]++;
      }
      
      // Read ring buffer in order (from oldest to newest) to create line segments
      const len = this.trailLengths[i];
      if (len < 2) continue;
      
      const head = this.trailHeadIndices[i];
      
      // Get color based on particle group
      const color = this.particleGroups[particleIndex] === 0 ? this.bandColors.bass :
                   (this.particleGroups[particleIndex] === 1 ? this.bandColors.mid : this.bandColors.high);
      
      // Create line segments from ring buffer
      for (let j = 0; j < len - 1; j++) {
        // Oldest is at (head - len + trailLength) % trailLength
        const idx1 = (head - len + j + trailLength) % trailLength;
        const idx2 = (head - len + j + 1 + trailLength) % trailLength;
        
        const alpha1 = this.trailAlphaBuffers[bufferOffset + idx1];
        const alpha2 = this.trailAlphaBuffers[bufferOffset + idx2];
        
        // Skip very faded segments
        if (alpha1 < 0.05 && alpha2 < 0.05) continue;
        
        const p1Offset = bufferOffset3 + idx1 * 3;
        const p2Offset = bufferOffset3 + idx2 * 3;
        
        // Skip if positions are the same (no movement)
        const dx = this.trailPositionBuffers[p1Offset] - this.trailPositionBuffers[p2Offset];
        const dy = this.trailPositionBuffers[p1Offset + 1] - this.trailPositionBuffers[p2Offset + 1];
        const dz = this.trailPositionBuffers[p1Offset + 2] - this.trailPositionBuffers[p2Offset + 2];
        if (dx * dx + dy * dy + dz * dz < 0.01) continue;
        
        trailPositions[vertexIndex] = this.trailPositionBuffers[p1Offset];
        trailPositions[vertexIndex + 1] = this.trailPositionBuffers[p1Offset + 1];
        trailPositions[vertexIndex + 2] = this.trailPositionBuffers[p1Offset + 2];
        
        trailPositions[vertexIndex + 3] = this.trailPositionBuffers[p2Offset];
        trailPositions[vertexIndex + 4] = this.trailPositionBuffers[p2Offset + 1];
        trailPositions[vertexIndex + 5] = this.trailPositionBuffers[p2Offset + 2];
        
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
          
          connectionColors[lineOffset] = colors[i3_1] * alpha;
          connectionColors[lineOffset + 1] = colors[i3_1 + 1] * alpha;
          connectionColors[lineOffset + 2] = colors[i3_1 + 2] * alpha;
          
          connectionColors[lineOffset + 3] = colors[i3_2] * alpha;
          connectionColors[lineOffset + 4] = colors[i3_2 + 1] * alpha;
          connectionColors[lineOffset + 5] = colors[i3_2 + 2] * alpha;
          
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
      this.material.opacity = this.settings.particleOpacity;
      
      // Update texture if particle shape changed
      if (!this.humanLayerMode && oldParticleShape !== this.settings.particleShape) {
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
        // Clear ring buffer arrays
        this.trailPositionBuffers = null;
        this.trailAlphaBuffers = null;
        this.trailHeadIndices = null;
        this.trailLengths = null;
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

    if (this.trailLines) {
      this.trailLines.visible = this.settings.trails && !this.humanLayerMode;
    }
    if (this.connectionLines) {
      this.connectionLines.visible = this.settings.connections && !this.humanLayerMode;
    }

    // Update connection material opacity
    if (this.connectionMaterial) {
      this.connectionMaterial.opacity = this.settings.connectionOpacity;
    }

    console.log('[ParticleSystem] Settings updated:', this.settings);
  }

  /**
   * Enable/disable stencil mask (used by Human Layer)
   * @param {boolean} enabled
   */
  setStencilMask(enabled) {
    const configureMaterial = (material) => {
      if (!material) return;
      material.stencilWrite = false;
      material.stencilTest = enabled;
      material.stencilRef = 1;
      material.stencilFunc = THREE.EqualStencilFunc;
      material.stencilFail = THREE.KeepStencilOp;
      material.stencilZFail = THREE.KeepStencilOp;
      material.stencilZPass = THREE.KeepStencilOp;
      material.needsUpdate = true;
    };
    
    configureMaterial(this.material);
    configureMaterial(this.trailMaterial);
    configureMaterial(this.connectionMaterial);
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

    if (this.trailLines) {
      this.trailLines.visible = this.settings.trails && !this.humanLayerMode;
    }
    if (this.connectionLines) {
      this.connectionLines.visible = this.settings.connections && !this.humanLayerMode;
    }
    
    console.log('[ParticleSystem] Particles regenerated');
  }

  /**
   * Update theme/palette
   */
  updateTheme(palette) {
    this.palette = palette;
    this.updateBandColors();

    if (this.humanLayerMode) {
      const colors = this.geometry.attributes.color.array;
      const preset = this.humanPreset || HUMAN_PARTICLE_PRESETS[HUMAN_DEFAULT_PRESET_ID];
      const whiteMix = preset.whiteMixBase + this.veinHigh * preset.whiteMixHighGain * this.humanTuning.sparkle;
      const count = this.humanActiveCount;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const group = this.particleGroups[i];
        const baseColor = group === 0
          ? this.bandColors.bass
          : (group === 1 ? this.bandColors.mid : this.bandColors.high);

        colors[i3] = baseColor[0] * (1 - whiteMix) + whiteMix;
        colors[i3 + 1] = baseColor[1] * (1 - whiteMix) + whiteMix;
        colors[i3 + 2] = baseColor[2] * (1 - whiteMix) + whiteMix;
      }

      for (let i = count * 3; i < colors.length; i++) {
        colors[i] = 0;
      }

      this.geometry.attributes.color.needsUpdate = true;
      console.log('[ParticleSystem] Theme updated');
      return;
    }

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
    this.veinPathIndices = new Uint16Array(count);
    this.veinPathSecondaryIndices = new Uint16Array(count);
    this.veinProgress = new Float32Array(count);
    this.veinSpeed = new Float32Array(count);
    this.veinRadius = new Float32Array(count);
    this.veinSwirlRate = new Float32Array(count);
    this.veinPulseOffset = new Float32Array(count);
    this.veinJitter = new Float32Array(count);
    this.updateHumanActiveCount();

    this.createParticles();
    
    if (this.settings.trails && this.trailLines) {
      this.scene.remove(this.trailLines);
      this.trailGeometry.dispose();
      this.trailMaterial.dispose();
      this.createTrailSystem();
    }

    if (this.trailLines) {
      this.trailLines.visible = this.settings.trails && !this.humanLayerMode;
    }
    if (this.connectionLines) {
      this.connectionLines.visible = this.settings.connections && !this.humanLayerMode;
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

    this.veinPathPositions = null;
    this.veinPathTangents = null;
    this.veinPathIndices = null;
    this.veinPathSecondaryIndices = null;
    this.veinProgress = null;
    this.veinSpeed = null;
    this.veinRadius = null;
    this.veinSwirlRate = null;
    this.veinPulseOffset = null;
    this.veinJitter = null;
    this.bodyCapsules = null;
    this.bodyCapsuleLookup = null;
    this.activeContainmentCapsules = null;
  }
}

export default ParticleSystem;
