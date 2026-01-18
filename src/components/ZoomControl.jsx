import { useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, GripVertical } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useDraggable } from '@/hooks/useDraggable';

/**
 * ZoomControl component
 * Provides camera zoom control slider positioned at bottom right
 */
const ZoomControl = ({ sceneRef }) => {
  const [zoom, setZoom] = useState(0.5);

  // Draggable hook - bottom-right default position
  const { isDragging, dragHandleProps, containerStyle, setRef } = useDraggable(
    'zoom-control',
    { x: typeof window !== 'undefined' ? window.innerWidth - 200 : 1000, y: typeof window !== 'undefined' ? window.innerHeight - 60 : 700 }
  );

  // Sync zoom from scene on mount and periodically
  useEffect(() => {
    const syncZoom = () => {
      if (sceneRef.current) {
        const currentZoom = sceneRef.current.getZoom();
        setZoom(currentZoom);
      }
    };

    // Initial sync
    syncZoom();

    // Sync periodically to catch wheel zoom changes
    const interval = setInterval(syncZoom, 100);

    return () => clearInterval(interval);
  }, [sceneRef]);

  const handleZoomChange = useCallback(
    (value) => {
      const newZoom = value[0];
      setZoom(newZoom);
      if (sceneRef.current) {
        sceneRef.current.setZoom(newZoom);
      }
    },
    [sceneRef]
  );

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(1, zoom + 0.1);
    setZoom(newZoom);
    if (sceneRef.current) {
      sceneRef.current.setZoom(newZoom);
    }
  }, [zoom, sceneRef]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0, zoom - 0.1);
    setZoom(newZoom);
    if (sceneRef.current) {
      sceneRef.current.setZoom(newZoom);
    }
  }, [zoom, sceneRef]);

  return (
    <div 
      ref={setRef}
      className={`flex items-center gap-1 px-2 py-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 ${isDragging ? 'shadow-2xl scale-[1.01]' : ''}`}
      style={{ ...containerStyle, zIndex: isDragging ? 1000 : 10 }}
    >
      {/* Drag Handle */}
      <div 
        {...dragHandleProps}
        className="flex items-center justify-center px-1 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded transition-colors"
      >
        <GripVertical className="h-4 w-4 text-foreground/30" />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-white/10"
        onClick={handleZoomOut}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Slider
        value={[zoom]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={handleZoomChange}
        className="w-24"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-foreground/60 hover:text-foreground hover:bg-white/10"
        onClick={handleZoomIn}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ZoomControl;
