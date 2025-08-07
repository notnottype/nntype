import { useCallback } from 'react';
import { CanvasObject, CanvasMode } from '../types';
import { CanvasMode as CanvasModeEnum } from '../types';

interface UseInputEventsProps {
  isComposing: boolean;
  currentTypingText: string;
  baseFontSize: number;
  scale: number;
  canvasObjects: CanvasObject[];
  canvasOffset: { x: number; y: number };
  showTextBox: boolean;
  currentMode: CanvasMode;
  selectedObject: CanvasObject | null;
  selectedObjects: CanvasObject[];
  selectedLinks: Set<string>;
  getCurrentWorldPosition: () => { x: number; y: number };
  setCurrentTypingText: (text: string) => void;
  setIsComposing: (composing: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  setCanvasObjects: (objects: CanvasObject[]) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setSelectedObject: (obj: CanvasObject | null) => void;
  setSelectedObjects: (objects: CanvasObject[]) => void;
  setSelectedLinks: (links: Set<string>) => void;
  pushUndo: () => void;
  handleAICommand: (text: string) => Promise<any> | null;
  switchMode: (mode: CanvasMode) => void;
  setLinkState: (state: any) => void;
  setSelectionState: (state: any) => void;
}

export const useInputEvents = ({
  isComposing,
  currentTypingText,
  baseFontSize,
  scale,
  canvasObjects,
  canvasOffset,
  showTextBox,
  currentMode,
  selectedObject,
  selectedObjects,
  selectedLinks,
  getCurrentWorldPosition,
  setCurrentTypingText,
  setIsComposing,
  setIsTyping,
  setCanvasObjects,
  setCanvasOffset,
  setSelectedObject,
  setSelectedObjects,
  setSelectedLinks,
  pushUndo,
  handleAICommand,
  switchMode,
  setLinkState,
  setSelectionState
}: UseInputEventsProps) => {

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentTypingText(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 100);
  }, [setCurrentTypingText, setIsTyping]);

  const handleCompositionStart = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(true);
  }, [setIsComposing]);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(false);
    setCurrentTypingText(e.currentTarget.value);
  }, [setIsComposing, setCurrentTypingText]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key is handled by global handler, don't handle it here
    if (e.key === 'Tab') {
      return; // Let global handler take care of mode switching
    }

    // Handle Escape key to clear selections and reset mode-specific states
    if (e.key === 'Escape') {
      e.preventDefault();
      
      // Clear selections but stay in current mode
      setSelectedObjects([]);
      setSelectedObject(null);
      setSelectedLinks(new Set());
      
      // Reset mode-specific states without changing mode
      if (currentMode === CanvasModeEnum.LINK) {
        setLinkState({
          sourceObjectId: null,
          targetObjectId: null,
          isCreating: false,
          previewPath: null
        });
      }
      
      if (currentMode === CanvasModeEnum.SELECT) {
        setSelectionState({
          selectedObjects: new Set(),
          dragArea: null
        });
      }
      
      // Clear typing text in Typography mode
      if (currentMode === CanvasModeEnum.TYPOGRAPHY) {
        setCurrentTypingText('');
      }
      
      return;
    }

    // Handle backslash + Enter for line breaks (without adding text to canvas)
    if (e.key === 'Enter') {
      // Check if the text ends with backslash and user pressed Enter
      const textValue = e.currentTarget.value;
      const cursorPosition = e.currentTarget.selectionStart || 0;
      const textBeforeCursor = textValue.substring(0, cursorPosition);
      
      if (textBeforeCursor.endsWith('\\')) {
        // Remove the backslash and add a line break
        const newText = textValue.substring(0, cursorPosition - 1) + '\n' + textValue.substring(cursorPosition);
        setCurrentTypingText(newText);
        
        // Prevent default Enter behavior
        e.preventDefault();
        
        // Set cursor position after the newline
        setTimeout(() => {
          const textarea = e.currentTarget;
          if (textarea) {
            textarea.selectionStart = textarea.selectionEnd = cursorPosition;
          }
        }, 0);
        return;
      }
      
      // Regular Enter behavior - add text to canvas
      if (!isComposing) {
        if (currentTypingText.trim() !== '') {
          // AI 명령어 처리 시도
          const aiResult = handleAICommand(currentTypingText);
          
          if (!aiResult) {
            // 일반 텍스트 처리
            pushUndo(); // 상태 변경 전 스냅샷 저장
            const worldPos = getCurrentWorldPosition();
            setCanvasObjects([
              ...canvasObjects,
              {
                type: 'text',
                content: currentTypingText,
                x: worldPos.x,
                y: worldPos.y,
                scale: 1,
                fontSize: baseFontSize / scale, // 월드 px로 변환해서 저장!
                id: Date.now()
              }
            ]);
            setCurrentTypingText('');
            
            // 오브젝트 생성 여부와 상관없이 줄바꿈(캔버스 오프셋 이동)은 항상 실행
            // 멀티라인 텍스트의 줄 수만큼 이동
            const lines = currentTypingText.split('\n');
            const moveDistance = (baseFontSize * 1.6) * lines.length;
            setCanvasOffset({
              x: canvasOffset.x,
              y: canvasOffset.y - moveDistance
            });
          }
        } else {
          // 빈 텍스트일 때도 줄바꿈
          setCanvasOffset({
            x: canvasOffset.x,
            y: canvasOffset.y - (baseFontSize * 1.6)
          });
        }
      }
      e.preventDefault();
    }
  }, [
    currentMode,
    isComposing,
    currentTypingText,
    baseFontSize,
    scale,
    canvasObjects,
    canvasOffset,
    getCurrentWorldPosition,
    setCurrentTypingText,
    setCanvasObjects,
    setCanvasOffset,
    setSelectedObjects,
    setSelectedObject,
    setSelectedLinks,
    pushUndo,
    handleAICommand,
    switchMode,
    setLinkState,
    setSelectionState
  ]);

  return {
    handleInputChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleInputKeyDown
  };
};
