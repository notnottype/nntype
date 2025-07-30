/**
 * Tests for the advanced rendering engine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasRenderingEngine, RenderObject } from '../renderingEngine';

// Mock HTMLCanvasElement and CanvasRenderingContext2D
const createMockCanvas = () => {
  const mockContext = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    getContext: vi.fn()
  };

  const mockCanvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    getContext: vi.fn(() => mockContext),
    remove: vi.fn()
  };

  return { mockCanvas, mockContext };
};

// Mock DOM
Object.defineProperty(window, 'devicePixelRatio', {
  value: 2,
  writable: true
});

global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 0);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('CanvasRenderingEngine', () => {
  let container: HTMLElement;
  let engine: CanvasRenderingEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock document.createElement
    const { mockCanvas, mockContext } = createMockCanvas();
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
    
    container = document.createElement('div');
    container.appendChild = vi.fn();
    
    engine = new CanvasRenderingEngine(container, 800, 600);
  });

  afterEach(() => {
    engine?.destroy();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create engine with correct dimensions', () => {
      expect(container.appendChild).toHaveBeenCalled();
    });

    it('should create default layers', () => {
      const debugInfo = engine.debugInfo();
      
      expect(debugInfo.layers).toHaveLength(5);
      expect(debugInfo.layers.map(l => l.id)).toEqual([
        'background', 'grid', 'content', 'selection', 'ui'
      ]);
    });

    it('should sort layers by z-index', () => {
      const debugInfo = engine.debugInfo();
      const zIndexes = debugInfo.layers.map(l => l.zIndex);
      
      // Should be sorted from lowest to highest
      expect(zIndexes).toEqual([-1000, -500, 0, 500, 1000]);
    });
  });

  describe('layer management', () => {
    it('should create new layers', () => {
      const layer = engine.createLayer('test', 100);
      
      expect(layer.id).toBe('test');
      expect(layer.zIndex).toBe(100);
      expect(layer.isDirty).toBe(true);
    });

    it('should throw error for duplicate layer ids', () => {
      engine.createLayer('duplicate', 100);
      
      expect(() => {
        engine.createLayer('duplicate', 200);
      }).toThrow('Layer duplicate already exists');
    });
  });

  describe('object management', () => {
    const createTestRenderObject = (id: string): RenderObject => ({
      id,
      layerId: 'content',
      bounds: { x: 0, y: 0, width: 100, height: 50 },
      lastModified: Date.now(),
      renderFunction: vi.fn()
    });

    it('should add objects to layers', () => {
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      const debugInfo = engine.debugInfo();
      const contentLayer = debugInfo.layers.find(l => l.id === 'content');
      
      expect(contentLayer?.objectCount).toBe(1);
      expect(contentLayer?.isDirty).toBe(true);
    });

    it('should update existing objects', () => {
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      engine.updateObject('test-obj', {
        bounds: { x: 50, y: 50, width: 200, height: 100 }
      });
      
      const debugInfo = engine.debugInfo();
      const contentLayer = debugInfo.layers.find(l => l.id === 'content');
      
      expect(contentLayer?.isDirty).toBe(true);
    });

    it('should handle layer changes during updates', () => {
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      engine.updateObject('test-obj', { layerId: 'ui' });
      
      const debugInfo = engine.debugInfo();
      const contentLayer = debugInfo.layers.find(l => l.id === 'content');
      const uiLayer = debugInfo.layers.find(l => l.id === 'ui');
      
      expect(contentLayer?.objectCount).toBe(0);
      expect(uiLayer?.objectCount).toBe(1);
    });

    it('should remove objects from layers', () => {
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      engine.removeObject('test-obj');
      
      const debugInfo = engine.debugInfo();
      const contentLayer = debugInfo.layers.find(l => l.id === 'content');
      
      expect(contentLayer?.objectCount).toBe(0);
    });
  });

  describe('rendering', () => {
    it('should mark layers as dirty when objects change', () => {
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      const debugInfo = engine.debugInfo();
      const contentLayer = debugInfo.layers.find(l => l.id === 'content');
      
      expect(contentLayer?.isDirty).toBe(true);
    });

    it('should schedule render when layers are dirty', () => {
      vi.useFakeTimers();
      
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      expect(requestAnimationFrame).toHaveBeenCalled();
      
      vi.restoreAllMocks();
    });

    it('should call render functions for objects', async () => {
      const renderFunction = vi.fn();
      const obj = createTestRenderObject('test-obj');
      obj.renderFunction = renderFunction;
      
      engine.addObject(obj);
      
      // Wait for render to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(renderFunction).toHaveBeenCalled();
    });
  });

  describe('performance metrics', () => {
    it('should track performance metrics', () => {
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('frameCount');
      expect(metrics).toHaveProperty('averageFrameTime');
      expect(metrics).toHaveProperty('lastFrameTime');
      expect(metrics).toHaveProperty('droppedFrames');
    });

    it('should start with zero metrics', () => {
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics.frameCount).toBe(0);
      expect(metrics.averageFrameTime).toBe(0);
      expect(metrics.droppedFrames).toBe(0);
    });
  });

  describe('resize handling', () => {
    it('should resize all layers', () => {
      engine.resize(1200, 800);
      
      const debugInfo = engine.debugInfo();
      
      // All layers should be marked dirty after resize
      debugInfo.layers.forEach(layer => {
        expect(layer.isDirty).toBe(true);
      });
    });
  });

  describe('debug information', () => {
    it('should provide comprehensive debug info', () => {
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      const debugInfo = engine.debugInfo();
      
      expect(debugInfo).toHaveProperty('layers');
      expect(debugInfo).toHaveProperty('objects');
      expect(debugInfo).toHaveProperty('renderQueue');
      expect(debugInfo).toHaveProperty('performance');
      
      expect(debugInfo.objects).toBe(1);
      expect(debugInfo.layers).toHaveLength(5);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      const obj = createTestRenderObject('test-obj');
      engine.addObject(obj);
      
      engine.destroy();
      
      const debugInfo = engine.debugInfo();
      
      expect(debugInfo.objects).toBe(0);
      expect(debugInfo.layers).toHaveLength(0);
    });

    it('should cancel animation frames on destroy', () => {
      engine.destroy();
      
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('clear functionality', () => {
    it('should clear all objects', () => {
      const obj1 = createTestRenderObject('obj1');
      const obj2 = createTestRenderObject('obj2');
      
      engine.addObject(obj1);
      engine.addObject(obj2);
      
      engine.clear();
      
      const debugInfo = engine.debugInfo();
      expect(debugInfo.objects).toBe(0);
    });

    it('should mark all layers dirty after clear', () => {
      engine.clear();
      
      const debugInfo = engine.debugInfo();
      debugInfo.layers.forEach(layer => {
        expect(layer.isDirty).toBe(true);
      });
    });
  });
});