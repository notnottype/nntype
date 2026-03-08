import { useState, useCallback, useRef, useEffect } from 'react';

// Throttle function to limit how often a function can be called
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;
  
  return ((...args: any[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}

interface UseResizableOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange?: (width: number) => void;
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
  onWidthChange
}: UseResizableOptions) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  
  // Throttled width update function - only execute every 16ms (60fps)
  const throttledOnWidthChange = useCallback(
    throttle((newWidth: number) => {
      onWidthChange?.(newWidth);
    }, 16),
    [onWidthChange]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.min(
      Math.max(startWidthRef.current + deltaX, minWidth),
      maxWidth
    );
    
    setWidth(newWidth);
    throttledOnWidthChange(newWidth);
  }, [isResizing, minWidth, maxWidth, throttledOnWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    resizeRef,
    handleMouseDown
  };
}