import { useRef, useEffect } from 'react';
import useThreeScene from '../hooks/useThreeScene';

/**
 * VisualizerCanvas component
 * Wrapper for the Three.js canvas element
 */
const VisualizerCanvas = ({ palette, sceneRef }) => {
  const canvasRef = useRef(null);
  const localSceneRef = useThreeScene(canvasRef, palette);

  // Expose scene ref to parent component
  useEffect(() => {
    if (sceneRef) {
      sceneRef.current = localSceneRef.current;
    }
  }, [localSceneRef, sceneRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    />
  );
};

export default VisualizerCanvas;
