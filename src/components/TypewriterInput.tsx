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
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleCompositionStart: (e: React.CompositionEvent<HTMLTextAreaElement>) => void
  handleCompositionEnd: (e: React.CompositionEvent<HTMLTextAreaElement>) => void
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
      {/* Main Typewriter Container */}
      <div
        style={{
          position: 'absolute',
          left: typewriterX - getTextBoxWidth() / 2,
          top: typewriterY - baseFontSize / 2,
          width: getTextBoxWidth(),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 20,
          pointerEvents: 'auto',
        }}
      >
        {/* Input Field */}
        <textarea
          id="typewriter-input"
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
          rows={currentTypingText.split('\n').length}
          style={{
            width: '100%',
            minHeight: baseFontSize * 1.6,
            height: Math.max(baseFontSize * 1.6, (currentTypingText.split('\n').length * baseFontSize * 1.6)),
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: baseFontSize,
            background: THEME_COLORS[theme].inputBg,
            border: `1px solid ${THEME_COLORS[theme].inputBorder}`,
            outline: 'none',
            color: THEME_COLORS[theme].text,
            backdropFilter: 'blur(1px)',
            borderRadius: '4px',
            padding: '0px',
            paddingTop: '0px',
            lineHeight: `${baseFontSize * 1.6}px`,
            boxSizing: 'border-box',
            opacity: aiState.isProcessing ? 0.6 : 1,
            cursor: aiState.isProcessing ? 'not-allowed' : 'text',
            resize: 'none',
            overflow: 'hidden',
            whiteSpace: 'pre-wrap',
            verticalAlign: 'baseline',
            textAlign: 'left'
          }}
        />

        {/* AI Status Indicator - Loading ring overlay without background */}
        {aiState.isProcessing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: Math.max(baseFontSize * 1.6, (currentTypingText.split('\n').length * baseFontSize * 1.6)),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingLeft: '8px',
              zIndex: 25,
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            <Loader2 className="w-4 h-4 animate-spin" color={theme === 'dark' ? '#60a5fa' : '#3b82f6'} />
          </div>
        )}
        
        {/* AI Error Indicator */}
        {aiState.error && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: '-16px',
              display: 'flex',
              alignItems: 'center',
              zIndex: 25,
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          >
            <AlertCircle className="w-3 h-3" color="rgba(239, 68, 68, 0.6)" />
            <span style={{ 
              marginLeft: '6px', 
              fontSize: '10px', 
              color: 'rgba(239, 68, 68, 0.5)',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 400,
              maxWidth: '200px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {aiState.error}
            </span>
          </div>
        )}

        {/* Controls Container */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
            zIndex: 30,
            pointerEvents: 'auto',
          }}
        >
          {/* Left side spacer for balance */}
          <div style={{ width: '68px' }} />

          {/* Width Selection Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {[40, 60, 80, 100, 120].map((chars, idx, arr) => {
              const fontWeight = maxCharsPerLine === chars ? 600 : 400;
              
              return (
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
                        : (theme === 'dark' ? '#bfc9d1' : '#6b7280'),
                      fontWeight: fontWeight,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      padding: '2px 6px',
                      cursor: maxCharsPerLine === chars ? 'default' : 'pointer',
                      opacity: maxCharsPerLine === chars ? 1 : 0.7,
                      transition: 'all 0.2s ease',
                      borderRadius: '4px',
                      textAlign: 'center',
                    }}
                    title={`${chars}자 폭으로 변경`}
                    onMouseOver={e => {
                      if (maxCharsPerLine !== chars) {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.color = theme === 'dark' ? '#ffffff' : '#374151';
                      }
                    }}
                    onMouseOut={e => {
                      if (maxCharsPerLine !== chars) {
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.color = theme === 'dark' ? '#bfc9d1' : '#6b7280';
                      }
                    }}
                  >
                    {chars}
                  </button>
                  {idx < arr.length - 1 && (
                    <span style={{ 
                      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)', 
                      fontSize: '10px', 
                      fontWeight: 300,
                      userSelect: 'none',
                    }}>
                      •
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Undo/Redo Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '8px',
              alignItems: 'center',
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
                color: undoStack.length === 0 
                  ? (theme === 'dark' ? '#4a5568' : '#d1d5db') 
                  : (theme === 'dark' ? '#bfc9d1' : '#6b7280'),
                cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: undoStack.length === 0 ? 0.4 : 0.8,
              }}
              title="실행 취소 (Undo)"
              onMouseOver={e => {
                if (undoStack.length > 0) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = theme === 'dark' ? '#ffffff' : '#374151';
                }
              }}
              onMouseOut={e => {
                if (undoStack.length > 0) {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.color = theme === 'dark' ? '#bfc9d1' : '#6b7280';
                }
              }}
            >
              <CornerUpLeft className="w-4 h-4" />
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
                color: redoStack.length === 0 
                  ? (theme === 'dark' ? '#4a5568' : '#d1d5db') 
                  : (theme === 'dark' ? '#bfc9d1' : '#6b7280'),
                cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: redoStack.length === 0 ? 0.4 : 0.8,
              }}
              title="다시 실행 (Redo)"
              onMouseOver={e => {
                if (redoStack.length > 0) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = theme === 'dark' ? '#ffffff' : '#374151';
                }
              }}
              onMouseOut={e => {
                if (redoStack.length > 0) {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.color = theme === 'dark' ? '#bfc9d1' : '#6b7280';
                }
              }}
            >
              <CornerUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Font Size Indicator */}
      <div
        style={{
          position: 'absolute',
          left: typewriterX - getTextBoxWidth() / 2 - 16, // 타이프라이터 박스 왼쪽에 위치, 폭 변화에 따라 자동 조정
          top: typewriterY - baseFontSize / 2,
          fontSize: '10px',
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 400,
          zIndex: 20,
          whiteSpace: 'nowrap',
          transform: 'translateX(-100%)', // 오른쪽 끝을 기준으로 정렬
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div>Display&nbsp;&nbsp;{baseFontSize}px({pxToPoints(baseFontSize).toFixed(0)}pt)</div>
          <div>Logical&nbsp;&nbsp;{baseFontSizePt.toFixed(0)}pt</div>
        </div>
      </div>


    </>
  )
}
