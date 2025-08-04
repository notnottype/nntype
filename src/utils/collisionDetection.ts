/**
 * Enhanced collision detection system for NNType
 * Optimized for performance and future MCP integration
 */

import { CanvasObjectType, TextObjectType, ArrowObjectType, A4GuideObjectType } from '../types';

export interface CollisionResult {
  isColliding: boolean;
  distance?: number;
  closestPoint?: { x: number; y: number };
  collisionType?: 'inside' | 'edge' | 'near';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Enhanced collision detector with distance calculation
 */
export class CollisionDetector {
  private static readonly EDGE_TOLERANCE = 5; // pixels
  private static readonly NEAR_TOLERANCE = 20; // pixels

  /**
   * Primary collision detection method - optimized for performance
   */
  static isPointInObject(
    object: CanvasObjectType,
    screenX: number,
    screenY: number,
    worldToScreen: (x: number, y: number) => { x: number; y: number },
    measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
  ): CollisionResult {
    switch (object.type) {
      case 'text':
        return this.isPointInTextObject(object as TextObjectType, screenX, screenY, worldToScreen, measureTextWidth);
      case 'arrow':
        return this.isPointInArrowObject(object as ArrowObjectType, screenX, screenY, worldToScreen);
      case 'a4guide':
        return this.isPointInA4GuideObject(object as A4GuideObjectType, screenX, screenY, worldToScreen);
      default:
        return { isColliding: false };
    }
  }

  /**
   * Text object collision detection with bounding box
   */
  private static isPointInTextObject(
    textObj: TextObjectType,
    screenX: number,
    screenY: number,
    worldToScreen: (x: number, y: number) => { x: number; y: number },
    measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
  ): CollisionResult {
    const screenPos = worldToScreen(textObj.x, textObj.y);
    const content = textObj.content || '';
    const lines = content.split('\n');
    const lineHeight = textObj.fontSize * 1.6;
    
    // Calculate text dimensions
    let maxWidth = 0;
    if (measureTextWidth) {
      maxWidth = Math.max(...lines.map(line => 
        measureTextWidth(line, textObj.fontSize, null, true)
      ));
    } else {
      // Fallback estimation
      maxWidth = Math.max(...lines.map(line => line.length)) * textObj.fontSize * 0.6;
    }
    
    const totalHeight = lines.length * lineHeight;
    
    // Bounding box collision
    const left = screenPos.x;
    const right = screenPos.x + maxWidth;
    const top = screenPos.y;
    const bottom = screenPos.y + totalHeight;
    
    const isInside = screenX >= left && screenX <= right && screenY >= top && screenY <= bottom;
    
    if (isInside) {
      return {
        isColliding: true,
        distance: 0,
        closestPoint: { x: screenX, y: screenY },
        collisionType: 'inside'
      };
    }
    
    // Calculate distance to nearest edge
    const distanceToLeft = Math.abs(screenX - left);
    const distanceToRight = Math.abs(screenX - right);
    const distanceToTop = Math.abs(screenY - top);
    const distanceToBottom = Math.abs(screenY - bottom);
    
    let minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
    let closestPoint: { x: number; y: number };
    
    // Find closest point on edge
    if (screenX < left) {
      closestPoint = { x: left, y: Math.max(top, Math.min(bottom, screenY)) };
      minDistance = Math.sqrt(Math.pow(screenX - left, 2) + Math.pow(screenY - closestPoint.y, 2));
    } else if (screenX > right) {
      closestPoint = { x: right, y: Math.max(top, Math.min(bottom, screenY)) };
      minDistance = Math.sqrt(Math.pow(screenX - right, 2) + Math.pow(screenY - closestPoint.y, 2));
    } else if (screenY < top) {
      closestPoint = { x: screenX, y: top };
      minDistance = Math.abs(screenY - top);
    } else if (screenY > bottom) {
      closestPoint = { x: screenX, y: bottom };
      minDistance = Math.abs(screenY - bottom);
    } else {
      closestPoint = { x: screenX, y: screenY };
      minDistance = 0;
    }
    
    const collisionType = minDistance <= this.EDGE_TOLERANCE ? 'edge' : 
                         minDistance <= this.NEAR_TOLERANCE ? 'near' : undefined;
    
    return {
      isColliding: minDistance <= this.EDGE_TOLERANCE,
      distance: minDistance,
      closestPoint,
      collisionType
    };
  }

