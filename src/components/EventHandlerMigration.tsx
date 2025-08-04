/**
 * Migration component to gradually integrate enhanced event handling
 * This allows for safe testing and rollback of the new event system
 */

import React, { useState, useEffect } from 'react';
import { CanvasContainer } from './CanvasContainer';
import { EnhancedCanvasContainer } from './EnhancedCanvasContainer';
import { CanvasObjectType, AIState, SelectionRectangle } from '../types';

interface EventHandlerMigrationProps {
  // All the props that would go to either container
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasWidth: number;
  canvasHeight: number;
  isSpacePressed: boolean;
  hoveredObject: CanvasObjectType | null;
  isMouseInTextBox: boolean;
  theme: 'light' | 'dark';
  
  // Canvas state
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  selectedObjects: CanvasObjectType[];
  scale: number;
  canvasOffset: { x: number; y: number };
  baseFontSize: number;
  baseFontSizePt: number;
  fontLoaded: boolean;
  selectionRect: SelectionRectangle | null;
  
  // State setters
  setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setSelectedObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setCanvasOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setBaseFontSize: React.Dispatch<React.SetStateAction<number>>;
  setBaseFontSizePt: React.Dispatch<React.SetStateAction<number>>;
  setDragPreviewObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectionRect: React.Dispatch<React.SetStateAction<SelectionRectangle | null>>;
  setHoveredObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setMousePosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsMouseInTextBox: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Legacy event handlers (for backwards compatibility)
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onWheel?: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  
  // Enhanced event callbacks
  onDoubleClick?: (worldX: number, worldY: number) => void;
  onContextMenu?: (worldX: number, worldY: number, object?: CanvasObjectType) => void;
  
  // All other props that both containers need
  showTextBox: boolean;
  currentTypingText: string;
  typewriterX: number;
  typewriterY: number;
  maxCharsPerLine: number;
  undoStack: any[];
  redoStack: any[];
  aiState: AIState;
  getTextBoxWidth: () => number;
  getCurrentLineHeight: (selectedObject: any, baseFontSize: number, scale: number) => number;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleCompositionStart: (e: React.CompositionEvent<HTMLInputElement>) => void;
  handleCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void;
  handleMaxCharsChange: (chars: number) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  THEME_COLORS: any;
  showInfo: boolean;
  showShortcuts: boolean;
  mousePosition: { x: number; y: number };
  INITIAL_FONT_SIZE: number;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  onDeleteSelected: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  saveSessionData?: () => void;
  
  // Migration control
  useEnhancedEvents?: boolean;
  fallbackToLegacy?: boolean;
}

// Feature flags for gradual rollout
const FEATURE_FLAGS = {
  ENHANCED_EVENTS_ENABLED: typeof window !== 'undefined' && 
    (localStorage.getItem('nntype-enhanced-events') === 'true' || 
     new URLSearchParams(window.location.search).get('enhanced-events') === 'true'),
  FORCE_LEGACY_EVENTS: typeof window !== 'undefined' && 
    localStorage.getItem('nntype-force-legacy') === 'true',
  DEBUG_MODE: typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development'
};

