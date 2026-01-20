import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'panel-positions';

// Animation duration for snap-back
const SNAP_ANIMATION_DURATION = 200;

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
 * @param {boolean} options.snapBack - Animate snap-back when released outside safe zone
 * @returns {Object} - { position, isDragging, dragHandleProps, resetPosition, isSnapping }
 */
export function useDraggable(panelId, defaultPosition = { x: 0, y: 0 }, options = {}) {
  const { constrainToViewport = true, snapBack = true } = options;
  
  // Initialize position from localStorage or default
  const [position, setPosition] = useState(() => {
    const saved = loadPositions();
    return saved[panelId] || defaultPosition;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  
  // Refs for tracking drag state (avoid stale closures)
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef(null);
  
  /**
   * Check if position is within safe bounds
   */
  const isInSafeBounds = useCallback((x, y) => {
    if (!elementRef.current) return true;
    
    const rect = elementRef.current.getBoundingClientRect();
    const safeMargin = 50; // Panel should have at least 50px inside viewport
    
    // Check if enough of the panel is visible
    const visibleWidth = Math.min(rect.width, window.innerWidth - x) - Math.max(0, -x);
    const visibleHeight = Math.min(rect.height, window.innerHeight - y) - Math.max(0, -y);
    
    return visibleWidth >= safeMargin && visibleHeight >= safeMargin && y >= 0;
  }, []);
  
  /**
   * Get safe position (constrained to viewport)
   */
  const getSafePosition = useCallback((x, y) => {
    if (!elementRef.current) return { x, y };
    
    const rect = elementRef.current.getBoundingClientRect();
    const padding = 16;
    
    const safeX = Math.max(padding, Math.min(window.innerWidth - rect.width - padding, x));
    const safeY = Math.max(padding, Math.min(window.innerHeight - rect.height - padding, y));
    
    return { x: safeX, y: safeY };
  }, []);
  
  /**
   * Constrain position to viewport bounds (during drag)
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
   * Handle drag end with optional snap-back
   */
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    
    setPosition((current) => {
      let finalPosition = current;
      
      // Check if snap-back is needed
      if (snapBack && !isInSafeBounds(current.x, current.y)) {
        const safePos = getSafePosition(current.x, current.y);
        finalPosition = safePos;
        
        // Trigger snap animation
        setIsSnapping(true);
        setTimeout(() => setIsSnapping(false), SNAP_ANIMATION_DURATION);
      }
      
      // Save to localStorage
      const allPositions = loadPositions();
      allPositions[panelId] = finalPosition;
      savePositions(allPositions);
      
      return finalPosition;
    });
  }, [panelId, snapBack, isInSafeBounds, getSafePosition]);
  
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
    transition: isSnapping ? `left ${SNAP_ANIMATION_DURATION}ms ease-out, top ${SNAP_ANIMATION_DURATION}ms ease-out` : undefined,
  };
  
  return {
    position,
    isDragging,
    isSnapping,
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
