/**
 * Enhanced Canvas Events Hook - Backward compatible wrapper
 * 
 * This provides a drop-in replacement for useCanvasEvents with enhanced performance
 * while maintaining the same API for easy migration.
 */

import { useEventHandlers } from './useEventHandlers';
import { CanvasObjectType } from '../types';

// Legacy interface for backward compatibility
export interface UseCanvasEventsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  selectedObjects: CanvasObjectType[];
  scale: number;
  canvasOffset: { x: number; y: number };
  baseFontSize: number;
  fontLoaded: boolean;
  showTextBox: boolean;
  isSpacePressed: boolean;
  setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setCanvasOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setDragPreviewObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectionRect: React.Dispatch<React.SetStateAction<{ x: number; y: number; width: number; height: number } | null>>;
  setHoveredObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setMousePosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsMouseInTextBox: React.Dispatch<React.SetStateAction<boolean>>;
  onDoubleClick?: (x: number, y: number) => void;
  onContextMenu?: (x: number, y: number, object?: CanvasObjectType) => void;
}

/**
 * Enhanced Canvas Events Hook
 * 
 * Drop-in replacement for useCanvasEvents with performance improvements:
 * - Adaptive throttling/debouncing
 * - Better performance monitoring
 * - Separated concerns for better maintainability
 * 
 * @param props - Same props as original useCanvasEvents
 * @returns Enhanced event handlers with same interface
 */
export const useCanvasEventsEnhanced = (props: UseCanvasEventsProps) => {
  // Extract config and callbacks from legacy props
  const config = {
    canvasRef: props.canvasRef,
    canvasObjects: props.canvasObjects,
    selectedObject: props.selectedObject,
    selectedObjects: props.selectedObjects,
    scale: props.scale,
    canvasOffset: props.canvasOffset,
    baseFontSize: props.baseFontSize,
    fontLoaded: props.fontLoaded,
    showTextBox: props.showTextBox,
    isSpacePressed: props.isSpacePressed,
  };

  const callbacks = {
    setCanvasObjects: props.setCanvasObjects,
    setSelectedObject: props.setSelectedObject,
    setSelectedObjects: props.setSelectedObjects,
    setCanvasOffset: props.setCanvasOffset,
    setDragPreviewObjects: props.setDragPreviewObjects,
    setSelectionRect: props.setSelectionRect,
    setHoveredObject: props.setHoveredObject,
    setMousePosition: props.setMousePosition,
    setIsMouseInTextBox: props.setIsMouseInTextBox,
    onDoubleClick: props.onDoubleClick,
    onContextMenu: props.onContextMenu,
  };

  // Use the enhanced event handlers
  return useEventHandlers(config, callbacks);
};

// Re-export for backward compatibility
export { useCanvasEventsEnhanced as useCanvasEvents };