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
 * Calculate link endpoints based on object positions
 */
export function calculateLinkEndpoints(
  fromObject: CanvasObjectType,
  toObject: CanvasObjectType
): LinkRenderData {
  if (fromObject.type !== 'text' || toObject.type !== 'text') {
    throw new Error('Links can only be created between text objects');
  }

  // Calculate approximate text bounds
  const fromWidth = fromObject.content.length * 8 * fromObject.scale; // Approximate
  const fromHeight = 20 * fromObject.scale;
  const toWidth = toObject.content.length * 8 * toObject.scale;
  const toHeight = 20 * toObject.scale;

  // Calculate centers
  const fromCenterX = fromObject.x + fromWidth / 2;
  const fromCenterY = fromObject.y + fromHeight / 2;
  const toCenterX = toObject.x + toWidth / 2;
  const toCenterY = toObject.y + toHeight / 2;

  // Calculate direction vector
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return {
      startX: fromCenterX,
      startY: fromCenterY,
      endX: toCenterX,
      endY: toCenterY
    };
  }

  // Normalize direction
  const unitX = dx / distance;
  const unitY = dy / distance;

  // Calculate edge points
  const fromRadius = Math.max(fromWidth, fromHeight) / 2 + 5;
  const toRadius = Math.max(toWidth, toHeight) / 2 + 5;

  const startX = fromCenterX + unitX * fromRadius;
  const startY = fromCenterY + unitY * fromRadius;
  const endX = toCenterX - unitX * toRadius;
  const endY = toCenterY - unitY * toRadius;

  // Use straight lines instead of bezier curves
  return {
    startX,
    startY,
    endX,
    endY
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
  canvasOffset: { x: number; y: number }
) {
  const linkData = calculateLinkEndpoints(fromObject, toObject);
  
  // Convert world coordinates to screen coordinates
  const startX = linkData.startX * scale + canvasOffset.x;
  const startY = linkData.startY * scale + canvasOffset.y;
  const endX = linkData.endX * scale + canvasOffset.x;
  const endY = linkData.endY * scale + canvasOffset.y;

  ctx.save();
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
    drawArrowhead(ctx, startX, startY, endX, endY, 10);
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