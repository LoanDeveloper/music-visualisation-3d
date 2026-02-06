import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Brain, Heart, Activity, AlertTriangle, GripVertical } from 'lucide-react';
import { getHumanPresetsForUI, POSES } from '@/utils/humanPresets';
import { useDraggable } from '@/hooks/useDraggable';

/**
 * HumanLayerControls component
 * Controls for the Human 3D Outline (Matrix vibe) layer
 */
const HumanLayerControls = ({
  enabled,
  onEnabledChange,
  preset,
  onPresetChange,
  pose,
  onPoseChange,
  isLoading,
  hasError,
  particleTuning,
  onParticleTuningChange,
}) => {
  const presets = getHumanPresetsForUI();
  const poses = Object.values(POSES);

  // Draggable hook - bottom-left default position
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const { isDragging, dragHandleProps, containerStyle, setRef } = useDraggable(
    'human-layer-controls',
    { 
      x: 16,
      y: typeof window !== 'undefined'
        ? (isMobile ? window.innerHeight - 460 : window.innerHeight - 430)
        : 500,
    }
  );

  // Get icon for preset
  const getPresetIcon = (presetId) => {
    switch (presetId) {
      case 'cerveau-focus':
        return <Brain className="h-3 w-3" />;
      case 'coeur-core':
        return <Heart className="h-3 w-3" />;
      case 'veines-flow':
        return <Activity className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const updateTuning = (key, value) => {
    if (!onParticleTuningChange || !particleTuning) return;
    onParticleTuningChange({
      ...particleTuning,
      [key]: value,
    });
  };

  return (
    <div 
      ref={setRef}
      className={`w-[220px] sm:w-64 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl ${isDragging ? 'shadow-2xl scale-[1.01]' : ''}`}
      style={{ ...containerStyle, zIndex: isDragging ? 1000 : 50 }}
    >
      {/* Drag Handle */}
      <div 
        {...dragHandleProps}
        className="flex items-center justify-center py-1.5 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-t-2xl transition-colors"
      >
        <GripVertical className="h-4 w-4 text-foreground/30 rotate-90" />
      </div>

      <div className="px-4 pb-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-foreground/70" />
          <span className="text-xs font-medium text-foreground/90">
            Human Layer
          </span>
          {isLoading && (
            <span className="text-[10px] text-foreground/50 animate-pulse">
              Loading...
            </span>
          )}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={isLoading}
        />
      </div>

      {/* Controls (visible when enabled) */}
      {enabled && !hasError && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          {/* Preset selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-foreground/60 uppercase tracking-wider">
              Preset
            </Label>
            <Select value={preset} onValueChange={onPresetChange}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-foreground/90 h-8 text-xs">
                <SelectValue placeholder="Choisir preset" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                {presets.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      {getPresetIcon(p.id)}
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pose selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-foreground/60 uppercase tracking-wider">
              Pose
            </Label>
            <Select value={pose} onValueChange={onPoseChange}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-foreground/90 h-8 text-xs">
                <SelectValue placeholder="Choisir pose" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                {poses.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset description */}
          <div className="text-[10px] text-foreground/40 italic">
            {presets.find((p) => p.id === preset)?.description || ''}
          </div>

          {particleTuning && (
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <Label className="text-[10px] text-foreground/60 uppercase tracking-wider">
                Particle Tuning
              </Label>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-foreground/60">
                    <span>Densite</span>
                    <span className="font-mono">{particleTuning.density.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[particleTuning.density]}
                    min={0.45}
                    max={1.45}
                    step={0.01}
                    onValueChange={(values) => updateTuning('density', values[0])}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-foreground/60">
                    <span>Vitesse</span>
                    <span className="font-mono">{particleTuning.speed.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[particleTuning.speed]}
                    min={0.4}
                    max={1.8}
                    step={0.01}
                    onValueChange={(values) => updateTuning('speed', values[0])}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-foreground/60">
                    <span>Pulse</span>
                    <span className="font-mono">{particleTuning.pulse.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[particleTuning.pulse]}
                    min={0.4}
                    max={1.9}
                    step={0.01}
                    onValueChange={(values) => updateTuning('pulse', values[0])}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-foreground/60">
                    <span>Sparkle</span>
                    <span className="font-mono">{particleTuning.sparkle.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[particleTuning.sparkle]}
                    min={0.3}
                    max={2.0}
                    step={0.01}
                    onValueChange={(values) => updateTuning('sparkle', values[0])}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-foreground/60">
                    <span>Luminosite</span>
                    <span className="font-mono">{particleTuning.brightness.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[particleTuning.brightness]}
                    min={0.4}
                    max={1.9}
                    step={0.01}
                    onValueChange={(values) => updateTuning('brightness', values[0])}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-foreground/60">
                    <span>Turbulence</span>
                    <span className="font-mono">{particleTuning.turbulence.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[particleTuning.turbulence]}
                    min={0.35}
                    max={1.9}
                    step={0.01}
                    onValueChange={(values) => updateTuning('turbulence', values[0])}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
        {hasError && (
          <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-[10px] text-red-300/90 leading-relaxed">
                Modeles 3D non trouves. Placez les fichiers GLB dans{' '}
                <code className="px-1 py-0.5 bg-red-500/20 rounded text-[9px]">
                  /public/models/human/
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumanLayerControls;
