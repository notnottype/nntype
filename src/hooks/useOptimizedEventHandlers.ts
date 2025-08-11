/**
 * Optimized event handlers for InfiniteTypewriterCanvas
 * Provides memoized event handlers to prevent unnecessary re-renders
 */

import { useCallback, useRef, useMemo } from 'react';
import { CanvasObject, TextObject, GuideObject, CanvasMode } from '../types';
import { screenToWorld, isPointInObject, findObjectAtPin } from '../utils';
import { findLinkAtPosition } from '../utils/linkUtils';

interface MousePosition {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  dragStart: MousePosition;
  dragEnd: MousePosition;
}

/**
 * Optimized mouse event handlers
 */
export const useOptimizedMouseHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  scale: number,
  canvasOffset: { x: number; y: number },
  currentMode: CanvasMode,
  isTyping: boolean,
  isSpacePressed: boolean
) => {
  const lastMousePosition = useRef<MousePosition>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<MousePosition>({ x: 0, y: 0 });

  // Memoized coordinate transformation
  const getWorldCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      
      return screenToWorld(screenX, screenY, canvasOffset, scale);
    },
    [canvasRef, canvasOffset, scale]
  );

  // Optimized mouse down handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Prevent default to avoid text selection
      e.preventDefault();
      
      const worldPos = getWorldCoordinates(e.clientX, e.clientY);
      
      isDraggingRef.current = true;
      dragStartRef.current = worldPos;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      
      return {
        worldPosition: worldPos,
        screenPosition: { x: e.clientX, y: e.clientY },
        button: e.button,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey
      };
    },
    [getWorldCoordinates]
  );

  // Optimized mouse move handler with throttling
  const handleMouseMove = useMemo(() => {
    let frameId: number | null = null;
    
    return (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (frameId !== null) return;
      
      frameId = requestAnimationFrame(() => {
        const worldPos = getWorldCoordinates(e.clientX, e.clientY);
        const delta = {
          x: e.clientX - lastMousePosition.current.x,
          y: e.clientY - lastMousePosition.current.y
        };
        
        lastMousePosition.current = { x: e.clientX, y: e.clientY };
        frameId = null;
        
        // Return event data for processing
        return {
          worldPosition: worldPos,
          screenPosition: { x: e.clientX, y: e.clientY },
          delta,
          isDragging: isDraggingRef.current
        };
      });
    };
  }, [getWorldCoordinates]);

  // Optimized mouse up handler
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const worldPos = getWorldCoordinates(e.clientX, e.clientY);
      const wasDragging = isDraggingRef.current;
      
      isDraggingRef.current = false;
      
      return {
        worldPosition: worldPos,
        screenPosition: { x: e.clientX, y: e.clientY },
        wasDragging,
        dragDistance: wasDragging ? {
          x: worldPos.x - dragStartRef.current.x,
          y: worldPos.y - dragStartRef.current.y
        } : { x: 0, y: 0 }
      };
    },
    [getWorldCoordinates]
  );

  // Optimized wheel handler with passive event listener
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Check if zooming is allowed
      if (isTyping && !e.ctrlKey && !e.metaKey) return null;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      return {
        deltaY: e.deltaY,
        ctrlKey: e.ctrlKey || e.metaKey,
        mousePosition: { x: mouseX, y: mouseY }
      };
    },
    [canvasRef, isTyping]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    getWorldCoordinates
  };
};

/**
 * Optimized keyboard event handlers
 */
