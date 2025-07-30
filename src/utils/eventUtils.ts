/**
 * Event handling utilities inspired by Excalidraw's event system
 * Provides unified pointer event handling for mouse, touch, and stylus input
 */

export interface PointerEvent {
  pointerId: number;
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  pressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  pointerType: 'mouse' | 'pen' | 'touch';
  isPrimary: boolean;
}

export interface EventHandlerState {
  isDragging: boolean;
  isDraggingText: boolean;
  isSelecting: boolean;
  dragStart: { x: number; y: number };
  lastPointerPosition: { x: number; y: number };
  activePointerId: number | null;
  pointerDownTime: number;
}

/**
 * Normalize pointer/mouse/touch events to a consistent interface
 */
export const normalizePointerEvent = (
  event: React.PointerEvent | React.MouseEvent | React.TouchEvent
): PointerEvent => {
  // Handle PointerEvent (preferred)
  if ('pointerId' in event) {
    const e = event as React.PointerEvent;
    return {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      clientX: e.clientX,
      clientY: e.clientY,
      button: e.button,
      buttons: e.buttons,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      pressure: e.pressure || 0.5,
      tiltX: e.tiltX || 0,
      tiltY: e.tiltY || 0,
      twist: e.twist || 0,
      pointerType: e.pointerType as 'mouse' | 'pen' | 'touch',
      isPrimary: e.isPrimary
    };
  }

  // Handle MouseEvent
  if ('button' in event) {
    const e = event as React.MouseEvent;
    return {
      pointerId: 1, // Synthetic pointer ID for mouse
      x: e.clientX,
      y: e.clientY,
      clientX: e.clientX,
      clientY: e.clientY,
      button: e.button,
      buttons: e.buttons,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      pressure: 0.5,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 'mouse',
      isPrimary: true
    };
  }

  // Handle TouchEvent
  if ('touches' in event) {
    const e = event as React.TouchEvent;
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      pointerId: touch?.identifier || 0,
      x: touch?.clientX || 0,
      y: touch?.clientY || 0,
      clientX: touch?.clientX || 0,
      clientY: touch?.clientY || 0,
      button: 0,
      buttons: 1,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      pressure: (touch as any)?.force || 0.5,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 'touch',
      isPrimary: true
    };
  }

  // Fallback
  return {
    pointerId: 0,
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    button: 0,
    buttons: 0,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    pressure: 0.5,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 'mouse',
    isPrimary: true
  };
};

/**
 * Determines if the event should be handled as a primary pointer event
 */
export const isPrimaryPointerEvent = (event: PointerEvent): boolean => {
  return event.isPrimary && event.button === 0;
};

/**
 * Check if the event is a right-click or secondary button
 */
export const isSecondaryPointerEvent = (event: PointerEvent): boolean => {
  return event.button === 2 || (event.ctrlKey && event.pointerType === 'touch');
};

/**
 * Calculate the distance between two pointer positions
 */
export const getPointerDistance = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: number | undefined;
  return ((...args: any[]) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => func.apply(null, args), delay);
  }) as T;
};

/**
 * Event type definitions for better type safety
 */
export type EventType = 
  | 'pointerdown'
  | 'pointermove' 
  | 'pointerup'
  | 'pointercancel'
  | 'wheel'
  | 'keydown'
  | 'keyup'
  | 'contextmenu';

export type EventHandler<T = any> = (event: T) => void;

/**
 * Event manager for centralized event handling
 */
export class EventManager {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private throttledHandlers: Map<string, EventHandler> = new Map();
  
  subscribe<T>(eventType: EventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    const handlers = this.handlers.get(eventType)!;
    handlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }
  
  emit<T>(eventType: EventType, event: T): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }
  
  createThrottledHandler<T>(
    key: string, 
    handler: EventHandler<T>, 
    limit: number = 16
  ): EventHandler<T> {
    if (!this.throttledHandlers.has(key)) {
      this.throttledHandlers.set(key, throttle(handler, limit));
    }
    return this.throttledHandlers.get(key)! as EventHandler<T>;
  }
  
  cleanup(): void {
    this.handlers.clear();
    this.throttledHandlers.clear();
  }
}

// Global event manager instance
export const globalEventManager = new EventManager();

/**
 * Constants for event handling
 */
export const EVENT_CONSTANTS = {
  DOUBLE_CLICK_THRESHOLD: 300, // ms
  DRAG_THRESHOLD: 5, // pixels
  LONG_PRESS_THRESHOLD: 500, // ms
  THROTTLE_INTERVAL: 16, // ms (60fps)
  DEBOUNCE_DELAY: 100, // ms
} as const;