/**
 * Enhanced Canvas Container with improved event handling
 * Based on Excalidraw's event handling patterns with pointer events
 */

import React, { useCallback } from 'react';
import { TypewriterInput } from './TypewriterInput';
import { CanvasInfoOverlay } from './CanvasInfoOverlay';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { StatusMessages } from './StatusMessages';
import { ZoomControls } from './ZoomControls';
import { CanvasObjectType, AIState, SelectionRectangle } from '../types';
import { useCanvasEvents } from '../hooks/useCanvasEvents';
import { useEnhancedCanvasOperations } from '../hooks/useEnhancedCanvasOperations';

interface EnhancedCanvasContainerProps {
  // Canvas props
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
  
  // Enhanced event callbacks
  onDoubleClick?: (worldX: number, worldY: number) => void;
  onContextMenu?: (worldX: number, worldY: number, object?: CanvasObjectType) => void;
  onWheel?: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  
  // TypewriterInput props
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
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleCompositionStart: (e: React.CompositionEvent<HTMLTextAreaElement>) => void;
  handleCompositionEnd: (e: React.CompositionEvent<HTMLTextAreaElement>) => void;
  handleMaxCharsChange: (chars: number) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  THEME_COLORS: any;
  
  // Overlay props
  showInfo: boolean;
  showShortcuts: boolean;
  mousePosition: { x: number; y: number };
  INITIAL_FONT_SIZE: number;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  
  // Status props
  onDeleteSelected: () => void;
  
  // Zoom props
  onZoomIn: () => void;
  onZoomOut: () => void;
  
  // Session management
  saveSessionData?: () => void;
}

