import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
}) => {
  const presets = getHumanPresetsForUI();
  const poses = Object.values(POSES);

  // Draggable hook - bottom-left default position
  const { isDragging, dragHandleProps, containerStyle, setRef } = useDraggable(
    'human-layer-controls',
    { x: 16, y: typeof window !== 'undefined' ? window.innerHeight - 240 : 500 }
  );

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
    <div 
      ref={setRef}
      className={`w-56 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl ${isDragging ? 'shadow-2xl scale-[1.01]' : ''}`}
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
