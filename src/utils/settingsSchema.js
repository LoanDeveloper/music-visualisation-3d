/**
 * Central settings schema with metadata for UI generation
 * This is the single source of truth for all visualization settings
 */

/**
 * Setting field types
 */
export const FieldType = {
  SLIDER: 'slider',
  SWITCH: 'switch',
  SELECT: 'select',
  NUMBER: 'number',
};

/**
 * Settings sections for accordion grouping
 */
export const SettingsSections = {
  AUDIO: 'audio',
  PARTICLES: 'particles',
  DISTRIBUTION: 'distribution',
  ANIMATION: 'animation',
  TRAILS: 'trails',
  CONNECTIONS: 'connections',
  ADVANCED: 'advanced',
  STEREO: 'stereo',
};

/**
 * Section metadata for UI
 */
export const SECTION_META = {
  [SettingsSections.AUDIO]: {
    label: 'Audio',
    description: 'Sensibilite et reponse frequentielle',
    icon: 'Volume2',
    defaultOpen: true,
  },
  [SettingsSections.PARTICLES]: {
    label: 'Particules',
    description: 'Apparence des particules',
    icon: 'Sparkles',
    defaultOpen: false,
  },
  [SettingsSections.DISTRIBUTION]: {
    label: 'Distribution',
    description: 'Forme et repartition spatiale',
    icon: 'Shapes',
    defaultOpen: false,
  },
  [SettingsSections.ANIMATION]: {
    label: 'Animation',
    description: 'Vitesse et mouvement',
    icon: 'Play',
    defaultOpen: false,
  },
  [SettingsSections.TRAILS]: {
    label: 'Trainees',
    description: 'Effets de trainees lumineuses',
    icon: 'Wind',
    defaultOpen: false,
  },
  [SettingsSections.CONNECTIONS]: {
    label: 'Connexions',
    description: 'Lignes entre particules proches',
    icon: 'Link',
    defaultOpen: false,
  },
  [SettingsSections.ADVANCED]: {
    label: 'Analyse avancee',
    description: 'Detection de beats et analyse spectrale',
    icon: 'Activity',
    defaultOpen: false,
  },
  [SettingsSections.STEREO]: {
    label: 'Stereo',
    description: 'Effets stereo gauche/droite',
    icon: 'Headphones',
    defaultOpen: false,
  },
};

/**
 * Complete settings schema
 * Each field has: type, label, section, default, and type-specific props
 */
