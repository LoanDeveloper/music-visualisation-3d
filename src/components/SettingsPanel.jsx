import { useState, useEffect } from 'react';
import { Settings, ChevronDown, Music, Sparkles, RotateCcw, Shapes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Slider control with label and value display
 */
const SliderControl = ({ label, value, min, max, step, onChange, unit = '' }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs text-muted-foreground font-mono">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
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
 * Collapsible section for organizing settings
 */
const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-4 pt-2 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * SettingsPanel component
 * Provides controls for all visualization parameters
 */
const SettingsPanel = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  // Keyboard shortcut to toggle panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
      // Escape to close
      if (e.code === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-5 left-5 z-[100] bg-background/60 backdrop-blur-md border-border/50 hover:bg-background/80"
          title="Parametres de visualisation"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Parametres</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {/* Audio Section */}
          <Section title="Audio" icon={Music} defaultOpen={true}>
            <SliderControl
              label="Sensibilite globale"
              value={settings.sensitivity}
              min={0.5}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('sensitivity', v)}
            />
            <SliderControl
              label="Intensite Bass"
              value={settings.bassIntensity}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('bassIntensity', v)}
            />
            <SliderControl
              label="Intensite Mid"
              value={settings.midIntensity}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('midIntensity', v)}
            />
            <SliderControl
              label="Intensite High"
              value={settings.highIntensity}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => updateSetting('highIntensity', v)}
            />
            <SliderControl
              label="Smoothing audio"
              value={settings.smoothing}
              min={0.1}
              max={0.95}
              step={0.05}
              onChange={(v) => updateSetting('smoothing', v)}
            />
          </Section>

          <Separator />

          {/* Particles Section */}
          <Section title="Particules" icon={Sparkles} defaultOpen={true}>
            <SliderControl
              label="Nombre de particules"
              value={settings.particleCount}
              min={1000}
              max={25000}
              step={1000}
              onChange={(v) => updateSetting('particleCount', v)}
            />
            <SliderControl
              label="Taille de base"
              value={settings.particleSize}
              min={1}
              max={8}
              step={0.5}
              onChange={(v) => updateSetting('particleSize', v)}
            />
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Taille reactive
              </Label>
              <Switch
                checked={settings.reactiveSize}
                onCheckedChange={(v) => updateSetting('reactiveSize', v)}
              />
            </div>
          </Section>

          <Separator />

          {/* Animation Section */}
          <Section title="Animation" icon={RotateCcw} defaultOpen={false}>
            <SliderControl
              label="Vitesse rotation"
              value={settings.rotationSpeed}
              min={0}
              max={0.05}
              step={0.001}
              onChange={(v) => updateSetting('rotationSpeed', v)}
            />
            <SliderControl
              label="Vitesse animation"
              value={settings.animationSpeed}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(v) => updateSetting('animationSpeed', v)}
            />
          </Section>

          <Separator />

          {/* Shape Section */}
          <Section title="Forme" icon={Shapes} defaultOpen={true}>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Distribution</Label>
              <Select
                value={settings.shape}
                onValueChange={(v) => updateSetting('shape', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sphere">Sphere</SelectItem>
                  <SelectItem value="spiral">Spirale / Galaxie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SliderControl
              label="Expansion (rayon)"
              value={settings.expansion}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(v) => updateSetting('expansion', v)}
            />
          </Section>
        </div>

        {/* Reset button */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSettingsChange(null)}
          >
            Reinitialiser
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
