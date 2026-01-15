// Color palette definitions for different themes
// Colors are in normalized RGB format [r, g, b] where values are 0.0 to 1.0

export const palettes = {
  neon: {
    name: 'Neon',
    primary: [0.0, 1.0, 1.0],      // Cyan
    secondary: [1.0, 0.0, 1.0],    // Magenta
    accent: [0.0, 1.0, 0.0],       // Green
    background: 0x000000,          // Black
  },
  sunset: {
    name: 'Sunset',
    primary: [1.0, 0.4, 0.0],      // Orange
    secondary: [1.0, 0.0, 0.4],    // Pink
    accent: [0.5, 0.0, 1.0],       // Purple
    background: 0x0a0a1f,          // Dark blue
  },
  ocean: {
    name: 'Ocean',
    primary: [0.0, 0.3, 1.0],      // Deep Blue
    secondary: [0.0, 0.8, 0.8],    // Aqua
    accent: [0.3, 1.0, 0.7],       // Mint
    background: 0x001020,          // Deep ocean blue
  },
  fire: {
    name: 'Fire',
    primary: [1.0, 0.2, 0.0],      // Red
    secondary: [1.0, 0.6, 0.0],    // Yellow-Orange
    accent: [1.0, 1.0, 0.0],       // Yellow
    background: 0x100000,          // Dark red
  },
  pastel: {
    name: 'Pastel',
    primary: [1.0, 0.7, 0.8],      // Pink
    secondary: [0.7, 0.9, 1.0],    // Light Blue
    accent: [0.9, 0.9, 0.7],       // Cream
    background: 0x1a1a2e,          // Dark purple-gray
  },
};

// Get list of all palette names
export const getPaletteNames = () => Object.keys(palettes);

// Get a specific palette by name
export const getPalette = (name) => {
  return palettes[name] || palettes.neon; // Default to neon if not found
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
