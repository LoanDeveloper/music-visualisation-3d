import { useRef } from 'react';
import useThreeScene from '../hooks/useThreeScene';

/**
 * VisualizerCanvas component
 * Wrapper for the Three.js canvas element
 */
const VisualizerCanvas = ({ palette, sceneRef }) => {
  const canvasRef = useRef(null);
  
  // Pass sceneRef directly to the hook - it will store the scene there
  useThreeScene(canvasRef, palette, sceneRef);

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
