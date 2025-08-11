/**
 * Optimized hooks for InfiniteTypewriterCanvas
 * Provides performance-optimized React hooks with proper memoization and cleanup
 */

import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { CanvasObject, TextObject, GuideObject } from '../types';
import { measureTextWidth } from '../utils';

/**
 * Optimized text measurement hook with memoization
 */
export const useTextMeasurement = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  fontLoaded: boolean,
  baseFontSize: number,
  maxCharsPerLine: number
) => {
  // Memoize text width calculation to prevent unnecessary recalculations
  const measureTextWidthMemoized = useCallback(
    (text: string, fontSize: number = baseFontSize) => {
      if (canvasRef.current && fontLoaded) {
        return measureTextWidth(text, fontSize, canvasRef.current, fontLoaded);
      }
      // Fallback calculation when canvas or font is not ready
      return text.length * fontSize * 0.6;
    },
    [baseFontSize, fontLoaded, canvasRef]
  );

  // Memoize text box width calculation
  const getTextBoxWidth = useCallback(() => {
    return measureTextWidthMemoized('A'.repeat(maxCharsPerLine), baseFontSize);
  }, [measureTextWidthMemoized, maxCharsPerLine, baseFontSize]);

  return {
    measureTextWidth: measureTextWidthMemoized,
    getTextBoxWidth
  };
};

/**
 * Optimized auto-save hook with debouncing
 */
export const useAutoSave = (
  saveCallback: () => void,
  dependencies: any[],
  debounceMs: number = 1000,
  enabled: boolean = true
) => {
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear previous timeout to debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveCallback();
      saveTimeoutRef.current = null;
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, dependencies);
};

/**
 * Optimized typewriter position hook
 */
export const useTypewriterPosition = (canvasWidth: number, canvasHeight: number) => {
  // Memoize typewriter position calculations
  const typewriterX = useMemo(() => canvasWidth / 2, [canvasWidth]);
  const typewriterY = useMemo(() => canvasHeight / 2, [canvasHeight]);

  return { typewriterX, typewriterY };
};

/**
 * Optimized event handler with proper cleanup
 */
export const useEventHandler = <K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  enabled: boolean = true
) => {
  const savedHandler = useRef<(event: WindowEventMap[K]) => void>();

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: WindowEventMap[K]) => {
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    window.addEventListener(eventName, eventListener);

    return () => {
      window.removeEventListener(eventName, eventListener);
    };
  }, [eventName, enabled]);
};

/**
 * Optimized canvas resizing hook
 */
export const useCanvasResize = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setCanvasSize: (width: number, height: number) => void
) => {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize(width, height);
      }
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(canvas);

    // Initial size
    const rect = canvas.getBoundingClientRect();
    setCanvasSize(rect.width, rect.height);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [canvasRef, setCanvasSize]);
};

/**
 * Optimized animation frame hook
 */
export const useAnimationFrame = (
  callback: (deltaTime: number) => void,
  enabled: boolean = true
) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, enabled]);
};

/**
 * Optimized object selection hook
 */
export const useObjectSelection = (canvasObjects: CanvasObject[]) => {
  const [selectedObjectIds, setSelectedObjectIds] = useState<Set<string>>(new Set());

  // Memoize selected objects
  const selectedObjects = useMemo(() => {
    return canvasObjects.filter(obj => selectedObjectIds.has(obj.id.toString()));
  }, [canvasObjects, selectedObjectIds]);

  const selectObject = useCallback((objectId: string) => {
    setSelectedObjectIds(prev => new Set(prev).add(objectId));
  }, []);

  const deselectObject = useCallback((objectId: string) => {
    setSelectedObjectIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(objectId);
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedObjectIds(new Set());
  }, []);

  const toggleObjectSelection = useCallback((objectId: string) => {
    setSelectedObjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(objectId)) {
        newSet.delete(objectId);
      } else {
        newSet.add(objectId);
      }
      return newSet;
    });
  }, []);

  return {
    selectedObjectIds,
    selectedObjects,
    selectObject,
    deselectObject,
    clearSelection,
    toggleObjectSelection
  };
};

/**
 * Optimized drag state hook
 */
export const useDragState = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });

  const startDrag = useCallback((x: number, y: number) => {
    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd({ x, y });
  }, []);

  const updateDrag = useCallback((x: number, y: number) => {
    if (isDragging) {
      setDragEnd({ x, y });
    }
  }, [isDragging]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getDragDelta = useCallback(() => {
    return {
      x: dragEnd.x - dragStart.x,
      y: dragEnd.y - dragStart.y
    };
  }, [dragStart, dragEnd]);

  return {
    isDragging,
    dragStart,
    dragEnd,
    startDrag,
    updateDrag,
    endDrag,
    getDragDelta
  };
};

/**
 * Optimized hover state hook
 */
export const useHoverState = <T extends { id: string | number }>() => {
  const [hoveredItem, setHoveredItem] = useState<T | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const setHoveredItemDebounced = useCallback((item: T | null, delay: number = 0) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (delay > 0) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoveredItem(item);
        hoverTimeoutRef.current = null;
      }, delay);
    } else {
      setHoveredItem(item);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    hoveredItem,
    setHoveredItem: setHoveredItemDebounced,
    clearHoveredItem: useCallback(() => setHoveredItemDebounced(null), [setHoveredItemDebounced])
  };
};

/**
 * Optimized undo/redo stack hook
 */
export const useUndoRedo = <T>(initialState: T, maxStackSize: number = 50) => {
  const [state, setState] = useState<T>(initialState);
  const [undoStack, setUndoStack] = useState<T[]>([]);
  const [redoStack, setRedoStack] = useState<T[]>([]);

  const pushState = useCallback((newState: T) => {
    setUndoStack(prev => [...prev.slice(-maxStackSize + 1), state]);
    setState(newState);
    setRedoStack([]);
  }, [state, maxStackSize]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, state]);
    setState(previousState);
  }, [state, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, state]);
    setState(nextState);
  }, [state, redoStack]);

  return {
    state,
    pushState,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  };
};