  /**
   * Arrow object collision detection with line segment collision
   */
  private static isPointInArrowObject(
    arrowObj: ArrowObjectType,
    screenX: number,
    screenY: number,
    worldToScreen: (x: number, y: number) => { x: number; y: number }
  ): CollisionResult {
    if (!arrowObj.points || arrowObj.points.length < 2) {
      return { isColliding: false };
    }

    const screenPoints = arrowObj.points.map(p => worldToScreen(p.x, p.y));
    let minDistance = Infinity;
    let closestPoint: { x: number; y: number } | undefined;

    // Check collision with each line segment
    for (let i = 0; i < screenPoints.length - 1; i++) {
      const p1 = screenPoints[i];
      const p2 = screenPoints[i + 1];
      
      const result = this.pointToLineSegmentDistance(
        { x: screenX, y: screenY },
        p1,
        p2
      );
      
      if (result.distance < minDistance) {
        minDistance = result.distance;
        closestPoint = result.closestPoint;
      }
    }

    const collisionType = minDistance <= this.EDGE_TOLERANCE ? 'edge' : 
                         minDistance <= this.NEAR_TOLERANCE ? 'near' : undefined;

    return {
      isColliding: minDistance <= this.EDGE_TOLERANCE,
      distance: minDistance,
      closestPoint,
      collisionType
    };
  }

  /**
   * A4 Guide object collision detection
   */
  private static isPointInA4GuideObject(
    guideObj: A4GuideObjectType,
    screenX: number,
    screenY: number,
    worldToScreen: (x: number, y: number) => { x: number; y: number }
  ): CollisionResult {
    const screenPos = worldToScreen(guideObj.x, guideObj.y);
    
    // A4 dimensions in mm converted to pixels (approximate)
    const a4Width = 210 * 3.78; // mm to pixels
    const a4Height = 297 * 3.78; // mm to pixels
    
    const left = screenPos.x;
    const right = screenPos.x + a4Width;
    const top = screenPos.y;
    const bottom = screenPos.y + a4Height;
    
    const isInside = screenX >= left && screenX <= right && screenY >= top && screenY <= bottom;
    
    if (isInside) {
      return {
        isColliding: true,
        distance: 0,
        closestPoint: { x: screenX, y: screenY },
        collisionType: 'inside'
      };
    }
    
    // Calculate distance to nearest edge
    const distances = [
      Math.abs(screenX - left),
      Math.abs(screenX - right),
      Math.abs(screenY - top),
      Math.abs(screenY - bottom)
    ];
    
    const minDistance = Math.min(...distances);
    
    return {
      isColliding: false,
      distance: minDistance,
      collisionType: minDistance <= this.NEAR_TOLERANCE ? 'near' : undefined
    };
  }

