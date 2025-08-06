/**
 * Link utilities for connecting and rendering text objects
 */

import { LinkObjectType, CanvasObjectType, PinPosition } from '../types';

export interface LinkRenderData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlPoint1?: { x: number; y: number };
  controlPoint2?: { x: number; y: number };
}

/**
 * Calculate text object bounds
 */
function getTextObjectBounds(textObj: CanvasObjectType, measureTextWidth?: (text: string, fontSize: number) => number) {
  if (textObj.type !== 'text') {
    throw new Error('Object must be a text object');
  }

  const lines = textObj.content.split('\n');
  const fontSize = textObj.fontSize * textObj.scale;
  const lineHeight = fontSize * 1.6;
  
  let width: number;
  if (measureTextWidth) {
    // Use accurate text measurement if available
    const maxWidth = Math.max(...lines.map(line => measureTextWidth(line, fontSize)));
    width = maxWidth;
  } else {
    // Fallback to approximation
    const approximateCharWidth = fontSize * 0.6;
    const maxLineLength = Math.max(...lines.map(line => line.length));
    width = maxLineLength * approximateCharWidth;
  }
  
  // Calculate accurate height: (lines-1) * lineHeight + fontSize
  const height = lines.length > 1 
    ? (lines.length - 1) * lineHeight + fontSize
    : fontSize;

  // textObj.y is the baseline, so we need to adjust for proper bounds
  const top = textObj.y - fontSize; // Move up by fontSize to get the actual top
  const bottom = textObj.y + (height - fontSize); // Adjust bottom accordingly
  
  return {
    left: textObj.x,
    right: textObj.x + width,
    top: top,
    bottom: bottom,
    centerX: textObj.x + width / 2,
    centerY: top + height / 2, // Center Y based on actual top
    width,
    height
  };
}

/**
 * Get all edge midpoints of a bounding box
 */
function getEdgeMidpoints(bounds: ReturnType<typeof getTextObjectBounds>): Array<{ x: number; y: number; edge: string }> {
  const padding = 8; // Padding to avoid text overlap
  
  return [
    { x: bounds.left - padding, y: bounds.centerY, edge: 'left' },       // Left edge midpoint
    { x: bounds.right + padding, y: bounds.centerY, edge: 'right' },     // Right edge midpoint  
    { x: bounds.centerX, y: bounds.top - padding, edge: 'top' },         // Top edge midpoint
    { x: bounds.centerX, y: bounds.bottom + padding, edge: 'bottom' }    // Bottom edge midpoint
  ];
}

/**
 * Calculate distance between two points
 */
function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find the optimal connection points between two objects
 * Uses minimum distance between all possible edge midpoint combinations
 */
function getBestConnectionPoints(
  fromBounds: ReturnType<typeof getTextObjectBounds>,
  toBounds: ReturnType<typeof getTextObjectBounds>
): { start: { x: number; y: number }, end: { x: number; y: number } } {
  const fromMidpoints = getEdgeMidpoints(fromBounds);
  const toMidpoints = getEdgeMidpoints(toBounds);

  let minDistance = Infinity;
  let bestStartPoint = fromMidpoints[0];
  let bestEndPoint = toMidpoints[0];

  // Find the combination with minimum distance
  for (const startPoint of fromMidpoints) {
    for (const endPoint of toMidpoints) {
      const distance = calculateDistance(startPoint, endPoint);
      if (distance < minDistance) {
        minDistance = distance;
        bestStartPoint = startPoint;
        bestEndPoint = endPoint;
      }
    }
  }

  return {
    start: { x: bestStartPoint.x, y: bestStartPoint.y },
    end: { x: bestEndPoint.x, y: bestEndPoint.y }
  };
}

/**
 * Legacy function - kept for backward compatibility with preview calculations
 */
function getBestConnectionPoint(
  fromBounds: ReturnType<typeof getTextObjectBounds>,
  toBounds: ReturnType<typeof getTextObjectBounds>,
  isSource: boolean
): { x: number; y: number } {
  const connectionPoints = getBestConnectionPoints(fromBounds, toBounds);
  return isSource ? connectionPoints.start : connectionPoints.end;
}

