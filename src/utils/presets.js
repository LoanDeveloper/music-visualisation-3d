/**
 * Preset configurations for the visualizer
 * Each preset contains a complete set of settings
 */

export const BUILT_IN_PRESETS = {
  default: {
    name: 'Default',
    description: 'Configuration equilibree par defaut',
    settings: {
      sensitivity: 1.5,
      bassIntensity: 1.4,
      midIntensity: 1.6,
      highIntensity: 1.8,
      smoothing: 0.65,
      particleCount: 12000,
      particleSize: 3,
      particleShape: 'circle',
      reactiveSize: true,
      rotationSpeed: 0.003,
      animationSpeed: 1.0,
      shape: 'sphere',
      expansion: 1.0,
      trails: false,
      trailLength: 8,
      trailDecay: 0.92,
      trailWidth: 1,
      connections: false,
      connectionDistance: 30,
      connectionOpacity: 0.3,
      connectionMaxCount: 500,
      connectionLineWidth: 1,
    },
  },

  cosmic: {
    name: 'Cosmic',
    description: 'Galaxie avec trainees lumineuses',
    settings: {
      sensitivity: 1.8,
      bassIntensity: 1.5,
      midIntensity: 1.4,
      highIntensity: 2.0,
      smoothing: 0.7,
      particleCount: 15000,
      particleSize: 2.5,
      particleShape: 'circle',
      reactiveSize: true,
      rotationSpeed: 0.005,
      animationSpeed: 0.8,
      shape: 'spiral',
      expansion: 1.2,
      trails: true,
      trailLength: 12,
      trailDecay: 0.88,
      trailWidth: 1.5,
      connections: false,
      connectionDistance: 30,
      connectionOpacity: 0.3,
      connectionMaxCount: 500,
      connectionLineWidth: 1,
    },
  },

  molecular: {
    name: 'Molecular',
    description: 'Structure atomique avec connexions',
    settings: {
      sensitivity: 1.6,
      bassIntensity: 1.8,
      midIntensity: 1.5,
      highIntensity: 1.2,
      smoothing: 0.6,
      particleCount: 8000,
      particleSize: 4,
      particleShape: 'circle',
      reactiveSize: true,
      rotationSpeed: 0.002,
      animationSpeed: 1.2,
      shape: 'atom',
      expansion: 1.0,
      trails: false,
      trailLength: 5,
      trailDecay: 0.9,
      trailWidth: 1,
      connections: true,
      connectionDistance: 50,
      connectionOpacity: 0.5,
      connectionMaxCount: 800,
      connectionLineWidth: 1.5,
    },
  },

  quantum: {
    name: 'Quantum',
    description: 'Nuage de probabilite quantique',
    settings: {
      sensitivity: 2.0,
      bassIntensity: 1.2,
      midIntensity: 1.8,
      highIntensity: 2.2,
      smoothing: 0.5,
      particleCount: 10000,
      particleSize: 2,
      particleShape: 'star',
      reactiveSize: true,
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
    },
  },

  dnaHelix: {
    name: 'DNA Helix',
    description: 'Double helice ADN animee',
    settings: {
      sensitivity: 1.4,
      bassIntensity: 1.6,
      midIntensity: 1.6,
      highIntensity: 1.4,
      smoothing: 0.7,
      particleCount: 10000,
      particleSize: 3,
      particleShape: 'circle',
      reactiveSize: true,
      rotationSpeed: 0.001,
      animationSpeed: 1.0,
      shape: 'dna',
      expansion: 1.0,
      trails: true,
      trailLength: 10,
      trailDecay: 0.9,
      trailWidth: 1,
      connections: true,
      connectionDistance: 40,
      connectionOpacity: 0.4,
      connectionMaxCount: 600,
      connectionLineWidth: 1,
    },
  },

  minimal: {
    name: 'Minimal',
    description: 'Design epure et simple',
    settings: {
      sensitivity: 1.2,
      bassIntensity: 1.0,
      midIntensity: 1.0,
      highIntensity: 1.0,
      smoothing: 0.8,
      particleCount: 5000,
      particleSize: 2,
      particleShape: 'circle',
      reactiveSize: false,
      rotationSpeed: 0.001,
      animationSpeed: 0.6,
      shape: 'sphere',
      expansion: 0.8,
      trails: false,
      trailLength: 5,
      trailDecay: 0.9,
      trailWidth: 1,
      connections: false,
      connectionDistance: 30,
      connectionOpacity: 0.3,
      connectionMaxCount: 500,
      connectionLineWidth: 1,
    },
  },

  intense: {
    name: 'Intense',
    description: 'Maximum de reactivite et effets',
    settings: {
      sensitivity: 2.5,
      bassIntensity: 2.0,
      midIntensity: 2.0,
      highIntensity: 2.5,
      smoothing: 0.5,
      particleCount: 20000,
      particleSize: 3.5,
      particleShape: 'star',
      reactiveSize: true,
      rotationSpeed: 0.01,
      animationSpeed: 1.5,
      shape: 'sphere',
      expansion: 1.5,
      trails: true,
      trailLength: 15,
      trailDecay: 0.95,
      trailWidth: 2,
      connections: true,
      connectionDistance: 35,
      connectionOpacity: 0.4,
      connectionMaxCount: 1000,
      connectionLineWidth: 1,
    },
  },

  network: {
    name: 'Network',
    description: 'Reseau de connexions dense',
    settings: {
      sensitivity: 1.5,
      bassIntensity: 1.3,
      midIntensity: 1.5,
      highIntensity: 1.3,
      smoothing: 0.7,
      particleCount: 6000,
      particleSize: 3,
      particleShape: 'triangle',
      reactiveSize: true,
      rotationSpeed: 0.003,
      animationSpeed: 0.8,
      shape: 'sphere',
      expansion: 0.9,
      trails: false,
      trailLength: 5,
      trailDecay: 0.9,
      trailWidth: 1,
      connections: true,
      connectionDistance: 60,
      connectionOpacity: 0.6,
      connectionMaxCount: 1500,
      connectionLineWidth: 2,
    },
  },
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
