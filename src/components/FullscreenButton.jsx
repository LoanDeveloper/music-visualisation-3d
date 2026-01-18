import { useState, useEffect } from 'react';
import { Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDraggable } from '@/hooks/useDraggable';

/**
 * FullscreenButton component
 * Toggles fullscreen mode
 */
const FullscreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Draggable hook - top-right corner default position
  const { isDragging, dragHandleProps, containerStyle, setRef } = useDraggable(
    'fullscreen-button',
    { x: typeof window !== 'undefined' ? window.innerWidth - 80 : 1200, y: 16 }
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Erreur lors du basculement en plein ecran:', error);
    }
  };

  return (
    <div
      ref={setRef}
      className={`flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl ${isDragging ? 'shadow-2xl scale-[1.01]' : ''}`}
      style={{ ...containerStyle, zIndex: isDragging ? 1000 : 10 }}
    >
      {/* Drag Handle */}
      <div 
        {...dragHandleProps}
        className="flex items-center justify-center px-1.5 py-2 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded-l-xl transition-colors"
      >
        <GripVertical className="h-4 w-4 text-foreground/30" />
      </div>

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-white/10 rounded-r-xl rounded-l-none"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isFullscreen ? 'Quitter (F)' : 'Plein ecran (F)'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default FullscreenButton;