/**
 * Calculate link endpoints based on object positions
 */
export function calculateLinkEndpoints(
  fromObject: CanvasObjectType,
  toObject: CanvasObjectType,
  measureTextWidth?: (text: string, fontSize: number) => number
): LinkRenderData {
  if (fromObject.type !== 'text' || toObject.type !== 'text') {
    throw new Error('Links can only be created between text objects');
  }

  const fromBounds = getTextObjectBounds(fromObject, measureTextWidth);
  const toBounds = getTextObjectBounds(toObject, measureTextWidth);

  // Check for overlapping objects
  const isOverlapping = !(
    fromBounds.right < toBounds.left ||
    fromBounds.left > toBounds.right ||
    fromBounds.bottom < toBounds.top ||
    fromBounds.top > toBounds.bottom
  );

  if (isOverlapping) {
    // For overlapping objects, use centers with small offset
    return {
      startX: fromBounds.centerX,
      startY: fromBounds.centerY - 5,
      endX: toBounds.centerX,
      endY: toBounds.centerY + 5
    };
  }

  // Calculate optimal connection points using minimum distance algorithm
  const connectionPoints = getBestConnectionPoints(fromBounds, toBounds);

  return {
    startX: connectionPoints.start.x,
    startY: connectionPoints.start.y,
    endX: connectionPoints.end.x,
    endY: connectionPoints.end.y
  };
}

/**
 * Render a link on canvas context
 */
