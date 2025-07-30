/**
 * Advanced Touch Gesture Recognition System
 * Supports pinch-to-zoom, pan, tap, double-tap, and long press gestures
 */

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface GestureState {
  type: 'none' | 'pan' | 'pinch' | 'tap' | 'double-tap' | 'long-press';
  startTime: number;
  startPoints: TouchPoint[];
  currentPoints: TouchPoint[];
  previousPoints: TouchPoint[];
  scale: number;
  rotation: number;
  translation: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface GestureEvent {
  type: GestureState['type'];
  phase: 'start' | 'change' | 'end' | 'cancel';
  touches: TouchPoint[];
  scale?: number;
  rotation?: number;
  translation?: { x: number; y: number };
  velocity?: { x: number; y: number };
  center?: { x: number; y: number };
  preventDefault: () => void;
}

export type GestureHandler = (event: GestureEvent) => void;

export interface GestureConfig {
  // Pinch gesture settings
  pinchThreshold: number; // Minimum distance change to trigger pinch
  minPinchScale: number;
  maxPinchScale: number;
  
  // Pan gesture settings
  panThreshold: number; // Minimum movement to trigger pan
  
  // Tap gesture settings
  tapThreshold: number; // Maximum movement allowed for tap
  tapTimeout: number; // Maximum time for tap
  doubleTapTimeout: number; // Time window for double tap
  
  // Long press settings
  longPressTimeout: number;
  longPressThreshold: number; // Maximum movement allowed during long press
  
  // General settings
  touchTimeout: number; // Timeout for touch interactions
  velocityDecay: number; // Velocity calculation decay factor
}

const DEFAULT_CONFIG: GestureConfig = {
  pinchThreshold: 10,
  minPinchScale: 0.1,
  maxPinchScale: 10,
  panThreshold: 5,
  tapThreshold: 10,
  tapTimeout: 300,
  doubleTapTimeout: 300,
  longPressTimeout: 500,
  longPressThreshold: 10,
  touchTimeout: 1000,
  velocityDecay: 0.8
};

export class TouchGestureRecognizer {
  private config: GestureConfig;
  private gestureState: GestureState;
  private handlers: Map<GestureState['type'], Set<GestureHandler>> = new Map();
  private timeouts: Map<string, number> = new Map();
  private lastTapTime = 0;
  private lastTapPosition = { x: 0, y: 0 };
  private isEnabled = true;

  constructor(
    private element: HTMLElement,
    config: Partial<GestureConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.gestureState = this.createInitialState();
    this.setupEventListeners();
  }

  private createInitialState(): GestureState {
    return {
      type: 'none',
      startTime: 0,
      startPoints: [],
      currentPoints: [],
      previousPoints: [],
      scale: 1,
      rotation: 0,
      translation: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 }
    };
  }

  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
  }

  private createTouchPoint(touch: Touch): TouchPoint {
    const rect = this.element.getBoundingClientRect();
    return {
      id: touch.identifier,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      timestamp: Date.now()
    };
  }

  private getTouchPoints(touchList: TouchList): TouchPoint[] {
    return Array.from(touchList).map(touch => this.createTouchPoint(touch));
  }

  private getDistance(p1: TouchPoint, p2: TouchPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getCenter(points: TouchPoint[]): { x: number; y: number } {
    if (points.length === 0) return { x: 0, y: 0 };
    
    const sum = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 }
    );
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  private getAngle(p1: TouchPoint, p2: TouchPoint): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  private calculateVelocity(current: TouchPoint[], previous: TouchPoint[]): { x: number; y: number } {
    if (current.length === 0 || previous.length === 0) {
      return { x: 0, y: 0 };
    }

    const currentCenter = this.getCenter(current);
    const previousCenter = this.getCenter(previous);
    const timeDelta = current[0].timestamp - previous[0].timestamp;

    if (timeDelta === 0) return { x: 0, y: 0 };

    const velocityX = (currentCenter.x - previousCenter.x) / timeDelta * 1000;
    const velocityY = (currentCenter.y - previousCenter.y) / timeDelta * 1000;

    return { x: velocityX, y: velocityY };
  }

  private emitGesture(
    type: GestureState['type'],
    phase: GestureEvent['phase'],
    additionalData: Partial<GestureEvent> = {}
  ): void {
    const handlers = this.handlers.get(type);
    if (!handlers || handlers.size === 0) return;

    const center = this.getCenter(this.gestureState.currentPoints);
    let preventDefault = false;

    const event: GestureEvent = {
      type,
      phase,
      touches: [...this.gestureState.currentPoints],
      center,
      preventDefault: () => { preventDefault = true; },
      ...additionalData
    };

    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in gesture handler:', error);
      }
    });

    return preventDefault ? event : undefined;
  }

  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled) return;

    const touches = this.getTouchPoints(event.touches);
    const timestamp = Date.now();

    // Clear any existing timeouts
    this.clearTimeouts();

    // Initialize gesture state
    this.gestureState = {
      ...this.createInitialState(),
      type: 'none',
      startTime: timestamp,
      startPoints: [...touches],
      currentPoints: [...touches],
      previousPoints: [...touches]
    };

    // Determine initial gesture type
    if (touches.length === 1) {
      this.initializeSingleTouchGestures(touches[0], timestamp);
    } else if (touches.length === 2) {
      this.initializePinchGesture(touches);
    }

    // Prevent default to avoid scrolling
    if (touches.length > 1) {
      event.preventDefault();
    }
  }

  private initializeSingleTouchGestures(touch: TouchPoint, timestamp: number): void {
    // Check for double tap
    const timeSinceLastTap = timestamp - this.lastTapTime;
    const distanceFromLastTap = this.getDistance(touch, this.lastTapPosition);

    if (timeSinceLastTap < this.config.doubleTapTimeout && 
        distanceFromLastTap < this.config.tapThreshold) {
      this.gestureState.type = 'double-tap';
      this.emitGesture('double-tap', 'start');
      return;
    }

    // Set up long press detection
    const longPressTimeout = window.setTimeout(() => {
      if (this.gestureState.type === 'none' && this.gestureState.currentPoints.length === 1) {
        const movement = this.getDistance(this.gestureState.startPoints[0], this.gestureState.currentPoints[0]);
        
        if (movement < this.config.longPressThreshold) {
          this.gestureState.type = 'long-press';
          this.emitGesture('long-press', 'start');
        }
      }
    }, this.config.longPressTimeout);

    this.timeouts.set('longPress', longPressTimeout);
  }

  private initializePinchGesture(touches: TouchPoint[]): void {
    if (touches.length !== 2) return;

    this.gestureState.type = 'pinch';
    this.gestureState.scale = 1;
    this.gestureState.rotation = 0;

    this.emitGesture('pinch', 'start', {
      scale: 1,
      rotation: 0,
      translation: { x: 0, y: 0 }
    });
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isEnabled || this.gestureState.type === 'none') return;

    const touches = this.getTouchPoints(event.touches);
    this.gestureState.previousPoints = [...this.gestureState.currentPoints];
    this.gestureState.currentPoints = [...touches];

    // Calculate velocity
    this.gestureState.velocity = this.calculateVelocity(
      this.gestureState.currentPoints,
      this.gestureState.previousPoints
    );

    switch (this.gestureState.type) {
      case 'pinch':
        this.handlePinchMove(event);
        break;
      case 'pan':
        this.handlePanMove(event);
        break;
      case 'long-press':
        this.handleLongPressMove(event);
        break;
      default:
        this.detectGestureFromMovement(event);
        break;
    }
  }

  private handlePinchMove(event: TouchEvent): void {
    if (this.gestureState.currentPoints.length !== 2 || 
        this.gestureState.startPoints.length !== 2) return;

    const currentDistance = this.getDistance(
      this.gestureState.currentPoints[0],
      this.gestureState.currentPoints[1]
    );
    
    const startDistance = this.getDistance(
      this.gestureState.startPoints[0],
      this.gestureState.startPoints[1]
    );

    if (startDistance === 0) return;

    const scale = currentDistance / startDistance;
    const clampedScale = Math.max(
      this.config.minPinchScale,
      Math.min(this.config.maxPinchScale, scale)
    );

    // Calculate rotation
    const startAngle = this.getAngle(
      this.gestureState.startPoints[0],
      this.gestureState.startPoints[1]
    );
    
    const currentAngle = this.getAngle(
      this.gestureState.currentPoints[0],
      this.gestureState.currentPoints[1]
    );

    const rotation = currentAngle - startAngle;

    // Calculate translation
    const startCenter = this.getCenter(this.gestureState.startPoints);
    const currentCenter = this.getCenter(this.gestureState.currentPoints);
    
    const translation = {
      x: currentCenter.x - startCenter.x,
      y: currentCenter.y - startCenter.y
    };

    this.gestureState.scale = clampedScale;
    this.gestureState.rotation = rotation;
    this.gestureState.translation = translation;

    this.emitGesture('pinch', 'change', {
      scale: clampedScale,
      rotation,
      translation,
      velocity: this.gestureState.velocity
    });

    event.preventDefault();
  }

  private handlePanMove(event: TouchEvent): void {
    if (this.gestureState.currentPoints.length !== 1) return;

    const startCenter = this.getCenter(this.gestureState.startPoints);
    const currentCenter = this.getCenter(this.gestureState.currentPoints);

    const translation = {
      x: currentCenter.x - startCenter.x,
      y: currentCenter.y - startCenter.y
    };

    this.gestureState.translation = translation;

    this.emitGesture('pan', 'change', {
      translation,
      velocity: this.gestureState.velocity
    });

    event.preventDefault();
  }

  private handleLongPressMove(event: TouchEvent): void {
    const movement = this.getDistance(
      this.gestureState.startPoints[0],
      this.gestureState.currentPoints[0]
    );

    if (movement > this.config.longPressThreshold) {
      // Too much movement, cancel long press
      this.gestureState.type = 'none';
      this.clearTimeouts();
    }
  }

  private detectGestureFromMovement(event: TouchEvent): void {
    if (this.gestureState.currentPoints.length === 1) {
      const movement = this.getDistance(
        this.gestureState.startPoints[0],
        this.gestureState.currentPoints[0]
      );

      if (movement > this.config.panThreshold) {
        this.clearTimeouts();
        this.gestureState.type = 'pan';
        this.emitGesture('pan', 'start');
        this.handlePanMove(event);
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled) return;

    const remainingTouches = this.getTouchPoints(event.touches);
    const timestamp = Date.now();

    // Handle gesture completion
    switch (this.gestureState.type) {
      case 'pinch':
        this.completePinchGesture();
        break;
      case 'pan':
        this.completePanGesture();
        break;
      case 'double-tap':
        this.completeDoubleTapGesture();
        break;
      case 'long-press':
        this.completeLongPressGesture();
        break;
      default:
        this.checkForTap(timestamp);
        break;
    }

    // Update state for remaining touches
    if (remainingTouches.length === 0) {
      this.gestureState = this.createInitialState();
      this.clearTimeouts();
    } else {
      this.gestureState.currentPoints = remainingTouches;
    }
  }

  private completePinchGesture(): void {
    this.emitGesture('pinch', 'end', {
      scale: this.gestureState.scale,
      rotation: this.gestureState.rotation,
      translation: this.gestureState.translation,
      velocity: this.gestureState.velocity
    });
  }

  private completePanGesture(): void {
    this.emitGesture('pan', 'end', {
      translation: this.gestureState.translation,
      velocity: this.gestureState.velocity
    });
  }

  private completeDoubleTapGesture(): void {
    this.emitGesture('double-tap', 'end');
  }

  private completeLongPressGesture(): void {
    this.emitGesture('long-press', 'end');
  }

  private checkForTap(timestamp: number): void {
    if (this.gestureState.currentPoints.length === 1) {
      const movement = this.getDistance(
        this.gestureState.startPoints[0],
        this.gestureState.currentPoints[0]
      );

      const duration = timestamp - this.gestureState.startTime;

      if (movement < this.config.tapThreshold && duration < this.config.tapTimeout) {
        this.lastTapTime = timestamp;
        this.lastTapPosition = this.gestureState.currentPoints[0];
        
        this.emitGesture('tap', 'start');
        this.emitGesture('tap', 'end');
      }
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    if (this.gestureState.type !== 'none') {
      this.emitGesture(this.gestureState.type, 'cancel');
    }
    
    this.gestureState = this.createInitialState();
    this.clearTimeouts();
  }

  private clearTimeouts(): void {
    this.timeouts.forEach(timeout => window.clearTimeout(timeout));
    this.timeouts.clear();
  }

  // Public API
  on(gestureType: GestureState['type'], handler: GestureHandler): () => void {
    if (!this.handlers.has(gestureType)) {
      this.handlers.set(gestureType, new Set());
    }
    
    this.handlers.get(gestureType)!.add(handler);
    
    return () => {
      this.handlers.get(gestureType)?.delete(handler);
    };
  }

  off(gestureType: GestureState['type'], handler: GestureHandler): void {
    this.handlers.get(gestureType)?.delete(handler);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
    this.gestureState = this.createInitialState();
    this.clearTimeouts();
  }

  destroy(): void {
    this.disable();
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.handlers.clear();
  }

  getCurrentGesture(): GestureState {
    return { ...this.gestureState };
  }

  updateConfig(newConfig: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Factory function for easy integration
export const createTouchGestureRecognizer = (
  element: HTMLElement,
  config?: Partial<GestureConfig>
): TouchGestureRecognizer => {
  return new TouchGestureRecognizer(element, config);
};