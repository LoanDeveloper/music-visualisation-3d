import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

/**
 * Slider control with label and value display
 */
const SliderControl = ({ label, value, min, max, step, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm text-muted-foreground font-mono tabular-nums">
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
};

/**
 * Section header
 */
const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
    {children}
  </h3>
);

/**
 * SettingsPanel component
 * Always visible panel with visualization parameters
 */
const SettingsPanel = ({ settings, onSettingsChange }) => {
  const updateSetting = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="fixed top-4 left-4 z-50 w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border bg-background/95 backdrop-blur-sm">
      <div className="p-4">
        <h2 className="text-base font-semibold mb-4">Parametres</h2>

        {/* Audio Section */}
        <div className="space-y-4">
          <SectionTitle>Audio</SectionTitle>
          
          <SliderControl
            label="Sensibilite"
            value={settings.sensitivity}
            min={0.5}
            max={3}
            step={0.1}
            onChange={(v) => updateSetting('sensitivity', v)}
          />
          <SliderControl
            label="Bass"
            value={settings.bassIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => updateSetting('bassIntensity', v)}
          />
          <SliderControl
            label="Medium"
            value={settings.midIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => updateSetting('midIntensity', v)}
          />
          <SliderControl
            label="Aigus"
            value={settings.highIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => updateSetting('highIntensity', v)}
          />
          <SliderControl
            label="Lissage"
            value={settings.smoothing}
            min={0.1}
            max={0.95}
            step={0.05}
            onChange={(v) => updateSetting('smoothing', v)}
          />
        </div>

        <Separator className="my-6" />

        {/* Particles Section */}
        <div className="space-y-4">
          <SectionTitle>Particules</SectionTitle>
          
          <SliderControl
            label="Nombre"
            value={settings.particleCount}
            min={1000}
            max={25000}
            step={1000}
            onChange={(v) => updateSetting('particleCount', v)}
          />
          <SliderControl
            label="Taille"
            value={settings.particleSize}
            min={1}
            max={8}
            step={0.5}
            onChange={(v) => updateSetting('particleSize', v)}
          />
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm">Taille reactive</Label>
            <Switch
              checked={settings.reactiveSize}
              onCheckedChange={(v) => updateSetting('reactiveSize', v)}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Animation Section */}
        <div className="space-y-4">
          <SectionTitle>Animation</SectionTitle>
          
          <SliderControl
            label="Rotation"
            value={settings.rotationSpeed}
            min={0}
            max={0.05}
            step={0.001}
            onChange={(v) => updateSetting('rotationSpeed', v)}
          />
          <SliderControl
            label="Vitesse"
            value={settings.animationSpeed}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(v) => updateSetting('animationSpeed', v)}
          />
        </div>

        <Separator className="my-6" />

        {/* Shape Section */}
        <div className="space-y-4">
          <SectionTitle>Forme</SectionTitle>
          
          <div className="space-y-3">
            <Label className="text-sm">Distribution</Label>
            <Select
              value={settings.shape}
              onValueChange={(v) => updateSetting('shape', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sphere">Sphere</SelectItem>
                <SelectItem value="spiral">Spirale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SliderControl
            label="Expansion"
            value={settings.expansion}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(v) => updateSetting('expansion', v)}
          />
        </div>

        <Separator className="my-6" />

        {/* Reset button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onSettingsChange(null)}
        >
          Reinitialiser
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
