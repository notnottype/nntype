import React from 'react'
import { TypewriterInput } from './TypewriterInput'
import { CanvasInfoOverlay } from './CanvasInfoOverlay'
import { ShortcutsOverlay } from './ShortcutsOverlay'
import { StatusMessages } from './StatusMessages'
import { ZoomControls } from './ZoomControls'
import { CanvasObjectType, AIState, CanvasModeType, PinPosition, LinkState, SelectionState } from '../types'

interface CanvasContainerProps {
  // Canvas props
  canvasRef: React.RefObject<HTMLCanvasElement>
  canvasWidth: number
  canvasHeight: number
  isSpacePressed: boolean
  hoveredObject: CanvasObjectType | null
  isMouseInTextBox: boolean
  theme: 'light' | 'dark'
  
  // Event handlers
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: () => void
  onMouseLeave: () => void
  
  // TypewriterInput props
  showTextBox: boolean
  currentTypingText: string
  typewriterX: number
  typewriterY: number
  baseFontSize: number
  baseFontSizePt: number
  scale: number
  maxCharsPerLine: number
  selectedObject: any
  undoStack: any[]
  redoStack: any[]
  aiState: AIState
  getTextBoxWidth: () => number
  getCurrentLineHeight: (selectedObject: any, baseFontSize: number, scale: number) => number
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleCompositionStart: (e: React.CompositionEvent<HTMLInputElement>) => void
  handleCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void
  handleMaxCharsChange: (chars: number) => void
  handleUndo: () => void
  handleRedo: () => void
  THEME_COLORS: any
  
  // Overlay props
  showInfo: boolean
  showShortcuts: boolean
  canvasOffset: { x: number; y: number }
  canvasObjects: CanvasObjectType[]
  mousePosition: { x: number; y: number }
  INITIAL_FONT_SIZE: number  // TODO: 향후 INITIAL_UI_FONT_SIZE_PX로 변경 예정
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number }
  
  // Status props
  onDeleteSelected: () => void
  
  // Zoom props
  onZoomIn: () => void
  onZoomOut: () => void
  
  // Multi-mode system props
  currentMode: CanvasModeType
  pinPosition: PinPosition
  linkState: LinkState
  selectionState: SelectionState
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  canvasRef,
  canvasWidth,
  canvasHeight,
  isSpacePressed,
  hoveredObject,
  isMouseInTextBox,
  theme,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  showTextBox,
  currentTypingText,
  typewriterX,
  typewriterY,
  baseFontSize,
  baseFontSizePt,
  scale,
  maxCharsPerLine,
  selectedObject,
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
  canvasOffset,
  canvasObjects,
  mousePosition,
  INITIAL_FONT_SIZE,
  screenToWorld,
  onDeleteSelected,
  onZoomIn,
  onZoomOut,
  currentMode,
  pinPosition,
  linkState,
  selectionState
}) => {
  const getCursorClass = () => {
    if (isSpacePressed) {
      return isMouseInTextBox ? 'cursor-grab' : 'cursor-default';
    }
    if (hoveredObject && isMouseInTextBox) {
      return 'cursor-move';
    }
    if (isMouseInTextBox) {
      return 'cursor-text';
    }
    return 'cursor-default';
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className={`absolute inset-0 ${getCursorClass()}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        tabIndex={0}
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
        currentMode={currentMode}
        pinPosition={pinPosition}
        linkState={linkState}
        selectionState={selectionState}
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

      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 backdrop-blur-sm px-3 py-1.5 rounded-full ${
        theme === 'dark' ? 'bg-black/80' : 'bg-white/90'
      }`}>
        <ZoomControls
          scale={scale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          theme={theme}
        />
      </div>
    </div>
  )
}