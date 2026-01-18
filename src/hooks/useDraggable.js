import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'panel-positions';

/**
 * Load all panel positions from localStorage
 * @returns {Object} - { panelId: { x, y }, ... }
 */
function loadPositions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save all panel positions to localStorage
 * @param {Object} positions - { panelId: { x, y }, ... }
 */
function savePositions(positions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Custom hook for making elements draggable with localStorage persistence
 * 
 * @param {string} panelId - Unique identifier for this panel
 * @param {Object} defaultPosition - { x, y } default position
 * @param {Object} options - Additional options
 * @param {boolean} options.constrainToViewport - Keep panel within viewport bounds
 * @returns {Object} - { position, isDragging, dragHandleProps, resetPosition }
 */
export function useDraggable(panelId, defaultPosition = { x: 0, y: 0 }, options = {}) {
  const { constrainToViewport = true } = options;
  
  // Initialize position from localStorage or default
  const [position, setPosition] = useState(() => {
    const saved = loadPositions();
    return saved[panelId] || defaultPosition;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for tracking drag state (avoid stale closures)
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef(null);
  
  /**
   * Constrain position to viewport bounds
   */
  const constrainPosition = useCallback((x, y) => {
    if (!constrainToViewport || !elementRef.current) {
      return { x, y };
    }
    
    const rect = elementRef.current.getBoundingClientRect();
    const padding = 20; // Keep at least 20px visible
    
    const maxX = window.innerWidth - padding;
    const maxY = window.innerHeight - padding;
    const minX = padding - rect.width;
    const minY = padding - rect.height;
    
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)), // Don't go above viewport
    };
  }, [constrainToViewport]);
  
  /**
   * Handle mouse/touch move
   */
  const handleMove = useCallback((clientX, clientY) => {
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    const newX = positionStartRef.current.x + deltaX;
    const newY = positionStartRef.current.y + deltaY;
    
    const constrained = constrainPosition(newX, newY);
    setPosition(constrained);
  }, [constrainPosition]);
  
  /**
   * Handle drag end
   */
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    
    // Save to localStorage
    setPosition((current) => {
      const allPositions = loadPositions();
      allPositions[panelId] = current;
      savePositions(allPositions);
      return current;
    });
  }, [panelId]);
  
  /**
   * Mouse event handlers
   */
  useEffect(() => {
    if (!isDragging) return;
    
    const onMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };
    
    const onMouseUp = () => {
      handleEnd();
    };
    
    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    
    const onTouchEnd = () => {
      handleEnd();
    };
    
    // Add listeners to window for capturing outside element
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);
  
  /**
   * Start drag handler (for drag handle element)
   */
  const onDragStart = useCallback((e) => {
    // Prevent text selection
    e.preventDefault();
    
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = { x: clientX, y: clientY };
    positionStartRef.current = { ...position };
    
    setIsDragging(true);
  }, [position]);
  
  /**
   * Reset position to default
   */
  const resetPosition = useCallback(() => {
    setPosition(defaultPosition);
    
    // Update localStorage
    const allPositions = loadPositions();
    allPositions[panelId] = defaultPosition;
    savePositions(allPositions);
  }, [panelId, defaultPosition]);
  
  /**
   * Set element ref (for constraining and measuring)
   */
  const setRef = useCallback((element) => {
    elementRef.current = element;
  }, []);
  
  /**
   * Props to spread on the drag handle element
   */
  const dragHandleProps = {
    onMouseDown: onDragStart,
    onTouchStart: onDragStart,
    style: {
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none',
      userSelect: 'none',
    },
  };
  
  /**
   * Style to apply to the draggable container
   */
  const containerStyle = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: isDragging ? 1000 : undefined, // Bring to front while dragging
  };
  
  return {
    position,
    isDragging,
    dragHandleProps,
    containerStyle,
    resetPosition,
    setRef,
  };
}

/**
 * Reset all panel positions to defaults
 */
export function resetAllPanelPositions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export default useDraggable;
