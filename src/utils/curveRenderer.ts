import { ArrowStyle, CurveType } from '../types';

export interface Point {
  x: number;
  y: number;
}

/**
 * High-performance Bezier curve renderer for Excalidraw-style links
 */
export class BezierCurveRenderer {
  /**
   * Calculate cubic bezier curve point at parameter t
   */
  static cubicBezier(
    t: number,
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point
  ): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  }

  /**
   * Calculate quadratic bezier curve point at parameter t
   */
  static quadraticBezier(t: number, p0: Point, p1: Point, p2: Point): Point {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    
    return {
      x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
      y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y
    };
  }

  /**
   * Generate smooth curve points with adaptive subdivision
   * Higher curvature areas get more sample points for smoothness
   */
  static generateSmoothCurve(
    startPoint: Point,
    controlPoints: Point[],
    endPoint: Point,
    curveType: CurveType = CurveType.BEZIER,
    maxError: number = 0.5
  ): Point[] {
    switch (curveType) {
      case CurveType.STRAIGHT:
        return [startPoint, endPoint];
      
      case CurveType.BEZIER:
        return this.generateBezierCurve(startPoint, controlPoints, endPoint, maxError);
      
      case CurveType.CATMULL_ROM:
        return this.generateCatmullRomCurve(startPoint, controlPoints, endPoint);
      
      default:
        return [startPoint, endPoint];
    }
  }

  /**
   * Generate bezier curve with adaptive subdivision
   */
  private static generateBezierCurve(
    start: Point,
    controlPoints: Point[],
    end: Point,
    maxError: number
  ): Point[] {
    if (controlPoints.length === 0) {
      return [start, end];
    }

    if (controlPoints.length === 1) {
      // Quadratic bezier
      return this.adaptiveQuadraticBezier(start, controlPoints[0], end, maxError);
    }

    // Cubic bezier (use first two control points)
    return this.adaptiveCubicBezier(start, controlPoints[0], controlPoints[1], end, maxError);
  }

  /**
   * Adaptive quadratic bezier subdivision
   */
  private static adaptiveQuadraticBezier(
    p0: Point,
    p1: Point,
    p2: Point,
    maxError: number,
    t0: number = 0,
    t1: number = 1
  ): Point[] {
    const midT = (t0 + t1) / 2;
    const midPoint = this.quadraticBezier(midT, p0, p1, p2);
    
    // Linear interpolation between start and end
    const linearMid = {
      x: (1 - midT) * p0.x + midT * p2.x,
      y: (1 - midT) * p0.y + midT * p2.y
    };
    
    // Check if curve deviates too much from straight line
    const error = Math.sqrt(
      Math.pow(midPoint.x - linearMid.x, 2) + 
      Math.pow(midPoint.y - linearMid.y, 2)
    );
    
    if (error <= maxError || Math.abs(t1 - t0) < 0.01) {
      return [p0, midPoint, p2];
    }
    
    // Subdivide recursively
    const leftHalf = this.adaptiveQuadraticBezier(p0, p1, p2, maxError, t0, midT);
    const rightHalf = this.adaptiveQuadraticBezier(p0, p1, p2, maxError, midT, t1);
    
    // Remove duplicate midpoint
    return [...leftHalf.slice(0, -1), ...rightHalf];
  }

  /**
   * Adaptive cubic bezier subdivision
   */
  private static adaptiveCubicBezier(
    p0: Point,
    p1: Point,
    p2: Point,
    p3: Point,
    maxError: number,
    t0: number = 0,
    t1: number = 1
  ): Point[] {
    const midT = (t0 + t1) / 2;
    const midPoint = this.cubicBezier(midT, p0, p1, p2, p3);
    
    // Linear interpolation between start and end
    const linearMid = {
      x: (1 - midT) * p0.x + midT * p3.x,
      y: (1 - midT) * p0.y + midT * p3.y
    };
    
    // Check if curve deviates too much from straight line
    const error = Math.sqrt(
      Math.pow(midPoint.x - linearMid.x, 2) + 
      Math.pow(midPoint.y - linearMid.y, 2)
    );
    
    if (error <= maxError || Math.abs(t1 - t0) < 0.01) {
      return [p0, midPoint, p3];
    }
    
    // Subdivide recursively
    const leftHalf = this.adaptiveCubicBezier(p0, p1, p2, p3, maxError, t0, midT);
    const rightHalf = this.adaptiveCubicBezier(p0, p1, p2, p3, maxError, midT, t1);
    
    // Remove duplicate midpoint
    return [...leftHalf.slice(0, -1), ...rightHalf];
  }

  /**
   * Generate Catmull-Rom curve (same as existing implementation)
   */
  private static generateCatmullRomCurve(
    start: Point,
    controlPoints: Point[],
    end: Point,
    segments: number = 50
  ): Point[] {
    const allPoints = [start, ...controlPoints, end];
    
    if (allPoints.length < 2) return allPoints;
    if (allPoints.length === 2) {
      // Simple linear interpolation
      const result: Point[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        result.push({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t
        });
      }
      return result;
    }

    const splinePoints: Point[] = [];
    
    // Add phantom points for smooth start and end
    const extendedPoints = [
      { x: 2 * allPoints[0].x - allPoints[1].x, y: 2 * allPoints[0].y - allPoints[1].y },
      ...allPoints,
      { x: 2 * allPoints[allPoints.length - 1].x - allPoints[allPoints.length - 2].x, 
        y: 2 * allPoints[allPoints.length - 1].y - allPoints[allPoints.length - 2].y }
    ];

    for (let i = 1; i < extendedPoints.length - 2; i++) {
      const p0 = extendedPoints[i - 1];
      const p1 = extendedPoints[i];
      const p2 = extendedPoints[i + 1];
      const p3 = extendedPoints[i + 2];

      for (let t = 0; t <= 1; t += 1 / segments) {
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );

        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        splinePoints.push({ x, y });
      }
    }

    return splinePoints;
  }

  /**
   * Calculate curve tangent at parameter t for arrow direction
   */
  static getCurveTangent(
    t: number,
    start: Point,
    controlPoints: Point[],
    end: Point,
    curveType: CurveType
  ): Point {
    const dt = 0.001;
    const t1 = Math.max(0, t - dt);
    const t2 = Math.min(1, t + dt);
    
    let p1: Point, p2: Point;
    
    if (curveType === CurveType.BEZIER && controlPoints.length >= 1) {
      if (controlPoints.length === 1) {
        p1 = this.quadraticBezier(t1, start, controlPoints[0], end);
        p2 = this.quadraticBezier(t2, start, controlPoints[0], end);
      } else {
        p1 = this.cubicBezier(t1, start, controlPoints[0], controlPoints[1], end);
        p2 = this.cubicBezier(t2, start, controlPoints[0], controlPoints[1], end);
      }
    } else {
      // Linear or other curve types
      p1 = { x: start.x + (end.x - start.x) * t1, y: start.y + (end.y - start.y) * t1 };
      p2 = { x: start.x + (end.x - start.x) * t2, y: start.y + (end.y - start.y) * t2 };
    }
    
    // Normalize the tangent vector
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    return length > 0 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
  }
}

