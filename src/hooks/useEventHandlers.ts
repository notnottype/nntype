/**
 * Refactored event handler system with separated concerns
 * Provides modular, performance-optimized event handling
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import { CanvasObjectType } from '../types';
import {
  normalizePointerEvent,
  isPrimaryPointerEvent,
  isSecondaryPointerEvent,
  EventHandlerState,
  EVENT_CONSTANTS,
  throttle,
  debounce,
  PointerEvent as NormalizedPointerEvent
} from '../utils/eventUtils';
import {
  screenToWorld,
  worldToScreen,
  isPointInObject,
  snapToGrid,
  measureTextWidth,
  createSelectionRectangle,
  getObjectsInSelectionRect
} from '../utils';

// Event handler configuration
interface EventHandlerConfig {
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
  typewriterX?: number;
  typewriterY?: number;
  maxCharsPerLine: number;
}

// Event handler callbacks
interface EventHandlerCallbacks {
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

// Performance optimization configuration (mutable for adaptive adjustments)
const PERFORMANCE_CONFIG = {
  HOVER_THROTTLE: 16, // 60fps for hover effects
  DRAG_THROTTLE: 8,   // 120fps for smooth dragging
  SELECTION_THROTTLE: 32, // 30fps for selection rectangle
  SNAP_DEBOUNCE: 150, // Debounce final snapping calculations
  OBJECT_SEARCH_DEBOUNCE: 50, // Debounce expensive object searches
  CANVAS_UPDATE_THROTTLE: 12, // ~80fps for canvas updates
};

// Specialized event handlers with intelligent throttling/debouncing
class CanvasEventHandlers {
  private config: EventHandlerConfig;
  private callbacks: EventHandlerCallbacks;
  private eventState: React.MutableRefObject<EventHandlerState>;
  private doubleClickTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  private clickCount = 0;

  // Performance optimized handlers
  private throttledHoverUpdate: (pointer: NormalizedPointerEvent) => void;
  private throttledDragUpdate: (deltaX: number, deltaY: number, pointer: NormalizedPointerEvent) => void;
  private throttledSelectionUpdate: (pointer: NormalizedPointerEvent) => void;
  private debouncedSnapCalculation: (callback: () => void) => void;
  private debouncedObjectSearch: (x: number, y: number, callback: (obj: CanvasObjectType | null) => void) => void;
  private throttledCanvasUpdate: (updateFn: () => void) => void;

  constructor(
    config: EventHandlerConfig,
    callbacks: EventHandlerCallbacks,
    eventState: React.MutableRefObject<EventHandlerState>,
    doubleClickTimeout: React.MutableRefObject<NodeJS.Timeout | null>
  ) {
    this.config = config;
    this.callbacks = callbacks;
    this.eventState = eventState;
    this.doubleClickTimeout = doubleClickTimeout;

    // Initialize performance-optimized handlers
    this.initializeOptimizedHandlers();
  }

  private initializeOptimizedHandlers = (): void => {
    // Throttled hover effects for smooth performance
    this.throttledHoverUpdate = throttle((pointer: NormalizedPointerEvent) => {
      const world = this.getWorldCoordinates(pointer.clientX, pointer.clientY);
      // Store client coordinates as before (for display purposes)
      this.callbacks.setMousePosition({ x: pointer.clientX, y: pointer.clientY });
      
      // Calculate canvas-relative coordinates for text box intersection
      const { canvasRef } = this.config;
      let canvasX: number, canvasY: number;
      
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        canvasX = pointer.clientX - rect.left;
        canvasY = pointer.clientY - rect.top;
      } else {
        canvasX = pointer.clientX;
        canvasY = pointer.clientY;
      }
      
      // Immediate object search for responsive hovering
      const hoveredObj = this.findObjectAtPoint(world.x, world.y);
      this.callbacks.setHoveredObject(hoveredObj);
      
      // Check text box intersection using canvas-relative coordinates
      if (this.config.showTextBox && this.config.typewriterX && this.config.typewriterY) {
        const { typewriterX, typewriterY, baseFontSize, maxCharsPerLine } = this.config;
        const textBoxWidth = maxCharsPerLine * (baseFontSize * 0.6);
        const textBoxHeight = baseFontSize * 1.5;
        
        // Use canvas-relative coordinates for consistent text box intersection check
        const isInTextBox = canvasX >= typewriterX - textBoxWidth / 2 && 
                           canvasX <= typewriterX + textBoxWidth / 2 && 
                           canvasY >= typewriterY - textBoxHeight / 2 && 
                           canvasY <= typewriterY + textBoxHeight / 2;
        
        this.callbacks.setIsMouseInTextBox(isInTextBox);
      }
    }, PERFORMANCE_CONFIG.HOVER_THROTTLE);

    // Throttled drag updates for smooth dragging
    this.throttledDragUpdate = throttle((deltaX: number, deltaY: number, pointer: NormalizedPointerEvent) => {
      this.performDragUpdate(deltaX, deltaY, pointer);
    }, PERFORMANCE_CONFIG.DRAG_THROTTLE);

    // Throttled selection rectangle updates
    this.throttledSelectionUpdate = throttle((pointer: NormalizedPointerEvent) => {
      this.performSelectionUpdate(pointer);
    }, PERFORMANCE_CONFIG.SELECTION_THROTTLE);

    // Debounced snap calculation for final positioning
    this.debouncedSnapCalculation = debounce((callback: () => void) => {
      callback();
    }, PERFORMANCE_CONFIG.SNAP_DEBOUNCE);

    // Debounced object search for expensive operations
    this.debouncedObjectSearch = debounce((x: number, y: number, callback: (obj: CanvasObjectType | null) => void) => {
      const obj = this.findObjectAtPoint(x, y);
      callback(obj);
    }, PERFORMANCE_CONFIG.OBJECT_SEARCH_DEBOUNCE);

    // Throttled canvas updates
    this.throttledCanvasUpdate = throttle((updateFn: () => void) => {
      updateFn();
    }, PERFORMANCE_CONFIG.CANVAS_UPDATE_THROTTLE);
  };

  // Coordinate transformation utilities
  getWorldCoordinates = (clientX: number, clientY: number): { x: number; y: number } => {
    const { canvasRef, scale, canvasOffset } = this.config;
    if (!canvasRef.current || !canvasOffset) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    
    return screenToWorld(screenX, screenY, scale, canvasOffset);
  };

  // Object detection
  findObjectAtPoint = (worldX: number, worldY: number): CanvasObjectType | null => {
    const { canvasObjects, fontLoaded, canvasRef, scale, canvasOffset } = this.config;
    
    // Convert world coordinates to screen coordinates for hit testing
    const screenPos = worldToScreen(worldX, worldY, scale, canvasOffset);
    
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
      const obj = canvasObjects[i];
      if (isPointInObject(
        obj,
        screenPos.x,
        screenPos.y,
        scale,
        (x: number, y: number) => worldToScreen(x, y, scale, canvasOffset),
        (text: string, fontSize: number) => measureTextWidth(text, fontSize, canvasRef.current, fontLoaded)
      )) {
        return obj;
      }
    }
    return null;
  };

  // Pointer down handler
  handlePointerDown = (pointer: NormalizedPointerEvent): void => {
    const { isSpacePressed } = this.config;
    const { setSelectedObject, setSelectedObjects, onDoubleClick, onContextMenu } = this.callbacks;
    
    if (!isPrimaryPointerEvent(pointer) && !isSecondaryPointerEvent(pointer)) {
      return;
    }

    const world = this.getWorldCoordinates(pointer.clientX, pointer.clientY);
    const clickedObject = this.findObjectAtPoint(world.x, world.y);

    // Handle right-click context menu
    if (isSecondaryPointerEvent(pointer)) {
      onContextMenu?.(world.x, world.y, clickedObject || undefined);
      return;
    }

    // Update event state
    const eventState = this.eventState.current;
    eventState.dragStart = { x: pointer.clientX, y: pointer.clientY };
    eventState.lastPointerPosition = { x: pointer.clientX, y: pointer.clientY };
    eventState.pointerDownTime = Date.now();

    // Double-click detection
    this.handleClickDetection(world, onDoubleClick);

    // Object selection logic
    this.handleObjectSelection(clickedObject, pointer, isSpacePressed);

    // Capture pointer for consistent event handling
    try {
      this.config.canvasRef.current?.setPointerCapture(pointer.pointerId);
      // Only set activePointerId if capture was successful
      eventState.activePointerId = pointer.pointerId;
    } catch (error) {
      // If capture fails, don't set activePointerId
      console.debug('Failed to capture pointer:', error);
    }
  };

  private handleClickDetection = (world: { x: number; y: number }, onDoubleClick?: (x: number, y: number) => void): void => {
    this.clickCount++;
    
    if (this.doubleClickTimeout.current) {
      clearTimeout(this.doubleClickTimeout.current);
    }

    if (this.clickCount === 2) {
      this.clickCount = 0;
      onDoubleClick?.(world.x, world.y);
      return;
    }

    this.doubleClickTimeout.current = setTimeout(() => {
      this.clickCount = 0;
    }, EVENT_CONSTANTS.DOUBLE_CLICK_THRESHOLD);
  };

  private handleObjectSelection = (
    clickedObject: CanvasObjectType | null,
    pointer: NormalizedPointerEvent,
    isSpacePressed: boolean
  ): void => {
    const { selectedObject, selectedObjects } = this.config;
    const { setSelectedObject, setSelectedObjects } = this.callbacks;
    const eventState = this.eventState.current;

    if (clickedObject) {
      if (isSpacePressed || pointer.shiftKey || pointer.ctrlKey || pointer.metaKey) {
        // Multi-selection mode
        this.handleMultiSelection(clickedObject, selectedObjects, setSelectedObjects, setSelectedObject);
      } else {
        // Single selection
        this.handleSingleSelection(clickedObject, selectedObjects, setSelectedObject, setSelectedObjects);
        eventState.isDraggingText = true;
      }
    } else {
      // Clicked on empty space
      if (isSpacePressed) {
        eventState.isDragging = true;
      } else {
        eventState.isSelecting = true;
        setSelectedObject(null);
        setSelectedObjects([]);
      }
    }
  };

  private handleMultiSelection = (
    clickedObject: CanvasObjectType,
    selectedObjects: CanvasObjectType[],
    setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>,
    setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>
  ): void => {
    if (selectedObjects.some(obj => obj.id === clickedObject.id)) {
      // Deselect if already selected
      setSelectedObjects(prev => prev.filter(obj => obj.id !== clickedObject.id));
      if (this.config.selectedObject?.id === clickedObject.id) {
        setSelectedObject(null);
      }
    } else {
      // Add to selection
      setSelectedObjects(prev => [...prev, clickedObject]);
      setSelectedObject(clickedObject);
    }
  };

  private handleSingleSelection = (
    clickedObject: CanvasObjectType,
    selectedObjects: CanvasObjectType[],
    setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>,
    setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>
  ): void => {
    if (!selectedObjects.some(obj => obj.id === clickedObject.id)) {
      setSelectedObject(clickedObject);
      setSelectedObjects([clickedObject]);
    }
  };

  // Enhanced pointer move handler with intelligent throttling
  handlePointerMove = (pointer: NormalizedPointerEvent): void => {
    const eventState = this.eventState.current;

    // Always update hover state for UI feedback (throttled)
    this.throttledHoverUpdate(pointer);

    // If no active interaction, just handle hovering
    if (!eventState.isDragging && !eventState.isDraggingText && !eventState.isSelecting) {
      return;
    }

    // Only handle active pointer moves during interaction
    if (eventState.activePointerId !== null && eventState.activePointerId !== pointer.pointerId) {
      return;
    }

    const deltaX = pointer.clientX - eventState.lastPointerPosition.x;
    const deltaY = pointer.clientY - eventState.lastPointerPosition.y;

    // Use different throttling strategies based on interaction type
    if (eventState.isDraggingText || eventState.isDragging) {
      // Use high-frequency throttling for smooth dragging
      this.throttledDragUpdate(deltaX, deltaY, pointer);
    } else if (eventState.isSelecting) {
      // Use lower frequency for selection rectangle (less critical for smoothness)
      this.throttledSelectionUpdate(pointer);
    }
  };

  // Extracted drag update logic for throttling
  private performDragUpdate = (deltaX: number, deltaY: number, pointer: NormalizedPointerEvent): void => {
    const eventState = this.eventState.current;

    if (eventState.isDraggingText) {
      this.handleTextDragging(deltaX, deltaY, pointer);
    } else if (eventState.isDragging) {
      this.handleCanvasPanning(deltaX, deltaY);
    }
    
    // Update last pointer position after processing
    eventState.lastPointerPosition = { x: pointer.clientX, y: pointer.clientY };
  };

  // Extracted selection update logic for throttling
  private performSelectionUpdate = (pointer: NormalizedPointerEvent): void => {
    this.handleSelectionRectangle(pointer);
  };

  private handleTextDragging = (deltaX: number, deltaY: number, pointer: NormalizedPointerEvent): void => {
    const { scale, baseFontSize, selectedObject, selectedObjects } = this.config;
    const { setSelectedObject, setSelectedObjects, setDragPreviewObjects } = this.callbacks;
    const eventState = this.eventState.current;
    
    const worldDeltaX = deltaX / scale;
    const worldDeltaY = deltaY / scale;
    const worldGridSize = baseFontSize / scale;

    if (selectedObjects.length > 1) {
      this.handleMultiObjectDragging(worldDeltaX, worldDeltaY, worldGridSize, selectedObjects, setSelectedObjects, setDragPreviewObjects);
    } else if (selectedObject) {
      this.handleSingleObjectDragging(worldDeltaX, worldDeltaY, worldGridSize, selectedObject, setSelectedObject, setDragPreviewObjects);
    }
  };

  private handleMultiObjectDragging = (
    worldDeltaX: number,
    worldDeltaY: number,
    worldGridSize: number,
    selectedObjects: CanvasObjectType[],
    setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>,
    setDragPreviewObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>
  ): void => {
    // Throttle canvas updates for smooth performance
    this.throttledCanvasUpdate(() => {
      const updatedObjects = selectedObjects.map(obj => ({
        ...obj,
        x: obj.x + worldDeltaX,
        y: obj.y + worldDeltaY
      }));

      setSelectedObjects(updatedObjects);
      
      // Create snapped preview (debounced for performance)
      this.debouncedSnapCalculation(() => {
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
      });
    });
  };

  private handleSingleObjectDragging = (
    worldDeltaX: number,
    worldDeltaY: number,
    worldGridSize: number,
    selectedObject: CanvasObjectType,
    setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>,
    setDragPreviewObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>
  ): void => {
    // Throttle single object updates for smooth performance
    this.throttledCanvasUpdate(() => {
      const updatedObject = {
        ...selectedObject,
        x: selectedObject.x + worldDeltaX,
        y: selectedObject.y + worldDeltaY
      };

      setSelectedObject(updatedObject);

      // Create snapped preview (debounced for performance)
      this.debouncedSnapCalculation(() => {
        const snappedX = snapToGrid(updatedObject.x, worldGridSize);
        const snappedY = snapToGrid(updatedObject.y, worldGridSize);
        
        setDragPreviewObjects([{
          ...updatedObject,
          x: snappedX,
          y: snappedY
        }]);
      });
    });
  };

  private handleCanvasPanning = (deltaX: number, deltaY: number): void => {
    const { baseFontSize } = this.config;
    const { setCanvasOffset } = this.callbacks;
    const eventState = this.eventState.current;
    
    // Throttle canvas panning for smooth performance
    this.throttledCanvasUpdate(() => {
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
    });
  };

  private handleSelectionRectangle = (pointer: NormalizedPointerEvent): void => {
    const { canvasObjects, scale, canvasOffset, fontLoaded, canvasRef } = this.config;
    const { setSelectionRect, setSelectedObjects } = this.callbacks;
    const eventState = this.eventState.current;

    // Create selection rectangle (immediate visual feedback)
    const selectionRect = createSelectionRectangle(
      eventState.dragStart.x,
      eventState.dragStart.y,
      pointer.clientX,
      pointer.clientY
    );
    
    setSelectionRect(selectionRect);

    // Debounce expensive object intersection calculations
    this.debouncedObjectSearch(0, 0, () => {
      const selectedObjs = getObjectsInSelectionRect(
        canvasObjects,
        selectionRect,
        scale,
        canvasOffset,
        (text: string, fontSize: number) => measureTextWidth(text, fontSize, canvasRef.current, fontLoaded)
      );
      
      setSelectedObjects(selectedObjs);
    });
  };

  // Pointer up handler
  handlePointerUp = (pointer: NormalizedPointerEvent): void => {
    const eventState = this.eventState.current;

    if (eventState.activePointerId !== pointer.pointerId) {
      return;
    }

    // Apply final snapping for dragged objects
    if (eventState.isDraggingText) {
      this.applyFinalSnapping();
    }

    this.resetEventState();
  };

  private applyFinalSnapping = (): void => {
    const { scale, baseFontSize, selectedObject, selectedObjects, showTextBox } = this.config;
    const { setCanvasObjects, setSelectedObject, setSelectedObjects } = this.callbacks;
    
    const worldGridSize = baseFontSize / scale;

    if (selectedObjects.length > 1) {
      this.applyMultiObjectSnapping(worldGridSize, selectedObjects, setCanvasObjects, setSelectedObjects);
    } else if (selectedObject) {
      this.applySingleObjectSnapping(worldGridSize, selectedObject, setCanvasObjects, setSelectedObject);
    }

    // Restore focus to text input if needed
    if (showTextBox) {
      setTimeout(() => {
        const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
        if (input) input.focus();
      }, 0);
    }
  };

  private applyMultiObjectSnapping = (
    worldGridSize: number,
    selectedObjects: CanvasObjectType[],
    setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>,
    setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>
  ): void => {
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
  };

  private applySingleObjectSnapping = (
    worldGridSize: number,
    selectedObject: CanvasObjectType,
    setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>,
    setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>
  ): void => {
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
  };

  private resetEventState = (): void => {
    const { setDragPreviewObjects, setSelectionRect } = this.callbacks;
    const eventState = this.eventState.current;
    
    // Release pointer capture before clearing state
    if (eventState.activePointerId && this.config.canvasRef.current) {
      try {
        this.config.canvasRef.current.releasePointerCapture(eventState.activePointerId);
      } catch (error) {
        // Silently ignore - browser may have already released capture
      }
    }
    
    // Clear event state
    eventState.isDragging = false;
    eventState.isDraggingText = false;
    eventState.isSelecting = false;
    eventState.activePointerId = null;
    
    // Clear preview objects and selection rectangle
    setDragPreviewObjects([]);
    setSelectionRect(null);
  };
}

// Main hook with separated concerns
export const useEventHandlers = (config: EventHandlerConfig, callbacks: EventHandlerCallbacks) => {
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

  // Create event handlers instance
  const eventHandlers = useMemo(
    () => new CanvasEventHandlers(config, callbacks, eventStateRef, doubleClickTimeoutRef),
    [config, callbacks]
  );

  // Performance monitoring for adaptive throttling
  const performanceMetrics = useRef({
    lastFrameTime: 0,
    averageFrameTime: 16.67, // 60fps baseline
    frameCount: 0
  });

  // Adaptive performance handler that adjusts throttling based on performance
  const updatePerformanceMetrics = useCallback(() => {
    const now = performance.now();
    const frameTime = now - performanceMetrics.current.lastFrameTime;
    
    if (performanceMetrics.current.lastFrameTime > 0) {
      performanceMetrics.current.averageFrameTime = 
        (performanceMetrics.current.averageFrameTime * 0.9) + (frameTime * 0.1);
      performanceMetrics.current.frameCount++;
      
      // Adaptive throttling: increase throttle intervals if performance is poor
      if (performanceMetrics.current.averageFrameTime > 20) {
        // Performance is degrading, increase throttling
        PERFORMANCE_CONFIG.HOVER_THROTTLE = Math.min(32, PERFORMANCE_CONFIG.HOVER_THROTTLE * 1.2);
        PERFORMANCE_CONFIG.DRAG_THROTTLE = Math.min(16, PERFORMANCE_CONFIG.DRAG_THROTTLE * 1.2);
      } else if (performanceMetrics.current.averageFrameTime < 12) {
        // Performance is good, can reduce throttling for smoother experience
        PERFORMANCE_CONFIG.HOVER_THROTTLE = Math.max(8, PERFORMANCE_CONFIG.HOVER_THROTTLE * 0.9);
        PERFORMANCE_CONFIG.DRAG_THROTTLE = Math.max(4, PERFORMANCE_CONFIG.DRAG_THROTTLE * 0.9);
      }
    }
    
    performanceMetrics.current.lastFrameTime = now;
  }, []);

  // Performance-aware cleanup
  useEffect(() => {
    let animationFrameId: number;
    
    const performanceLoop = () => {
      updatePerformanceMetrics();
      animationFrameId = requestAnimationFrame(performanceLoop);
    };
    
    performanceLoop();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [updatePerformanceMetrics]);

  // React event handlers with performance optimization
  const handlePointerDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const pointer = normalizePointerEvent(event);
    event.preventDefault();
    updatePerformanceMetrics(); // Track performance on interaction start
    eventHandlers.handlePointerDown(pointer);
  }, [eventHandlers, updatePerformanceMetrics]);

  const handlePointerMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const pointer = normalizePointerEvent(event);
    eventHandlers.handlePointerMove(pointer);
  }, [eventHandlers]);

  const handlePointerUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const pointer = normalizePointerEvent(event);
    eventHandlers.handlePointerUp(pointer);
  }, [eventHandlers]);

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const world = eventHandlers.getWorldCoordinates(event.clientX, event.clientY);
    const clickedObject = eventHandlers.findObjectAtPoint(world.x, world.y);
    callbacks.onContextMenu?.(world.x, world.y, clickedObject || undefined);
  }, [eventHandlers, callbacks]);

  // Enhanced cleanup with performance monitoring cleanup
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