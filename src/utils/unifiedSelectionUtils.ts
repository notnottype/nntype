/**
 * Unified Selection System
 * Integrates select mode selection with regular mouse selection
 */

import { CanvasObjectType, SelectionState } from '../types';
import { 
  getObjectsInSelectionRect,
  createSelectionRect,
  clearSelection,
  addToSelection,
  removeFromSelection,
  moveSelectedObjects
} from './selectionUtils';

export interface UnifiedSelectionState {
  selectedObjects: Set<string>;
  dragArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;
  isDragging: boolean;
  isActive: boolean; // Whether selection is currently active
  dragDelta?: { x: number; y: number } | null; // Current drag offset
  draggedObjectIds?: string[]; // IDs of objects being dragged
  initialPositions?: Map<string, { x: number; y: number }>; // Initial positions before drag
}

export interface SelectionEvent {
  type: 'start' | 'update' | 'end' | 'cancel';
  mode: 'normal' | 'select' | 'additive'; // additive for Cmd+click
  coordinates: {
    screen: { x: number; y: number };
    world: { x: number; y: number };
  };
  modifiers: {
    meta: boolean;
    shift: boolean;
    alt: boolean;
  };
}

/**
 * Unified Selection Handler
 * Handles both select mode and regular mouse selection uniformly
 */
export class UnifiedSelectionHandler {
  private currentState: UnifiedSelectionState;
  private mode: 'normal' | 'select';
  private onStateChange: (state: UnifiedSelectionState) => void;
  private canvasObjects: CanvasObjectType[];
  private measureTextWidth: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number;
  private canvas: HTMLCanvasElement | null;
  private fontLoaded: boolean;
  private dragStartPos: { x: number; y: number } | null = null;
  private draggedObjects: CanvasObjectType[] = [];
  private initialObjectPositions: Map<string, { x: number; y: number }> = new Map();
  private hoveredObject: CanvasObjectType | null = null;
  private pinPosition: { x: number; y: number; worldX: number; worldY: number } | null = null;

  constructor(
    initialState: UnifiedSelectionState,
    mode: 'normal' | 'select',
    onStateChange: (state: UnifiedSelectionState) => void,
    canvasObjects: CanvasObjectType[],
    measureTextWidth: (text: string, fontSize: number, canvas?: HTMLCanvasElement | null, fontLoaded?: boolean) => number,
    canvas: HTMLCanvasElement | null = null,
    fontLoaded: boolean = true,
    hoveredObject: CanvasObjectType | null = null,
    pinPosition: { x: number; y: number; worldX: number; worldY: number } | null = null
  ) {
    this.currentState = { ...initialState };
    this.mode = mode;
    this.onStateChange = onStateChange;
    this.canvasObjects = canvasObjects;
    this.measureTextWidth = measureTextWidth;
    this.canvas = canvas;
    this.fontLoaded = fontLoaded;
    this.hoveredObject = hoveredObject;
    this.pinPosition = pinPosition;
  }

  /**
   * Update handler configuration
   */
  updateConfig(config: {
    mode?: 'normal' | 'select';
    canvasObjects?: CanvasObjectType[];
    canvas?: HTMLCanvasElement | null;
    fontLoaded?: boolean;
    hoveredObject?: CanvasObjectType | null;
    pinPosition?: { x: number; y: number; worldX: number; worldY: number } | null;
  }) {
    if (config.mode) this.mode = config.mode;
    if (config.canvasObjects) this.canvasObjects = config.canvasObjects;
    if (config.canvas) this.canvas = config.canvas;
    if (config.fontLoaded !== undefined) this.fontLoaded = config.fontLoaded;
    if (config.hoveredObject !== undefined) this.hoveredObject = config.hoveredObject;
    if (config.pinPosition !== undefined) this.pinPosition = config.pinPosition;
  }

  /**
   * Handle selection events uniformly
   */
  handleSelectionEvent(event: SelectionEvent): void {
    switch (event.type) {
      case 'start':
        this.handleSelectionStart(event);
        break;
      case 'update':
        this.handleSelectionUpdate(event);
        break;
      case 'end':
        this.handleSelectionEnd(event);
        break;
      case 'cancel':
        this.handleSelectionCancel();
        break;
    }
  }

