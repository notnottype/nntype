/**
 * Centralized canvas event handling hook inspired by Excalidraw's architecture
 * Provides unified pointer event handling with proper state management
 */

import { useCallback, useRef, useEffect } from 'react';
import { 
  normalizePointerEvent, 
  isPrimaryPointerEvent,
  isSecondaryPointerEvent,
  getPointerDistance,
  EventHandlerState,
  PointerEvent,
  EVENT_CONSTANTS,
  throttle
} from '../utils/eventUtils';
import { CanvasObjectType, SelectionRectangle } from '../types';
import { 
  screenToWorld, 
  isPointInObject, 
  measureTextWidth,
  snapToGrid,
  createSelectionRectangle,
  getObjectsInSelectionRect
} from '../utils';

interface UseCanvasEventsProps {
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
  
  // State setters
  setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setCanvasOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setDragPreviewObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectionRect: React.Dispatch<React.SetStateAction<SelectionRectangle | null>>;
  setHoveredObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setMousePosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsMouseInTextBox: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Callbacks
  onDoubleClick?: (worldX: number, worldY: number) => void;
  onContextMenu?: (worldX: number, worldY: number, object?: CanvasObjectType) => void;
}

export const useCanvasEvents = ({
  canvasRef,
  canvasObjects,
  selectedObject,
  selectedObjects,
  scale,
  canvasOffset,
  baseFontSize,
  fontLoaded,
  showTextBox,
  isSpacePressed,
  setCanvasObjects,
  setSelectedObject,
  setSelectedObjects,
  setCanvasOffset,
  setDragPreviewObjects,
  setSelectionRect,
  setHoveredObject,
  setMousePosition,
  setIsMouseInTextBox,
  onDoubleClick,
  onContextMenu
}: UseCanvasEventsProps) => {
  
  // Event handler state
  const eventStateRef = useRef<EventHandlerState>({
    isDragging: false,
    isDraggingText: false,
    isSelecting: false,
    dragStart: { x: 0, y: 0 },
    lastPointerPosition: { x: 0, y: 0 },
    activePointerId: null,
    pointerDownTime: 0
  });

  const doubleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  // Helper function to get world coordinates
  const getWorldCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    return screenToWorld({ x: screenX, y: screenY }, scale, canvasOffset);
  }, [scale, canvasOffset]);

  // Find object at world coordinates
  const findObjectAtPoint = useCallback((worldX: number, worldY: number): CanvasObjectType | null => {
    // Check in reverse order (top to bottom)
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
      const obj = canvasObjects[i];
      if (isPointInObject(
        { x: worldX, y: worldY }, 
        obj, 
        (text: string, fontSize: number) => measureTextWidth(text, fontSize, canvasRef.current, fontLoaded)
      )) {
        return obj;
      }
    }
    return null;
  }, [canvasObjects, fontLoaded]);

  // Throttled mouse move handler for performance
  const throttledMouseMove = useCallback(
    throttle((pointer: PointerEvent) => {
      const world = getWorldCoordinates(pointer.clientX, pointer.clientY);
      setMousePosition({ x: pointer.clientX, y: pointer.clientY });
      
      // Update hovered object
      const hoveredObj = findObjectAtPoint(world.x, world.y);
      setHoveredObject(hoveredObj);
      
      // Check if mouse is in text box area
      if (showTextBox) {
        // Implementation depends on your text box positioning logic
        // This is a placeholder - adjust based on your text box position calculation
        setIsMouseInTextBox(false); // Update this logic
      }
    }, EVENT_CONSTANTS.THROTTLE_INTERVAL),
    [getWorldCoordinates, findObjectAtPoint, showTextBox]
  );

  // Pointer down handler
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = normalizePointerEvent(event);
    
    if (!isPrimaryPointerEvent(pointer) && !isSecondaryPointerEvent(pointer)) {
      return;
    }

    // Prevent default to avoid text selection and other browser behaviors
    event.preventDefault();

    const eventState = eventStateRef.current;
    const world = getWorldCoordinates(pointer.clientX, pointer.clientY);
    const clickedObject = findObjectAtPoint(world.x, world.y);

    // Handle right-click context menu
    if (isSecondaryPointerEvent(pointer)) {
      onContextMenu?.(world.x, world.y, clickedObject || undefined);
      return;
    }

    // Update event state
    eventState.activePointerId = pointer.pointerId;
    eventState.dragStart = { x: pointer.clientX, y: pointer.clientY };
    eventState.lastPointerPosition = { x: pointer.clientX, y: pointer.clientY };
    eventState.pointerDownTime = Date.now();

    // Handle double-click detection
    clickCountRef.current++;
    if (doubleClickTimeoutRef.current) {
      clearTimeout(doubleClickTimeoutRef.current);
    }

    if (clickCountRef.current === 2) {
      // Double click detected
      clickCountRef.current = 0;
      onDoubleClick?.(world.x, world.y);
      return;
    }

    doubleClickTimeoutRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, EVENT_CONSTANTS.DOUBLE_CLICK_THRESHOLD);

    // Object selection logic
    if (clickedObject) {
      if (pointer.shiftKey || pointer.ctrlKey || pointer.metaKey) {
        // Multi-selection mode
        if (selectedObjects.some(obj => obj.id === clickedObject.id)) {
          // Deselect if already selected
          setSelectedObjects(prev => prev.filter(obj => obj.id !== clickedObject.id));
          if (selectedObject?.id === clickedObject.id) {
            setSelectedObject(null);
          }
        } else {
          // Add to selection
          setSelectedObjects(prev => [...prev, clickedObject]);
          setSelectedObject(clickedObject);
        }
      } else {
        // Single selection
        if (!selectedObjects.some(obj => obj.id === clickedObject.id)) {
          setSelectedObject(clickedObject);
          setSelectedObjects([clickedObject]);
        }
        eventState.isDraggingText = true;
      }
    } else {
      // Clicked on empty space
      if (isSpacePressed) {
        // Pan mode
        eventState.isDragging = true;
      } else {
        // Multi-select mode
        eventState.isSelecting = true;
        setSelectedObject(null);
        setSelectedObjects([]);
      }
    }

    // Capture pointer for consistent event handling
    canvasRef.current?.setPointerCapture(pointer.pointerId);
  }, [
    getWorldCoordinates,
    findObjectAtPoint,
    selectedObject,
    selectedObjects,
    isSpacePressed,
    setSelectedObject,
    setSelectedObjects,
    onDoubleClick,
    onContextMenu
  ]);

  // Pointer move handler
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = normalizePointerEvent(event);
    const eventState = eventStateRef.current;

    // Always update mouse position for hover effects
    throttledMouseMove(pointer);

    // Only handle primary pointer moves during interaction
    if (eventState.activePointerId !== pointer.pointerId) {
      return;
    }

    const deltaX = pointer.clientX - eventState.lastPointerPosition.x;
    const deltaY = pointer.clientY - eventState.lastPointerPosition.y;

    // Text object dragging
    if (eventState.isDraggingText) {
      event.preventDefault();
      
      const worldDeltaX = deltaX / scale;
      const worldDeltaY = deltaY / scale;
      const worldGridSize = baseFontSize / scale;

      if (selectedObjects.length > 1) {
        // Multi-object dragging
        const updatedObjects = selectedObjects.map(obj => ({
          ...obj,
          x: obj.x + worldDeltaX,
          y: obj.y + worldDeltaY
        }));

        setSelectedObjects(updatedObjects);
        
        // Update preview with snapped positions
        const referenceObj = updatedObjects[0];
        const snappedX = snapToGrid(referenceObj.x, worldGridSize);
        const snappedY = snapToGrid(referenceObj.y, worldGridSize);
        const snapDeltaX = snappedX - referenceObj.x;
        const snapDeltaY = snappedY - referenceObj.y;

        const previewObjects = updatedObjects.map(obj => ({
          ...obj,
          x: obj.x + snapDeltaX,
          y: obj.y + snapDeltaY
        }));

        setDragPreviewObjects(previewObjects);
      } else if (selectedObject) {
        // Single object dragging
        const updatedObject = {
          ...selectedObject,
          x: selectedObject.x + worldDeltaX,
          y: selectedObject.y + worldDeltaY
        };

        setSelectedObject(updatedObject);

        // Create snapped preview
        const snappedX = snapToGrid(updatedObject.x, worldGridSize);
        const snappedY = snapToGrid(updatedObject.y, worldGridSize);
        
        setDragPreviewObjects([{
          ...updatedObject,
          x: snappedX,
          y: snappedY
        }]);
      }

      eventState.lastPointerPosition = { x: pointer.clientX, y: pointer.clientY };
    }
    // Canvas panning
    else if (eventState.isDragging) {
      event.preventDefault();
      
      const gridSize = baseFontSize * 1.8;
      const snappedDeltaX = snapToGrid(deltaX, gridSize);
      const snappedDeltaY = snapToGrid(deltaY, gridSize);

      if (Math.abs(snappedDeltaX) >= gridSize || Math.abs(snappedDeltaY) >= gridSize) {
        setCanvasOffset(prev => ({
          x: prev.x + snappedDeltaX,
          y: prev.y + snappedDeltaY
        }));

        eventState.lastPointerPosition = {
          x: eventState.lastPointerPosition.x + snappedDeltaX,
          y: eventState.lastPointerPosition.y + snappedDeltaY
        };
      }
    }
    // Multi-selection rectangle
    else if (eventState.isSelecting) {
      const selectionRect = createSelectionRectangle(
        eventState.dragStart.x,
        eventState.dragStart.y,
        pointer.clientX,
        pointer.clientY
      );
      
      setSelectionRect(selectionRect);

      // Find objects in selection area
      const selectedObjs = getObjectsInSelectionRect(
        canvasObjects,
        selectionRect,
        scale,
        canvasOffset,
        (text: string, fontSize: number) => measureTextWidth(text, fontSize, canvasRef.current, fontLoaded)
      );
      
      setSelectedObjects(selectedObjs);
    }
  }, [
    scale,
    baseFontSize,
    selectedObject,
    selectedObjects,
    canvasObjects,
    canvasOffset,
    fontLoaded,
    setSelectedObject,
    setSelectedObjects,
    setDragPreviewObjects,
    setSelectionRect,
    setCanvasOffset,
    throttledMouseMove
  ]);

  // Pointer up handler
  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const pointer = normalizePointerEvent(event);
    const eventState = eventStateRef.current;

    if (eventState.activePointerId !== pointer.pointerId) {
      return;
    }

    // Apply final snapping for dragged objects
    if (eventState.isDraggingText) {
      const worldGridSize = baseFontSize / scale;

      if (selectedObjects.length > 1) {
        // Multi-object final positioning
        const referenceObj = selectedObjects[0];
        const snappedX = snapToGrid(referenceObj.x, worldGridSize);
        const snappedY = snapToGrid(referenceObj.y, worldGridSize);
        const snapDeltaX = snappedX - referenceObj.x;
        const snapDeltaY = snappedY - referenceObj.y;

        if (snapDeltaX !== 0 || snapDeltaY !== 0) {
          const selectedIds = selectedObjects.map(obj => obj.id);
          setCanvasObjects(prev => prev.map(obj =>
            selectedIds.includes(obj.id)
              ? { ...obj, x: obj.x + snapDeltaX, y: obj.y + snapDeltaY }
              : obj
          ));

          setSelectedObjects(prev => prev.map(obj => ({
            ...obj,
            x: obj.x + snapDeltaX,
            y: obj.y + snapDeltaY
          })));
        }
      } else if (selectedObject) {
        // Single object final positioning
        const snappedX = snapToGrid(selectedObject.x, worldGridSize);
        const snappedY = snapToGrid(selectedObject.y, worldGridSize);

        if (snappedX !== selectedObject.x || snappedY !== selectedObject.y) {
          setCanvasObjects(prev => prev.map(obj =>
            obj.id === selectedObject.id
              ? { ...obj, x: snappedX, y: snappedY }
              : obj
          ));

          setSelectedObject(prev => prev ? { ...prev, x: snappedX, y: snappedY } : null);
        }
      }
    }

    // Reset event state
    eventState.isDragging = false;
    eventState.isDraggingText = false;
    eventState.isSelecting = false;
    eventState.activePointerId = null;
    
    // Clear preview objects and selection rectangle
    setDragPreviewObjects([]);
    setSelectionRect(null);

    // Release pointer capture
    canvasRef.current?.releasePointerCapture(pointer.pointerId);

    // Restore focus to text input if needed
    if (showTextBox) {
      setTimeout(() => {
        const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
        if (input) input.focus();
      }, 0);
    }
  }, [
    scale,
    baseFontSize,
    selectedObject,
    selectedObjects,
    showTextBox,
    setCanvasObjects,
    setSelectedObject,
    setSelectedObjects,
    setDragPreviewObjects,
    setSelectionRect
  ]);

  // Context menu handler
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    const world = getWorldCoordinates(event.clientX, event.clientY);
    const clickedObject = findObjectAtPoint(world.x, world.y);
    
    onContextMenu?.(world.x, world.y, clickedObject || undefined);
  }, [getWorldCoordinates, findObjectAtPoint, onContextMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (doubleClickTimeoutRef.current) {
        clearTimeout(doubleClickTimeoutRef.current);
      }
    };
  }, []);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleContextMenu,
    eventState: eventStateRef.current
  };
};