/**
 * Performance monitoring hook for InfiniteTypewriterCanvas
 * Tracks render performance, memory usage, and provides optimization hints
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  objectCount: number;
  lastRenderTimestamp: number;
}

interface PerformanceWarning {
  type: 'fps' | 'memory' | 'objects' | 'renderTime';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (
  enabled: boolean = false,
  objectCount: number = 0
) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    objectCount: 0,
    lastRenderTimestamp: 0
  });

  const [warnings, setWarnings] = useState<PerformanceWarning[]>([]);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const renderCountRef = useRef<number>(0);

  // Track FPS
  const trackFrame = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    // Keep last 60 frame times
    frameTimesRef.current.push(delta);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Calculate average FPS
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    const fps = Math.round(1000 / avgFrameTime);

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      fps,
      objectCount,
      lastRenderTimestamp: now
    }));

    // Check for performance issues
    if (fps < 30) {
      addWarning({
        type: 'fps',
        message: `Low FPS detected: ${fps}`,
        severity: fps < 20 ? 'high' : 'medium',
        timestamp: now
      });
    }
  }, [enabled, objectCount]);

  // Track memory usage
  const trackMemory = useCallback(() => {
    if (!enabled) return;

    // @ts-ignore - memory API is not standard but available in Chrome
    if (performance.memory) {
      // @ts-ignore
      const memoryUsage = performance.memory.usedJSHeapSize / 1048576; // Convert to MB
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage
      }));

      // Check for high memory usage
      if (memoryUsage > 500) {
        addWarning({
          type: 'memory',
          message: `High memory usage: ${memoryUsage.toFixed(2)}MB`,
          severity: memoryUsage > 1000 ? 'high' : 'medium',
          timestamp: performance.now()
        });
      }
    }
  }, [enabled]);

  // Track render time
  const startRenderTracking = useCallback(() => {
    if (!enabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime
      }));

      // Check for slow renders
      if (renderTime > 16.67) { // More than one frame at 60fps
        addWarning({
          type: 'renderTime',
          message: `Slow render detected: ${renderTime.toFixed(2)}ms`,
          severity: renderTime > 33.33 ? 'high' : 'medium',
          timestamp: performance.now()
        });
      }

      renderCountRef.current++;
    };
  }, [enabled]);

  // Add warning with deduplication
  const addWarning = useCallback((warning: PerformanceWarning) => {
    setWarnings(prev => {
      // Remove old warnings (older than 5 seconds)
      const recentWarnings = prev.filter(w => 
        performance.now() - w.timestamp < 5000
      );

      // Check for duplicate warnings
      const isDuplicate = recentWarnings.some(w => 
        w.type === warning.type && 
        performance.now() - w.timestamp < 1000
      );

      if (isDuplicate) return recentWarnings;

      return [...recentWarnings, warning].slice(-10); // Keep last 10 warnings
    });
  }, []);

  // Check object count
  useEffect(() => {
    if (!enabled) return;

    if (objectCount > 1000) {
      addWarning({
        type: 'objects',
        message: `High object count: ${objectCount}`,
        severity: objectCount > 5000 ? 'high' : 'medium',
        timestamp: performance.now()
      });
    }
  }, [enabled, objectCount, addWarning]);

  // Performance monitoring interval
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      trackFrame();
      trackMemory();
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, trackFrame, trackMemory]);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    const report = {
      metrics,
      warnings: warnings.filter(w => performance.now() - w.timestamp < 10000),
      renderCount: renderCountRef.current,
      suggestions: [] as string[]
    };

    // Add suggestions based on metrics
    if (metrics.fps < 30) {
      report.suggestions.push('Consider reducing the number of objects or simplifying rendering');
    }

    if (metrics.memoryUsage > 500) {
      report.suggestions.push('Memory usage is high. Consider clearing unused objects');
    }

    if (metrics.objectCount > 1000) {
      report.suggestions.push('High object count detected. Consider implementing virtualization');
    }

    if (metrics.renderTime > 16.67) {
      report.suggestions.push('Render time exceeds frame budget. Consider optimizing render logic');
    }

    return report;
  }, [metrics, warnings]);

  // Clear warnings
  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  return {
    metrics,
    warnings,
    startRenderTracking,
    trackFrame,
    getPerformanceReport,
    clearWarnings
  };
};

/**
 * Render optimization hook
 */
export const useRenderOptimization = () => {
  const renderCountRef = useRef(0);
  const lastPropsRef = useRef<any>({});

  // Track unnecessary renders
  const trackRender = useCallback((componentName: string, props: any) => {
    renderCountRef.current++;

    // Check which props changed
    const changedProps: string[] = [];
    
    Object.keys(props).forEach(key => {
      if (lastPropsRef.current[key] !== props[key]) {
        changedProps.push(key);
      }
    });

    lastPropsRef.current = { ...props };

    if (changedProps.length === 0 && renderCountRef.current > 1) {
      console.warn(`${componentName} re-rendered without prop changes`);
    }

    return {
      renderCount: renderCountRef.current,
      changedProps
    };
  }, []);

  return {
    trackRender
  };
};

/**
 * Virtualization hook for large object lists
 */
export const useVirtualization = <T extends { id: string | number }>(
  items: T[],
  viewportHeight: number,
  itemHeight: number,
  overscan: number = 3
) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  const calculateVisibleRange = useCallback((scrollTop: number) => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
    );

    setVisibleRange({ start, end });
  }, [items.length, viewportHeight, itemHeight, overscan]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return {
    visibleItems,
    visibleRange,
    calculateVisibleRange,
    totalHeight: items.length * itemHeight
  };
};

/**
 * Debounce hook for performance optimization
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook for performance optimization
 */
export const useThrottle = <T>(value: T, interval: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
};