import { useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

/**
 * ZoomControl component
 * Provides camera zoom control slider positioned at bottom right
 */
const ZoomControl = ({ sceneRef }) => {
  const [zoom, setZoom] = useState(0.5);

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
    <div className="fixed bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10">
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
