/**
 * Selection utilities for multi-object selection and manipulation
 */

import { CanvasObjectType, SelectionState, TextObjectType } from '../types';
import { measureTextWidth } from './index';

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  return x >= rectX && x <= rectX + rectWidth &&
         y >= rectY && y <= rectY + rectHeight;
}

/**
 * Get objects within a selection rectangle
 */
export function getObjectsInSelectionRect(
  objects: CanvasObjectType[],
  selectionRect: { x: number; y: number; width: number; height: number },
  canvas?: HTMLCanvasElement | null,
  fontLoaded?: boolean
): CanvasObjectType[] {
  const { x, y, width, height } = selectionRect;
  const minX = Math.min(x, x + width);
  const maxX = Math.max(x, x + width);
  const minY = Math.min(y, y + height);
  const maxY = Math.max(y, y + height);

  return objects.filter(obj => {
    if (obj.type === 'text') {
      const textObj = obj as TextObjectType;
      const { width: textWidth, height: textHeight } = getTextDimensions(
        textObj, 
        1, // No scale needed for world coordinates
        canvas, 
        fontLoaded
      );
      
      // Adjust Y position for text baseline
      const textY = obj.y - textObj.fontSize;
      
      return isRectIntersecting(
        obj.x, textY, textWidth, textHeight,
        minX, minY, maxX - minX, maxY - minY
      );
    }
    
    if (obj.type === 'a4guide') {
      return isRectIntersecting(
        obj.x, obj.y, obj.width, obj.height,
        minX, minY, maxX - minX, maxY - minY
      );
    }
    
    return false;
  });
}

/**
 * Check if two rectangles intersect
 */
function isRectIntersecting(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
}

/**
 * Create selection rectangle from two points
 */
export function createSelectionRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  return { x, y, width, height };
}

/**
 * Render selection rectangle
 */
export function renderSelectionRect(
  ctx: CanvasRenderingContext2D,
  selectionRect: { x: number; y: number; width: number; height: number },
  scale: number,
  canvasOffset: { x: number; y: number }
) {
  const screenX = selectionRect.x * scale + canvasOffset.x;
  const screenY = selectionRect.y * scale + canvasOffset.y;
  const screenWidth = selectionRect.width * scale;
  const screenHeight = selectionRect.height * scale;

  ctx.save();
  ctx.strokeStyle = '#4a9eff';
  ctx.fillStyle = 'rgba(74, 158, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  // Fill selection area
  ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
  
  // Draw selection border
  ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

  ctx.restore();
}

/**
 * Get accurate text dimensions for a text object
 */
function getTextDimensions(
  textObj: TextObjectType,
  scale: number,
  canvas?: HTMLCanvasElement | null,
  fontLoaded?: boolean
): { width: number; height: number } {
  const lines = textObj.content.split('\n');
  const fontSize = textObj.fontSize * textObj.scale * scale;
  const lineHeight = fontSize * 1.6;
  
  // Calculate accurate width using measureTextWidth
  let maxWidth = 0;
  if (canvas && fontLoaded) {
    for (const line of lines) {
      const lineWidth = measureTextWidth(line, fontSize, canvas, fontLoaded);
      maxWidth = Math.max(maxWidth, lineWidth);
    }
  } else {
    // Fallback to approximation if canvas/font not available
    maxWidth = Math.max(...lines.map(line => line.length)) * fontSize * 0.6;
  }
  
  // Calculate accurate height: (lines-1) * lineHeight + fontSize
  const totalHeight = lines.length > 1 
    ? (lines.length - 1) * lineHeight + fontSize
    : fontSize;
  
  return { width: maxWidth, height: totalHeight };
}

/**
 * Render selection highlights for selected objects
 */
