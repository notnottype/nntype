// Enhanced math utilities using Excalidraw's math library
import { Vector, Point, Rectangle, Segment } from '@excalidraw/math';
import { memoize, throttleRAF } from '@excalidraw/common';

// Enhanced distance calculation using Excalidraw's optimized functions
export const calculateDistance = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  return Vector.distance(point1 as Point, point2 as Point);
};

// Optimized line-to-point distance calculation
export const distanceToLineSegment = memoize(
  (
    px: number, py: number, 
    x1: number, y1: number, 
    x2: number, y2: number
  ): number => {
    const segment: Segment = [
      { x: x1, y: y1 } as Point,
      { x: x2, y: y2 } as Point
    ];
    return Segment.distanceToPoint(segment, { x: px, y: py } as Point);
  }
);

// Enhanced bounding box calculations
export const calculateBoundingBox = (
  objects: Array<{ x: number; y: number; width?: number; height?: number }>
): Rectangle => {
  if (objects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 } as Rectangle;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.forEach(obj => {
    const left = obj.x;
    const top = obj.y;
    const right = obj.x + (obj.width || 0);
    const bottom = obj.y + (obj.height || 0);

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  } as Rectangle;
};

// Optimized intersection testing
export const intersectsRectangle = (
  rect1: Rectangle,
  rect2: Rectangle
): boolean => {
  return Rectangle.intersects(rect1, rect2);
};

// Enhanced curve calculations for smooth arrows
export const calculateBezierPoint = (
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Point => {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  } as Point;
};

// Optimized angle calculations
export const calculateAngle = (
  from: Point,
  to: Point
): number => {
  return Vector.angle(Vector.subtract(to, from));
};

// Enhanced grid snapping with multiple grid sizes
export const snapToGrid = memoize(
  (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
  }
);

// Throttled viewport calculations for performance
export const throttledViewportUpdate = throttleRAF(
  (
    canvasOffset: { x: number; y: number },
    scale: number,
    canvasWidth: number,
    canvasHeight: number,
    callback: (viewport: Rectangle) => void
  ) => {
    const viewport: Rectangle = {
      x: -canvasOffset.x / scale,
      y: -canvasOffset.y / scale,
      width: canvasWidth / scale,
      height: canvasHeight / scale
    } as Rectangle;
    
    callback(viewport);
  }
);

// Enhanced collision detection for selection
export const isPointInRectangle = (
  point: Point,
  rect: Rectangle
): boolean => {
  return Rectangle.pointInRectangle(point, rect);
};

// Optimized multi-line text measurement
export const calculateTextBounds = memoize(
  (
    text: string,
    fontSize: number,
    lineHeight: number = 1.6,
    measureTextFn: (text: string, fontSize: number) => number
  ): Rectangle => {
    const lines = text.split('\n');
    let maxWidth = 0;
    
    lines.forEach(line => {
      const lineWidth = measureTextFn(line, fontSize);
      maxWidth = Math.max(maxWidth, lineWidth);
    });
    
    const totalHeight = lines.length > 1 
      ? (lines.length - 1) * fontSize * lineHeight + fontSize 
      : fontSize;
    
    return {
      x: 0,
      y: 0,
      width: maxWidth,
      height: totalHeight
    } as Rectangle;
  }
);

// Enhanced coordinate transformations
export const worldToScreen = (
  worldPoint: Point,
  scale: number,
  offset: Point
): Point => {
  return {
    x: worldPoint.x * scale + offset.x,
    y: worldPoint.y * scale + offset.y
  } as Point;
};

export const screenToWorld = (
  screenPoint: Point,
  scale: number,
  offset: Point
): Point => {
  return {
    x: (screenPoint.x - offset.x) / scale,
    y: (screenPoint.y - offset.y) / scale
  } as Point;
};

// Optimized arrow head calculations
export const calculateArrowHead = (
  start: Point,
  end: Point,
  arrowLength: number = 12,
  arrowAngle: number = Math.PI / 6
): [Point, Point] => {
  const angle = calculateAngle(start, end);
  
  const arrowPoint1: Point = {
    x: end.x - arrowLength * Math.cos(angle - arrowAngle),
    y: end.y - arrowLength * Math.sin(angle - arrowAngle)
  };
  
  const arrowPoint2: Point = {
    x: end.x - arrowLength * Math.cos(angle + arrowAngle),
    y: end.y - arrowLength * Math.sin(angle + arrowAngle)
  };
  
  return [arrowPoint1, arrowPoint2];
};