import { palettes, getPaletteNames } from '@/utils/colorPalettes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical } from 'lucide-react';
import { useDraggable } from '@/hooks/useDraggable';

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

  // Draggable hook - top-right default position
  const { isDragging, dragHandleProps, containerStyle, setRef } = useDraggable(
    'theme-selector',
    { x: typeof window !== 'undefined' ? window.innerWidth - 220 : 1000, y: 16 }
  );

  return (
    <div 
      ref={setRef}
      className={`flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl ${isDragging ? 'shadow-2xl scale-[1.01]' : ''}`}
      style={{ ...containerStyle, zIndex: isDragging ? 1000 : 10 }}
    >
      {/* Drag Handle */}
      <div 
        {...dragHandleProps}
        className="flex items-center justify-center px-1.5 py-2 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-l-xl transition-colors"
      >
        <GripVertical className="h-4 w-4 text-foreground/30" />
      </div>

      <Select value={currentTheme} onValueChange={onThemeChange}>
        <SelectTrigger className="w-44 bg-transparent border-0 text-foreground/90 focus:ring-0 focus:ring-offset-0">
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