  /**
   * Calculate distance from point to line segment
   */
  private static pointToLineSegmentDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): { distance: number; closestPoint: { x: number; y: number } } {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line segment is actually a point
      const distance = Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
      );
      return { distance, closestPoint: lineStart };
    }

    // Calculate projection of point onto line segment
    const t = Math.max(0, Math.min(1, 
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
    ));

    const closestPoint = {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy
    };

    const distance = Math.sqrt(
      Math.pow(point.x - closestPoint.x, 2) + Math.pow(point.y - closestPoint.y, 2)
    );

    return { distance, closestPoint };
  }

  /**
   * Get bounding box for any object type
   */
  static getBoundingBox(
    object: CanvasObjectType,
    worldToScreen: (x: number, y: number) => { x: number; y: number },
    measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
  ): BoundingBox {
    switch (object.type) {
      case 'text':
        return this.getTextBoundingBox(object as TextObjectType, worldToScreen, measureTextWidth);
      case 'arrow':
        return this.getArrowBoundingBox(object as ArrowObjectType, worldToScreen);
      case 'a4guide':
        return this.getA4GuideBoundingBox(object as A4GuideObjectType, worldToScreen);
      default:
        const pos = worldToScreen((object as any).x || 0, (object as any).y || 0);
        return { x: pos.x, y: pos.y, width: 0, height: 0 };
    }
  }

  private static getTextBoundingBox(
    textObj: TextObjectType,
    worldToScreen: (x: number, y: number) => { x: number; y: number },
    measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
  ): BoundingBox {
    const screenPos = worldToScreen(textObj.x, textObj.y);
    const content = textObj.content || '';
    const lines = content.split('\n');
    const lineHeight = textObj.fontSize * 1.6;
    
    let maxWidth = 0;
    if (measureTextWidth) {
      maxWidth = Math.max(...lines.map(line => 
        measureTextWidth(line, textObj.fontSize, null, true)
      ));
    } else {
      maxWidth = Math.max(...lines.map(line => line.length)) * textObj.fontSize * 0.6;
    }
    
    return {
      x: screenPos.x,
      y: screenPos.y,
      width: maxWidth,
      height: lines.length * lineHeight
    };
  }

  private static getArrowBoundingBox(
    arrowObj: ArrowObjectType,
    worldToScreen: (x: number, y: number) => { x: number; y: number }
  ): BoundingBox {
    if (!arrowObj.points || arrowObj.points.length === 0) {
      const pos = worldToScreen(arrowObj.x, arrowObj.y);
      return { x: pos.x, y: pos.y, width: 0, height: 0 };
    }

    const screenPoints = arrowObj.points.map(p => worldToScreen(p.x, p.y));
    const xs = screenPoints.map(p => p.x);
    const ys = screenPoints.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private static getA4GuideBoundingBox(
    guideObj: A4GuideObjectType,
    worldToScreen: (x: number, y: number) => { x: number; y: number }
  ): BoundingBox {
    const screenPos = worldToScreen(guideObj.x, guideObj.y);
    const a4Width = 210 * 3.78;
    const a4Height = 297 * 3.78;
    
    return {
      x: screenPos.x,
      y: screenPos.y,
      width: a4Width,
      height: a4Height
    };
  }

  /**
   * Spatial indexing for performance optimization (future use)
   */
  static createSpatialIndex(
    objects: CanvasObjectType[],
    worldToScreen: (x: number, y: number) => { x: number; y: number },
    measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
  ) {
    const index = new Map<string, CanvasObjectType[]>();
    const gridSize = 100; // pixels
    
    objects.forEach(obj => {
      const bbox = this.getBoundingBox(obj, worldToScreen, measureTextWidth);
      
      // Calculate grid cells this object spans
      const startX = Math.floor(bbox.x / gridSize);
      const endX = Math.floor((bbox.x + bbox.width) / gridSize);
      const startY = Math.floor(bbox.y / gridSize);
      const endY = Math.floor((bbox.y + bbox.height) / gridSize);
      
      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const key = `${x},${y}`;
          if (!index.has(key)) {
            index.set(key, []);
          }
          index.get(key)!.push(obj);
        }
      }
    });
    
    return {
      index,
      getCandidates: (screenX: number, screenY: number): CanvasObjectType[] => {
        const gridX = Math.floor(screenX / gridSize);
        const gridY = Math.floor(screenY / gridSize);
        const key = `${gridX},${gridY}`;
        return index.get(key) || [];
      }
    };
  }
}

/**
 * Backward compatibility wrapper
 */
export const isPointInObject = (
  object: CanvasObjectType,
  screenX: number,
  screenY: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  measureTextWidth?: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number
): boolean => {
  return CollisionDetector.isPointInObject(object, screenX, screenY, worldToScreen, measureTextWidth).isColliding;
};