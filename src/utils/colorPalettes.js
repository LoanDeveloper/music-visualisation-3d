// Color palette definitions for different themes
// Colors are in normalized RGB format [r, g, b] where values are 0.0 to 1.0

export const palettes = {
  // ============ MODERN VIBRANT PALETTES ============
  
  aurora: {
    name: 'Aurora',
    description: 'Aurore boreale - tons verts et violets',
    primary: [0.18, 0.85, 0.65],     // Emerald green
    secondary: [0.55, 0.25, 0.85],   // Purple
    accent: [0.95, 0.45, 0.75],      // Pink
    background: 0x050510,
  },
  
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'Neon futuriste - cyan et magenta',
    primary: [0.0, 0.95, 0.95],      // Electric Cyan
    secondary: [0.95, 0.0, 0.55],    // Hot Pink
    accent: [0.95, 0.95, 0.0],       // Neon Yellow
    background: 0x0a0014,
  },
  
  synthwave: {
    name: 'Synthwave',
    description: 'Retro 80s - rose et bleu',
    primary: [1.0, 0.2, 0.6],        // Hot Pink
    secondary: [0.4, 0.2, 1.0],      // Electric Purple
    accent: [0.2, 0.8, 1.0],         // Cyan Blue
    background: 0x0d0221,
  },
  
  // ============ NATURE-INSPIRED PALETTES ============
  
  ocean: {
    name: 'Ocean',
    description: 'Profondeurs marines - bleus et turquoise',
    primary: [0.0, 0.45, 0.85],      // Deep Ocean Blue
    secondary: [0.0, 0.75, 0.75],    // Teal
    accent: [0.4, 0.95, 0.85],       // Aquamarine
    background: 0x000a14,
  },
  
  forest: {
    name: 'Forest',
    description: 'Foret enchantee - verts et or',
    primary: [0.15, 0.7, 0.35],      // Forest Green
    secondary: [0.5, 0.85, 0.3],     // Lime
    accent: [0.95, 0.8, 0.2],        // Gold
    background: 0x050a05,
  },
  
  sunset: {
    name: 'Sunset',
    description: 'Coucher de soleil - orange et violet',
    primary: [1.0, 0.45, 0.15],      // Warm Orange
    secondary: [0.95, 0.25, 0.45],   // Coral
    accent: [0.6, 0.2, 0.8],         // Purple
    background: 0x0f0508,
  },
  
  // ============ FIRE & ENERGY PALETTES ============
  
  inferno: {
    name: 'Inferno',
    description: 'Feu intense - rouge, orange, jaune',
    primary: [0.95, 0.15, 0.05],     // Fire Red
    secondary: [1.0, 0.55, 0.0],     // Bright Orange
    accent: [1.0, 0.95, 0.3],        // Yellow Flame
    background: 0x100200,
  },
  
  plasma: {
    name: 'Plasma',
    description: 'Energie plasma - violet et rose',
    primary: [0.7, 0.1, 0.95],       // Electric Purple
    secondary: [0.95, 0.3, 0.7],     // Magenta
    accent: [0.3, 0.6, 1.0],         // Electric Blue
    background: 0x08000f,
  },
  
  // ============ SOFT & ELEGANT PALETTES ============
  
  ethereal: {
    name: 'Ethereal',
    description: 'Ethere et doux - pastels lumineux',
    primary: [0.75, 0.85, 1.0],      // Soft Blue
    secondary: [0.95, 0.75, 0.9],    // Soft Pink
    accent: [0.8, 1.0, 0.85],        // Mint
    background: 0x0a0a12,
  },
  
  moonlight: {
    name: 'Moonlight',
    description: 'Clair de lune - bleus froids et argent',
    primary: [0.65, 0.75, 0.95],     // Moon Blue
    secondary: [0.85, 0.85, 0.95],   // Silver
    accent: [0.5, 0.65, 0.85],       // Dusty Blue
    background: 0x05080c,
  },
  
  // ============ MONOCHROME & MINIMAL PALETTES ============
  
  noir: {
    name: 'Noir',
    description: 'Noir et blanc - elegant et minimal',
    primary: [0.95, 0.95, 0.95],     // White
    secondary: [0.6, 0.6, 0.65],     // Silver
    accent: [0.35, 0.35, 0.4],       // Dark Gray
    background: 0x000000,
  },
  
  gold: {
    name: 'Gold',
    description: 'Or et bronze - luxe et chaleur',
    primary: [1.0, 0.85, 0.35],      // Gold
    secondary: [0.85, 0.55, 0.25],   // Bronze
    accent: [1.0, 0.95, 0.7],        // Light Gold
    background: 0x0a0804,
  },
  
  // ============ COSMIC PALETTES ============
  
  nebula: {
    name: 'Nebula',
    description: 'Nebuleuse cosmique - violet et rose',
    primary: [0.45, 0.15, 0.75],     // Deep Purple
    secondary: [0.85, 0.35, 0.65],   // Nebula Pink
    accent: [0.3, 0.55, 0.95],       // Star Blue
    background: 0x050008,
  },
  
  cosmic: {
    name: 'Cosmic',
    description: 'Espace profond - bleu et violet',
    primary: [0.25, 0.35, 0.95],     // Deep Blue
    secondary: [0.65, 0.25, 0.85],   // Purple
    accent: [0.9, 0.7, 0.95],        // Lavender
    background: 0x020208,
  },
  
  // ============ LEGACY PALETTES (updated) ============
  
  neon: {
    name: 'Neon',
    description: 'Neon classique - cyan et magenta',
    primary: [0.0, 0.95, 0.9],       // Bright Cyan
    secondary: [0.95, 0.0, 0.85],    // Magenta
    accent: [0.45, 1.0, 0.45],       // Neon Green
    background: 0x000008,
  },
  
  fire: {
    name: 'Fire',
    description: 'Feu classique - rouge et orange',
    primary: [1.0, 0.25, 0.1],       // Red
    secondary: [1.0, 0.6, 0.1],      // Orange
    accent: [1.0, 0.95, 0.4],        // Yellow
    background: 0x0c0200,
  },
  
  pastel: {
    name: 'Pastel',
    description: 'Pastels doux - rose et bleu',
    primary: [1.0, 0.7, 0.8],        // Soft Pink
    secondary: [0.7, 0.85, 1.0],     // Soft Blue
    accent: [0.85, 1.0, 0.8],        // Soft Green
    background: 0x0c0c14,
  },
};

