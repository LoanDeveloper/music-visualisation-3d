/**
 * Preset configurations for the visualizer
 * Each preset contains a complete set of settings
 * 
 * Note: Settings schema is defined in settingsSchema.js
 * Presets can override any setting from the schema defaults
 */

import { getDefaultSettings } from './settingsSchema';

// Get base defaults from schema
const SCHEMA_DEFAULTS = getDefaultSettings();

/**
 * Create a preset by merging overrides with schema defaults
 * This ensures all presets have complete settings
 */
function createPreset(name, description, overrides = {}) {
  return {
    name,
    description,
    settings: { ...SCHEMA_DEFAULTS, ...overrides },
  };
}

export const BUILT_IN_PRESETS = {
  default: createPreset('Default', 'Configuration equilibree par defaut', {}),

  cosmic: createPreset('Cosmic', 'Galaxie avec trainees lumineuses', {
    sensitivity: 1.8,
    bassIntensity: 1.5,
    midIntensity: 1.4,
    highIntensity: 2.0,
    smoothing: 0.7,
    particleCount: 15000,
    particleSize: 2.5,
    rotationSpeed: 0.005,
    animationSpeed: 0.8,
    shape: 'spiral',
    expansion: 1.2,
    trails: true,
    trailLength: 12,
    trailDecay: 0.88,
    trailWidth: 1.5,
    spectralColorMode: 'centroid',
    spectralColorIntensity: 0.4,
  }),

  molecular: createPreset('Molecular', 'Structure atomique avec connexions', {
    sensitivity: 1.6,
    bassIntensity: 1.8,
    midIntensity: 1.5,
    highIntensity: 1.2,
    smoothing: 0.6,
    particleCount: 8000,
    particleSize: 4,
    rotationSpeed: 0.002,
    animationSpeed: 1.2,
    shape: 'atom',
    connections: true,
    connectionDistance: 50,
    connectionOpacity: 0.5,
    connectionMaxCount: 800,
    connectionLineWidth: 1.5,
    beatPulseIntensity: 1.3,
  }),

  quantum: createPreset('Quantum', 'Nuage de probabilite quantique', {
    sensitivity: 2.0,
    bassIntensity: 1.2,
    midIntensity: 1.8,
    highIntensity: 2.2,
    smoothing: 0.5,
    particleCount: 10000,
    particleSize: 2,
    particleShape: 'star',
    rotationSpeed: 0.008,
    animationSpeed: 1.5,
    shape: 'quantum',
    expansion: 1.3,
    trails: true,
    trailLength: 6,
    trailDecay: 0.85,
    trailWidth: 0.5,
    connections: true,
    connectionDistance: 25,
    connectionOpacity: 0.2,
    connectionMaxCount: 400,
    connectionLineWidth: 0.5,
    spectralColorMode: 'chroma',
    spectralColorIntensity: 0.6,
    enableChroma: true,
  }),

  dnaHelix: createPreset('DNA Helix', 'Double helice ADN animee', {
    sensitivity: 1.4,
    bassIntensity: 1.6,
    midIntensity: 1.6,
    highIntensity: 1.4,
    smoothing: 0.7,
    particleCount: 10000,
    rotationSpeed: 0.001,
    shape: 'dna',
    trails: true,
    trailLength: 10,
    trailDecay: 0.9,
    connections: true,
    connectionDistance: 40,
    connectionOpacity: 0.4,
    connectionMaxCount: 600,
  }),

  minimal: createPreset('Minimal', 'Design epure et simple', {
    sensitivity: 1.2,
    bassIntensity: 1.0,
    midIntensity: 1.0,
    highIntensity: 1.0,
    smoothing: 0.8,
    particleCount: 5000,
    particleSize: 2,
    reactiveSize: false,
    rotationSpeed: 0.001,
    animationSpeed: 0.6,
    expansion: 0.8,
    beatReactive: false,
    onsetFlash: false,
    rmsScale: false,
    stereoEnabled: false,
    stereoSeparation: false,
  }),

  intense: createPreset('Intense', 'Maximum de reactivite et effets', {
    sensitivity: 2.5,
    bassIntensity: 2.0,
    midIntensity: 2.0,
    highIntensity: 2.5,
    smoothing: 0.5,
    particleCount: 20000,
    particleSize: 3.5,
    particleShape: 'star',
    rotationSpeed: 0.01,
    animationSpeed: 1.5,
    expansion: 1.5,
    trails: true,
    trailLength: 15,
    trailDecay: 0.95,
    trailWidth: 2,
    connections: true,
    connectionDistance: 35,
    connectionOpacity: 0.4,
    connectionMaxCount: 1000,
    beatPulseIntensity: 1.8,
    beatSensitivity: 1.5,
    spectralColorMode: 'centroid',
    spectralColorIntensity: 0.7,
  }),

  network: createPreset('Network', 'Reseau de connexions dense', {
    sensitivity: 1.5,
    bassIntensity: 1.3,
    midIntensity: 1.5,
    highIntensity: 1.3,
    smoothing: 0.7,
    particleCount: 6000,
    particleShape: 'triangle',
    rotationSpeed: 0.003,
    animationSpeed: 0.8,
    expansion: 0.9,
    connections: true,
    connectionDistance: 60,
    connectionOpacity: 0.6,
    connectionMaxCount: 1500,
    connectionLineWidth: 2,
    onsetFlash: false,
  }),

  beatSync: createPreset('Beat Sync', 'Synchronisation maximale avec le rythme', {
    sensitivity: 1.8,
    bassIntensity: 2.0,
    midIntensity: 1.2,
    highIntensity: 1.5,
    smoothing: 0.5,
    rotationSpeed: 0.002,
    beatPulseIntensity: 2.0,
    beatSensitivity: 1.2,
    onsetSensitivity: 1.5,
  }),

  spectral: createPreset('Spectral', 'Couleurs basees sur analyse spectrale', {
    sensitivity: 1.6,
    smoothing: 0.6,
    rotationSpeed: 0.004,
    trails: true,
    trailLength: 10,
    trailDecay: 0.9,
    beatPulseIntensity: 0.8,
    spectralColorMode: 'centroid',
    spectralColorIntensity: 0.8,
  }),

  chromatic: createPreset('Chromatic', 'Couleurs basees sur les notes detectees', {
    bassIntensity: 1.3,
    midIntensity: 1.8,
    highIntensity: 1.6,
    particleCount: 10000,
    particleSize: 3.5,
    particleShape: 'star',
    rotationSpeed: 0.003,
    animationSpeed: 0.9,
    shape: 'quantum',
    expansion: 1.1,
    trails: true,
    trailLength: 8,
    trailDecay: 0.88,
    connections: true,
    connectionDistance: 35,
    connectionOpacity: 0.3,
    connectionMaxCount: 600,
    spectralColorMode: 'chroma',
    spectralColorIntensity: 0.9,
    enableChroma: true,
  }),

  stereoWide: createPreset('Stereo Wide', 'Couleurs et reactivite stereo maximales', {
    sensitivity: 1.8,
    bassIntensity: 1.6,
    midIntensity: 1.5,
    highIntensity: 1.7,
    smoothing: 0.55,
    particleCount: 14000,
    expansion: 1.1,
    beatPulseIntensity: 1.2,
    stereoWidthEffect: 1.5,
    stereoPanningEffect: 1.2,
    stereoColorIntensity: 1.0,
  }),
};

