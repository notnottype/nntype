import { useEffect, useRef, useCallback } from 'react';
import { CanvasPerformanceManager, createDebouncedResizeHandler } from '../utils/performanceUtils';
import { setupCanvasHiDPI } from '../utils/canvasUtils';

// Enhanced canvas hook with performance optimizations
export const useOptimizedCanvas = (
  width: number,
  height: number,
  onResize?: (width: number, height: number) => void
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const performanceManagerRef = useRef<CanvasPerformanceManager | null>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  // Initialize performance manager
  useEffect(() => {
    performanceManagerRef.current = new CanvasPerformanceManager();
    
    return () => {
      performanceManagerRef.current?.cleanup();
    };
  }, []);

  // Setup canvas with HiDPI support
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupCanvasHiDPI(canvas, width, height);
    ctxRef.current = ctx;
    
    if (onResize) {
      onResize(width, height);
    }
  }, [width, height, onResize]);

  // Setup debounced resize handler
  useEffect(() => {
    if (onResize) {
      resizeHandlerRef.current = createDebouncedResizeHandler(() => {
        setupCanvas();
      }, 250);
    }
  }, [setupCanvas, onResize]);

  // Initial canvas setup and resize listener
  useEffect(() => {
    setupCanvas();
    
    const handleResize = () => {
      resizeHandlerRef.current?.();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvas]);

  // Optimized render function
  const scheduleRender = useCallback((renderFn: () => void) => {
    performanceManagerRef.current?.scheduleRender(renderFn);
  }, []);

  // Batch render operations
  const batchRender = useCallback((operations: Array<() => void>) => {
    performanceManagerRef.current?.batchRender(operations);
  }, []);

  return {
    canvasRef,
    ctx: ctxRef.current,
    scheduleRender,
    batchRender,
    setupCanvas
  };
};