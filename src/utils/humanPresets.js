/**
 * Human Layer Presets Configuration
 * Pure config - no Three.js imports
 * 
 * Each preset defines how bass/mid/high frequencies map to
 * Body, Veins, Brain, Heart layer opacities and effects.
 */

// Layer visibility minimum values (always slightly visible when enabled)
export const LAYER_MINIMUMS = {
  body: 0.05,
  veins: 0.05,
  brain: 0.03,
  heart: 0.05,
};

// Smoothing factor for frequency band interpolation
export const SMOOTHING_FACTOR = 0.12;

// Default edge threshold angle for EdgesGeometry (in degrees)
export const EDGE_THRESHOLD_ANGLE = 20;

// Pose crossfade duration (in seconds)
export const POSE_CROSSFADE_DURATION = 0.5;

/**
 * Preset definitions
 * Each preset has:
 * - name: Display name for UI
 * - description: Brief description
 * - compute: Function that takes smoothed bands (sb, sm, sh) 
 *   and returns layer parameters
 */
export const HUMAN_PRESETS = {
  VEINS_FLOW: {
    id: 'VEINS_FLOW',
    name: 'Veines Flow',
    description: 'La musique voyage a travers les veines',
    compute: (sb, sm, sh) => ({
      bodyOpacity: LAYER_MINIMUMS.body + 0.15 * sb,
      veinsOpacity: LAYER_MINIMUMS.veins + 0.8 * (0.6 * sb + 0.4 * sm),
      brainOpacity: LAYER_MINIMUMS.brain + 0.08 * sh,
      heartOpacity: LAYER_MINIMUMS.heart + 0.2 * sb,
      heartScale: 1 + 0.04 * sb,
      veinsFlowSpeed: 0.2 + 1.2 * (0.7 * sm + 0.3 * sb),
    }),
  },
  
  BRAIN_FOCUS: {
    id: 'BRAIN_FOCUS',
    name: 'Cerveau Focus',
    description: 'La musique est le cerveau (aigus/mediums)',
    compute: (sb, sm, sh) => ({
      bodyOpacity: LAYER_MINIMUMS.body + 0.12 * sm,
      veinsOpacity: LAYER_MINIMUMS.veins + 0.15 * sm,
      brainOpacity: LAYER_MINIMUMS.brain + 0.75 * (0.4 * sm + 0.6 * sh),
      heartOpacity: LAYER_MINIMUMS.heart + 0.12 * sb,
      heartScale: 1 + 0.03 * sb,
      veinsFlowSpeed: 0.2 + 0.4 * sm,
    }),
  },
  
  HEART_CORE: {
    id: 'HEART_CORE',
    name: 'Coeur Core',
    description: 'La musique est le coeur (basses)',
    compute: (sb, sm, sh) => ({
      bodyOpacity: LAYER_MINIMUMS.body + 0.1 * sb,
      veinsOpacity: LAYER_MINIMUMS.veins + 0.4 * sb,
      brainOpacity: LAYER_MINIMUMS.brain + 0.07 * sh,
      heartOpacity: LAYER_MINIMUMS.heart + 0.75 * sb,
      heartScale: 1 + 0.12 * sb,
      veinsFlowSpeed: 0.3 + 0.8 * sb,
    }),
  },
  
  FULL_BODY_NETWORK: {
    id: 'FULL_BODY_NETWORK',
    name: 'Reseau Complet',
    description: 'Silhouette + veines + organes equilibres',
    compute: (sb, sm, sh) => ({
      bodyOpacity: LAYER_MINIMUMS.body + 0.35 * (0.4 * sb + 0.3 * sm + 0.3 * sh),
      veinsOpacity: LAYER_MINIMUMS.veins + 0.4 * (0.4 * sb + 0.4 * sm + 0.2 * sh),
      brainOpacity: LAYER_MINIMUMS.brain + 0.3 * (0.2 * sm + 0.8 * sh),
      heartOpacity: LAYER_MINIMUMS.heart + 0.35 * sb,
      heartScale: 1 + 0.06 * sb,
      veinsFlowSpeed: 0.2 + 0.6 * (0.5 * sb + 0.5 * sm),
    }),
  },
};

// Default preset
export const DEFAULT_PRESET = 'FULL_BODY_NETWORK';

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