export const SETTINGS_SCHEMA = {
  // === AUDIO SECTION ===
  sensitivity: {
    type: FieldType.SLIDER,
    section: SettingsSections.AUDIO,
    label: 'Sensibilite globale',
    default: 1.5,
    min: 0.1,
    max: 3.0,
    step: 0.1,
  },
  bassIntensity: {
    type: FieldType.SLIDER,
    section: SettingsSections.AUDIO,
    label: 'Intensite basses',
    default: 1.4,
    min: 0.0,
    max: 3.0,
    step: 0.1,
  },
  midIntensity: {
    type: FieldType.SLIDER,
    section: SettingsSections.AUDIO,
    label: 'Intensite mediums',
    default: 1.6,
    min: 0.0,
    max: 3.0,
    step: 0.1,
  },
  highIntensity: {
    type: FieldType.SLIDER,
    section: SettingsSections.AUDIO,
    label: 'Intensite aigus',
    default: 1.8,
    min: 0.0,
    max: 3.0,
    step: 0.1,
  },
  smoothing: {
    type: FieldType.SLIDER,
    section: SettingsSections.AUDIO,
    label: 'Lissage temporel',
    default: 0.65,
    min: 0.1,
    max: 0.95,
    step: 0.05,
  },

  // === PARTICLES SECTION ===
  particleCount: {
    type: FieldType.SLIDER,
    section: SettingsSections.PARTICLES,
    label: 'Nombre de particules',
    default: 12000,
    min: 1000,
    max: 50000,
    step: 1000,
  },
  particleSize: {
    type: FieldType.SLIDER,
    section: SettingsSections.PARTICLES,
    label: 'Taille',
    default: 3,
    min: 0.5,
    max: 10,
    step: 0.5,
  },
  particleShape: {
    type: FieldType.SELECT,
    section: SettingsSections.PARTICLES,
    label: 'Forme',
    default: 'circle',
    options: [
      { value: 'circle', label: 'Cercle' },
      { value: 'square', label: 'Carre' },
      { value: 'star', label: 'Etoile' },
      { value: 'triangle', label: 'Triangle' },
      { value: 'ring', label: 'Anneau' },
    ],
  },
  reactiveSize: {
    type: FieldType.SWITCH,
    section: SettingsSections.PARTICLES,
    label: 'Taille reactive',
    default: true,
  },

  // === DISTRIBUTION SECTION ===
  shape: {
    type: FieldType.SELECT,
    section: SettingsSections.DISTRIBUTION,
    label: 'Distribution',
    default: 'sphere',
    options: [
      { value: 'sphere', label: 'Sphere' },
      { value: 'spiral', label: 'Spirale' },
      { value: 'atom', label: 'Atome' },
      { value: 'quantum', label: 'Quantique' },
      { value: 'dna', label: 'ADN' },
    ],
  },
  expansion: {
    type: FieldType.SLIDER,
    section: SettingsSections.DISTRIBUTION,
    label: 'Expansion',
    default: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.1,
  },

  // === ANIMATION SECTION ===
  rotationSpeed: {
    type: FieldType.SLIDER,
    section: SettingsSections.ANIMATION,
    label: 'Vitesse de rotation',
    default: 0.003,
    min: 0,
    max: 0.02,
    step: 0.001,
  },
  animationSpeed: {
    type: FieldType.SLIDER,
    section: SettingsSections.ANIMATION,
    label: 'Vitesse animation',
    default: 1.0,
    min: 0.1,
    max: 2.0,
    step: 0.1,
  },

  // === TRAILS SECTION ===
  trails: {
    type: FieldType.SWITCH,
    section: SettingsSections.TRAILS,
    label: 'Activer les trainees',
    default: false,
  },
  trailLength: {
    type: FieldType.SLIDER,
    section: SettingsSections.TRAILS,
    label: 'Longueur',
    default: 8,
    min: 2,
    max: 20,
    step: 1,
    dependsOn: 'trails',
  },
  trailDecay: {
    type: FieldType.SLIDER,
    section: SettingsSections.TRAILS,
    label: 'Persistance',
    default: 0.92,
    min: 0.8,
    max: 0.98,
    step: 0.01,
    dependsOn: 'trails',
  },
  trailWidth: {
    type: FieldType.SLIDER,
    section: SettingsSections.TRAILS,
    label: 'Epaisseur',
    default: 1,
    min: 0.5,
    max: 3,
    step: 0.5,
    dependsOn: 'trails',
  },

  // === CONNECTIONS SECTION ===
  connections: {
    type: FieldType.SWITCH,
    section: SettingsSections.CONNECTIONS,
    label: 'Activer les connexions',
    default: false,
  },
  connectionDistance: {
    type: FieldType.SLIDER,
    section: SettingsSections.CONNECTIONS,
    label: 'Distance max',
    default: 30,
    min: 10,
    max: 100,
    step: 5,
    dependsOn: 'connections',
  },
  connectionOpacity: {
    type: FieldType.SLIDER,
    section: SettingsSections.CONNECTIONS,
    label: 'Opacite',
    default: 0.3,
    min: 0.1,
    max: 1.0,
    step: 0.1,
    dependsOn: 'connections',
  },
  connectionMaxCount: {
    type: FieldType.SLIDER,
    section: SettingsSections.CONNECTIONS,
    label: 'Nombre max',
    default: 500,
    min: 100,
    max: 2000,
    step: 100,
    dependsOn: 'connections',
  },
  connectionLineWidth: {
    type: FieldType.SLIDER,
    section: SettingsSections.CONNECTIONS,
    label: 'Epaisseur ligne',
    default: 1,
    min: 0.5,
    max: 3,
    step: 0.5,
    dependsOn: 'connections',
  },

  // === ADVANCED ANALYSIS SECTION ===
  beatReactive: {
    type: FieldType.SWITCH,
    section: SettingsSections.ADVANCED,
    label: 'Reactivite aux beats',
    default: true,
  },
  beatPulseIntensity: {
    type: FieldType.SLIDER,
    section: SettingsSections.ADVANCED,
    label: 'Intensite pulsation',
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.1,
    dependsOn: 'beatReactive',
  },
  beatSensitivity: {
    type: FieldType.SLIDER,
    section: SettingsSections.ADVANCED,
    label: 'Sensibilite beat',
    default: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.1,
    dependsOn: 'beatReactive',
  },
  onsetFlash: {
    type: FieldType.SWITCH,
    section: SettingsSections.ADVANCED,
    label: 'Flash aux onsets',
    default: true,
  },
  onsetSensitivity: {
    type: FieldType.SLIDER,
    section: SettingsSections.ADVANCED,
    label: 'Sensibilite onset',
    default: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.1,
    dependsOn: 'onsetFlash',
  },
  rmsScale: {
    type: FieldType.SWITCH,
    section: SettingsSections.ADVANCED,
    label: 'Echelle RMS',
    default: true,
  },
  spectralColorMode: {
    type: FieldType.SELECT,
    section: SettingsSections.ADVANCED,
    label: 'Mode couleur spectral',
    default: 'none',
    options: [
      { value: 'none', label: 'Desactive' },
      { value: 'centroid', label: 'Centroide' },
      { value: 'chroma', label: 'Chromatique' },
    ],
  },
  spectralColorIntensity: {
    type: FieldType.SLIDER,
    section: SettingsSections.ADVANCED,
    label: 'Intensite spectrale',
    default: 0.5,
    min: 0.0,
    max: 1.0,
    step: 0.1,
    dependsOn: { key: 'spectralColorMode', notValue: 'none' },
  },
  enableChroma: {
    type: FieldType.SWITCH,
    section: SettingsSections.ADVANCED,
    label: 'Analyse chromatique',
    default: false,
  },

  // === STEREO SECTION ===
  stereoEnabled: {
    type: FieldType.SWITCH,
    section: SettingsSections.STEREO,
    label: 'Activer stereo',
    default: true,
  },
  stereoWidthEffect: {
    type: FieldType.SLIDER,
    section: SettingsSections.STEREO,
    label: 'Effet largeur',
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.1,
    dependsOn: 'stereoEnabled',
  },
  stereoPanningEffect: {
    type: FieldType.SLIDER,
    section: SettingsSections.STEREO,
    label: 'Effet panoramique',
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.1,
    dependsOn: 'stereoEnabled',
  },
  stereoSeparation: {
    type: FieldType.SWITCH,
    section: SettingsSections.STEREO,
    label: 'Separation visuelle',
    default: true,
    dependsOn: 'stereoEnabled',
  },
  stereoColorIntensity: {
    type: FieldType.SLIDER,
    section: SettingsSections.STEREO,
    label: 'Intensite couleur stereo',
    default: 0.7,
    min: 0.0,
    max: 1.0,
    step: 0.1,
    dependsOn: 'stereoEnabled',
  },
};

