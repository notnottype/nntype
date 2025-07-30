import { LinkObjectType, CurveType, ArrowStyle } from '../types';
import { BezierCurveRenderer, Point } from './curveRenderer';

/**
 * Curve editing system for interactive link manipulation
 */
export class CurveEditor {
  private static readonly CONTROL_POINT_RADIUS = 6;
  private static readonly CONTROL_POINT_HOVER_RADIUS = 8;

  /**
   * Check if a point is near a control point (for mouse interaction)
   */
  static isPointNearControlPoint(
    mousePos: Point,
    controlPoint: Point,
    worldToScreen: (x: number, y: number) => Point,
    scale: number
  ): boolean {
    const screenControlPoint = worldToScreen(controlPoint.x, controlPoint.y);
    const distance = Math.sqrt(
      Math.pow(mousePos.x - screenControlPoint.x, 2) +
      Math.pow(mousePos.y - screenControlPoint.y, 2)
    );
    
    return distance <= this.CONTROL_POINT_HOVER_RADIUS * scale;
  }

  /**
   * Get the control point index that the mouse is hovering over
   */
  static getHoveredControlPointIndex(
    mousePos: Point,
    link: LinkObjectType,
    worldToScreen: (x: number, y: number) => Point,
    scale: number
  ): number | null {
    for (let i = 0; i < link.controlPoints.length; i++) {
      if (this.isPointNearControlPoint(mousePos, link.controlPoints[i], worldToScreen, scale)) {
        return i;
      }
    }
    return null;
  }

  /**
   * Add a new control point at the specified position
   */
  static addControlPoint(
    link: LinkObjectType,
    newPoint: Point,
    insertIndex?: number
  ): LinkObjectType {
    const controlPoints = [...link.controlPoints];
    
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= controlPoints.length) {
      controlPoints.splice(insertIndex, 0, newPoint);
    } else {
      // Find the best position to insert the new control point
      const bestIndex = this.findBestInsertPosition(link, newPoint);
      controlPoints.splice(bestIndex, 0, newPoint);
    }

