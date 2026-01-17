import { useState } from 'react';
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
import { RotateCcw, Save, Trash2 } from 'lucide-react';
import {
  getAllPresets,
  getPreset,
  saveCustomPreset,
  deleteCustomPreset,
  BUILT_IN_PRESETS,
} from '@/utils/presets';

/**
 * Slider control with label and value display
 */
const SliderControl = ({ label, value, min, max, step, onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs text-foreground/80">{label}</Label>
        <span className="text-xs text-foreground/50 font-mono tabular-nums">
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
  <h3 className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider mb-3">
    {children}
  </h3>
);

/**
 * Select control with label
 */
const SelectControl = ({ label, value, options, onChange }) => (
  <div className="space-y-2">
    <Label className="text-xs text-foreground/80">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-white/5 border-white/10 text-foreground/90 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

/**
 * Switch control with label
 */
const SwitchControl = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-1">
    <Label className="text-xs text-foreground/80">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

/**
 * SettingsPanel component
 * Transparent floating panel with all visualization parameters
 */
const SettingsPanel = ({ settings, onSettingsChange }) => {
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [customPresetName, setCustomPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presets, setPresets] = useState(getAllPresets());

  const updateSetting = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handlePresetChange = (presetName) => {
    setSelectedPreset(presetName);
    const preset = getPreset(presetName);
    if (preset) {
      onSettingsChange({ ...settings, ...preset.settings });
    }
  };

  const handleSavePreset = () => {
    if (customPresetName.trim()) {
      saveCustomPreset(customPresetName.trim(), settings);
      setPresets(getAllPresets());
      setCustomPresetName('');
      setShowSaveInput(false);
    }
  };

  const handleDeletePreset = (name) => {
    if (!BUILT_IN_PRESETS[name]) {
      deleteCustomPreset(name);
      setPresets(getAllPresets());
      if (selectedPreset === name) {
        setSelectedPreset('default');
      }
    }
  };

  const distributionShapes = [
    { value: 'sphere', label: 'Sphere' },
    { value: 'spiral', label: 'Spirale / Galaxie' },
    { value: 'atom', label: 'Atome / Moleculaire' },
    { value: 'quantum', label: 'Quantique' },
    { value: 'dna', label: 'ADN / Helix' },
  ];

  const particleShapes = [
    { value: 'circle', label: 'Cercle' },
    { value: 'square', label: 'Carre' },
    { value: 'star', label: 'Etoile' },
    { value: 'triangle', label: 'Triangle' },
    { value: 'ring', label: 'Anneau' },
  ];

  const presetOptions = Object.entries(presets).map(([key, preset]) => ({
    value: key,
    label: preset.name,
    isBuiltIn: !!BUILT_IN_PRESETS[key],
  }));

  return (
    <div className="fixed top-4 left-4 z-50 w-64 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-medium text-foreground/90">Parametres</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-foreground/50 hover:text-foreground hover:bg-white/10"
            onClick={() => onSettingsChange(null)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Presets Section */}
        <div className="space-y-3 mb-5">
          <SectionTitle>Presets</SectionTitle>
          
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-foreground/90 h-8 text-xs">
              <SelectValue placeholder="Choisir un preset" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
              {presetOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <div className="flex items-center justify-between w-full">
                    <span>{opt.label}</span>
                    {!opt.isBuiltIn && (
                      <span className="text-[9px] text-foreground/40 ml-2">custom</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Save preset */}
          {showSaveInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={customPresetName}
                onChange={(e) => setCustomPresetName(e.target.value)}
                placeholder="Nom du preset"
                className="flex-1 h-7 px-2 text-xs bg-white/5 border border-white/10 rounded text-foreground/90 placeholder:text-foreground/30"
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-foreground/50 hover:text-foreground hover:bg-white/10"
                onClick={handleSavePreset}
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10"
              onClick={() => setShowSaveInput(true)}
            >
              <Save className="h-3 w-3 mr-1.5" />
              Sauvegarder preset
            </Button>
          )}

          {/* Delete custom preset */}
          {!BUILT_IN_PRESETS[selectedPreset] && selectedPreset && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
              onClick={() => handleDeletePreset(selectedPreset)}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Supprimer preset
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-5" />

        {/* Audio Section */}
        <div className="space-y-3 mb-5">
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

        {/* Divider */}
        <div className="h-px bg-white/10 mb-5" />

        {/* Distribution Section */}
        <div className="space-y-3 mb-5">
          <SectionTitle>Distribution</SectionTitle>
          
          <SelectControl
            label="Forme globale"
            value={settings.shape}
            options={distributionShapes}
            onChange={(v) => updateSetting('shape', v)}
          />
          <SliderControl
            label="Expansion"
            value={settings.expansion}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(v) => updateSetting('expansion', v)}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-5" />

        {/* Particles Section */}
        <div className="space-y-3 mb-5">
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
          <SelectControl
            label="Forme particule"
            value={settings.particleShape}
            options={particleShapes}
            onChange={(v) => updateSetting('particleShape', v)}
          />
          <SwitchControl
            label="Taille reactive"
            checked={settings.reactiveSize}
            onChange={(v) => updateSetting('reactiveSize', v)}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-5" />

        {/* Trails Section */}
        <div className="space-y-3 mb-5">
          <SectionTitle>Trainees</SectionTitle>
          
          <SwitchControl
            label="Activer trainees"
            checked={settings.trails}
            onChange={(v) => updateSetting('trails', v)}
          />
          {settings.trails && (
            <>
              <SliderControl
                label="Longueur"
                value={settings.trailLength}
                min={3}
                max={20}
                step={1}
                onChange={(v) => updateSetting('trailLength', v)}
              />
              <SliderControl
                label="Persistance"
                value={settings.trailDecay}
                min={0.8}
                max={0.98}
                step={0.01}
                onChange={(v) => updateSetting('trailDecay', v)}
              />
              <SliderControl
                label="Epaisseur"
                value={settings.trailWidth}
                min={0.5}
                max={3}
                step={0.5}
                onChange={(v) => updateSetting('trailWidth', v)}
              />
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-5" />

        {/* Connections Section */}
        <div className="space-y-3 mb-5">
          <SectionTitle>Connexions</SectionTitle>
          
          <SwitchControl
            label="Activer connexions"
            checked={settings.connections}
            onChange={(v) => updateSetting('connections', v)}
          />
          {settings.connections && (
            <>
              <SliderControl
                label="Distance max"
                value={settings.connectionDistance}
                min={10}
                max={100}
                step={5}
                onChange={(v) => updateSetting('connectionDistance', v)}
              />
              <SliderControl
                label="Opacite"
                value={settings.connectionOpacity}
                min={0.1}
                max={0.8}
                step={0.05}
                onChange={(v) => updateSetting('connectionOpacity', v)}
              />
              <SliderControl
                label="Nombre max"
                value={settings.connectionMaxCount}
                min={100}
                max={2000}
                step={100}
                onChange={(v) => updateSetting('connectionMaxCount', v)}
              />
              <SliderControl
                label="Epaisseur ligne"
                value={settings.connectionLineWidth}
                min={0.5}
                max={3}
                step={0.5}
                onChange={(v) => updateSetting('connectionLineWidth', v)}
              />
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-5" />

        {/* Animation Section */}
        <div className="space-y-3">
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
      </div>
    </div>
  );
};

export default SettingsPanel;
