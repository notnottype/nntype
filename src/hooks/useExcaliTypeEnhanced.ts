/**
 * Master hook that integrates all enhanced features
 * Provides a unified interface for the enhanced NNType experience
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAdvancedCanvas } from './useAdvancedCanvas';
import { useCanvasEvents } from './useCanvasEvents';
import { useTouchGestures } from './useTouchGestures';
import { useEnhancedCanvasOperations } from './useEnhancedCanvasOperations';
import { CanvasObjectType, SelectionRectangle, Theme } from '../types';
import { getAnalytics } from '../utils/analytics';
import { throttle, debounce } from '../utils/eventUtils';

interface UseNNTypeEnhancedProps {
  // Canvas dimensions
  width: number;
  height: number;
  
  // Canvas state
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  selectedObjects: CanvasObjectType[];
  scale: number;
  canvasOffset: { x: number; y: number };
  baseFontSize: number;
  baseFontSizePt: number;
  theme: Theme;
  
  // UI state
  showGrid?: boolean;
  showA4Guide?: boolean;
  fontLoaded: boolean;
  showTextBox: boolean;
  isSpacePressed: boolean;
  
  // State setters
  setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setCanvasOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setBaseFontSize: React.Dispatch<React.SetStateAction<number>>;
  setBaseFontSizePt: React.Dispatch<React.SetStateAction<number>>;
  
  // Event callbacks
  onDoubleClick?: (worldX: number, worldY: number) => void;
  onContextMenu?: (worldX: number, worldY: number, object?: CanvasObjectType) => void;
  
  // Session management
  saveSessionData?: () => void;
  
  // Feature flags
  enableTouchGestures?: boolean;
  enableAnalytics?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export const useNNTypeEnhanced = ({
  width,
  height,
  canvasObjects,
  selectedObject,
  selectedObjects,
  scale,
  canvasOffset,
  baseFontSize,
  baseFontSizePt,
  theme,
  showGrid = false,
  showA4Guide = false,
  fontLoaded,
  showTextBox,
  isSpacePressed,
  setCanvasObjects,
  setSelectedObject,
  setSelectedObjects,
  setScale,
  setCanvasOffset,
  setBaseFontSize,
  setBaseFontSizePt,
  onDoubleClick,
  onContextMenu,
  saveSessionData,
  enableTouchGestures = true,
  enableAnalytics = false,
  enablePerformanceMonitoring = true
}: UseNNTypeEnhancedProps) => {
  
  // Canvas container ref for the advanced rendering system
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Enhanced state
  const [dragPreviewObjects, setDragPreviewObjects] = useState<CanvasObjectType[]>([]);
  const [selectionRect, setSelectionRect] = useState<SelectionRectangle | null>(null);
  const [hoveredObject, setHoveredObject] = useState<CanvasObjectType | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInTextBox, setIsMouseInTextBox] = useState(false);
  
  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    objectCount: 0
  });

  // Advanced canvas rendering
  const {
    containerRef: renderingContainerRef,
    isReady: isRenderingReady,
    performanceMetrics: renderingMetrics,
    markRegionDirty,
    clearCanvas,
    getCanvas,
    getDebugInfo
  } = useAdvancedCanvas({
    width,
    height,
    canvasObjects,
    scale,
    canvasOffset,
    theme,
    showGrid,
    showA4Guide,
    onRenderComplete: useCallback((metrics) => {
      setPerformanceMetrics(prev => ({
        ...prev,
        fps: metrics.fps,
        renderTime: metrics.averageFrameTime
      }));
      
      // Track performance metrics
      if (enableAnalytics) {
        const analytics = getAnalytics();
        analytics?.trackPerformanceMetric('canvas_fps', metrics.fps);
        analytics?.trackPerformanceMetric('canvas_render_time', metrics.averageFrameTime);
      }
    }, [enableAnalytics])
  });

  // Enhanced canvas operations
  const {
    enhancedPan,
    enhancedZoom,
    addCanvasObject,
    bulkUpdateObjects,
    deleteObjects,
    resetCanvas,
    getPerformanceMetrics: getOperationsMetrics,
    debouncedSaveSession
  } = useEnhancedCanvasOperations({
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
  });

  // Enhanced event handling
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleContextMenu,
    eventState
  } = useCanvasEvents({
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
    onDoubleClick: useCallback((worldX, worldY) => {
      onDoubleClick?.(worldX, worldY);
      
      if (enableAnalytics) {
        getAnalytics()?.trackCanvasInteraction('double_click', undefined, {
          worldPosition: { x: worldX, y: worldY }
        });
      }
    }, [onDoubleClick, enableAnalytics]),
    onContextMenu: useCallback((worldX, worldY, object) => {
      onContextMenu?.(worldX, worldY, object);
      
      if (enableAnalytics) {
        getAnalytics()?.trackCanvasInteraction('context_menu', undefined, {
          worldPosition: { x: worldX, y: worldY },
          hasObject: !!object
        });
      }
    }, [onContextMenu, enableAnalytics])
  });

  // Touch gesture integration
  const {
    isGesturing,
    hasMomentum,
    stopMomentum
  } = useTouchGestures({
    canvasRef,
    scale,
    canvasOffset,
    isEnabled: enableTouchGestures,
    onPan: useCallback((translation, velocity) => {
      setCanvasOffset(translation);
      debouncedSaveSession();
      
      if (enableAnalytics) {
        getAnalytics()?.trackGesture('pan', undefined, {
          velocity: Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
        });
      }
    }, [setCanvasOffset, debouncedSaveSession, enableAnalytics]),
    onPinch: useCallback((newScale, center) => {
      enhancedZoom(newScale, center);
      debouncedSaveSession();
      
      if (enableAnalytics) {
        getAnalytics()?.trackGesture('pinch', undefined, {
          scale: newScale,
          center
        });
      }
    }, [enhancedZoom, debouncedSaveSession, enableAnalytics]),
    onTap: useCallback((position) => {
      if (enableAnalytics) {
        getAnalytics()?.trackGesture('tap', undefined, { position });
      }
    }, [enableAnalytics]),
    onDoubleTap: useCallback((position) => {
      onDoubleClick?.(position.x, position.y);
      
      if (enableAnalytics) {
        getAnalytics()?.trackGesture('double_tap', undefined, { position });
      }
    }, [onDoubleClick, enableAnalytics]),
    onLongPress: useCallback((position) => {
      onContextMenu?.(position.x, position.y);
      
      if (enableAnalytics) {
        getAnalytics()?.trackGesture('long_press', undefined, { position });
      }
    }, [onContextMenu, enableAnalytics])
  });

  // Performance monitoring
  const updatePerformanceMetrics = useCallback(
    throttle(() => {
      const metrics = {
        objectCount: canvasObjects.length,
        memoryUsage: getOperationsMetrics().memoryUsage.estimatedSize,
        ...renderingMetrics
      };
      
      setPerformanceMetrics(prev => ({
        ...prev,
        ...metrics
      }));
      
      if (enablePerformanceMonitoring && enableAnalytics) {
        const analytics = getAnalytics();
        analytics?.trackPerformanceMetric('object_count', metrics.objectCount);
        analytics?.trackPerformanceMetric('memory_usage', metrics.memoryUsage);
      }
    }, 5000), // Update every 5 seconds
    [canvasObjects.length, getOperationsMetrics, renderingMetrics, enablePerformanceMonitoring, enableAnalytics]
  );

  // Analytics integration
  useEffect(() => {
    if (enableAnalytics) {
      const analytics = getAnalytics();
      analytics?.trackCanvasInteraction('canvas_mount', undefined, {
        objectCount: canvasObjects.length,
        scale,
        theme,
        touchSupport: enableTouchGestures
      });
    }
  }, []); // Only run on mount

  // Canvas integration
  useEffect(() => {
    if (isRenderingReady && renderingContainerRef.current && !canvasRef.current) {
      canvasRef.current = getCanvas();
    }
  }, [isRenderingReady, getCanvas]);

  // Performance monitoring
  useEffect(() => {
    updatePerformanceMetrics();
  }, [canvasObjects, updatePerformanceMetrics]);

  // Error boundary integration
  const handleError = useCallback((error: Error, errorInfo: any) => {
    console.error('NNType Enhanced Error:', error, errorInfo);
    
    if (enableAnalytics) {
      getAnalytics()?.trackError(error, {
        component: 'NNTypeEnhanced',
        ...errorInfo
      });
    }
  }, [enableAnalytics]);

  // Keyboard shortcuts integration
  const handleKeyboardShortcut = useCallback((shortcut: string, event: KeyboardEvent) => {
    if (enableAnalytics) {
      getAnalytics()?.trackCanvasInteraction('keyboard_shortcut', undefined, {
        shortcut,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey
      });
    }
  }, [enableAnalytics]);

  // Enhanced API
  const enhancedAPI = {
    // Canvas operations
    addObject: addCanvasObject,
    updateObjects: bulkUpdateObjects,
    removeObjects: deleteObjects,
    clearCanvas,
    resetCanvas,
    
    // Navigation
    pan: enhancedPan,
    zoom: enhancedZoom,
    stopMomentum,
    
    // Performance
    markRegionDirty,
    getPerformanceMetrics: () => ({
      ...performanceMetrics,
      operations: getOperationsMetrics(),
      rendering: renderingMetrics,
      debug: getDebugInfo()
    }),
    
    // State
    isGesturing,
    hasMomentum,
    isRenderingReady,
    eventState,
    
    // Error handling
    handleError,
    
    // Analytics
    trackEvent: enableAnalytics ? (type: string, action: string, value?: number, metadata?: any) => {
      getAnalytics()?.trackCanvasInteraction(action, value, metadata);
    } : undefined
  };

  // Return enhanced canvas container props and API
  return {
    // Canvas container props
    canvasContainerProps: {
      ref: renderingContainerRef,
      style: { width, height, position: 'relative' as const }
    },
    
    // Canvas ref for event handling
    canvasRef,
    
    // Event handlers (to be attached to the actual canvas element)
    eventHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onContextMenu: handleContextMenu
    },
    
    // Enhanced state
    enhancedState: {
      dragPreviewObjects,
      selectionRect,
      hoveredObject,
      mousePosition,
      isMouseInTextBox,
      performanceMetrics,
      isGesturing,
      hasMomentum,
      isRenderingReady
    },
    
    // Enhanced API
    api: enhancedAPI,
    
    // Debug information
    debug: {
      eventState,
      performanceMetrics,
      operationsMetrics: getOperationsMetrics(),
      renderingDebug: getDebugInfo()
    }
  };
};