/**
 * Get list of preset names
 */
export const getPresetNames = () => Object.keys(BUILT_IN_PRESETS);

/**
 * Get a preset by name
 */
export const getPreset = (name) => BUILT_IN_PRESETS[name] || BUILT_IN_PRESETS.default;

/**
 * Storage key for custom presets
 */
const STORAGE_KEY = 'musicVisualizer_customPresets';

/**
 * Load custom presets from localStorage
 */
export const loadCustomPresets = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to load custom presets:', e);
    return {};
  }
};

/**
 * Save custom preset to localStorage
 */
export const saveCustomPreset = (name, settings) => {
  try {
    const customPresets = loadCustomPresets();
    customPresets[name] = {
      name,
      description: 'Preset personnalise',
      settings: { ...settings },
      createdAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
    return true;
  } catch (e) {
    console.error('Failed to save custom preset:', e);
    return false;
  }
};

/**
 * Delete custom preset from localStorage
 */
export const deleteCustomPreset = (name) => {
  try {
    const customPresets = loadCustomPresets();
    delete customPresets[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
    return true;
  } catch (e) {
    console.error('Failed to delete custom preset:', e);
    return false;
  }
};

/**
 * Get all presets (built-in + custom)
 */
export const getAllPresets = () => {
  const custom = loadCustomPresets();
  return { ...BUILT_IN_PRESETS, ...custom };
};