export function renderLink(
  ctx: CanvasRenderingContext2D,
  link: LinkObjectType,
  fromObject: CanvasObjectType,
  toObject: CanvasObjectType,
  scale: number,
  canvasOffset: { x: number; y: number },
  isSelected: boolean = false,
  isHovered: boolean = false,
  measureTextWidth?: (text: string, fontSize: number) => number
) {
  const linkData = calculateLinkEndpoints(fromObject, toObject, measureTextWidth);
  
  // Convert world coordinates to screen coordinates
  const startX = linkData.startX * scale + canvasOffset.x;
  const startY = linkData.startY * scale + canvasOffset.y;
  const endX = linkData.endX * scale + canvasOffset.x;
  const endY = linkData.endY * scale + canvasOffset.y;

  ctx.save();
  
  // Selection and hover highlighting
  if (isSelected || isHovered) {
    ctx.strokeStyle = isSelected ? '#007bff' : '#666666';
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.globalAlpha = 0.7;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;
  }
  
  // Main link
  ctx.strokeStyle = link.color;
  ctx.lineWidth = 2;
  
  // Set line style
  if (link.style === 'dashed') {
    ctx.setLineDash([5, 5]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  
  // Always draw straight line
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  
  ctx.stroke();

  // Draw arrowhead for arrow style
  if (link.style === 'arrow') {
    ctx.fillStyle = link.color;
    drawArrowhead(ctx, startX, startY, endX, endY, 10);
  }

  // Draw selection handles for selected links
  if (isSelected) {
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    ctx.fillStyle = '#007bff';
    ctx.beginPath();
    ctx.arc(midX, midY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw small handles at endpoints
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(startX, startY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(endX, endY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw arrowhead at the end of a line
 */
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(toX, toY);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size / 2);
  ctx.lineTo(-size, size / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Render link preview during creation
 */
export function renderLinkPreview(
  ctx: CanvasRenderingContext2D,
  from: PinPosition,
  to: PinPosition,
  scale: number,
  canvasOffset: { x: number; y: number }
) {
  const startX = from.worldX * scale + canvasOffset.x;
  const startY = from.worldY * scale + canvasOffset.y;
  const endX = to.worldX * scale + canvasOffset.x;
  const endY = to.worldY * scale + canvasOffset.y;

  ctx.save();
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.globalAlpha = 0.7;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw preview arrowhead
  drawArrowhead(ctx, startX, startY, endX, endY, 8);

  ctx.restore();
}

/**
 * Calculate optimal connection point for link preview
 * This creates a temporary text object for calculations
 */
export function calculatePreviewConnectionPoint(
  sourceObject: CanvasObjectType,
  targetWorldPos: { x: number; y: number },
  measureTextWidth?: (text: string, fontSize: number) => number
): { x: number; y: number } {
  if (sourceObject.type !== 'text') {
    return { x: sourceObject.x, y: sourceObject.y };
  }

  const sourceBounds = getTextObjectBounds(sourceObject, measureTextWidth);
  
  // Create a fake target bounds at the cursor position
  const targetBounds = {
    left: targetWorldPos.x - 5,
    right: targetWorldPos.x + 5,
    top: targetWorldPos.y - 5,
    bottom: targetWorldPos.y + 5,
    centerX: targetWorldPos.x,
    centerY: targetWorldPos.y,
    width: 10,
    height: 10
  };

  // Use the optimized connection point calculation but with proper bounds
  return getBestConnectionPoint(sourceBounds, targetBounds, true);
}

/**
 * Get link by ID
 */
export function getLinkById(links: LinkObjectType[], linkId: string): LinkObjectType | null {
  return links.find(link => link.id === linkId) || null;
}

/**
 * Update link color
 */
export function updateLinkColor(links: LinkObjectType[], linkId: string, color: string): LinkObjectType[] {
  return links.map(link => 
    link.id === linkId ? { ...link, color } : link
  );
}

/**
 * Update link style
 */
export function updateLinkStyle(
  links: LinkObjectType[], 
  linkId: string, 
  style: 'arrow' | 'line' | 'dashed'
): LinkObjectType[] {
  return links.map(link => 
    link.id === linkId ? { ...link, style } : link
  );
}

/**
 * Remove link by ID
 */
export function removeLink(links: LinkObjectType[], linkId: string): LinkObjectType[] {
  return links.filter(link => link.id !== linkId);
}

/**
 * Get all objects that have links
 */
export function getLinkedObjectIds(links: LinkObjectType[]): Set<string> {
  const linkedIds = new Set<string>();
  links.forEach(link => {
    linkedIds.add(link.from);
    linkedIds.add(link.to);
  });
  return linkedIds;
}

/**
 * Check if a point is near a link line for selection
 */
export function isPointOnLink(
  point: { x: number; y: number },
  link: LinkObjectType,
  fromObject: CanvasObjectType,
  toObject: CanvasObjectType,
  tolerance: number = 10,
  measureTextWidth?: (text: string, fontSize: number) => number
): boolean {
  if (fromObject.type !== 'text' || toObject.type !== 'text') {
    return false;
  }

  const linkData = calculateLinkEndpoints(fromObject, toObject, measureTextWidth);
  
  // Calculate distance from point to line segment
  const distance = distancePointToLine(
    point.x, point.y,
    linkData.startX, linkData.startY,
    linkData.endX, linkData.endY
  );

  return distance <= tolerance;
}

/**
 * Calculate distance from point to line segment
 */
function distancePointToLine(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line is a point
    return Math.sqrt(A * A + B * B);
  }

  let param = dot / lenSq;

  // Clamp to line segment
  if (param < 0) {
    param = 0;
  } else if (param > 1) {
    param = 1;
  }

  const xx = x1 + param * C;
  const yy = y1 + param * D;

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find link at given world coordinates
 */
export function findLinkAtPosition(
  worldPos: { x: number; y: number },
  links: LinkObjectType[],
  canvasObjects: CanvasObjectType[],
  tolerance: number = 10,
  measureTextWidth?: (text: string, fontSize: number) => number
): LinkObjectType | null {
  for (const link of links) {
    const fromObject = canvasObjects.find(obj => obj.id.toString() === link.from);
    const toObject = canvasObjects.find(obj => obj.id.toString() === link.to);

    if (fromObject && toObject && isPointOnLink(worldPos, link, fromObject, toObject, tolerance, measureTextWidth)) {
      return link;
    }
  }

  return null;
}
