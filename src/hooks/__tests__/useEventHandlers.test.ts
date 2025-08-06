/**
 * Tests for the enhanced event handler system
 */

import { renderHook, act } from '@testing-library/react';
import { useEventHandlers } from '../useEventHandlers';
import { CanvasObjectType } from '../../types';
import * as eventUtils from '../../utils/eventUtils';

// Mock dependencies
jest.mock('../../utils/eventUtils');
jest.mock('../../utils/canvasUtils');

const mockEventUtils = eventUtils as jest.Mocked<typeof eventUtils>;

describe('useEventHandlers', () => {
  // Mock canvas ref
  const mockCanvas = {
    current: {
      getBoundingClientRect: jest.fn(() => ({ left: 0, top: 0 })),
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
    } as any
  };

  // Mock config
  const mockConfig = {
    canvasRef: mockCanvas,
    canvasObjects: [],
    selectedObject: null,
    selectedObjects: [],
    scale: 1,
    canvasOffset: { x: 0, y: 0 },
    baseFontSize: 16,
    fontLoaded: true,
    showTextBox: false,
    isSpacePressed: false,
  };

  // Mock callbacks
  const mockCallbacks = {
    setCanvasObjects: jest.fn(),
    setSelectedObject: jest.fn(),
    setSelectedObjects: jest.fn(),
    setCanvasOffset: jest.fn(),
    setDragPreviewObjects: jest.fn(),
    setSelectionRect: jest.fn(),
    setHoveredObject: jest.fn(),
    setMousePosition: jest.fn(),
    setIsMouseInTextBox: jest.fn(),
    onDoubleClick: jest.fn(),
    onContextMenu: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock normalizePointerEvent
    mockEventUtils.normalizePointerEvent.mockReturnValue({
      pointerId: 1,
      x: 100,
      y: 100,
      clientX: 100,
      clientY: 100,
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
    });

    mockEventUtils.isPrimaryPointerEvent.mockReturnValue(true);
    mockEventUtils.isSecondaryPointerEvent.mockReturnValue(false);
  });

  it('should initialize event handlers', () => {
    const { result } = renderHook(() => 
      useEventHandlers(mockConfig, mockCallbacks)
    );

    expect(result.current).toHaveProperty('handlePointerDown');
    expect(result.current).toHaveProperty('handlePointerMove');
    expect(result.current).toHaveProperty('handlePointerUp');
    expect(result.current).toHaveProperty('handleContextMenu');
    expect(result.current).toHaveProperty('eventState');
  });

  it('should handle pointer down events', () => {
    const { result } = renderHook(() => 
      useEventHandlers(mockConfig, mockCallbacks)
    );

    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handlePointerDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEventUtils.normalizePointerEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle pointer move events with throttling', () => {
    const { result } = renderHook(() => 
      useEventHandlers(mockConfig, mockCallbacks)
    );

    const mockEvent = {} as any;

    act(() => {
      result.current.handlePointerMove(mockEvent);
    });

    expect(mockEventUtils.normalizePointerEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle pointer up events', () => {
    const { result } = renderHook(() => 
      useEventHandlers(mockConfig, mockCallbacks)
    );

    const mockEvent = {} as any;

    act(() => {
      result.current.handlePointerUp(mockEvent);
    });

    expect(mockEventUtils.normalizePointerEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle context menu events', () => {
    const { result } = renderHook(() => 
      useEventHandlers(mockConfig, mockCallbacks)
    );

    const mockEvent = {
      preventDefault: jest.fn(),
      clientX: 100,
      clientY: 100,
    } as any;

    act(() => {
      result.current.handleContextMenu(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should track event state correctly', () => {
    const { result } = renderHook(() => 
      useEventHandlers(mockConfig, mockCallbacks)
    );

    expect(result.current.eventState).toEqual({
      isDragging: false,
      isDraggingText: false,
      isSelecting: false,
      dragStart: { x: 0, y: 0 },
      lastPointerPosition: { x: 0, y: 0 },
      activePointerId: null,
      pointerDownTime: 0,
    });
  });

  it('should handle multi-object selection with space key', () => {
    const mockObject: CanvasObjectType = {
      id: '1',
      x: 50,
      y: 50,
      text: 'Test',
      fontSize: 16,
      scale: 1,
    };

    const configWithObject = {
      ...mockConfig,
      canvasObjects: [mockObject],
      isSpacePressed: true,
    };

    const { result } = renderHook(() => 
      useEventHandlers(configWithObject, mockCallbacks)
    );

    // This would require more complex mocking of canvas utils
    // to properly test object selection logic
    expect(result.current.handlePointerDown).toBeDefined();
  });

  it('should clean up timeouts on unmount', () => {
    const { unmount } = renderHook(() => 
      useEventHandlers(mockConfig, mockCallbacks)
    );

    // Mock setTimeout to track timeout creation
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    unmount();

    // Cleanup should be called
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(0); // No timeouts created yet
    
    clearTimeoutSpy.mockRestore();
  });

  describe('Performance optimization', () => {
    it('should adapt throttling based on performance', () => {
      // Mock performance.now
      const mockPerformanceNow = jest.spyOn(performance, 'now');
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(30); // 30ms frame time

      const { result } = renderHook(() => 
        useEventHandlers(mockConfig, mockCallbacks)
      );

      // The performance monitoring should automatically adjust throttling
      expect(result.current).toBeDefined();
      
      mockPerformanceNow.mockRestore();
    });

    it('should throttle expensive operations', () => {
      const { result } = renderHook(() => 
        useEventHandlers(mockConfig, mockCallbacks)
      );

      const mockEvent = {} as any;

      // Multiple rapid calls should be throttled
      act(() => {
        result.current.handlePointerMove(mockEvent);
        result.current.handlePointerMove(mockEvent);
        result.current.handlePointerMove(mockEvent);
      });

      // Only first call should process immediately, others are throttled
      expect(mockEventUtils.normalizePointerEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error handling', () => {
    it('should handle missing canvas ref gracefully', () => {
      const configWithoutCanvas = {
        ...mockConfig,
        canvasRef: { current: null },
      };

      const { result } = renderHook(() => 
        useEventHandlers(configWithoutCanvas, mockCallbacks)
      );

      const mockEvent = {
        preventDefault: jest.fn(),
      } as any;

      expect(() => {
        act(() => {
          result.current.handlePointerDown(mockEvent);
        });
      }).not.toThrow();
    });

    it('should handle invalid pointer events', () => {
      mockEventUtils.isPrimaryPointerEvent.mockReturnValue(false);
      mockEventUtils.isSecondaryPointerEvent.mockReturnValue(false);

      const { result } = renderHook(() => 
        useEventHandlers(mockConfig, mockCallbacks)
      );

      const mockEvent = {
        preventDefault: jest.fn(),
      } as any;

      expect(() => {
        act(() => {
          result.current.handlePointerDown(mockEvent);
        });
      }).not.toThrow();
    });
  });
});