export function renderSelectionHighlights(
  ctx: CanvasRenderingContext2D,
  objects: CanvasObjectType[],
  selectedIds: Set<string>,
  scale: number,
  canvasOffset: { x: number; y: number },
  canvas?: HTMLCanvasElement | null,
  fontLoaded?: boolean
) {
  ctx.save();
  ctx.strokeStyle = '#4a9eff';
  ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
  ctx.lineWidth = 2;

  objects.forEach(obj => {
    if (selectedIds.has(obj.id.toString())) {
      const screenX = obj.x * scale + canvasOffset.x;
      const screenY = obj.y * scale + canvasOffset.y;

      if (obj.type === 'text') {
        const textObj = obj as TextObjectType;
        const { width: textWidth, height: textHeight } = getTextDimensions(
          textObj, 
          scale, 
          canvas, 
          fontLoaded
        );
        
        // Adjust Y position for text baseline
        const adjustedY = screenY - textObj.fontSize * textObj.scale * scale;
        
        // Highlight background
        ctx.fillRect(screenX - 5, adjustedY - 5, textWidth + 10, textHeight + 10);
        
        // Highlight border
        ctx.strokeRect(screenX - 5, adjustedY - 5, textWidth + 10, textHeight + 10);
      } else if (obj.type === 'a4guide') {
        const screenWidth = obj.width * scale;
        const screenHeight = obj.height * scale;
        
        // Highlight background
        ctx.fillRect(screenX - 2, screenY - 2, screenWidth + 4, screenHeight + 4);
        
        // Highlight border
        ctx.strokeRect(screenX - 2, screenY - 2, screenWidth + 4, screenHeight + 4);
      }
    }
  });

  ctx.restore();
}

/**
 * Add object to selection
 */
export function addToSelection(
  selectionState: SelectionState,
  objectId: string
): SelectionState {
  const newSelectedObjects = new Set(selectionState.selectedObjects);
  newSelectedObjects.add(objectId);
  
  return {
    ...selectionState,
    selectedObjects: newSelectedObjects
  };
}

/**
 * Remove object from selection
 */
export function removeFromSelection(
  selectionState: SelectionState,
  objectId: string
): SelectionState {
  const newSelectedObjects = new Set(selectionState.selectedObjects);
  newSelectedObjects.delete(objectId);
  
  return {
    ...selectionState,
    selectedObjects: newSelectedObjects
  };
}

/**
 * Clear all selections
 */
export function clearSelection(selectionState: SelectionState): SelectionState {
  return {
    ...selectionState,
    selectedObjects: new Set(),
    dragArea: null
  };
}

/**
 * Toggle object selection
 */
export function toggleSelection(
  selectionState: SelectionState,
  objectId: string
): SelectionState {
  if (selectionState.selectedObjects.has(objectId)) {
    return removeFromSelection(selectionState, objectId);
  } else {
    return addToSelection(selectionState, objectId);
  }
}

/**
 * Select multiple objects
 */
export function selectMultipleObjects(
  selectionState: SelectionState,
  objectIds: string[]
): SelectionState {
  const newSelectedObjects = new Set(selectionState.selectedObjects);
  objectIds.forEach(id => newSelectedObjects.add(id));
  
  return {
    ...selectionState,
    selectedObjects: newSelectedObjects
  };
}

/**
 * Get selection bounds (for group operations)
 */
export function getSelectionBounds(
  objects: CanvasObjectType[],
  selectedIds: Set<string>,
  canvas?: HTMLCanvasElement | null,
  fontLoaded?: boolean
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const selectedObjects = objects.filter(obj => selectedIds.has(obj.id.toString()));
  
  if (selectedObjects.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedObjects.forEach(obj => {
    let objMinX = obj.x;
    let objMinY = obj.y;
    let objMaxX = obj.x;
    let objMaxY = obj.y;

    if (obj.type === 'text') {
      const textObj = obj as TextObjectType;
      const { width: textWidth, height: textHeight } = getTextDimensions(
        textObj, 
        1, // No scale needed for world coordinates
        canvas, 
        fontLoaded
      );
      
      // Adjust Y position for text baseline
      objMinY = obj.y - textObj.fontSize;
      objMaxX += textWidth;
      objMaxY = objMinY + textHeight;
    } else if (obj.type === 'a4guide') {
      objMaxX += obj.width;
      objMaxY += obj.height;
    }

    minX = Math.min(minX, objMinX);
    minY = Math.min(minY, objMinY);
    maxX = Math.max(maxX, objMaxX);
    maxY = Math.max(maxY, objMaxY);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Move selected objects
 */
export function moveSelectedObjects(
  objects: CanvasObjectType[],
  selectedIds: Set<string>,
  deltaX: number,
  deltaY: number
): CanvasObjectType[] {
  return objects.map(obj => {
    if (selectedIds.has(obj.id.toString())) {
      return {
        ...obj,
        x: obj.x + deltaX,
        y: obj.y + deltaY
      };
    }
    return obj;
  });
}

/**
 * Check if any object is selected
 */
export function hasSelection(selectionState: SelectionState): boolean {
  return selectionState.selectedObjects.size > 0;
}

/**
 * Get count of selected objects
 */
export function getSelectionCount(selectionState: SelectionState): number {
  return selectionState.selectedObjects.size;
}