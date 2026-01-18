import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Brain, Heart, Activity } from 'lucide-react';
import { getHumanPresetsForUI, POSES } from '@/utils/humanPresets';

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
}) => {
  const presets = getHumanPresetsForUI();
  const poses = Object.values(POSES);

  // Get icon for preset
  const getPresetIcon = (presetId) => {
    switch (presetId) {
      case 'BRAIN_FOCUS':
        return <Brain className="h-3 w-3" />;
      case 'HEART_CORE':
        return <Heart className="h-3 w-3" />;
      case 'VEINS_FLOW':
        return <Activity className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="human-layer-controls">
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
      {enabled && (
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
        </div>
      )}
    </div>
  );
};

export default HumanLayerControls;
