// Performance optimization utilities using Excalidraw patterns
import { debounce, throttleRAF, memoize } from '@excalidraw/common';

// Enhanced canvas performance utilities
export class CanvasPerformanceManager {
  private frameId: number | null = null;
  private renderQueue: Array<() => void> = [];
  private isRenderScheduled = false;

  // Throttled render using RAF for smooth performance
  public scheduleRender = throttleRAF((renderFn: () => void) => {
    if (!this.isRenderScheduled) {
      this.isRenderScheduled = true;
      this.frameId = requestAnimationFrame(() => {
        renderFn();
        this.isRenderScheduled = false;
        this.frameId = null;
      });
    }
  });

  // Batch render operations for efficiency
  public batchRender(operations: Array<() => void>) {
    this.renderQueue.push(...operations);
    this.processRenderQueue();
  }

  private processRenderQueue = throttleRAF(() => {
    if (this.renderQueue.length > 0) {
      const operations = this.renderQueue.splice(0);
      operations.forEach(op => op());
    }
  });

  public cleanup() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.renderQueue = [];
    this.isRenderScheduled = false;
  }
}

// Optimized object culling for large canvases
export const createViewportCuller = memoize(
  (viewportBounds: { x: number; y: number; width: number; height: number }) => {
    return (objects: Array<{ x: number; y: number; width?: number; height?: number }>) => {
      return objects.filter(obj => {
        const objRight = obj.x + (obj.width || 0);
        const objBottom = obj.y + (obj.height || 0);
        const viewportRight = viewportBounds.x + viewportBounds.width;
        const viewportBottom = viewportBounds.y + viewportBounds.height;

        return !(
          objRight < viewportBounds.x ||
          obj.x > viewportRight ||
          objBottom < viewportBounds.y ||
          obj.y > viewportBottom
        );
      });
    };
  }
);

// Debounced resize handler to prevent excessive recalculations
export const createDebouncedResizeHandler = (callback: () => void, delay: number = 250) => {
  return debounce(callback, delay);
};

// Memoized text measurement cache
const textMeasurementCache = new Map<string, number>();

export const getMemoizedTextMeasurement = memoize(
  (
    text: string, 
    fontSize: number, 
    fontFamily: string,
    measureFn: (text: string, fontSize: number) => number
  ): number => {
    const cacheKey = `${text}-${fontSize}-${fontFamily}`;
    
    if (textMeasurementCache.has(cacheKey)) {
      return textMeasurementCache.get(cacheKey)!;
    }
    
    const measurement = measureFn(text, fontSize);
    textMeasurementCache.set(cacheKey, measurement);
    
    // Prevent memory leaks by limiting cache size
    if (textMeasurementCache.size > 1000) {
      const firstKey = textMeasurementCache.keys().next().value;
      textMeasurementCache.delete(firstKey);
    }
    
    return measurement;
  }
);

// Optimized HiDPI canvas setup with performance considerations
export const setupOptimizedCanvas = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  options: {
    alpha?: boolean;
    desynchronized?: boolean;
    willReadFrequently?: boolean;
  } = {}
): CanvasRenderingContext2D | null => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  const ctx = canvas.getContext('2d', {
    alpha: options.alpha ?? true,
    desynchronized: options.desynchronized ?? true,
    willReadFrequently: options.willReadFrequently ?? false
  });
  
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Optimize rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  
  return ctx;
};

// Optimized drawing state management
export class DrawingStateManager {
  private ctx: CanvasRenderingContext2D;
  private stateStack: Array<{
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
    globalAlpha: number;
  }> = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public saveState() {
    this.stateStack.push({
      fillStyle: this.ctx.fillStyle,
      strokeStyle: this.ctx.strokeStyle,
      lineWidth: this.ctx.lineWidth,
      lineCap: this.ctx.lineCap,
      lineJoin: this.ctx.lineJoin,
      globalAlpha: this.ctx.globalAlpha
    });
  }

  public restoreState() {
    const state = this.stateStack.pop();
    if (state) {
      Object.assign(this.ctx, state);
    }
  }

  public withState<T>(fn: () => T): T {
    this.saveState();
    try {
      return fn();
    } finally {
      this.restoreState();
    }
  }
}

// Efficient object pooling for temporary objects
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  public acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  public release(obj: T) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Create point pool for frequent point calculations
export const pointPool = new ObjectPool(
  () => ({ x: 0, y: 0 }),
  (point) => { point.x = 0; point.y = 0; },
  50
);

// Optimized event throttling for mouse/touch events
export const createOptimizedEventHandler = <T extends Event>(
  handler: (event: T) => void,
  throttleMs: number = 16 // ~60fps
) => {
  return throttleRAF((event: T) => {
    handler(event);
  });
};

// Memory-efficient canvas clear
export const clearCanvasOptimized = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  // Use clearRect instead of fillRect for better performance
  ctx.clearRect(0, 0, width, height);
};