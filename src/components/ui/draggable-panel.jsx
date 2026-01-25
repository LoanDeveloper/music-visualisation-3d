/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { GripVertical } from 'lucide-react';
import { useDraggable } from '../../hooks/useDraggable';
import { cn } from '../../lib/utils';

/**
 * DraggablePanel - A wrapper component that makes any panel draggable
 * 
 * Features:
 * - Notion-style grip icon for dragging
 * - Position persistence via localStorage
 * - Viewport constraints
 * - Smooth drag experience
 * 
 * @param {Object} props
 * @param {string} props.id - Unique panel identifier for position persistence
 * @param {Object} props.defaultPosition - { x, y } default position
 * @param {React.ReactNode} props.children - Panel content
 * @param {string} props.className - Additional CSS classes for the container
 * @param {string} props.gripPosition - Position of grip: 'top' | 'left' (default: 'top')
 * @param {boolean} props.showGrip - Whether to show the grip icon (default: true)
 * @param {number} props.zIndex - Base z-index (default: 50)
 */
export function DraggablePanel({
  id,
  defaultPosition = { x: 16, y: 16 },
  children,
  className,
  gripPosition = 'top',
  showGrip = true,
  zIndex = 50,
}) {
  const {
    isDragging,
    dragHandleProps,
    containerStyle,
    setRef,
  } = useDraggable(id, defaultPosition);
  
  // Merge z-index with container style
  const mergedStyle = {
    ...containerStyle,
    zIndex: isDragging ? 1000 : zIndex,
  };
  
  return (
    <div
      ref={setRef}
      className={cn(
        'draggable-panel',
        isDragging && 'is-dragging',
        className
      )}
      style={mergedStyle}
    >
      {showGrip && gripPosition === 'top' && (
        <DragHandle {...dragHandleProps} position="top" isDragging={isDragging} />
      )}
      
      <div className="draggable-panel-content">
        {showGrip && gripPosition === 'left' && (
          <DragHandle {...dragHandleProps} position="left" isDragging={isDragging} />
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * DragHandle - The grip icon for dragging
 */
function DragHandle({ position, isDragging, ...props }) {
  const isTop = position === 'top';
  
  return (
    <div
      className={cn(
        'drag-handle',
        isTop ? 'drag-handle-top' : 'drag-handle-left',
        isDragging && 'is-dragging'
      )}
      title="Drag to move"
      {...props}
    >
      <GripVertical 
        size={isTop ? 16 : 14} 
        className={cn(
          'drag-handle-icon',
          isTop && 'rotate-90'
        )}
      />
    </div>
  );
}

/**
 * Inline DragHandle - For use inside existing components
 * Use this when you want to add a drag handle to an existing panel header
 * 
 * @param {Object} props
 * @param {string} props.panelId - Panel identifier
 * @param {Object} props.defaultPosition - Default position
 * @param {Function} props.onPositionChange - Called with containerStyle when position changes
 */
export function useDraggableHandle(panelId, defaultPosition) {
  return useDraggable(panelId, defaultPosition);
}

export default DraggablePanel;
