/**
 * Touch Gestures Hook for Canvas Integration
 * Integrates touch gesture recognition with canvas operations
 */

import { useEffect, useRef, useCallback } from 'react';
import { TouchGestureRecognizer, GestureEvent, GestureConfig } from '../utils/touchGestures';
import { throttle, debounce } from '../utils/eventUtils';

interface UseTouchGesturesProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  scale: number;
  canvasOffset: { x: number; y: number };
  isEnabled: boolean;
  
  // Gesture callbacks
  onPan?: (translation: { x: number; y: number }, velocity: { x: number; y: number }) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onTap?: (position: { x: number; y: number }) => void;
  onDoubleTap?: (position: { x: number; y: number }) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  
  // Configuration
  gestureConfig?: Partial<GestureConfig>;
  enableMomentum?: boolean;
  momentumDecay?: number;
}

interface MomentumState {
  isActive: boolean;
  velocity: { x: number; y: number };
  lastUpdate: number;
  animationFrame?: number;
}

export const useTouchGestures = ({
  canvasRef,
  scale,
  canvasOffset,
  isEnabled,
  onPan,
  onPinch,
  onTap,
  onDoubleTap,
  onLongPress,
  gestureConfig,
  enableMomentum = true,
  momentumDecay = 0.95
}: UseTouchGesturesProps) => {
  
  const recognizerRef = useRef<TouchGestureRecognizer | null>(null);
  const momentumRef = useRef<MomentumState>({
    isActive: false,
    velocity: { x: 0, y: 0 },
    lastUpdate: 0
  });
  
  const isGesturingRef = useRef(false);
  const baseScaleRef = useRef(scale);
  const basePanRef = useRef(canvasOffset);

  // Throttled callbacks for performance
  const throttledOnPan = useCallback(
    throttle((translation: { x: number; y: number }, velocity: { x: number; y: number }) => {
      onPan?.(translation, velocity);
    }, 16),
    [onPan]
  );

  const throttledOnPinch = useCallback(
    throttle((newScale: number, center: { x: number; y: number }) => {
      onPinch?.(newScale, center);
    }, 16),
    [onPinch]
  );

  // Handle momentum animation
  const animateMomentum = useCallback(() => {
    const momentum = momentumRef.current;
    if (!momentum.isActive) return;

    const now = performance.now();
    const deltaTime = now - momentum.lastUpdate;
    
    // Apply momentum decay
    momentum.velocity.x *= Math.pow(momentumDecay, deltaTime / 16);
    momentum.velocity.y *= Math.pow(momentumDecay, deltaTime / 16);
    
    // Stop momentum when velocity is too small
    const velocityMagnitude = Math.sqrt(
      momentum.velocity.x * momentum.velocity.x + 
      momentum.velocity.y * momentum.velocity.y
    );
    
    if (velocityMagnitude < 0.1) {
      momentum.isActive = false;
      if (momentum.animationFrame) {
        cancelAnimationFrame(momentum.animationFrame);
        momentum.animationFrame = undefined;
      }
      return;
    }

    // Apply momentum translation
    const translation = {
      x: momentum.velocity.x * deltaTime / 16,
      y: momentum.velocity.y * deltaTime / 16
    };
    
    throttledOnPan(translation, momentum.velocity);
    
    momentum.lastUpdate = now;
    momentum.animationFrame = requestAnimationFrame(animateMomentum);
  }, [throttledOnPan, momentumDecay]);

  // Start momentum animation
  const startMomentum = useCallback((velocity: { x: number; y: number }) => {
    if (!enableMomentum) return;
    
    const momentum = momentumRef.current;
    
    // Stop existing momentum
    if (momentum.animationFrame) {
      cancelAnimationFrame(momentum.animationFrame);
    }
    
    // Start new momentum
    momentum.isActive = true;
    momentum.velocity = { ...velocity };
    momentum.lastUpdate = performance.now();
    momentum.animationFrame = requestAnimationFrame(animateMomentum);
  }, [enableMomentum, animateMomentum]);

  // Stop momentum animation
  const stopMomentum = useCallback(() => {
    const momentum = momentumRef.current;
    momentum.isActive = false;
    
    if (momentum.animationFrame) {
      cancelAnimationFrame(momentum.animationFrame);
      momentum.animationFrame = undefined;
    }
  }, []);

  // Gesture event handlers
  const handlePanStart = useCallback((event: GestureEvent) => {
    stopMomentum();
    isGesturingRef.current = true;
    basePanRef.current = { ...canvasOffset };
  }, [canvasOffset, stopMomentum]);

  const handlePanChange = useCallback((event: GestureEvent) => {
    if (!event.translation) return;
    
    const totalTranslation = {
      x: basePanRef.current.x + event.translation.x,
      y: basePanRef.current.y + event.translation.y
    };
    
    throttledOnPan(totalTranslation, event.velocity || { x: 0, y: 0 });
  }, [throttledOnPan]);

  const handlePanEnd = useCallback((event: GestureEvent) => {
    isGesturingRef.current = false;
    
    if (event.velocity && enableMomentum) {
      // Start momentum with gesture velocity
      const velocityThreshold = 100; // pixels per second
      const velocityMagnitude = Math.sqrt(
        event.velocity.x * event.velocity.x + 
        event.velocity.y * event.velocity.y
      );
      
      if (velocityMagnitude > velocityThreshold) {
        startMomentum(event.velocity);
      }
    }
  }, [enableMomentum, startMomentum]);

  const handlePinchStart = useCallback((event: GestureEvent) => {
    stopMomentum();
    isGesturingRef.current = true;
    baseScaleRef.current = scale;
  }, [scale, stopMomentum]);

  const handlePinchChange = useCallback((event: GestureEvent) => {
    if (!event.scale || !event.center) return;
    
    const newScale = baseScaleRef.current * event.scale;
    
    // Clamp scale to reasonable bounds
    const clampedScale = Math.max(0.1, Math.min(10, newScale));
    
    throttledOnPinch(clampedScale, event.center);
  }, [throttledOnPinch]);

  const handlePinchEnd = useCallback((event: GestureEvent) => {
    isGesturingRef.current = false;
  }, []);

  const handleTap = useCallback((event: GestureEvent) => {
    if (event.phase === 'end' && event.center) {
      onTap?.(event.center);
    }
  }, [onTap]);

  const handleDoubleTap = useCallback((event: GestureEvent) => {
    if (event.phase === 'start' && event.center) {
      onDoubleTap?.(event.center);
    }
  }, [onDoubleTap]);

  const handleLongPress = useCallback((event: GestureEvent) => {
    if (event.phase === 'start' && event.center) {
      onLongPress?.(event.center);
    }
  }, [onLongPress]);

  // Initialize gesture recognizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const recognizer = new TouchGestureRecognizer(canvas, {
      pinchThreshold: 10,
      minPinchScale: 0.1,
      maxPinchScale: 10,
      panThreshold: 5,
      tapThreshold: 10,
      tapTimeout: 300,
      doubleTapTimeout: 300,
      longPressTimeout: 500,
      longPressThreshold: 10,
      ...gestureConfig
    });

    recognizerRef.current = recognizer;

    // Subscribe to gesture events
    const unsubscribePan = [
      recognizer.on('pan', (event) => {
        if (event.phase === 'start') handlePanStart(event);
        else if (event.phase === 'change') handlePanChange(event);
        else if (event.phase === 'end') handlePanEnd(event);
      })
    ];

    const unsubscribePinch = [
      recognizer.on('pinch', (event) => {
        if (event.phase === 'start') handlePinchStart(event);
        else if (event.phase === 'change') handlePinchChange(event);
        else if (event.phase === 'end') handlePinchEnd(event);
      })
    ];

    const unsubscribeTap = recognizer.on('tap', handleTap);
    const unsubscribeDoubleTap = recognizer.on('double-tap', handleDoubleTap);
    const unsubscribeLongPress = recognizer.on('long-press', handleLongPress);

    // Enable/disable based on prop
    if (isEnabled) {
      recognizer.enable();
    } else {
      recognizer.disable();
    }

    return () => {
      unsubscribePan.forEach(fn => fn());
      unsubscribePinch.forEach(fn => fn());
      unsubscribeTap();
      unsubscribeDoubleTap();
      unsubscribeLongPress();
      recognizer.destroy();
      stopMomentum();
    };
  }, [
    canvasRef,
    isEnabled,
    gestureConfig,
    handlePanStart,
    handlePanChange,
    handlePanEnd,
    handlePinchStart,
    handlePinchChange,
    handlePinchEnd,
    handleTap,
    handleDoubleTap,
    handleLongPress,
    stopMomentum
  ]);

  // Update enabled state
  useEffect(() => {
    if (recognizerRef.current) {
      if (isEnabled) {
        recognizerRef.current.enable();
      } else {
        recognizerRef.current.disable();
        stopMomentum();
      }
    }
  }, [isEnabled, stopMomentum]);

  // Cleanup momentum on unmount
  useEffect(() => {
    return () => {
      stopMomentum();
    };
  }, [stopMomentum]);

  return {
    isGesturing: isGesturingRef.current,
    hasMomentum: momentumRef.current.isActive,
    stopMomentum,
    recognizer: recognizerRef.current
  };
};