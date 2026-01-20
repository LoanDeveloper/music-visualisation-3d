import { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RotateCcw,
  Save,
  Trash2,
  GripVertical,
  ChevronDown,
  Zap,
  LayoutGrid,
  Volume2,
  Sparkles,
  Shapes,
  Play,
  Wind,
  Link,
  Activity,
  Headphones,
} from 'lucide-react';
import {
  getAllPresets,
  getPreset,
  saveCustomPreset,
  deleteCustomPreset,
  BUILT_IN_PRESETS,
} from '@/utils/presets';
import {
  SETTINGS_SCHEMA,
  SECTION_META,
  SECTION_ORDER,
  FieldType,
  getSettingsBySection,
  isSettingEnabled,
} from '@/utils/settingsSchema';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { useDraggable } from '@/hooks/useDraggable';

// Icon mapping for sections
const SECTION_ICONS = {
  audio: Volume2,
  particles: Sparkles,
  distribution: Shapes,
  animation: Play,
  trails: Wind,
  connections: Link,
  advanced: Activity,
  stereo: Headphones,
};

/**
 * Slider control with label and value display
 */
const SliderControl = ({ label, value, min, max, step, onChange, disabled }) => {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center">
        <Label className="text-xs text-foreground/80">{label}</Label>
        <span className="text-xs text-foreground/50 font-mono tabular-nums">
          {value.toFixed(step < 1 ? (step < 0.01 ? 3 : 2) : 0)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        disabled={disabled}
      />
    </div>
  );
};

/**
 * Select control with label
 */
const SelectControl = ({ label, value, options, onChange, disabled }) => (
  <div className={`space-y-2 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
    <Label className="text-xs text-foreground/80">{label}</Label>
    <Select value={value} onValueChange={onChange} disabled={disabled}>
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
const SwitchControl = ({ label, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between py-1 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
    <Label className="text-xs text-foreground/80">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

/**
 * Collapsible section component
 */
const SettingsSection = ({ sectionKey, isOpen, onToggle, children }) => {
  const meta = SECTION_META[sectionKey];
  const Icon = SECTION_ICONS[sectionKey] || Shapes;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 group">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-foreground/50" />
          <span className="text-xs font-medium text-foreground/80">{meta.label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-foreground/40 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

/**
 * Render a field based on its schema definition
 */
const renderField = (key, field, value, onChange, settings) => {
  const enabled = isSettingEnabled(key, settings);

  switch (field.type) {
    case FieldType.SLIDER:
      return (
        <SliderControl
          key={key}
          label={field.label}
          value={value}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={onChange}
          disabled={!enabled}
        />
      );
    case FieldType.SELECT:
      return (
        <SelectControl
          key={key}
          label={field.label}
          value={value}
          options={field.options}
          onChange={onChange}
          disabled={!enabled}
        />
      );
    case FieldType.SWITCH:
      return (
        <SwitchControl
          key={key}
          label={field.label}
          checked={value}
          onChange={onChange}
          disabled={!enabled}
        />
      );
    default:
      return null;
  }
};

/**
 * SettingsPanel component
 * Notion-like floating panel with collapsible accordion sections
 */
const SettingsPanel = ({ settings, onSettingsChange }) => {
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [customPresetName, setCustomPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presets, setPresets] = useState(getAllPresets());
  const [lowPowerMode, setLowPowerMode] = useState(false);
  
  // Section open states - audio open by default
  const [openSections, setOpenSections] = useState({
    audio: true,
    particles: false,
    distribution: false,
    animation: false,
    trails: false,
    connections: false,
    advanced: false,
    stereo: false,
  });

  // Draggable hook
  const { isDragging, dragHandleProps, containerStyle, setRef } = useDraggable(
    'settings-panel',
    { x: 16, y: 16 }
  );

  // Subscribe to low power mode changes
  useEffect(() => {
    const handleLowPowerChange = (isLowPower) => {
      setLowPowerMode(isLowPower);
    };
    performanceMonitor.onLowPowerChange(handleLowPowerChange);
    setLowPowerMode(performanceMonitor.isLowPowerMode());
    
    return () => {
      performanceMonitor.offLowPowerChange(handleLowPowerChange);
    };
  }, []);

  const updateSetting = useCallback((key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  }, [settings, onSettingsChange]);

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

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleResetLayout = () => {
    localStorage.removeItem('panel-positions');
    window.location.reload();
  };

  const handleToggleLowPower = () => {
    performanceMonitor.toggleLowPowerMode();
  };

  // Group settings by section
  const settingsBySection = getSettingsBySection();

  const presetOptions = Object.entries(presets).map(([key, preset]) => ({
    value: key,
    label: preset.name,
    isBuiltIn: !!BUILT_IN_PRESETS[key],
  }));

  return (
    <div
      ref={setRef}
      className={`w-72 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl ${
        isDragging ? 'shadow-2xl scale-[1.01]' : ''
      }`}
      style={{ ...containerStyle, zIndex: isDragging ? 1000 : 50 }}
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-t-2xl transition-colors border-b border-white/5"
      >
        <GripVertical className="h-4 w-4 text-foreground/30 rotate-90" />
      </div>

      <div className="px-4 pb-4">
        {/* Quick Actions Bar */}
        <div className="flex items-center gap-1.5 py-3 border-b border-white/5 mb-3">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-xs ${
              lowPowerMode
                ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                : 'text-foreground/50 hover:text-foreground hover:bg-white/10'
            }`}
            onClick={handleToggleLowPower}
            title={lowPowerMode ? 'Desactiver mode eco' : 'Activer mode eco'}
          >
            <Zap className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-foreground/50 hover:text-foreground hover:bg-white/10"
            onClick={handleResetLayout}
            title="Reinitialiser disposition"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-foreground/50 hover:text-foreground hover:bg-white/10"
            onClick={() => onSettingsChange(null)}
            title="Reinitialiser parametres"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Presets Section */}
        <div className="space-y-2 mb-4">
          <Label className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">
            Presets
          </Label>

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

          <div className="flex gap-1.5">
            {showSaveInput ? (
              <div className="flex gap-1.5 flex-1">
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
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-xs text-foreground/50 hover:text-foreground hover:bg-white/10"
                onClick={() => setShowSaveInput(true)}
              >
                <Save className="h-3 w-3 mr-1.5" />
                Sauvegarder
              </Button>
            )}
            {!BUILT_IN_PRESETS[selectedPreset] && selectedPreset && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400/50 hover:text-red-400 hover:bg-red-400/10"
                onClick={() => handleDeletePreset(selectedPreset)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mb-3" />

        {/* Settings Sections */}
        <div className="divide-y divide-white/5">
          {SECTION_ORDER.map((sectionKey) => {
            const fields = settingsBySection[sectionKey];
            if (!fields || fields.length === 0) return null;

            return (
              <SettingsSection
                key={sectionKey}
                sectionKey={sectionKey}
                isOpen={openSections[sectionKey]}
                onToggle={() => toggleSection(sectionKey)}
              >
                {fields.map(({ key, ...field }) =>
                  renderField(
                    key,
                    field,
                    settings[key],
                    (value) => updateSetting(key, value),
                    settings
                  )
                )}
              </SettingsSection>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