/**
 * Arrow renderer for various arrow styles
 */
export class ArrowRenderer {
  static renderArrow(
    ctx: CanvasRenderingContext2D,
    endPoint: Point,
    direction: Point,
    style: ArrowStyle,
    size: number,
    color: string,
    scale: number = 1
  ): void {
    const scaledSize = size * scale;
    
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.translate(endPoint.x, endPoint.y);
    
    const angle = Math.atan2(direction.y, direction.x);
    ctx.rotate(angle);
    
    switch (style) {
      case ArrowStyle.ARROW:
        this.drawTriangleArrow(ctx, scaledSize);
        break;
        
      case ArrowStyle.DOUBLE_ARROW:
        this.drawDoubleArrow(ctx, scaledSize);
        break;
        
      case ArrowStyle.DOT:
        this.drawDot(ctx, scaledSize);
        break;
        
      case ArrowStyle.DIAMOND:
        this.drawDiamond(ctx, scaledSize);
        break;
        
      case ArrowStyle.CIRCLE:
        this.drawCircle(ctx, scaledSize);
        break;
        
      case ArrowStyle.NONE:
      default:
        // No arrow
        break;
    }
    
    ctx.restore();
  }

  private static drawTriangleArrow(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size, size / 2);
    ctx.closePath();
    ctx.fill();
  }

  private static drawDoubleArrow(ctx: CanvasRenderingContext2D, size: number): void {
    // Draw two triangle arrows
    this.drawTriangleArrow(ctx, size);
    ctx.translate(-size * 0.7, 0);
    this.drawTriangleArrow(ctx, size);
  }

  private static drawDot(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  private static drawDiamond(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size / 2, -size / 2);
    ctx.lineTo(-size, 0);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
  }

  private static drawCircle(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
    ctx.stroke();
  }
}