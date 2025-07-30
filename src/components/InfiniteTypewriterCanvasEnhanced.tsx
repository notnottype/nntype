/**
 * Enhanced version showing integration of improved event handling
 * This demonstrates how to use the new event system while maintaining compatibility
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Type, Move, Download, Import, Grid, FileText, Image, Code, RotateCcw, Trash2, Eye, EyeOff, Sun, Moon, Layers, Info, NotepadTextDashed, TextCursorInput } from 'lucide-react';
import { Header } from './Header';
import { EventHandlerMigration } from './EventHandlerMigration';
import { createPNGExporter, createJSONExporter, createSVGExporter } from '../utils/exportHandlers';
import { 
  measureTextWidth, 
  snapToGrid, 
  isPointInObject, 
  calculateContentBoundingBox,
  worldToScreen,
  screenToWorld,
  drawGrid,
  drawCanvasObjects,
  drawHoverHighlight,
  setupCanvasHiDPI,
  loadGoogleFonts,
  getCurrentLineHeight,
  findFontSizeLevel,
  findZoomLevel,
  calculateTextBoxOffset,
  calculateA4GuidePosition,
  calculateDPIPixelsPerMM,
  drawContentForExport,
  createExportData,
  downloadFile,
  downloadCanvas,
  createSVGElement,
  addSVGBackground,
  addTextObjectToSVG,
  addA4GuideToSVG,
  addCurrentTypingTextToSVG,
  calculateSVGOutputSize,
  serializeSVG,
  createSelectionRectangle,
  getObjectsInSelectionRect,
  drawSelectionRectangle,
  drawMultiSelectHighlight
} from '../utils';
import { 
  INITIAL_UI_FONT_SIZE_PX,
  INITIAL_BASE_FONT_SIZE_PT,
  CANVAS_ZOOM_LEVELS,
  UI_FONT_SIZE_LEVELS_PX,
  BASE_FONT_SIZE_LEVELS_PT,
  TEXT_BOX_WIDTH_MM,
  A4_MARGIN_LR_MM,
  A4_MARGIN_TOP_MM,
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  THEME_COLORS
} from '../constants';
import { pxToPoints, pointsToPx } from '../utils/units';
import { CanvasObjectType, A4GuideObjectType, Theme, AICommand, SelectionRectangle } from '../types';
import { aiService } from '../services/aiService';
import { wrapTextToLines } from '../utils';
import { ExportMenu } from './ExportMenu';
import { ApiKeyInput } from './ApiKeyInput';
import { saveSession, loadSession, clearSession } from '../utils/sessionStorage';

// This is a demonstration of how to integrate the enhanced event handling
// It shows the minimal changes needed to the existing component

const InfiniteTypewriterCanvasEnhanced = () => {
  // All the existing state remains the same
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObjectType[]>(() => {
    const sessionData = loadSession();
    return sessionData?.canvasObjects || [];
  });
  
  // ... (all existing state variables remain unchanged)
  const [currentTypingText, setCurrentTypingText] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.currentTypingText || '';
  });
  const [isComposing, setIsComposing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragPreviewObjects, setDragPreviewObjects] = useState<CanvasObjectType[]>([]);
  const [scale, setScale] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.scale || 1;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState<CanvasObjectType | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<CanvasObjectType[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRectangle | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInTextBox, setIsMouseInTextBox] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<CanvasObjectType | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 64);
  const [canvasOffset, setCanvasOffset] = useState(() => {
    const sessionData = loadSession();
    if (sessionData?.typewriterLTWorldPosition) {
      try {
        const initialTypewriterX = window.innerWidth / 2;
        const initialTypewriterY = (window.innerHeight - 64) / 2;
        const textBoxWidth = sessionData.maxCharsPerLine * (sessionData.baseFontSize * 0.6);
        const currentLTScreen = {
          x: initialTypewriterX - textBoxWidth / 2,
          y: initialTypewriterY - sessionData.baseFontSize / 2
        };
        const targetScreenX = sessionData.typewriterLTWorldPosition.x * sessionData.scale;
        const targetScreenY = sessionData.typewriterLTWorldPosition.y * sessionData.scale;
        
        return {
          x: currentLTScreen.x - targetScreenX,
          y: currentLTScreen.y - targetScreenY
        };
      } catch (error) {
        console.warn('Failed to calculate initial offset:', error);
        return { x: 0, y: 0 };
      }
    }
    return { x: 0, y: 0 };
  });

  // ... all other existing state and derived values
  const [baseFontSizePt, setBaseFontSizePt] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.baseFontSizePt || INITIAL_BASE_FONT_SIZE_PT;
  });
  
  const baseFontSize = useMemo(() => pointsToPx(baseFontSizePt), [baseFontSizePt]);
  const maxCharsPerLine = useMemo(() => Math.floor(TEXT_BOX_WIDTH_MM * 3.77953 / (baseFontSize * 0.6)), [baseFontSize]);
  
  // ... rest of existing computed values and refs
  const isComposingRef = useRef(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [showA4Guide, setShowA4Guide] = useState(false);
  const [a4GuideObjects, setA4GuideObjects] = useState<A4GuideObjectType[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTextBox, setShowTextBox] = useState(true);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [aiState, setAiState] = useState({ isProcessing: false, response: '', error: null });
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Enhanced event handlers for double-click and context menu
  const handleDoubleClick = useCallback((worldX: number, worldY: number) => {
    console.log('Double click at world coordinates:', worldX, worldY);
    // Add your double-click logic here
    // For example, start text editing at the clicked location
  }, []);

  const handleContextMenu = useCallback((worldX: number, worldY: number, object?: CanvasObjectType) => {
    console.log('Context menu at world coordinates:', worldX, worldY, 'Object:', object);
    // Add your context menu logic here
    // For example, show a custom context menu
  }, []);

  // Session save function for the enhanced operations
  const saveSessionData = useCallback(() => {
    const sessionData = {
      canvasObjects,
      currentTypingText,
      scale,
      typewriterLTWorldPosition: getCurrentLTWorldPosition(),
      maxCharsPerLine,
      baseFontSize,
      baseFontSizePt
    };
    saveSession(sessionData);
  }, [canvasObjects, currentTypingText, scale, maxCharsPerLine, baseFontSize, baseFontSizePt]);

  // Helper function to get current LT world position (if needed)
  const getCurrentLTWorldPosition = useCallback(() => {
    const typewriterX = canvasWidth / 2;
    const typewriterY = canvasHeight / 2;
    const textBoxWidth = getTextBoxWidth();
    const currentLTScreen = {
      x: typewriterX - textBoxWidth / 2,
      y: typewriterY - baseFontSize / 2
    };
    return screenToWorld(currentLTScreen, scale, canvasOffset);
  }, [canvasWidth, canvasHeight, baseFontSize, scale, canvasOffset]);

  // All existing functions remain the same...
  const getTextBoxWidth = useCallback(() => {
    return maxCharsPerLine * (baseFontSize * 0.6);
  }, [maxCharsPerLine, baseFontSize]);

  // ... (keep all existing functions like handleInputChange, etc.)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentTypingText(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 100);
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(true);
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(false);
    isComposingRef.current = false;
    setCurrentTypingText(e.currentTarget.value); 
  };

  // ... all other existing handlers and effects

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header
        theme={theme}
        setTheme={setTheme}
        showA4Guide={showA4Guide}
        setShowA4Guide={setShowA4Guide}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        setIsExportMenuOpen={setIsExportMenuOpen}
        showInfo={showInfo}
        setShowInfo={setShowInfo}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
        showTextBox={showTextBox}
        setShowTextBox={setShowTextBox}
        setShowApiKeyInput={setShowApiKeyInput}
        canvasObjects={canvasObjects}
        setCanvasObjects={setCanvasObjects}
        scale={scale}
        canvasOffset={canvasOffset}
        currentTypingText={currentTypingText}
        setCurrentTypingText={setCurrentTypingText}
        selectedObject={selectedObject}
        setSelectedObject={setSelectedObject}
        baseFontSize={baseFontSize}
        maxCharsPerLine={maxCharsPerLine}
        typewriterX={canvasWidth / 2}
        typewriterY={canvasHeight / 2}
        fontLoaded={fontLoaded}
        canvasRef={canvasRef}
      />

      {/* Use the migration component that can switch between old and new event handling */}
      <EventHandlerMigration
        // Canvas props
        canvasRef={canvasRef}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        isSpacePressed={isSpacePressed}
        hoveredObject={hoveredObject}
        isMouseInTextBox={isMouseInTextBox}
        theme={theme}
        
        // Canvas state
        canvasObjects={canvasObjects}
        selectedObject={selectedObject}
        selectedObjects={selectedObjects}
        scale={scale}
        canvasOffset={canvasOffset}
        baseFontSize={baseFontSize}
        baseFontSizePt={baseFontSizePt}
        fontLoaded={fontLoaded}
        selectionRect={selectionRect}
        
        // State setters
        setCanvasObjects={setCanvasObjects}
        setSelectedObject={setSelectedObject}
        setSelectedObjects={setSelectedObjects}
        setScale={setScale}
        setCanvasOffset={setCanvasOffset}
        setBaseFontSize={setBaseFontSize}
        setBaseFontSizePt={setBaseFontSizePt}
        setDragPreviewObjects={setDragPreviewObjects}
        setSelectionRect={setSelectionRect}
        setHoveredObject={setHoveredObject}
        setMousePosition={setMousePosition}
        setIsMouseInTextBox={setIsMouseInTextBox}
        
        // Enhanced event callbacks
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        
        // All TypewriterInput and other props...
        showTextBox={showTextBox}
        currentTypingText={currentTypingText}
        typewriterX={canvasWidth / 2}
        typewriterY={canvasHeight / 2}
        maxCharsPerLine={maxCharsPerLine}
        undoStack={undoStack}
        redoStack={redoStack}
        aiState={aiState}
        getTextBoxWidth={getTextBoxWidth}
        getCurrentLineHeight={() => getCurrentLineHeight()}
        handleInputChange={handleInputChange}
        handleInputKeyDown={() => {}} // Add your handler
        handleCompositionStart={handleCompositionStart}
        handleCompositionEnd={handleCompositionEnd}
        handleMaxCharsChange={() => {}} // Add your handler
        handleUndo={() => {}} // Add your handler
        handleRedo={() => {}} // Add your handler
        THEME_COLORS={THEME_COLORS}
        showInfo={showInfo}
        showShortcuts={showShortcuts}
        mousePosition={mousePosition}
        INITIAL_FONT_SIZE={INITIAL_UI_FONT_SIZE_PX}
        screenToWorld={(screenX, screenY) => screenToWorld({ x: screenX, y: screenY }, scale, canvasOffset)}
        onDeleteSelected={() => {
          if (selectedObject) {
            setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
            setSelectedObject(null);
          }
        }}
        onZoomIn={() => {
          const currentIndex = findZoomLevel(scale, CANVAS_ZOOM_LEVELS);
          const newIndex = Math.min(CANVAS_ZOOM_LEVELS.length - 1, currentIndex + 1);
          if (newIndex !== currentIndex) {
            setScale(CANVAS_ZOOM_LEVELS[newIndex]);
          }
        }}
        onZoomOut={() => {
          const currentIndex = findZoomLevel(scale, CANVAS_ZOOM_LEVELS);
          const newIndex = Math.max(0, currentIndex - 1);
          if (newIndex !== currentIndex) {
            setScale(CANVAS_ZOOM_LEVELS[newIndex]);
          }
        }}
        saveSessionData={saveSessionData}
        
        // Migration control (can be omitted to use feature flags)
        useEnhancedEvents={true} // Force use enhanced events for this demo
      />

      {/* Export Menu */}
      {isExportMenuOpen && (
        <ExportMenu
          canvasObjects={canvasObjects}
          a4GuideObjects={a4GuideObjects}
          currentTypingText={currentTypingText}
          scale={scale}
          canvasOffset={canvasOffset}
          baseFontSize={baseFontSize}
          baseFontSizePt={baseFontSizePt}
          canvasRef={canvasRef}
          fontLoaded={fontLoaded}
          maxCharsPerLine={maxCharsPerLine}
          typewriterX={canvasWidth / 2}
          typewriterY={canvasHeight / 2}
          getTextBoxWidth={getTextBoxWidth}
          theme={theme}
          onClose={() => setIsExportMenuOpen(false)}
        />
      )}

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <ApiKeyInput
          theme={theme}
          onClose={() => setShowApiKeyInput(false)}
        />
      )}
    </div>
  );
};

export default InfiniteTypewriterCanvasEnhanced;