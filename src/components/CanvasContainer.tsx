import React from 'react'
import { Layers2, Sun, Moon } from 'lucide-react'
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
  
  // Shortcuts props
  onShowShortcutsToggle: () => void
  
  // Grid props
  showGrid: boolean
  onShowGridToggle: () => void
  
  // Info toggle props
  onShowInfoToggle: () => void
  
  // Multi-mode system props
  currentMode: CanvasModeType
  pinPosition: PinPosition
  linkState: LinkState
  selectionState: SelectionState
  
  // Theme toggle
  onThemeToggle: () => void
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
  onShowShortcutsToggle,
  showGrid,
  onShowGridToggle,
  onShowInfoToggle,
  currentMode,
  pinPosition,
  linkState,
  selectionState,
  onThemeToggle
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
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-transparent">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className={`absolute inset-0 ${getCursorClass()} focus:outline-none`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        tabIndex={0}
      />
      
      {showShortcuts && (
        <div className="relative z-50">
          <ShortcutsOverlay 
            theme={theme} 
            typewriterY={typewriterY} 
            baseFontSize={baseFontSize} 
            typewriterX={typewriterX}
            getTextBoxWidth={getTextBoxWidth}
          />
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

      <StatusMessages
        theme={theme}
        showTextBox={showTextBox}
        currentTypingText={currentTypingText}
        selectedObject={selectedObject}
        onDeleteSelected={onDeleteSelected}
      />

      {/* Bottom Controls - Center */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-none">
          {/* Zoom Controls */}
          <div className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg backdrop-blur-sm border pointer-events-auto ${
            theme === 'dark' 
              ? 'bg-black/20 border-gray-700/30' 
              : 'bg-white/40 border-gray-200/30'
          }`}>
            <ZoomControls
              scale={scale}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              theme={theme}
            />
          </div>

          {/* Shortcuts Toggle */}
          <div className={`flex items-center gap-1 px-1.5 py-1.5 rounded-lg backdrop-blur-sm border pointer-events-auto ${
            theme === 'dark' 
              ? 'bg-black/20 border-gray-700/30' 
              : 'bg-white/40 border-gray-200/30'
          }`}>
            <button
              onClick={onShowShortcutsToggle}
              className={`p-1 rounded-lg ${
                showShortcuts ? 'text-blue-500 bg-blue-500/10' : ''
              } ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Shortcuts Guide"
            >
              <Layers2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}