  private handleSelectionStart(event: SelectionEvent): void {
    const newState = { ...this.currentState };

    // Use mouse position as primary - pin is just visual indicator in select mode
    const checkX = event.coordinates.screen.x;
    const checkY = event.coordinates.screen.y;

    // Check if clicking on an object (both mouse hover and pin hover work the same)
    const clickedObject = this.canvasObjects.find(obj => 
      this.isPointInObject(obj, checkX, checkY)
    );

    // Check if object is hovered (either by mouse or pin position)
    const isObjectHovered = this.hoveredObject && 
      (this.hoveredObject.id === clickedObject?.id || 
       (this.mode === 'select' && this.pinPosition && clickedObject));

    console.log('handleSelectionStart:', {
      clickedObjectId: clickedObject?.id,
      hoveredObjectId: this.hoveredObject?.id,
      isObjectHovered,
      mode: this.mode,
      coordinates: event.coordinates
    });

    if (clickedObject) {
      // Object clicked
      if (event.modifiers.meta) {
        // Multi-select with Cmd/Ctrl
        if (newState.selectedObjects.has(clickedObject.id.toString())) {
          newState.selectedObjects.delete(clickedObject.id.toString());
        } else {
          newState.selectedObjects.add(clickedObject.id.toString());
        }
        console.log('Multi-select toggled:', clickedObject.id);
      } else {
        // Single selection
        if (isObjectHovered) {
          // Object was hovered -> prepare for drag
          if (!newState.selectedObjects.has(clickedObject.id.toString())) {
            newState.selectedObjects.clear();
            newState.selectedObjects.add(clickedObject.id.toString());
          }
          
          // Start drag preparation
          this.dragStartPos = { 
            x: event.coordinates.world.x, 
            y: event.coordinates.world.y 
          };
          
          this.draggedObjects = this.canvasObjects.filter(obj => 
            newState.selectedObjects.has(obj.id.toString())
          );
          
          // Store initial positions
          this.initialObjectPositions.clear();
          const initialPositions = new Map<string, { x: number; y: number }>();
          this.draggedObjects.forEach(obj => {
            const pos = { x: obj.x, y: obj.y };
            this.initialObjectPositions.set(obj.id.toString(), pos);
            initialPositions.set(obj.id.toString(), pos);
          });
          
          newState.isDragging = true;
          newState.draggedObjectIds = this.draggedObjects.map(obj => obj.id.toString());
          newState.initialPositions = initialPositions;
          
          console.log('Starting object drag:', {
            draggedCount: this.draggedObjects.length,
            dragStartPos: this.dragStartPos
          });
        } else {
          // Object not hovered -> just select it
          newState.selectedObjects.clear();
          newState.selectedObjects.add(clickedObject.id.toString());
          console.log('Object selected without hover - no drag');
        }
      }
      
      // Never start area selection when object is clicked
      newState.isActive = false;
      newState.dragArea = null;
      
    } else {
      // No object clicked -> check if we should start area selection
      
      // CRITICAL: Don't start area selection if any object is currently hovered
      if (this.hoveredObject) {
        console.log('Area selection blocked - object is hovered:', this.hoveredObject.id);
        // Just clear selection if not using meta key
        if (!event.modifiers.meta) {
          newState.selectedObjects.clear();
        }
      } else {
        // No object hovered -> start area selection
        if (!event.modifiers.meta) {
          newState.selectedObjects.clear();
        }
        
        newState.dragArea = {
          start: { x: event.coordinates.world.x, y: event.coordinates.world.y },
          end: { x: event.coordinates.world.x, y: event.coordinates.world.y }
        };
        newState.isActive = true;
        console.log('Starting area selection');
      }
    }

    this.currentState = newState;
    this.onStateChange(newState);
  }

  private handleSelectionUpdate(event: SelectionEvent): void {
    const newState = { ...this.currentState };

    if (newState.isDragging && this.dragStartPos && this.draggedObjects.length > 0) {
      // Handle object dragging - calculate delta based on current mouse position
      const deltaX = event.coordinates.world.x - this.dragStartPos.x;
      const deltaY = event.coordinates.world.y - this.dragStartPos.y;
      
      // Store drag delta in state for the hook to handle
      newState.dragDelta = { x: deltaX, y: deltaY };
      
      console.log('Drag update:', {
        worldCoords: event.coordinates.world,
        dragStartPos: this.dragStartPos,
        delta: { x: deltaX, y: deltaY }
      });
      
    } else if (newState.dragArea && newState.isActive && !newState.isDragging) {
      // Only do area selection if we're not dragging objects
      // Update drag area for selection
      newState.dragArea.end = { 
        x: event.coordinates.world.x, 
        y: event.coordinates.world.y 
      };

      // In normal mode, update selection immediately
      // In select mode, only show preview
      if (this.mode === 'normal') {
        const selectionRect = createSelectionRect(
          newState.dragArea.start.x,
          newState.dragArea.start.y,
          newState.dragArea.end.x,
          newState.dragArea.end.y
        );

        const objectsInArea = getObjectsInSelectionRect(
          this.canvasObjects,
          selectionRect,
          this.canvas,
          this.fontLoaded
        );

        newState.selectedObjects.clear();
        objectsInArea.forEach(obj => {
          newState.selectedObjects.add(obj.id.toString());
        });
      }
    } else {
      console.log('No drag update:', {
        isDragging: newState.isDragging,
        hasDragStart: !!this.dragStartPos,
        draggedObjectsCount: this.draggedObjects.length,
        hasArea: !!newState.dragArea,
        isActive: newState.isActive
      });
    }

    this.currentState = newState;
    this.onStateChange(newState);
  }