export const useOptimizedKeyboardHandlers = (
  isTyping: boolean,
  isComposing: boolean,
  currentMode: CanvasMode
) => {
  const keysPressed = useRef<Set<string>>(new Set());

  // Optimized key down handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if composing (IME input)
      if (isComposing) return null;
      
      const key = e.key.toLowerCase();
      const code = e.code;
      
      // Track pressed keys
      keysPressed.current.add(key);
      
      // Create key event data
      const eventData = {
        key,
        code,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        isRepeat: e.repeat
      };
      
      // Check for shortcuts
      const shortcuts = {
        undo: (e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey,
        redo: (e.ctrlKey || e.metaKey) && ((key === 'z' && e.shiftKey) || key === 'y'),
        selectAll: (e.ctrlKey || e.metaKey) && key === 'a',
        copy: (e.ctrlKey || e.metaKey) && key === 'c',
        cut: (e.ctrlKey || e.metaKey) && key === 'x',
        paste: (e.ctrlKey || e.metaKey) && key === 'v',
        delete: key === 'delete' || key === 'backspace',
        escape: key === 'escape',
        enter: key === 'enter',
        tab: key === 'tab',
        space: key === ' ' || code === 'Space'
      };
      
      // Prevent default for certain keys when typing
      if (isTyping && (shortcuts.space || shortcuts.tab)) {
        e.preventDefault();
      }
      
      return {
        ...eventData,
        shortcuts,
        shouldPreventDefault: isTyping && (shortcuts.space || shortcuts.tab)
      };
    },
    [isTyping, isComposing, currentMode]
  );

  // Optimized key up handler
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
      
      return {
        key,
        code: e.code,
        keysStillPressed: Array.from(keysPressed.current)
      };
    },
    []
  );

  // Check if a key is currently pressed
  const isKeyPressed = useCallback((key: string) => {
    return keysPressed.current.has(key.toLowerCase());
  }, []);

  return {
    handleKeyDown,
    handleKeyUp,
    isKeyPressed
  };
};

/**
 * Optimized selection handlers
 */
export const useOptimizedSelectionHandlers = (
  canvasObjects: CanvasObject[],
  scale: number,
  canvasOffset: { x: number; y: number }
) => {
  // Memoized object finder
  const findObjectsInRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      return canvasObjects.filter(obj => {
        if (obj.type !== 'text' && obj.type !== 'guide') return false;
        
        const objX = (obj as TextObject | GuideObject).x;
        const objY = (obj as TextObject | GuideObject).y;
        
        return (
          objX >= rect.x &&
          objX <= rect.x + rect.width &&
          objY >= rect.y &&
          objY <= rect.y + rect.height
        );
      });
    },
    [canvasObjects]
  );

  // Memoized object at point finder
  const findObjectAtPoint = useCallback(
    (x: number, y: number) => {
      // Check objects in reverse order (top to bottom)
      for (let i = canvasObjects.length - 1; i >= 0; i--) {
        const obj = canvasObjects[i];
        if (isPointInObject(x, y, obj, scale)) {
          return obj;
        }
      }
      return null;
    },
    [canvasObjects, scale]
  );

  // Optimized selection rectangle handler
  const handleSelectionRect = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      const rect = {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY)
      };
      
      return {
        rect,
        selectedObjects: findObjectsInRect(rect)
      };
    },
    [findObjectsInRect]
  );

  return {
    findObjectsInRect,
    findObjectAtPoint,
    handleSelectionRect
  };
};

/**
 * Optimized drag and drop handlers
 */
export const useOptimizedDragHandlers = () => {
  const dragDataRef = useRef<any>(null);
  
  const handleDragStart = useCallback((e: React.DragEvent, data: any) => {
    dragDataRef.current = data;
    e.dataTransfer.effectAllowed = 'move';
    
    // Create ghost image for drag preview
    if (e.dataTransfer.setDragImage) {
      const dragImage = new Image();
      dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return true;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = dragDataRef.current;
    dragDataRef.current = null;
    
    return {
      data,
      dropPosition: { x: e.clientX, y: e.clientY }
    };
  }, []);

  return {
    handleDragStart,
    handleDragOver,
    handleDrop
  };
};

/**
 * Optimized resize observer handler
 */
export const useOptimizedResizeHandler = (
  callback: (width: number, height: number) => void
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    // Use requestAnimationFrame for smooth resizing
    requestAnimationFrame(() => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        callbackRef.current(width, height);
      }
    });
  }, []);

  return handleResize;
};

/**
 * Optimized clipboard handlers
 */
export const useOptimizedClipboardHandlers = () => {
  const handleCopy = useCallback(async (data: any) => {
    try {
      const json = JSON.stringify(data);
      await navigator.clipboard.writeText(json);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error('Failed to paste:', error);
      return null;
    }
  }, []);

  const handleCut = useCallback(async (data: any) => {
    const success = await handleCopy(data);
    return success;
  }, [handleCopy]);

  return {
    handleCopy,
    handlePaste,
    handleCut
  };
};