// Get list of all palette names
export const getPaletteNames = () => Object.keys(palettes);

// Get a specific palette by name
export const getPalette = (name) => {
  return palettes[name] || palettes.aurora; // Default to aurora if not found
};

// Linear interpolation between two colors
export const lerpColor = (color1, color2, t) => {
  return [
    color1[0] + (color2[0] - color1[0]) * t,
    color1[1] + (color2[1] - color1[1]) * t,
    color1[2] + (color2[2] - color1[2]) * t,
  ];
};

// Convert normalized RGB to hex color
export const rgbToHex = (rgb) => {
  const r = Math.floor(rgb[0] * 255);
  const g = Math.floor(rgb[1] * 255);
  const b = Math.floor(rgb[2] * 255);
  return (r << 16) | (g << 8) | b;
};

// Get a color gradient based on audio intensity (0-1)
export const getIntensityColor = (palette, intensity) => {
  // Interpolate between primary, secondary, and accent based on intensity
  if (intensity < 0.5) {
    // 0-0.5: primary to secondary
    return lerpColor(palette.primary, palette.secondary, intensity * 2);
  } else {
    // 0.5-1.0: secondary to accent
    return lerpColor(palette.secondary, palette.accent, (intensity - 0.5) * 2);
  }
};

// Get a triadic color blend (useful for advanced visualization)
export const getTriadicBlend = (palette, t1, t2, t3) => {
  const total = t1 + t2 + t3;
  if (total === 0) return palette.primary;
  
  return [
    (palette.primary[0] * t1 + palette.secondary[0] * t2 + palette.accent[0] * t3) / total,
    (palette.primary[1] * t1 + palette.secondary[1] * t2 + palette.accent[1] * t3) / total,
    (palette.primary[2] * t1 + palette.secondary[2] * t2 + palette.accent[2] * t3) / total,
  ];
};

// Adjust color brightness
export const adjustBrightness = (color, factor) => {
  return [
    Math.min(color[0] * factor, 1.0),
    Math.min(color[1] * factor, 1.0),
    Math.min(color[2] * factor, 1.0),
  ];
};

// Get complementary color
export const getComplementary = (color) => {
  return [
    1.0 - color[0],
    1.0 - color[1],
    1.0 - color[2],
  ];
};
