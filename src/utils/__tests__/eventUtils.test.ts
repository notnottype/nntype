/**
 * Tests for event utilities
 * Comprehensive testing for the enhanced event handling system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizePointerEvent,
  isPrimaryPointerEvent,
  isSecondaryPointerEvent,
  getPointerDistance,
  throttle,
  debounce,
  EventManager,
  EVENT_CONSTANTS
} from '../eventUtils';

// Mock React events
const createMockPointerEvent = (overrides = {}) => ({
  pointerId: 1,
  clientX: 100,
  clientY: 200,
  button: 0,
  buttons: 1,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  pressure: 0.5,
  tiltX: 0,
  tiltY: 0,
  twist: 0,
  pointerType: 'mouse' as const,
  isPrimary: true,
  ...overrides
});

const createMockMouseEvent = (overrides = {}) => ({
  clientX: 150,
  clientY: 250,
  button: 0,
  buttons: 1,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...overrides
});

const createMockTouchEvent = (overrides = {}) => ({
  touches: [{
    identifier: 0,
    clientX: 200,
    clientY: 300,
    force: 0.5,
    ...overrides
  }],
  changedTouches: [],
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false
});

describe('eventUtils', () => {
  describe('normalizePointerEvent', () => {
    it('should normalize pointer events correctly', () => {
      const mockEvent = createMockPointerEvent({
        pointerId: 123,
        clientX: 300,
        clientY: 400,
        pressure: 0.8
      });

      const normalized = normalizePointerEvent(mockEvent as any);

      expect(normalized).toEqual({
        pointerId: 123,
        x: 300,
        y: 400,
        clientX: 300,
        clientY: 400,
        button: 0,
        buttons: 1,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        pressure: 0.8,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 'mouse',
        isPrimary: true
      });
    });

    it('should normalize mouse events correctly', () => {
      const mockEvent = createMockMouseEvent({
        clientX: 250,
        clientY: 350,
        ctrlKey: true
      });

      const normalized = normalizePointerEvent(mockEvent as any);

      expect(normalized).toEqual({
        pointerId: 1,
        x: 250,
        y: 350,
        clientX: 250,
        clientY: 350,
        button: 0,
        buttons: 1,
        shiftKey: false,
        ctrlKey: true,
        altKey: false,
        metaKey: false,
        pressure: 0.5,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 'mouse',
        isPrimary: true
      });
    });

    it('should normalize touch events correctly', () => {
      const mockEvent = createMockTouchEvent({
        clientX: 180,
        clientY: 280,
        force: 0.7
      });

      const normalized = normalizePointerEvent(mockEvent as any);

      expect(normalized).toEqual({
        pointerId: 0,
        x: 180,
        y: 280,
        clientX: 180,
        clientY: 280,
        button: 0,
        buttons: 1,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        pressure: 0.7,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 'touch',
        isPrimary: true
      });
    });
  });

  describe('isPrimaryPointerEvent', () => {
    it('should return true for primary pointer events', () => {
      const event = createMockPointerEvent({
        isPrimary: true,
        button: 0
      });
      const normalized = normalizePointerEvent(event as any);
      
      expect(isPrimaryPointerEvent(normalized)).toBe(true);
    });

    it('should return false for non-primary pointer events', () => {
      const event = createMockPointerEvent({
        isPrimary: false,
        button: 0
      });
      const normalized = normalizePointerEvent(event as any);
      
      expect(isPrimaryPointerEvent(normalized)).toBe(false);
    });

    it('should return false for non-primary button events', () => {
      const event = createMockPointerEvent({
        isPrimary: true,
        button: 1
      });
      const normalized = normalizePointerEvent(event as any);
      
      expect(isPrimaryPointerEvent(normalized)).toBe(false);
    });
  });

  describe('isSecondaryPointerEvent', () => {
    it('should return true for right-click events', () => {
      const event = createMockPointerEvent({
        button: 2
      });
      const normalized = normalizePointerEvent(event as any);
      
      expect(isSecondaryPointerEvent(normalized)).toBe(true);
    });

    it('should return true for ctrl+touch events', () => {
      const event = createMockTouchEvent({
        ctrlKey: true
      });
      const normalized = normalizePointerEvent(event as any);
      
      expect(isSecondaryPointerEvent(normalized)).toBe(true);
    });

    it('should return false for primary button events', () => {
      const event = createMockPointerEvent({
        button: 0
      });
      const normalized = normalizePointerEvent(event as any);
      
      expect(isSecondaryPointerEvent(normalized)).toBe(false);
    });
  });

  describe('getPointerDistance', () => {
    it('should calculate distance correctly', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      
      expect(getPointerDistance(p1, p2)).toBe(5);
    });

    it('should handle negative coordinates', () => {
      const p1 = { x: -3, y: -4 };
      const p2 = { x: 0, y: 0 };
      
      expect(getPointerDistance(p1, p2)).toBe(5);
    });

    it('should handle same points', () => {
      const p1 = { x: 100, y: 200 };
      const p2 = { x: 100, y: 200 };
      
      expect(getPointerDistance(p1, p2)).toBe(0);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should preserve function arguments', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('arg1', 'arg2');
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      
      debouncedFn();
      vi.advanceTimersByTime(50);
      
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('EventManager', () => {
    let eventManager: EventManager;

    beforeEach(() => {
      eventManager = new EventManager();
    });

    afterEach(() => {
      eventManager.cleanup();
    });

    it('should subscribe and emit events', () => {
      const handler = vi.fn();
      const unsubscribe = eventManager.subscribe('pointerdown', handler);

      eventManager.emit('pointerdown', { x: 100, y: 200 });
      
      expect(handler).toHaveBeenCalledWith({ x: 100, y: 200 });

      unsubscribe();
      eventManager.emit('pointerdown', { x: 300, y: 400 });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventManager.subscribe('pointermove', handler1);
      eventManager.subscribe('pointermove', handler2);

      eventManager.emit('pointermove', { x: 50, y: 75 });
      
      expect(handler1).toHaveBeenCalledWith({ x: 50, y: 75 });
      expect(handler2).toHaveBeenCalledWith({ x: 50, y: 75 });
    });

    it('should create throttled handlers', () => {
      vi.useFakeTimers();
      
      const handler = vi.fn();
      const throttledHandler = eventManager.createThrottledHandler('test', handler, 100);

      throttledHandler('arg1');
      throttledHandler('arg2');
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('arg1');

      vi.restoreAllMocks();
    });

    it('should cleanup properly', () => {
      const handler = vi.fn();
      eventManager.subscribe('wheel', handler);
      
      eventManager.cleanup();
      eventManager.emit('wheel', { deltaY: 10 });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('EVENT_CONSTANTS', () => {
    it('should have reasonable default values', () => {
      expect(EVENT_CONSTANTS.DOUBLE_CLICK_THRESHOLD).toBe(300);
      expect(EVENT_CONSTANTS.DRAG_THRESHOLD).toBe(5);
      expect(EVENT_CONSTANTS.LONG_PRESS_THRESHOLD).toBe(500);
      expect(EVENT_CONSTANTS.THROTTLE_INTERVAL).toBe(16);
      expect(EVENT_CONSTANTS.DEBOUNCE_DELAY).toBe(100);
    });
  });
});