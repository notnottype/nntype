/**
 * Advanced Canvas Hook with Layer-based Rendering
 * Integrates the new rendering engine with React lifecycle
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { CanvasRenderingEngine, RenderObject } from '../utils/renderingEngine';
import { CanvasObjectType } from '../types';
import { throttle, debounce } from '../utils/eventUtils';

interface UseAdvancedCanvasProps {
  width: number;
  height: number;
  canvasObjects: CanvasObjectType[];
  scale: number;
  canvasOffset: { x: number; y: number };
  theme: 'light' | 'dark';
  showGrid?: boolean;
  showA4Guide?: boolean;
  onRenderComplete?: (metrics: any) => void;
}

export const useAdvancedCanvas = ({
  width,
  height,
  canvasObjects,
  scale,
  canvasOffset,
  theme,
  showGrid = false,
  showA4Guide = false,
  onRenderComplete
}: UseAdvancedCanvasProps) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasRenderingEngine | null>(null);
  const renderObjectsRef = useRef<Map<string, RenderObject>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    averageFrameTime: 0,
    droppedFrames: 0
  });

  // Initialize rendering engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new CanvasRenderingEngine(
      containerRef.current,
      width,
      height
    );
    
    engineRef.current = engine;
    setIsReady(true);

    return () => {
      engine.destroy();
      engineRef.current = null;
      setIsReady(false);
    };
  }, []); // Only run once on mount

  // Handle canvas resize
  useEffect(() => {
    if (engineRef.current && isReady) {
      engineRef.current.resize(width, height);
    }
  }, [width, height, isReady]);

  // Create render functions for different object types
  const createTextRenderFunction = useCallback((textObj: any) => {
    return (ctx: CanvasRenderingContext2D, devicePixelRatio: number) => {
      const screenPos = {
        x: (textObj.x * scale) + canvasOffset.x,
        y: (textObj.y * scale) + canvasOffset.y
      };

      // Skip rendering if object is outside viewport
      if (screenPos.x > width || screenPos.y > height || 
          screenPos.x + textObj.width * scale < 0 || 
          screenPos.y + textObj.fontSize * scale < 0) {
        return;
      }

      ctx.save();
      
      // Apply text styling
      ctx.font = `${textObj.fontSize * scale}px 'Noto Sans Mono', monospace`;
      ctx.fillStyle = textObj.color || (theme === 'dark' ? '#ffffff' : '#000000');
      ctx.textBaseline = 'top';
      
      // Render text with line breaks
      const lines = textObj.content.split('\n');
      const lineHeight = textObj.fontSize * scale * 1.2;
      
      lines.forEach((line: string, index: number) => {
        ctx.fillText(
          line,
          screenPos.x,
          screenPos.y + (index * lineHeight)
        );
      });
      
      ctx.restore();
    };
  }, [scale, canvasOffset, width, height, theme]);

  const createA4GuideRenderFunction = useCallback((guideObj: any) => {
    return (ctx: CanvasRenderingContext2D, devicePixelRatio: number) => {
      const screenPos = {
        x: (guideObj.x * scale) + canvasOffset.x,
        y: (guideObj.y * scale) + canvasOffset.y
      };

      const guideWidth = guideObj.width * scale;
      const guideHeight = guideObj.height * scale;

      ctx.save();
      ctx.strokeStyle = theme === 'dark' ? '#404040' : '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      ctx.strokeRect(screenPos.x, screenPos.y, guideWidth, guideHeight);
      
      ctx.restore();
    };
  }, [scale, canvasOffset, theme]);

  const createGridRenderFunction = useCallback(() => {
    return (ctx: CanvasRenderingContext2D, devicePixelRatio: number) => {
      if (!showGrid) return;

      const gridSize = 20 * scale;
      const offsetX = canvasOffset.x % gridSize;
      const offsetY = canvasOffset.y % gridSize;

      ctx.save();
      ctx.strokeStyle = theme === 'dark' ? '#333333' : '#f0f0f0';
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.restore();
    };
  }, [showGrid, scale, canvasOffset, width, height, theme]);

  // Update render objects when canvas objects change
  useEffect(() => {
    if (!engineRef.current || !isReady) return;

    const engine = engineRef.current;
    const currentObjects = renderObjectsRef.current;
    const newObjectIds = new Set(canvasObjects.map(obj => obj.id));
    const currentObjectIds = new Set(currentObjects.keys());

    // Remove deleted objects
    for (const id of currentObjectIds) {
      if (!newObjectIds.has(id)) {
        engine.removeObject(id);
        currentObjects.delete(id);
      }
    }

    // Add or update objects
    for (const canvasObj of canvasObjects) {
      const bounds = {
        x: canvasObj.x * scale + canvasOffset.x,
        y: canvasObj.y * scale + canvasOffset.y,
        width: (canvasObj as any).width ? (canvasObj as any).width * scale : 200 * scale,
        height: (canvasObj as any).height ? (canvasObj as any).height * scale : 100 * scale
      };

      const renderObj: RenderObject = {
        id: canvasObj.id,
        layerId: canvasObj.type === 'a4guide' ? 'background' : 'content',
        bounds,
        lastModified: Date.now(),
        renderFunction: canvasObj.type === 'text' 
          ? createTextRenderFunction(canvasObj)
          : createA4GuideRenderFunction(canvasObj)
      };

      if (currentObjects.has(canvasObj.id)) {
        engine.updateObject(canvasObj.id, renderObj);
      } else {
        engine.addObject(renderObj);
      }

      currentObjects.set(canvasObj.id, renderObj);
    }
  }, [canvasObjects, scale, canvasOffset, isReady, createTextRenderFunction, createA4GuideRenderFunction]);

  // Update grid when needed
  useEffect(() => {
    if (!engineRef.current || !isReady) return;

    const engine = engineRef.current;
    const gridRenderObj: RenderObject = {
      id: 'grid',
      layerId: 'grid',
      bounds: { x: 0, y: 0, width, height },
      lastModified: Date.now(),
      renderFunction: createGridRenderFunction()
    };

    if (showGrid) {
      if (renderObjectsRef.current.has('grid')) {
        engine.updateObject('grid', gridRenderObj);
      } else {
        engine.addObject(gridRenderObj);
        renderObjectsRef.current.set('grid', gridRenderObj);
      }
    } else {
      if (renderObjectsRef.current.has('grid')) {
        engine.removeObject('grid');
        renderObjectsRef.current.delete('grid');
      }
    }
  }, [showGrid, width, height, createGridRenderFunction, isReady]);

  // Performance monitoring
  const updatePerformanceMetrics = useCallback(
    throttle(() => {
      if (!engineRef.current) return;

      const metrics = engineRef.current.getPerformanceMetrics();
      const fps = metrics.averageFrameTime > 0 ? 1000 / metrics.averageFrameTime : 0;
      
      const newMetrics = {
        fps: Math.round(fps),
        averageFrameTime: Math.round(metrics.averageFrameTime * 100) / 100,
        droppedFrames: metrics.droppedFrames
      };

      setPerformanceMetrics(newMetrics);
      onRenderComplete?.(newMetrics);
    }, 1000),
    [onRenderComplete]
  );

  // Monitor performance
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(updatePerformanceMetrics, 1000);
    return () => clearInterval(interval);
  }, [isReady, updatePerformanceMetrics]);

  // API methods
  const markRegionDirty = useCallback((bounds: { x: number; y: number; width: number; height: number }) => {
    if (!engineRef.current) return;

    // Find objects in the dirty region and mark their layers dirty
    for (const [id, renderObj] of renderObjectsRef.current) {
      const objBounds = renderObj.bounds;
      if (bounds.x < objBounds.x + objBounds.width &&
          bounds.x + bounds.width > objBounds.x &&
          bounds.y < objBounds.y + objBounds.height &&
          bounds.y + bounds.height > objBounds.y) {
        engineRef.current.markLayerDirty(renderObj.layerId);
      }
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clear();
      renderObjectsRef.current.clear();
    }
  }, []);

  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    return engineRef.current?.getCanvas() || null;
  }, []);

  const getDebugInfo = useCallback(() => {
    return engineRef.current?.debugInfo() || null;
  }, []);

  return {
    containerRef,
    isReady,
    performanceMetrics,
    markRegionDirty,
    clearCanvas,
    getCanvas,
    getDebugInfo
  };
};