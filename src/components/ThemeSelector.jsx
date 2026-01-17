import { palettes, getPaletteNames } from '@/utils/colorPalettes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Color preview dots for a palette
 */
const ColorPreview = ({ palette }) => {
  const colors = [palette.primary, palette.secondary, palette.accent];
  return (
    <div className="flex gap-1">
      {colors.map((color, index) => (
        <div
          key={index}
          className="w-3 h-3 rounded-full shadow-sm"
          style={{
            backgroundColor: `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`,
            boxShadow: `0 0 6px rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, 0.5)`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * ThemeSelector component
 * Select dropdown for choosing color themes
 */
const ThemeSelector = ({ currentTheme, onThemeChange }) => {
  const paletteNames = getPaletteNames();

  return (
    <div className="fixed top-4 right-16 z-10">
      <Select value={currentTheme} onValueChange={onThemeChange}>
        <SelectTrigger className="w-44 bg-black/40 backdrop-blur-xl border-white/10 text-foreground/90">
          <div className="flex items-center gap-2">
            <ColorPreview palette={palettes[currentTheme]} />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10 max-h-80">
          {paletteNames.map((name) => (
            <SelectItem key={name} value={name}>
              <div className="flex items-center gap-3">
                <ColorPreview palette={palettes[name]} />
                <div className="flex flex-col">
                  <span className="text-sm">{palettes[name].name}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeSelector;