export const EnhancedCanvasContainer: React.FC<EnhancedCanvasContainerProps> = ({
  canvasRef,
  canvasWidth,
  canvasHeight,
  isSpacePressed,
  hoveredObject,
  isMouseInTextBox,
  theme,
  canvasObjects,
  selectedObject,
  selectedObjects,
  scale,
  canvasOffset,
  baseFontSize,
  baseFontSizePt,
  fontLoaded,
  selectionRect,
  setCanvasObjects,
  setSelectedObject,
  setSelectedObjects,
  setScale,
  setCanvasOffset,
  setBaseFontSize,
  setBaseFontSizePt,
  setDragPreviewObjects,
  setSelectionRect,
  setHoveredObject,
  setMousePosition,
  setIsMouseInTextBox,
  onDoubleClick,
  onContextMenu,
  onWheel,
  showTextBox,
  currentTypingText,
  typewriterX,
  typewriterY,
  maxCharsPerLine,
  undoStack,
  redoStack,
  aiState,
  getTextBoxWidth,
  getCurrentLineHeight,
  handleInputChange,
  handleInputKeyDown,
  handleCompositionStart,
  handleCompositionEnd,
  handleMaxCharsChange,
  handleUndo,
  handleRedo,
  THEME_COLORS,
  showInfo,
  showShortcuts,
  mousePosition,
  INITIAL_FONT_SIZE,
  screenToWorld,
  onDeleteSelected,
  onZoomIn,
  onZoomOut,
  saveSessionData
}) => {
  
  // Enhanced canvas operations
  const {
    enhancedPan,
    enhancedZoom,
    addCanvasObject,
    bulkUpdateObjects,
    deleteObjects,
    resetCanvas,
    getPerformanceMetrics,
    debouncedSaveSession
  } = useEnhancedCanvasOperations({
    scale,
    canvasOffset,
    baseFontSize,
    baseFontSizePt,
    canvasObjects,
    setScale,
    setCanvasOffset,
    setCanvasObjects,
    setBaseFontSize,
    setBaseFontSizePt,
    saveSessionData
  });

  // Enhanced event handling
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleContextMenu,
    eventState
  } = useCanvasEvents({
    canvasRef,
    canvasObjects,
    selectedObject,
    selectedObjects,
    scale,
    canvasOffset,
    baseFontSize,
    fontLoaded,
    showTextBox,
    isSpacePressed,
    setCanvasObjects,
    setSelectedObject,
    setSelectedObjects,
    setCanvasOffset,
    setDragPreviewObjects,
    setSelectionRect,
    setHoveredObject,
    setMousePosition,
    setIsMouseInTextBox,
    onDoubleClick,
    onContextMenu
  });

  // Enhanced cursor management
  const getCursorStyle = useCallback(() => {
    if (eventState.isDragging) {
      return 'cursor-grabbing';
    }
    if (eventState.isDraggingText) {
      return 'cursor-move';
    }
    if (eventState.isSelecting) {
      return 'cursor-crosshair';
    }
    if (isSpacePressed) {
      return 'cursor-grab';
    }
    if (hoveredObject) {
      return 'cursor-pointer';
    }
    if (isMouseInTextBox) {
      return 'cursor-text';
    }
    return 'cursor-default';
  }, [eventState, isSpacePressed, hoveredObject, isMouseInTextBox]);

  // Handle pointer cancel (for edge cases)
  const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    // Reset all drag states
    eventState.isDragging = false;
    eventState.isDraggingText = false;
    eventState.isSelecting = false;
    eventState.activePointerId = null;
    
    setDragPreviewObjects([]);
    setSelectionRect(null);
  }, [eventState, setDragPreviewObjects, setSelectionRect]);

  // Handle touch events for mobile support
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent default touch behaviors like scroll and zoom
    event.preventDefault();
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    // Handle touch move - this will be processed by the pointer events
    event.preventDefault();
  }, []);

  // Enhanced zoom handling with momentum
  const handleEnhancedWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      
      // Use the center of the canvas as zoom point if no specific point provided  
      const rect = canvasRef.current?.getBoundingClientRect();
      const centerPoint = rect ? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      } : undefined;
      
      const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(10, scale * zoomDelta));
      
      if (newScale !== scale) {
        enhancedZoom(newScale, centerPoint);
        debouncedSaveSession();
      }
    } else {
      // Regular wheel handling (defer to original handler if provided)
      onWheel?.(event);
    }
  }, [scale, enhancedZoom, debouncedSaveSession, onWheel]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className={`absolute inset-0 ${getCursorStyle()}`}
        style={{ touchAction: 'none' }} // Important for pointer events
        
        // Enhanced pointer events (preferred over mouse events)
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        
        // Touch events for mobile support
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        
        // Context menu and wheel events
        onContextMenu={handleContextMenu}
        onWheel={handleEnhancedWheel}
        
        // Accessibility
        tabIndex={0}
        role="application"
        aria-label="Infinite typewriter canvas"
      />
      
      {showShortcuts && (
        <div className="relative z-50">
          <ShortcutsOverlay theme={theme} />
        </div>
      )}

      <TypewriterInput
        showTextBox={showTextBox}
        currentTypingText={currentTypingText}
        typewriterX={typewriterX}
        typewriterY={typewriterY}
        baseFontSize={baseFontSize}
        baseFontSizePt={baseFontSizePt}
        scale={scale}
        theme={theme}
        maxCharsPerLine={maxCharsPerLine}
        selectedObject={selectedObject}
        undoStack={undoStack}
        redoStack={redoStack}
        aiState={aiState}
        getTextBoxWidth={getTextBoxWidth}
        getCurrentLineHeight={getCurrentLineHeight}
        handleInputChange={handleInputChange}
        handleInputKeyDown={handleInputKeyDown}
        handleCompositionStart={handleCompositionStart}
        handleCompositionEnd={handleCompositionEnd}
        handleMaxCharsChange={handleMaxCharsChange}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        THEME_COLORS={THEME_COLORS}
      />

      {showInfo && (
        <CanvasInfoOverlay
          canvasOffset={canvasOffset}
          scale={scale}
          canvasObjects={canvasObjects}
          selectedObject={selectedObject}
          hoveredObject={hoveredObject}
          mousePosition={mousePosition}
          isMouseInTextBox={isMouseInTextBox}
          typewriterX={typewriterX}
          typewriterY={typewriterY}
          baseFontSize={baseFontSize}
          initialFontSize={INITIAL_FONT_SIZE}
          getTextBoxWidth={getTextBoxWidth}
          screenToWorld={screenToWorld}
          theme={theme}
        />
      )}

      <StatusMessages
        theme={theme}
        showTextBox={showTextBox}
        currentTypingText={currentTypingText}
        selectedObject={selectedObject}
        onDeleteSelected={onDeleteSelected}
      />

      <ZoomControls
        scale={scale}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        theme={theme}
      />

      {/* Performance monitoring overlay (development only) */}
      {typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 right-4 bg-black bg-opacity-50 text-white p-2 text-xs rounded">
          <div>Objects: {getPerformanceMetrics().objectCount}</div>
          <div>Queue: {getPerformanceMetrics().queuedOperations}</div>
          <div>Processing: {getPerformanceMetrics().isProcessing ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};