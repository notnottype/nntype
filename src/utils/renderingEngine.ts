/**
 * Advanced Canvas Rendering Engine
 * High-performance layer-based rendering system with selective updates
 */

export interface RenderLayer {
  id: string;
  zIndex: number;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  isDirty: boolean;
  lastRenderTime: number;
  objects: string[]; // Object IDs in this layer
}

export interface RenderObject {
  id: string;
  layerId: string;
  bounds: { x: number; y: number; width: number; height: number };
  lastModified: number;
  renderFunction: (ctx: CanvasRenderingContext2D, scale: number) => void;
}

export class CanvasRenderingEngine {
  private layers: Map<string, RenderLayer> = new Map();
  private objects: Map<string, RenderObject> = new Map();
  private compositeCanvas: HTMLCanvasElement;
  private compositeContext: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRendering = false;
  private renderQueue: Set<string> = new Set(); // Layer IDs to render
  private performanceMetrics = {
    frameCount: 0,
    averageFrameTime: 0,
    lastFrameTime: 0,
    droppedFrames: 0
  };

  constructor(
    private container: HTMLElement,
    private width: number,
    private height: number,
    private devicePixelRatio: number = window.devicePixelRatio || 1
  ) {
    this.compositeCanvas = document.createElement('canvas');
    this.compositeContext = this.compositeCanvas.getContext('2d')!;
    this.setupCanvas(this.compositeCanvas, width, height);
    container.appendChild(this.compositeCanvas);
    
    // Create default layers
    this.createLayer('background', -1000);
    this.createLayer('grid', -500);
    this.createLayer('content', 0);
    this.createLayer('selection', 500);
    this.createLayer('ui', 1000);
  }

  private setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    const scaledWidth = width * this.devicePixelRatio;
    const scaledHeight = height * this.devicePixelRatio;
    
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
  }

  createLayer(id: string, zIndex: number): RenderLayer {
    if (this.layers.has(id)) {
      throw new Error(`Layer ${id} already exists`);
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    this.setupCanvas(canvas, this.width, this.height);

    const layer: RenderLayer = {
      id,
      zIndex,
      canvas,
      context,
      isDirty: true,
      lastRenderTime: 0,
      objects: []
    };

    this.layers.set(id, layer);
    return layer;
  }

  addObject(object: RenderObject): void {
    this.objects.set(object.id, object);
    
    const layer = this.layers.get(object.layerId);
    if (layer) {
      layer.objects.push(object.id);
      this.markLayerDirty(object.layerId);
    }
  }

  updateObject(id: string, updates: Partial<RenderObject>): void {
    const object = this.objects.get(id);
    if (!object) return;

    const oldLayerId = object.layerId;
    Object.assign(object, updates, { lastModified: Date.now() });

    // Handle layer changes
    if (updates.layerId && updates.layerId !== oldLayerId) {
      const oldLayer = this.layers.get(oldLayerId);
      const newLayer = this.layers.get(updates.layerId);
      
      if (oldLayer) {
        oldLayer.objects = oldLayer.objects.filter(objId => objId !== id);
        this.markLayerDirty(oldLayerId);
      }
      
      if (newLayer) {
        newLayer.objects.push(id);
        this.markLayerDirty(updates.layerId);
      }
    } else {
      this.markLayerDirty(object.layerId);
    }
  }

  removeObject(id: string): void {
    const object = this.objects.get(id);
    if (!object) return;

    const layer = this.layers.get(object.layerId);
    if (layer) {
      layer.objects = layer.objects.filter(objId => objId !== id);
      this.markLayerDirty(object.layerId);
    }

    this.objects.delete(id);
  }

  markLayerDirty(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.isDirty = true;
      this.renderQueue.add(layerId);
      this.scheduleRender();
    }
  }

  private scheduleRender(): void {
    if (this.animationFrameId !== null || this.isRendering) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.render();
    });
  }

  private render(): void {
    if (this.isRendering) return;
    
    const startTime = performance.now();
    this.isRendering = true;
    this.animationFrameId = null;

    try {
      // Render dirty layers
      const layersToRender = Array.from(this.renderQueue);
      this.renderQueue.clear();

      for (const layerId of layersToRender) {
        this.renderLayer(layerId);
      }

      // Composite all layers if any were updated
      if (layersToRender.length > 0) {
        this.composite();
      }

      // Update performance metrics
      const frameTime = performance.now() - startTime;
      this.updatePerformanceMetrics(frameTime);

    } finally {
      this.isRendering = false;
    }
  }

  private renderLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer || !layer.isDirty) return;

    const { context, objects } = layer;
    
    // Clear layer
    context.clearRect(0, 0, this.width, this.height);

    // Render objects in this layer
    for (const objectId of objects) {
      const object = this.objects.get(objectId);
      if (object) {
        context.save();
        object.renderFunction(context, this.devicePixelRatio);
        context.restore();
      }
    }

    layer.isDirty = false;
    layer.lastRenderTime = Date.now();
  }

  private composite(): void {
    const { compositeContext } = this;
    
    // Clear composite canvas
    compositeContext.clearRect(0, 0, this.width, this.height);

    // Composite layers in z-index order
    const sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      compositeContext.drawImage(layer.canvas, 0, 0);
    }
  }

  private updatePerformanceMetrics(frameTime: number): void {
    this.performanceMetrics.frameCount++;
    this.performanceMetrics.lastFrameTime = frameTime;
    
    // Calculate moving average
    const alpha = 0.1;
    this.performanceMetrics.averageFrameTime = 
      (1 - alpha) * this.performanceMetrics.averageFrameTime + alpha * frameTime;

    // Track dropped frames (>16.67ms = dropped frame at 60fps)
    if (frameTime > 16.67) {
      this.performanceMetrics.droppedFrames++;
    }
  }

  // Public API methods
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    // Resize composite canvas
    this.setupCanvas(this.compositeCanvas, width, height);

    // Resize all layer canvases
    for (const layer of this.layers.values()) {
      this.setupCanvas(layer.canvas, width, height);
      layer.isDirty = true;
      this.renderQueue.add(layer.id);
    }

    this.scheduleRender();
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  getCanvas(): HTMLCanvasElement {
    return this.compositeCanvas;
  }

  clear(): void {
    this.objects.clear();
    for (const layer of this.layers.values()) {
      layer.objects = [];
      layer.isDirty = true;
      this.renderQueue.add(layer.id);
    }
    this.scheduleRender();
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.compositeCanvas.remove();
    this.layers.clear();
    this.objects.clear();
    this.renderQueue.clear();
  }

  // Debugging and development helpers
  debugInfo() {
    return {
      layers: Array.from(this.layers.values()).map(layer => ({
        id: layer.id,
        zIndex: layer.zIndex,
        isDirty: layer.isDirty,
        objectCount: layer.objects.length,
        lastRenderTime: layer.lastRenderTime
      })),
      objects: this.objects.size,
      renderQueue: Array.from(this.renderQueue),
      performance: this.performanceMetrics
    };
  }
}

// Factory function for easy integration
export const createRenderingEngine = (
  container: HTMLElement,
  width: number,
  height: number
): CanvasRenderingEngine => {
  return new CanvasRenderingEngine(container, width, height);
};