/**
 * Generate default settings from schema
 * @returns {Object} Default settings object
 */
export function getDefaultSettings() {
  const defaults = {};
  for (const [key, field] of Object.entries(SETTINGS_SCHEMA)) {
    defaults[key] = field.default;
  }
  return defaults;
}

/**
 * Get settings grouped by section
 * @returns {Object} Settings grouped by section key
 */
export function getSettingsBySection() {
  const grouped = {};
  
  for (const [key, field] of Object.entries(SETTINGS_SCHEMA)) {
    const section = field.section;
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push({ key, ...field });
  }
  
  return grouped;
}

/**
 * Validate settings against schema
 * @param {Object} settings Settings to validate
 * @returns {Object} Validated and sanitized settings
 */
export function validateSettings(settings) {
  const validated = {};
  const defaults = getDefaultSettings();
  
  for (const [key, field] of Object.entries(SETTINGS_SCHEMA)) {
    const value = settings[key];
    
    if (value === undefined) {
      validated[key] = defaults[key];
      continue;
    }
    
    switch (field.type) {
      case FieldType.SLIDER:
      case FieldType.NUMBER:
        // Clamp to min/max
        validated[key] = Math.max(field.min, Math.min(field.max, Number(value) || defaults[key]));
        break;
        
      case FieldType.SWITCH:
        validated[key] = Boolean(value);
        break;
        
      case FieldType.SELECT:
        // Ensure value is in options
        const validValues = field.options.map(o => o.value);
        validated[key] = validValues.includes(value) ? value : defaults[key];
        break;
        
      default:
        validated[key] = value;
    }
  }
  
  return validated;
}

/**
 * Check if a setting should be enabled based on dependencies
 * @param {string} key Setting key
 * @param {Object} settings Current settings
 * @returns {boolean} Whether the setting should be enabled
 */
export function isSettingEnabled(key, settings) {
  const field = SETTINGS_SCHEMA[key];
  if (!field || !field.dependsOn) return true;
  
  const dep = field.dependsOn;
  
  // Simple boolean dependency
  if (typeof dep === 'string') {
    return Boolean(settings[dep]);
  }
  
  // Complex dependency with notValue
  if (typeof dep === 'object' && dep.key) {
    if (dep.notValue !== undefined) {
      return settings[dep.key] !== dep.notValue;
    }
    if (dep.value !== undefined) {
      return settings[dep.key] === dep.value;
    }
  }
  
  return true;
}

/**
 * Get section order for UI rendering
 */
export const SECTION_ORDER = [
  SettingsSections.AUDIO,
  SettingsSections.DISTRIBUTION,
  SettingsSections.PARTICLES,
  SettingsSections.ANIMATION,
  SettingsSections.TRAILS,
  SettingsSections.CONNECTIONS,
  SettingsSections.ADVANCED,
  SettingsSections.STEREO,
];
