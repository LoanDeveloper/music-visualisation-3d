import { useEffect, useRef } from 'react';
import ThreeScene from '../core/ThreeScene';

/**
 * Custom hook for managing Three.js scene lifecycle
 * @param {React.RefObject} canvasRef - Reference to canvas element
 * @param {string} palette - Current color palette name
 * @returns {React.RefObject} Reference to ThreeScene instance
 */
export const useThreeScene = (canvasRef, palette = 'neon') => {
  const sceneRef = useRef(null);

  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    sceneRef.current = new ThreeScene(canvasRef.current, palette);

    // Handle window resize
    const handleResize = () => {
      if (sceneRef.current) {
        sceneRef.current.handleResize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
    };
  }, [canvasRef]);

  // Update palette when it changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updatePalette(palette);
    }
  }, [palette]);

  return sceneRef;
};

export default useThreeScene;
