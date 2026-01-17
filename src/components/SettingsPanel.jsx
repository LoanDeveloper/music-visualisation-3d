import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

/**
 * Compact slider control
 */
const SliderControl = ({ label, value, min, max, step, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs text-muted-foreground/70 font-mono tabular-nums">
          {value.toFixed(step < 1 ? 1 : 0)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        className="h-1"
      />
    </div>
  );
};

/**
 * SettingsPanel component
 * Minimal floating panel with essential controls
 */
const SettingsPanel = ({ settings, onSettingsChange }) => {
  const updateSetting = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="fixed top-4 left-4 z-50 w-56 rounded-xl border border-border/50 bg-card backdrop-blur-md shadow-lg">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Parametres</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => onSettingsChange(null)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Intensity controls */}
        <div className="space-y-3">
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
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50" />

        {/* Visual controls */}
        <div className="space-y-3">
          <SliderControl
            label="Particules"
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
            max={6}
            step={0.5}
            onChange={(v) => updateSetting('particleSize', v)}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
