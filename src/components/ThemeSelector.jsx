import { palettes, getPaletteNames } from '@/utils/colorPalettes';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      <div className="flex gap-1">
        {colors.map((color, index) => (
          <div
            key={index}
            className="w-2.5 h-2.5 rounded-full border border-border/50"
            style={{
              backgroundColor: `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed top-5 left-20 z-10">
      <TooltipProvider delayDuration={300}>
        <ToggleGroup
          type="single"
          value={currentTheme}
          onValueChange={(value) => value && onThemeChange(value)}
          className="bg-background/60 backdrop-blur-md border border-border/50 rounded-lg p-1"
        >
          {paletteNames.map((name) => (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={name}
                  className="px-2.5 py-1.5 data-[state=on]:bg-accent"
                >
                  {getColorPreview(name)}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{palettes[name].name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
};

export default ThemeSelector;