    return {
      ...link,
      controlPoints
    };
  }

  /**
   * Remove a control point at the specified index
   */
  static removeControlPoint(link: LinkObjectType, index: number): LinkObjectType {
    if (index < 0 || index >= link.controlPoints.length) {
      return link;
    }

    const controlPoints = [...link.controlPoints];
    controlPoints.splice(index, 1);

    return {
      ...link,
      controlPoints
    };
  }

  /**
   * Move a control point to a new position
   */
  static moveControlPoint(
    link: LinkObjectType,
    index: number,
    newPosition: Point
  ): LinkObjectType {
    if (index < 0 || index >= link.controlPoints.length) {
      return link;
    }

    const controlPoints = [...link.controlPoints];
    controlPoints[index] = newPosition;

    return {
      ...link,
      controlPoints
    };
  }

  /**
   * Find the best position to insert a new control point
   * This is done by finding the closest point on the curve
   */
  private static findBestInsertPosition(link: LinkObjectType, newPoint: Point): number {
    if (link.controlPoints.length === 0) {
      return 0;
    }

    const curvePoints = BezierCurveRenderer.generateSmoothCurve(
      link.curve.startPoint,
      link.controlPoints,
      link.curve.endPoint,
      link.curve.type
    );

    let minDistance = Infinity;
    let bestSegment = 0;

    // Find the closest segment on the curve
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const distance = this.distanceToLineSegment(
        newPoint,
        curvePoints[i],
        curvePoints[i + 1]
      );

      if (distance < minDistance) {
        minDistance = distance;
        bestSegment = i;
      }
    }

    // Convert curve segment index to control point insertion index
    const segmentRatio = bestSegment / (curvePoints.length - 1);
    const insertIndex = Math.floor(segmentRatio * (link.controlPoints.length + 1));

    return Math.max(0, Math.min(insertIndex, link.controlPoints.length));
  }

  /**
   * Calculate distance from a point to a line segment
   */
  private static distanceToLineSegment(point: Point, segmentStart: Point, segmentEnd: Point): number {
    const dx = segmentEnd.x - segmentStart.x;
    const dy = segmentEnd.y - segmentStart.y;

    if (dx === 0 && dy === 0) {
      // Segment is a point
      const distance = Math.sqrt(
        Math.pow(point.x - segmentStart.x, 2) + Math.pow(point.y - segmentStart.y, 2)
      );
      return distance;
    }

    const t = Math.max(0, Math.min(1,
      ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / (dx * dx + dy * dy)
    ));

    const projection = {
      x: segmentStart.x + t * dx,
      y: segmentStart.y + t * dy
    };

    return Math.sqrt(
      Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2)
    );
  }

  /**
   * Draw control points for editing
   */
  static drawControlPoints(
    ctx: CanvasRenderingContext2D,
    link: LinkObjectType,
    worldToScreen: (x: number, y: number) => Point,
    scale: number,
    hoveredIndex: number | null = null,
    selectedIndex: number | null = null,
    theme: 'light' | 'dark' = 'light'
  ): void {
    const controlPointColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
    const hoveredColor = theme === 'dark' ? '#93c5fd' : '#1d4ed8';
    const selectedColor = theme === 'dark' ? '#fbbf24' : '#f59e0b';

    link.controlPoints.forEach((controlPoint, index) => {
      const screenPoint = worldToScreen(controlPoint.x, controlPoint.y);
      const radius = this.CONTROL_POINT_RADIUS * scale;

      ctx.save();

      // Determine color based on state
      let fillColor = controlPointColor;
      if (selectedIndex === index) {
        fillColor = selectedColor;
      } else if (hoveredIndex === index) {
        fillColor = hoveredColor;
      }

      // Draw control point
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = theme === 'dark' ? '#1f2937' : '#ffffff';
      ctx.lineWidth = 2 * scale;

      ctx.beginPath();
      ctx.arc(screenPoint.x, screenPoint.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });
  }

  /**
   * Generate a preview curve while dragging
   */
  static generatePreviewCurve(
    link: LinkObjectType,
    draggedIndex: number,
    draggedPosition: Point
  ): Point[] {
    const tempControlPoints = [...link.controlPoints];
    tempControlPoints[draggedIndex] = draggedPosition;

    return BezierCurveRenderer.generateSmoothCurve(
      link.curve.startPoint,
      tempControlPoints,
      link.curve.endPoint,
      link.curve.type
    );
  }

  /**
   * Check if a point is on the curve (for adding new control points)
   */
  static isPointOnCurve(
    mousePos: Point,
    link: LinkObjectType,
    worldToScreen: (x: number, y: number) => Point,
    screenToWorld: (x: number, y: number) => Point,
    scale: number,
    tolerance: number = 10
  ): { isOnCurve: boolean; insertIndex?: number } {
    const worldMousePos = screenToWorld(mousePos.x, mousePos.y);
    
    const curvePoints = BezierCurveRenderer.generateSmoothCurve(
      link.curve.startPoint,
      link.controlPoints,
      link.curve.endPoint,
      link.curve.type
    );

    let minDistance = Infinity;
    let bestSegmentIndex = -1;

    for (let i = 0; i < curvePoints.length - 1; i++) {
      const distance = this.distanceToLineSegment(
        worldMousePos,
        curvePoints[i],
        curvePoints[i + 1]
      );

      if (distance < minDistance) {
        minDistance = distance;
        bestSegmentIndex = i;
      }
    }

    const isOnCurve = minDistance * Math.max(1, 1 / scale) <= tolerance;
    
    if (isOnCurve) {
      const segmentRatio = bestSegmentIndex / (curvePoints.length - 1);
      const insertIndex = Math.floor(segmentRatio * (link.controlPoints.length + 1));
      return { isOnCurve: true, insertIndex };
    }

    return { isOnCurve: false };
  }

  /**
   * Update curve type
   */
  static changeCurveType(link: LinkObjectType, newType: CurveType): LinkObjectType {
    return {
      ...link,
      curve: {
        ...link.curve,
        type: newType
      }
    };
  }

  /**
   * Update arrow style
   */
  static changeArrowStyle(link: LinkObjectType, newStyle: ArrowStyle): LinkObjectType {
    return {
      ...link,
      style: {
        ...link.style,
        arrowStyle: newStyle
      }
    };
  }
}