  private handleSelectionEnd(event: SelectionEvent): void {
    const newState = { ...this.currentState };

    if (newState.isDragging) {
      // Finalize drag operation
      this.dragStartPos = null;
      this.draggedObjects = [];
      this.initialObjectPositions.clear();
      newState.isDragging = false;
      newState.dragDelta = null; // Clear drag delta
      newState.draggedObjectIds = undefined;
      newState.initialPositions = undefined;
      
    } else if (newState.dragArea && newState.isActive) {
      // Finalize area selection
      const selectionRect = createSelectionRect(
        newState.dragArea.start.x,
        newState.dragArea.start.y,
        newState.dragArea.end.x,
        newState.dragArea.end.y
      );

      const objectsInArea = getObjectsInSelectionRect(
        this.canvasObjects,
        selectionRect,
        this.canvas,
        this.fontLoaded
      );

      if (this.mode === 'select' || event.modifiers.meta) {
        // In select mode or with Cmd, add to existing selection
        objectsInArea.forEach(obj => {
          newState.selectedObjects.add(obj.id.toString());
        });
      } else {
        // In normal mode, replace selection
        newState.selectedObjects.clear();
        objectsInArea.forEach(obj => {
          newState.selectedObjects.add(obj.id.toString());
        });
      }

      newState.dragArea = null;
      newState.isActive = false;
    }

    this.currentState = newState;
    this.onStateChange(newState);
  }

  private handleSelectionCancel(): void {
    const newState = { ...this.currentState };
    
    // Reset drag state
    if (newState.isDragging) {
      this.dragStartPos = null;
      this.draggedObjects = [];
      this.initialObjectPositions.clear();
      newState.dragDelta = null;
      newState.draggedObjectIds = undefined;
      newState.initialPositions = undefined;
    }
    
    newState.dragArea = null;
    newState.isActive = false;
    newState.isDragging = false;
    
    this.currentState = newState;
    this.onStateChange(newState);
  }

  /**
   * Manually trigger selection of objects in current drag area
   * Used for Space key activation in select mode
   */
  finalizeSelection(): void {
    if (this.currentState.dragArea) {
      this.handleSelectionEnd({
        type: 'end',
        mode: this.mode,
        coordinates: {
          screen: { x: 0, y: 0 },
          world: this.currentState.dragArea.end
        },
        modifiers: { meta: false, shift: false, alt: false }
      });
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    const newState: UnifiedSelectionState = {
      selectedObjects: new Set(),
      dragArea: null,
      isDragging: false,
      isActive: false
    };
    
    this.currentState = newState;
    this.onStateChange(newState);
  }

  /**
   * Get current selection state
   */
  getState(): UnifiedSelectionState {
    return { ...this.currentState };
  }

  /**
   * Check if point is in object - will be overridden by hook
   */
  private isPointInObject: (obj: CanvasObjectType, screenX: number, screenY: number) => boolean = () => false;
}

/**
 * Convert legacy SelectionState to UnifiedSelectionState
 */
export function convertToUnifiedState(legacyState: SelectionState): UnifiedSelectionState {
  return {
    selectedObjects: new Set(legacyState.selectedObjects),
    dragArea: legacyState.dragArea,
    isDragging: false,
    isActive: !!legacyState.dragArea
  };
}

/**
 * Convert UnifiedSelectionState to legacy SelectionState
 */
export function convertToLegacyState(unifiedState: UnifiedSelectionState): SelectionState {
  return {
    selectedObjects: new Set(unifiedState.selectedObjects),
    dragArea: unifiedState.dragArea
  };
}

/**
 * Create selection event from mouse event
 */
export function createSelectionEventFromMouse(
  type: 'start' | 'update' | 'end' | 'cancel',
  mouseEvent: React.MouseEvent<HTMLCanvasElement>,
  worldCoordinates: { x: number; y: number },
  mode: 'normal' | 'select' = 'normal'
): SelectionEvent {
  const rect = mouseEvent.currentTarget.getBoundingClientRect();
  
  return {
    type,
    mode,
    coordinates: {
      screen: {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
      },
      world: worldCoordinates
    },
    modifiers: {
      meta: mouseEvent.metaKey,
      shift: mouseEvent.shiftKey,
      alt: mouseEvent.altKey
    }
  };
}