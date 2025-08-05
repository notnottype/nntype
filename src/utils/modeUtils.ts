/**
 * Mode management utilities for multi-mode canvas interaction system
 */

import { CanvasModeType, PinPosition, LinkState, SelectionState, CanvasObjectType, LinkObjectType } from '../types';

export const CANVAS_MODES: CanvasModeType[] = ['typography', 'link', 'select'];

/**
 * Get the next mode in the cycle
 */
export function getNextMode(currentMode: CanvasModeType): CanvasModeType {
  const currentIndex = CANVAS_MODES.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % CANVAS_MODES.length;
  return CANVAS_MODES[nextIndex];
}

/**
 * Get mode display properties for UI feedback
 */
export function getModeDisplayProperties(mode: CanvasModeType, theme: 'light' | 'dark' = 'light') {
  // Define border colors for each mode
  const getBorderColor = (theme: 'light' | 'dark') => {
    switch (mode) {
      case 'typography':
        return theme === 'dark' ? '#4b5563' : '#d1d5db'; // Default input border color
      case 'link':
        return '#ff6b6b'; // Red for link mode
      case 'select':
        return '#4a9eff'; // Blue for select mode
    }
  };

  switch (mode) {
    case 'typography':
      return {
        icon: '',
        borderColor: getBorderColor(theme),
        placeholder: 'Type your text...',
        description: 'Typography Mode - Enter text and create content'
      };
    case 'link':
      return {
        icon: '→',
        borderColor: getBorderColor(theme),
        placeholder: 'Navigate with Shift+arrows, Space to link',
        description: 'Link Mode - Connect text objects with arrows'
      };
    case 'select':
      return {
        icon: '■',
        borderColor: getBorderColor(theme),
        placeholder: 'Shift+arrows to select, Ctrl+Shift+arrows to move',
        description: 'Select Mode - Multi-select and batch operations'
      };
  }
}

/**
 * Initialize pin position
 */
export function createInitialPinPosition(): PinPosition {
  return {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0
  };
}

/**
 * Position pin at input box top-left corner
 */
export function positionPinAtInputBox(
  typewriterX: number,
  typewriterY: number,
  textBoxWidth: number,
  baseFontSize: number,
  canvasOffset: { x: number; y: number },
  scale: number
): PinPosition {
  // Calculate top-left corner of input box, slightly offset to right and up
  const inputBoxLeft = typewriterX - textBoxWidth / 2;
  const inputBoxTop = typewriterY - baseFontSize / 2 - 25;
  
  return {
    x: inputBoxLeft,
    y: inputBoxTop,
    worldX: (inputBoxLeft - canvasOffset.x) / scale,
    worldY: (inputBoxTop - canvasOffset.y) / scale
  };
}

/**
 * Initialize link state
 */
export function createInitialLinkState(): LinkState {
  return {
    sourceObjectId: null,
    targetObjectId: null,
    isCreating: false,
    previewPath: null
  };
}

/**
 * Initialize selection state
 */
export function createInitialSelectionState(): SelectionState {
  return {
    selectedObjects: new Set<string>(),
    dragArea: null
  };
}

/**
 * Update pin position with coordinate conversion
 */
export function updatePinPosition(
  currentPin: PinPosition,
  deltaX: number,
  deltaY: number,
  canvasOffset: { x: number; y: number },
  scale: number
): PinPosition {
  const newX = currentPin.x + deltaX;
  const newY = currentPin.y + deltaY;
  
  return {
    x: newX,
    y: newY,
    worldX: (newX - canvasOffset.x) / scale,
    worldY: (newY - canvasOffset.y) / scale
  };
}

/**
 * Find object at pin position
 */
export function findObjectAtPin(
  objects: CanvasObjectType[],
  pinPosition: PinPosition,
  tolerance: number = 20,
  measureTextFn?: (text: string, fontSize: number) => number
): CanvasObjectType | null {
  const { worldX, worldY } = pinPosition;
  
  // Check text objects first (they have priority)
  for (const obj of objects) {
    if (obj.type === 'text') {
      const lineHeight = obj.fontSize * 1.6;
      
      // Handle multiline text
      const lines = obj.content.split('\n');
      let maxWidth = 0;
      
      if (measureTextFn) {
        // Use accurate text measurement when available
        lines.forEach(line => {
          const lineWidth = measureTextFn(line, obj.fontSize) * obj.scale;
          maxWidth = Math.max(maxWidth, lineWidth);
        });
      } else {
        // Fallback to approximate measurement
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const approximateCharWidth = obj.fontSize * 0.6;
        maxWidth = maxLineLength * approximateCharWidth * obj.scale;
      }
      
      const textHeight = lines.length * lineHeight * obj.scale;
      
      const objLeft = obj.x;
      const objTop = obj.y - obj.fontSize; // Adjust for baseline
      const objRight = obj.x + maxWidth;
      const objBottom = obj.y + textHeight - obj.fontSize;
      
      if (worldX >= objLeft - tolerance && 
          worldX <= objRight + tolerance &&
          worldY >= objTop - tolerance && 
          worldY <= objBottom + tolerance) {
        return obj;
      }
    }
  }
  
  return null;
}

/**
 * Create a new link between objects
 */
export function createLink(
  fromObjectId: string,
  toObjectId: string,
  style: 'arrow' | 'line' | 'dashed' = 'arrow',
  color: string = '#666666'
): LinkObjectType {
  return {
    id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'link',
    from: fromObjectId,
    to: toObjectId,
    style,
    color
  };
}

/**
 * Check if two objects are already linked
 */
export function areObjectsLinked(
  fromId: string,
  toId: string,
  links: LinkObjectType[]
): boolean {
  return links.some(link => 
    (link.from === fromId && link.to === toId) ||
    (link.from === toId && link.to === fromId)
  );
}

/**
 * Get all links connected to an object
 */
export function getObjectLinks(
  objectId: string,
  links: LinkObjectType[]
): LinkObjectType[] {
  return links.filter(link => 
    link.from === objectId || link.to === objectId
  );
}

/**
 * Remove links associated with deleted objects
 */
export function cleanupOrphanedLinks(
  links: LinkObjectType[],
  validObjectIds: Set<string>
): LinkObjectType[] {
  return links.filter(link => 
    validObjectIds.has(link.from) && validObjectIds.has(link.to)
  );
}

/**
 * Check if objects are within selection area
 */
export function getObjectsInArea(
  objects: CanvasObjectType[],
  startX: number,
  startY: number,
  endX: number,
  endY: number
): CanvasObjectType[] {
  const minX = Math.min(startX, endX);
  const maxX = Math.max(startX, endX);
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);
  
  return objects.filter(obj => {
    if (obj.type === 'text') {
      // Check if text object center is within selection area
      const centerX = obj.x + 100; // Approximate center
      const centerY = obj.y + 15;
      
      return centerX >= minX && centerX <= maxX &&
             centerY >= minY && centerY <= maxY;
    }
    
    if (obj.type === 'a4guide') {
      // Check if A4 guide overlaps with selection area
      return !(obj.x + obj.width < minX || 
               obj.x > maxX ||
               obj.y + obj.height < minY ||
               obj.y > maxY);
    }
    
    return false;
  });
}

/**
 * Move multiple objects by delta
 */
export function moveObjects(
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