import { palettes, getPaletteNames } from '../utils/colorPalettes';
import './ThemeSelector.css';

/**
 * ThemeSelector component
 * Allows user to switch between color themes
 */
const ThemeSelector = ({ currentTheme, onThemeChange }) => {
  const paletteNames = getPaletteNames();

  const getColorPreview = (paletteName) => {
    const palette = palettes[paletteName];
    const colors = [palette.primary, palette.secondary, palette.accent];

    return (
      <div className="color-preview">
        {colors.map((color, index) => (
          <div
            key={index}
            className="color-dot"
            style={{
              backgroundColor: `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="theme-selector">
      <div className="theme-label">Thèmes</div>
      <div className="theme-buttons">
        {paletteNames.map((name) => (
          <button
            key={name}
            className={`theme-button ${currentTheme === name ? 'active' : ''}`}
            onClick={() => onThemeChange(name)}
            title={palettes[name].name}
          >
            {getColorPreview(name)}
            <span className="theme-name">{palettes[name].name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
