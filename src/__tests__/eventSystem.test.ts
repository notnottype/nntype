/**
 * Basic tests for the enhanced event handling system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizePointerEvent, throttle, debounce } from '../utils/eventUtils';

describe('Enhanced Event System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Event Normalization', () => {
    it('should normalize pointer events correctly', () => {
      const mockPointerEvent = {
        type: 'pointerdown',
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
        pointerType: 'mouse',
        isPrimary: true,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      const normalized = normalizePointerEvent(mockPointerEvent);

      expect(normalized).toEqual({
        pointerId: 1,
        x: 100,
        y: 200,
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
        pointerType: 'mouse',
        isPrimary: true
      });
    });

    it('should handle mouse events as pointer events', () => {
      const mockMouseEvent = {
        type: 'mousedown',
        clientX: 150,
        clientY: 250,
        button: 0,
        buttons: 1,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as any;

      const normalized = normalizePointerEvent(mockMouseEvent);

      expect(normalized).toEqual({
        pointerId: 1, // Mouse events get ID 1
        x: 150,
        y: 250,
        clientX: 150,
        clientY: 250,
        button: 0,
        buttons: 1,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        pressure: 0.5, // Mouse events get standard pressure
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 'mouse',
        isPrimary: true
      });
    });
  });

  describe('Performance Utilities', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttled = throttle(mockFn, 100);

      throttled();
      throttled();
      throttled();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debounced = debounce(mockFn, 100);

      debounced();
      debounced();
      debounced();

      expect(mockFn).toHaveBeenCalledTimes(0);

      // Wait for debounce timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event System Integration', () => {
    it('should handle basic event system functionality', () => {
      // Test that our event utilities are properly exportable and functional
      expect(typeof normalizePointerEvent).toBe('function');
      expect(typeof throttle).toBe('function');
      expect(typeof debounce).toBe('function');
    });
  });
});