/**
 * Enhanced canvas operations hook that integrates with the new event handling system
 * Provides centralized canvas operations with better performance and state management
 */

import { useCallback, useRef } from 'react';
import { CanvasObjectType } from '../types';
import { throttle, debounce } from '../utils/eventUtils';

interface UseEnhancedCanvasOperationsProps {
  scale: number;
  canvasOffset: { x: number; y: number };
  baseFontSize: number;
  baseFontSizePt: number;
  canvasObjects: CanvasObjectType[];
  
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setCanvasOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setBaseFontSize: React.Dispatch<React.SetStateAction<number>>;
  setBaseFontSizePt: React.Dispatch<React.SetStateAction<number>>;
  
  // Session management
  saveSessionData?: () => void;
}

export const useEnhancedCanvasOperations = ({
  scale,
  canvasOffset,
  baseFontSize,
  baseFontSizePt,
  canvasObjects,
  setScale,
  setCanvasOffset,
  setCanvasObjects,
  setBaseFontSize,
  setBaseFontSizePt,
  saveSessionData
}: UseEnhancedCanvasOperationsProps) => {
  
  // Performance optimization refs
  const operationQueueRef = useRef<Array<() => void>>([]);
  const isProcessingRef = useRef(false);

  // Throttled session save for performance
  const throttledSaveSession = useCallback(
    throttle(() => {
      saveSessionData?.();
    }, 1000), // Save at most once per second
    [saveSessionData]
  );

  // Debounced session save for final state
  const debouncedSaveSession = useCallback(
    debounce(() => {
      saveSessionData?.();
    }, 500), // Save after 500ms of inactivity
    [saveSessionData]
  );

  // Batch operations for performance
  const batchOperations = useCallback((operations: Array<() => void>) => {
    operationQueueRef.current.push(...operations);
    
    if (!isProcessingRef.current) {
      isProcessingRef.current = true;
      
      // Process all queued operations in the next frame
      requestAnimationFrame(() => {
        const queue = operationQueueRef.current;
        operationQueueRef.current = [];
        
        queue.forEach(operation => operation());
        
        isProcessingRef.current = false;
        
        // Save session after batch operations
        debouncedSaveSession();
      });
    }
  }, [debouncedSaveSession]);

  // Enhanced pan operation with momentum and constraints
  const enhancedPan = useCallback((deltaX: number, deltaY: number, withMomentum = false) => {
    const panOperation = () => {
      setCanvasOffset(prev => {
        // Apply constraints to prevent panning too far
        const maxOffset = 10000; // Reasonable pan limit
        const newX = Math.max(-maxOffset, Math.min(maxOffset, prev.x + deltaX));
        const newY = Math.max(-maxOffset, Math.min(maxOffset, prev.y + deltaY));
        
        return { x: newX, y: newY };
      });
    };

    if (withMomentum) {
      // Apply momentum effect (simplified)
      const momentum = 0.8;
      let currentDeltaX = deltaX;
      let currentDeltaY = deltaY;
      
      const applyMomentum = () => {
        if (Math.abs(currentDeltaX) < 0.5 && Math.abs(currentDeltaY) < 0.5) {
          return; // Stop momentum
        }
        
        setCanvasOffset(prev => ({
          x: prev.x + currentDeltaX,
          y: prev.y + currentDeltaY
        }));
        
        currentDeltaX *= momentum;
        currentDeltaY *= momentum;
        
        requestAnimationFrame(applyMomentum);
      };
      
      requestAnimationFrame(applyMomentum);
    } else {
      batchOperations([panOperation]);
    }
  }, [setCanvasOffset, batchOperations]);

  // Enhanced zoom with smart centering
  const enhancedZoom = useCallback((
    newScale: number, 
    centerPoint?: { x: number; y: number }
  ) => {
    const zoomOperation = () => {
      if (centerPoint) {
        // Zoom to specific point
        const scaleRatio = newScale / scale;
        const newOffsetX = centerPoint.x - (centerPoint.x - canvasOffset.x) * scaleRatio;
        const newOffsetY = centerPoint.y - (centerPoint.y - canvasOffset.y) * scaleRatio;
        
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
      }
      
      setScale(newScale);
    };

    batchOperations([zoomOperation]);
  }, [scale, canvasOffset, setScale, setCanvasOffset, batchOperations]);

  // Smart object operations with collision detection
  const addCanvasObject = useCallback((newObject: CanvasObjectType, checkCollision = false) => {
    const addOperation = () => {
      if (checkCollision) {
        // Simple collision detection - adjust position if overlapping
        const existingPositions = canvasObjects
          .filter(obj => obj.type === newObject.type)
          .map(obj => ({ x: obj.x, y: obj.y }));
        
        let adjustedObject = { ...newObject };
        let attempts = 0;
        const maxAttempts = 10;
        const offset = baseFontSize / scale;
        
        while (attempts < maxAttempts) {
          const hasCollision = existingPositions.some(pos => 
            Math.abs(pos.x - adjustedObject.x) < offset && 
            Math.abs(pos.y - adjustedObject.y) < offset
          );
          
          if (!hasCollision) break;
          
          adjustedObject.x += offset;
          adjustedObject.y += offset;
          attempts++;
        }
        
        setCanvasObjects(prev => [...prev, adjustedObject]);
      } else {
        setCanvasObjects(prev => [...prev, newObject]);
      }
    };

    batchOperations([addOperation]);
  }, [canvasObjects, baseFontSize, scale, setCanvasObjects, batchOperations]);

  // Bulk object operations for performance
  const bulkUpdateObjects = useCallback((
    updates: Array<{ id: string; updates: Partial<CanvasObjectType> }>
  ) => {
    const bulkOperation = () => {
      setCanvasObjects(prev => {
        const updateMap = new Map(updates.map(update => [update.id, update.updates]));
        
        return prev.map(obj => {
          const update = updateMap.get(obj.id);
          return update ? { ...obj, ...update } : obj;
        });
      });
    };

    batchOperations([bulkOperation]);
  }, [setCanvasObjects, batchOperations]);

  // Enhanced delete with undo capability
  const deleteObjects = useCallback((objectIds: string[], createUndoSnapshot = true) => {
    if (createUndoSnapshot) {
      // Create undo snapshot before deletion
      // This would integrate with your undo/redo system
    }

    const deleteOperation = () => {
      setCanvasObjects(prev => prev.filter(obj => !objectIds.includes(obj.id)));
    };

    batchOperations([deleteOperation]);
  }, [setCanvasObjects, batchOperations]);

  // Performance-optimized object finder
  const findObjectsInRegion = useCallback((
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
  ): CanvasObjectType[] => {
    return canvasObjects.filter(obj => {
      // Simple bounding box check
      return obj.x >= bounds.minX && 
             obj.x <= bounds.maxX && 
             obj.y >= bounds.minY && 
             obj.y <= bounds.maxY;
    });
  }, [canvasObjects]);

  // Canvas state management
  const getCanvasState = useCallback(() => ({
    scale,
    canvasOffset,
    baseFontSize,
    baseFontSizePt,
    objectCount: canvasObjects.length,
    bounds: canvasObjects.reduce(
      (bounds, obj) => ({
        minX: Math.min(bounds.minX, obj.x),
        maxX: Math.max(bounds.maxX, obj.x),
        minY: Math.min(bounds.minY, obj.y),
        maxY: Math.max(bounds.maxY, obj.y)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    )
  }), [scale, canvasOffset, baseFontSize, baseFontSizePt, canvasObjects]);

  // Reset canvas with animation option
  const resetCanvas = useCallback((animated = false) => {
    const resetOperations = [
      () => setScale(1),
      () => setCanvasOffset({ x: 0, y: 0 }),
      () => setCanvasObjects([]),
      () => setBaseFontSize(16),
      () => setBaseFontSizePt(12)
    ];

    if (animated) {
      // Animate reset over time
      let step = 0;
      const totalSteps = 10;
      const animate = () => {
        const progress = step / totalSteps;
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
        
        setScale(scale * (1 - easeProgress) + 1 * easeProgress);
        setCanvasOffset(prev => ({
          x: prev.x * (1 - easeProgress),
          y: prev.y * (1 - easeProgress)
        }));
        
        step++;
        if (step <= totalSteps) {
          requestAnimationFrame(animate);
        } else {
          // Complete reset
          batchOperations(resetOperations);
        }
      };
      requestAnimationFrame(animate);
    } else {
      batchOperations(resetOperations);
    }
  }, [
    scale, 
    setScale, 
    setCanvasOffset, 
    setCanvasObjects, 
    setBaseFontSize, 
    setBaseFontSizePt, 
    batchOperations
  ]);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => ({
    objectCount: canvasObjects.length,
    queuedOperations: operationQueueRef.current.length,
    isProcessing: isProcessingRef.current,
    memoryUsage: {
      objects: canvasObjects.length,
      estimatedSize: canvasObjects.length * 200 // Rough estimate in bytes
    }
  }), [canvasObjects]);

  return {
    // Enhanced operations
    enhancedPan,
    enhancedZoom,
    addCanvasObject,
    bulkUpdateObjects,
    deleteObjects,
    findObjectsInRegion,
    
    // State management
    getCanvasState,
    resetCanvas,
    
    // Performance
    batchOperations,
    getPerformanceMetrics,
    
    // Session management
    throttledSaveSession,
    debouncedSaveSession
  };
};