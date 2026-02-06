/**
 * Human Layer Presets Configuration
 * Pure config - no Three.js imports
 * 
 * Each preset defines how bass/mid/high frequencies map to
 * Body, Veins, Brain, Heart layer opacities and effects.
 */

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const driveBand = (value, gain = 1.8, curve = 0.8) => {
  const driven = clamp01(value * gain);
  return Math.pow(driven, curve);
};

// Layer visibility minimum values (always slightly visible when enabled)
export const LAYER_MINIMUMS = {
  body: 0.20,
  veins: 0.07,
  brain: 0.06,
  heart: 0.08,
};

// Smoothing factor for frequency band interpolation
export const SMOOTHING_FACTOR = 0.12;

// Default edge threshold angle for EdgesGeometry (in degrees)
export const EDGE_THRESHOLD_ANGLE = 34;

// Pose crossfade duration (in seconds)
// Set to 0 to avoid double arms/legs visibility between poses
export const POSE_CROSSFADE_DURATION = 0;

/**
 * Preset definitions
 * Each preset has:
 * - name: Display name for UI
 * - description: Brief description
 * - compute: Function that takes smoothed bands (sb, sm, sh) 
 *   and returns layer parameters
 */
export const HUMAN_PRESETS = {
  'veines-flow': {
    id: 'veines-flow',
    name: 'Veines Flow',
    description: 'La musique voyage a travers les veines',
    compute: (sb, sm, sh) => {
      const b = driveBand(sb, 2.15, 0.74);
      const m = driveBand(sm, 1.95, 0.80);
      const h = driveBand(sh, 1.75, 0.90);
      const vesselEnergy = clamp01(0.58 * b + 0.32 * m + 0.10 * h);
      return {
        bodyOpacity: clamp01(LAYER_MINIMUMS.body + 0.24 * (0.45 * b + 0.55 * m)),
        veinsOpacity: clamp01(LAYER_MINIMUMS.veins + 0.74 * vesselEnergy),
        brainOpacity: clamp01(LAYER_MINIMUMS.brain + 0.14 * (0.35 * m + 0.65 * h)),
        heartOpacity: clamp01(LAYER_MINIMUMS.heart + 0.34 * (0.85 * b + 0.15 * m)),
        heartScale: 1 + 0.08 * b,
        veinsFlowSpeed: 0.28 + 1.55 * (0.55 * m + 0.45 * b),
      };
    },
  },
  
  'cerveau-focus': {
    id: 'cerveau-focus',
    name: 'Cerveau Focus',
    description: 'La musique est le cerveau (aigus/mediums)',
    compute: (sb, sm, sh) => {
      const b = driveBand(sb, 1.75, 0.86);
      const m = driveBand(sm, 2.05, 0.76);
      const h = driveBand(sh, 2.25, 0.70);
      const brainEnergy = clamp01(0.68 * h + 0.32 * m);
      return {
        bodyOpacity: clamp01(LAYER_MINIMUMS.body + 0.18 * (0.35 * b + 0.65 * m)),
        veinsOpacity: clamp01(LAYER_MINIMUMS.veins + 0.20 * (0.30 * b + 0.70 * m)),
        brainOpacity: clamp01(LAYER_MINIMUMS.brain + 0.82 * brainEnergy),
        heartOpacity: clamp01(LAYER_MINIMUMS.heart + 0.16 * (0.85 * b + 0.15 * m)),
        heartScale: 1 + 0.03 * b + 0.02 * h,
        veinsFlowSpeed: 0.24 + 0.55 * m + 0.20 * h,
      };
    },
  },
  
  'coeur-core': {
    id: 'coeur-core',
    name: 'Coeur Core',
    description: 'La musique est le coeur (basses)',
    compute: (sb, sm, sh) => {
      const b = driveBand(sb, 2.35, 0.68);
      const m = driveBand(sm, 1.70, 0.86);
      const h = driveBand(sh, 1.45, 1.00);
      const coreEnergy = clamp01(0.86 * b + 0.14 * m);
      return {
        bodyOpacity: clamp01(LAYER_MINIMUMS.body + 0.26 * coreEnergy),
        veinsOpacity: clamp01(LAYER_MINIMUMS.veins + 0.34 * coreEnergy),
        brainOpacity: clamp01(LAYER_MINIMUMS.brain + 0.10 * (0.30 * m + 0.70 * h)),
        heartOpacity: clamp01(LAYER_MINIMUMS.heart + 0.88 * coreEnergy),
        heartScale: 1 + 0.16 * coreEnergy,
        veinsFlowSpeed: 0.25 + 1.05 * coreEnergy,
      };
    },
  },
  
  'reseau-complet': {
    id: 'reseau-complet',
    name: 'Reseau Complet',
    description: 'Silhouette + veines + organes equilibres',
    compute: (sb, sm, sh) => {
      const b = driveBand(sb, 2.00, 0.76);
      const m = driveBand(sm, 1.95, 0.80);
      const h = driveBand(sh, 1.90, 0.84);
      const balance = clamp01(0.40 * b + 0.35 * m + 0.25 * h);
      return {
        bodyOpacity: clamp01(LAYER_MINIMUMS.body + 0.46 * balance),
        veinsOpacity: clamp01(LAYER_MINIMUMS.veins + 0.48 * (0.45 * b + 0.35 * m + 0.20 * h)),
        brainOpacity: clamp01(LAYER_MINIMUMS.brain + 0.46 * (0.30 * m + 0.70 * h)),
        heartOpacity: clamp01(LAYER_MINIMUMS.heart + 0.45 * (0.70 * b + 0.30 * m)),
        heartScale: 1 + 0.09 * (0.70 * b + 0.30 * balance),
        veinsFlowSpeed: 0.25 + 0.90 * (0.45 * m + 0.35 * b + 0.20 * h),
      };
    },
  },
};

// Default preset
export const DEFAULT_PRESET = 'reseau-complet';

// Default pose
export const DEFAULT_POSE = 'open';

// Available poses
export const POSES = {
  open: {
    id: 'open',
    name: 'Bras ouverts',
    modelPath: '/models/human/pose-open.glb',
  },
  closed: {
    id: 'closed',
    name: 'Bras fermes',
    modelPath: '/models/human/pose-closed.glb',
  },
};

// Required mesh names in GLB files
export const REQUIRED_MESHES = ['Body', 'Veins', 'Brain', 'Heart'];

/**
 * Get preset by ID
 * @param {string} presetId 
 * @returns {object|null}
 */
export function getHumanPreset(presetId) {
  return HUMAN_PRESETS[presetId] || null;
}

/**
 * Get all preset IDs
 * @returns {string[]}
 */
export function getHumanPresetIds() {
  return Object.keys(HUMAN_PRESETS);
}

/**
 * Get all presets as array for UI
 * @returns {Array<{id: string, name: string, description: string}>}
 */
export function getHumanPresetsForUI() {
  return Object.values(HUMAN_PRESETS).map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
}
