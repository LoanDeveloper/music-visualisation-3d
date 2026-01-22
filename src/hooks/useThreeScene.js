import { useEffect } from 'react';
import ThreeScene from '../core/ThreeScene';

/**
 * Custom hook for managing Three.js scene lifecycle
 * @param {React.RefObject} canvasRef - Reference to canvas element
 * @param {string} palette - Current color palette name
 * @param {React.RefObject} sceneRef - Reference to store ThreeScene instance (from parent)
 * @param {Object} visualSettings - Visualization settings
 */
export const useThreeScene = (canvasRef, palette = 'neon', sceneRef, visualSettings) => {
  // Initialize scene
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    if (import.meta.env.DEV) console.log('[useThreeScene] Initializing ThreeScene...');
    
    // Create scene and store in provided ref
    const scene = new ThreeScene(canvasRef.current, palette, visualSettings);
    
    if (sceneRef) {
      sceneRef.current = scene;
    }

    // Handle window resize
    const handleResize = () => {
      if (sceneRef?.current) {
        sceneRef.current.handleResize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (import.meta.env.DEV) console.log('[useThreeScene] Cleaning up ThreeScene...');
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef?.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
    };
  }, [canvasRef]); // Only re-run if canvas changes

  // Update palette when it changes
  useEffect(() => {
    if (sceneRef?.current) {
      sceneRef.current.updatePalette(palette);
    }
  }, [palette, sceneRef]);

  // Update visual settings when they change
  useEffect(() => {
    if (sceneRef?.current && visualSettings) {
      sceneRef.current.updateSettings(visualSettings);
    }
  }, [visualSettings, sceneRef]);
};

export default useThreeScene;
