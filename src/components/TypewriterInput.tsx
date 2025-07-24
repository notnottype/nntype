import React from 'react'
import { CornerUpLeft, CornerUpRight, Loader2, AlertCircle } from 'lucide-react'
import { pxToPoints } from '../utils/units'
import { AIState } from '../types'

interface TypewriterInputProps {
  showTextBox: boolean
  currentTypingText: string
  typewriterX: number
  typewriterY: number
  baseFontSize: number      // UI 폰트 크기 (픽셀)
  baseFontSizePt: number    // Base 폰트 크기 (포인트)
  scale: number             // 캔버스 줌 레벨
  theme: 'light' | 'dark'
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
}

export const TypewriterInput: React.FC<TypewriterInputProps> = ({
  showTextBox,
  currentTypingText,
  typewriterX,
  typewriterY,
  baseFontSize,
  baseFontSizePt,
  scale,
  theme,
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
  THEME_COLORS
}) => {
  if (!showTextBox) return null

  return (
    <>
      {/* Input Field */}
      <input
        id="typewriter-input"
        type="text"
        value={currentTypingText}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onClick={(e) => {
          e.stopPropagation();
          e.currentTarget.focus();
        }}
        disabled={aiState.isProcessing}
        style={{
          position: 'absolute',
          left: typewriterX - getTextBoxWidth() / 2,
          top: typewriterY - baseFontSize / 2,
          width: getTextBoxWidth(),
          height: Math.max(getCurrentLineHeight(selectedObject, baseFontSize, scale), baseFontSize + 16),
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: baseFontSize,
          background: THEME_COLORS[theme].inputBg,
          border: `1px solid ${THEME_COLORS[theme].inputBorder}`,
          outline: 'none',
          color: THEME_COLORS[theme].text,
          zIndex: 20,
          backdropFilter: 'blur(1px)',
          borderRadius: '4px',
          padding: 0,
          lineHeight: `${getCurrentLineHeight(selectedObject, baseFontSize, scale)}px`,
          boxSizing: 'border-box',
          opacity: aiState.isProcessing ? 0.6 : 1,
          cursor: aiState.isProcessing ? 'not-allowed' : 'text'
        }}
      />

      {/* AI Status Indicator */}
      {(aiState.isProcessing || aiState.error) && (
        <div
          style={{
            position: 'absolute',
            left: typewriterX + getTextBoxWidth() / 2 + 8,
            top: typewriterY - baseFontSize / 2,
            height: Math.max(getCurrentLineHeight(selectedObject, baseFontSize, scale), baseFontSize + 16),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
            borderRadius: '4px',
            padding: '0 8px',
            zIndex: 25,
            backdropFilter: 'blur(8px)',
          }}
        >
          {aiState.isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" color={theme === 'dark' ? '#60a5fa' : '#3b82f6'} />
              <span style={{ 
                marginLeft: '6px', 
                fontSize: '12px', 
                color: theme === 'dark' ? '#60a5fa' : '#3b82f6',
                fontFamily: '"JetBrains Mono", monospace'
              }}>
                AI 처리 중...
              </span>
            </>
          ) : aiState.error ? (
            <>
              <AlertCircle className="w-4 h-4" color="#ef4444" />
              <span style={{ 
                marginLeft: '6px', 
                fontSize: '12px', 
                color: '#ef4444',
                fontFamily: '"JetBrains Mono", monospace',
                maxWidth: '200px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {aiState.error}
              </span>
            </>
          ) : null}
        </div>
      )}
      
      {/* Font Size Indicator */}
      <div
        style={{
          position: 'absolute',
          left: typewriterX - getTextBoxWidth() / 2,
          top: typewriterY - baseFontSize / 2 + 45, // 타이프라이터 박스 위쪽으로 이동
          fontSize: '11px',
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          padding: '6px 10px',
          borderRadius: '4px',
          zIndex: 20,
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}
      >
        UI: {baseFontSize}px ({pxToPoints(baseFontSize).toFixed(1)}pt) | Base: {baseFontSizePt.toFixed(1)}pt
      </div>

      {/* Width Selection Buttons */}
      <div
        style={{
          position: 'absolute',
          left: typewriterX - getTextBoxWidth() / 2,
          top: typewriterY + baseFontSize / 2 + 24,
          width: getTextBoxWidth(),
          display: 'flex',
          justifyContent: 'center',
          zIndex: 30,
          pointerEvents: 'auto',
        }}
      >
        {[40, 60, 80, 100, 120].map((chars, idx, arr) => (
          <React.Fragment key={chars}>
            <button
              onClick={() => handleMaxCharsChange(chars)}
              disabled={maxCharsPerLine === chars}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: maxCharsPerLine === chars
                  ? '#60a5fa'
                  : (theme === 'dark' ? '#bfc9d1' : '#bfc9d1'),
                fontWeight: maxCharsPerLine === chars ? 500 : 400,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                padding: '1px 8px',
                cursor: maxCharsPerLine === chars ? 'default' : 'pointer',
                opacity: maxCharsPerLine === chars ? 1 : 0.7,
                transition: 'color 0.15s, opacity 0.15s',
              }}
              title={`${chars}자 폭으로 변경`}
            >
              {chars}
            </button>
            {idx < arr.length - 1 && (
              <span style={{ 
                color: theme === 'dark' ? '#bfc9d1' : '#bfc9d1', 
                fontSize: 13, 
                margin: '0 2px' 
              }}>
                -
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Undo/Redo Buttons */}
      <div
        style={{
          position: 'absolute',
          left: typewriterX + getTextBoxWidth() / 2 - 68,
          top: typewriterY + baseFontSize / 2 + 12,
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          zIndex: 30,
          padding: '4px 20px 4px 4px',
          borderRadius: '10px',
          background: 'transparent',
        }}
      >
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
          title="실행 취소 (Undo)"
          onMouseOver={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(200,200,200,0.08)' : 'rgba(200,200,200,0.15)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <CornerUpLeft className="w-4 h-4" color="#aaa" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
          title="다시 실행 (Redo)"
          onMouseOver={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(200,200,200,0.08)' : 'rgba(200,200,200,0.15)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <CornerUpRight className="w-4 h-4" color="#aaa" />
        </button>
      </div>
    </>
  )
}