export const EventHandlerMigration: React.FC<EventHandlerMigrationProps> = ({
  useEnhancedEvents,
  fallbackToLegacy,
  ...props
}) => {
  const [shouldUseEnhanced, setShouldUseEnhanced] = useState(() => {
    // Priority: prop override > feature flag > default false
    if (useEnhancedEvents !== undefined) return useEnhancedEvents;
    if (FEATURE_FLAGS.FORCE_LEGACY_EVENTS) return false;
    return FEATURE_FLAGS.ENHANCED_EVENTS_ENABLED;
  });
  
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  
  // Error boundary logic
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (shouldUseEnhanced && (error.message?.includes('pointer') || error.message?.includes('event'))) {
        console.warn('Enhanced event handling error detected, considering fallback:', error);
        setErrorCount(prev => prev + 1);
        
        // Auto-fallback after 3 errors
        if (errorCount >= 2 && fallbackToLegacy !== false) {
          console.warn('Falling back to legacy event handling due to repeated errors');
          setShouldUseEnhanced(false);
          setHasError(true);
        }
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [shouldUseEnhanced, errorCount, fallbackToLegacy]);
  
  // Development controls
  useEffect(() => {
    if (FEATURE_FLAGS.DEBUG_MODE) {
      // Add global controls for testing
      (window as any).nntypeDebug = {
        switchToEnhanced: () => {
          setShouldUseEnhanced(true);
          setHasError(false);
          localStorage.setItem('nntype-enhanced-events', 'true');
        },
        switchToLegacy: () => {
          setShouldUseEnhanced(false);
          localStorage.setItem('nntype-enhanced-events', 'false');
        },
        getEventSystemStatus: () => ({
          enhanced: shouldUseEnhanced,
          hasError,
          errorCount,
          featureFlags: FEATURE_FLAGS
        })
      };
      
      console.log('NNType Debug: Event system =', shouldUseEnhanced ? 'Enhanced' : 'Legacy');
    }
  }, [shouldUseEnhanced, hasError, errorCount]);
  
  // Render the appropriate container
  if (shouldUseEnhanced && !hasError) {
    try {
      return (
        <div className="relative">
          <EnhancedCanvasContainer
            {...props}
            // Enhanced-specific props
            selectedObjects={props.selectedObjects}
            selectionRect={props.selectionRect}
            fontLoaded={props.fontLoaded}
            setSelectedObjects={props.setSelectedObjects}
            setDragPreviewObjects={props.setDragPreviewObjects}
            setSelectionRect={props.setSelectionRect}
            setHoveredObject={props.setHoveredObject}
            setMousePosition={props.setMousePosition}
            setIsMouseInTextBox={props.setIsMouseInTextBox}
            onDoubleClick={props.onDoubleClick}
            onContextMenu={props.onContextMenu}
          />
          
          {FEATURE_FLAGS.DEBUG_MODE && (
            <div className="absolute bottom-4 left-4 bg-green-500 text-white px-2 py-1 text-xs rounded">
              Enhanced Events Active
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Enhanced event handler failed, falling back to legacy:', error);
      setHasError(true);
      setShouldUseEnhanced(false);
    }
  }
  
  // Legacy fallback
  return (
    <div className="relative">
      <CanvasContainer
        canvasRef={props.canvasRef}
        canvasWidth={props.canvasWidth}
        canvasHeight={props.canvasHeight}
        isSpacePressed={props.isSpacePressed}
        hoveredObject={props.hoveredObject}
        isMouseInTextBox={props.isMouseInTextBox}
        theme={props.theme}
        
        // Legacy event handlers
        onMouseDown={props.onMouseDown || (() => {})}
        onMouseMove={props.onMouseMove || (() => {})}
        onMouseUp={props.onMouseUp || (() => {})}
        onMouseLeave={props.onMouseLeave || (() => {})}
        onWheel={props.onWheel || (() => {})}
        
        // All other props
        showTextBox={props.showTextBox}
        currentTypingText={props.currentTypingText}
        typewriterX={props.typewriterX}
        typewriterY={props.typewriterY}
        baseFontSize={props.baseFontSize}
        baseFontSizePt={props.baseFontSizePt}
        scale={props.scale}
        maxCharsPerLine={props.maxCharsPerLine}
        selectedObject={props.selectedObject}
        undoStack={props.undoStack}
        redoStack={props.redoStack}
        aiState={props.aiState}
        getTextBoxWidth={props.getTextBoxWidth}
        getCurrentLineHeight={props.getCurrentLineHeight}
        handleInputChange={props.handleInputChange}
        handleInputKeyDown={props.handleInputKeyDown}
        handleCompositionStart={props.handleCompositionStart}
        handleCompositionEnd={props.handleCompositionEnd}
        handleMaxCharsChange={props.handleMaxCharsChange}
        handleUndo={props.handleUndo}
        handleRedo={props.handleRedo}
        THEME_COLORS={props.THEME_COLORS}
        showInfo={props.showInfo}
        showShortcuts={props.showShortcuts}
        canvasOffset={props.canvasOffset}
        canvasObjects={props.canvasObjects}
        mousePosition={props.mousePosition}
        INITIAL_FONT_SIZE={props.INITIAL_FONT_SIZE}
        screenToWorld={props.screenToWorld}
        onDeleteSelected={props.onDeleteSelected}
        onZoomIn={props.onZoomIn}
        onZoomOut={props.onZoomOut}
      />
      
      {FEATURE_FLAGS.DEBUG_MODE && (
        <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-2 py-1 text-xs rounded">
          {hasError ? 'Legacy Events (Fallback)' : 'Legacy Events Active'}
        </div>
      )}
    </div>
  );
};

// Export utility functions for testing and migration
export const EventSystemUtils = {
  enableEnhancedEvents: () => {
    localStorage.setItem('nntype-enhanced-events', 'true');
    window.location.reload();
  },
  
  disableEnhancedEvents: () => {
    localStorage.setItem('nntype-enhanced-events', 'false');
    window.location.reload();
  },
  
  isEnhancedEventsEnabled: () => FEATURE_FLAGS.ENHANCED_EVENTS_ENABLED,
  
  getEventSystemStatus: () => ({
    enhanced: FEATURE_FLAGS.ENHANCED_EVENTS_ENABLED,
    forceLegacy: FEATURE_FLAGS.FORCE_LEGACY_EVENTS,
    debug: FEATURE_FLAGS.DEBUG_MODE
  })
};
