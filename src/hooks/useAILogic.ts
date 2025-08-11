import { useCallback } from 'react';
import { CanvasObject, AICommand } from '../types';
import { aiService } from '../services/aiService';
import { wrapTextToLines } from '../utils';

interface UseAILogicProps {
  baseFontSize: number;
  scale: number;
  maxCharsPerLine: number;
  showTextBox: boolean;
  canvasObjects: CanvasObject[];
  getTextBoxWidth: () => number;
  getCurrentWorldPosition: () => { x: number; y: number };
  measureTextWidthLocal: (text: string, fontSize: number) => number;
  setCanvasObjects: (objects: CanvasObject[]) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setCurrentTypingText: (text: string) => void;
  canvasOffset: { x: number; y: number };
  pushUndo: () => void;
  parseCommand: (text: string) => AICommand | null;
}

export const useAILogic = ({
  baseFontSize,
  scale,
  maxCharsPerLine,
  showTextBox,
  canvasObjects,
  getTextBoxWidth,
  getCurrentWorldPosition,
  measureTextWidthLocal,
  setCanvasObjects,
  setCanvasOffset,
  setCurrentTypingText,
  canvasOffset,
  pushUndo,
  parseCommand
}: UseAILogicProps) => {
  
  const processAICommand = useCallback(async (command: AICommand) => {
    try {
      const response = await aiService.askGPT(command.question);
      
      if (response.success && response.content) {
        // 응답을 현재 타이프라이터 박스 폭에 맞게 줄바꿈 처리
        // 월드 좌표계 기준으로 통일해서 UI 픽셀 크기와 무관하게 일관된 결과 보장
        const worldFontSize = baseFontSize / scale;
        const textBoxPixelWidth = getTextBoxWidth();
        const worldBoxWidth = textBoxPixelWidth / scale; // 월드 좌표계 폭으로 변환
        
        const wrappedLines = wrapTextToLines(
          response.content, 
          maxCharsPerLine, 
          worldBoxWidth, 
          worldFontSize, 
          (text: string, fontSize: number) => measureTextWidthLocal(text, fontSize) / scale
        );
        const worldPos = getCurrentWorldPosition();
        
        pushUndo(); // 상태 변경 전 스냅샷 저장
        
        // 각 줄을 별도의 텍스트 오브젝트로 생성 (현재 타이프라이터 위치에서 시작)
        const worldLineHeight = (baseFontSize / scale) * 1.6;
        const newObjects = wrappedLines.map((line, index) => ({
          type: 'text' as const,
          content: line,
          x: worldPos.x,
          y: worldPos.y + ((index + 1) * worldLineHeight),
          scale: 1,
          fontSize: baseFontSize / scale,
          id: Date.now() + index,
          isAIResponse: true,
          color: '#3b82f6'
        }));
        
        setCanvasObjects([...canvasObjects, ...newObjects]);
        
        // 타이프라이터를 마지막 텍스트 아래로 이동
        const totalHeight = wrappedLines.length * worldLineHeight * scale;
        setCanvasOffset({
          x: canvasOffset.x,
          y: canvasOffset.y - totalHeight
        });
        
      } else {
        throw new Error(response.error || 'AI 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('AI 처리 오류:', error);
      throw error;
    } finally {
      // AI 응답 처리 완료 후 입력창에 포커스를 다시 주고 /gpt 프리픽스 설정
      setTimeout(() => {
        const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
        if (input && showTextBox) {
          // AI 명령어였다면 /gpt 를 입력창에 미리 입력해둠
          setCurrentTypingText('/gpt ');
          input.focus();
          // 커서를 맨 끝으로 이동
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 0);
    }
  }, [
    baseFontSize,
    scale,
    maxCharsPerLine,
    showTextBox,
    canvasObjects,
    getTextBoxWidth,
    getCurrentWorldPosition,
    measureTextWidthLocal,
    setCanvasObjects,
    setCanvasOffset,
    setCurrentTypingText,
    canvasOffset,
    pushUndo
  ]);

  const handleAICommand = useCallback((currentTypingText: string) => {
    const command = parseCommand(currentTypingText);
    
    if (command && command.type === 'gpt') {
      // AI 명령어 처리
      pushUndo(); // 상태 변경 전 스냅샷 저장
      
      // 질문을 먼저 텍스트 오브젝트로 추가
      const worldPos = getCurrentWorldPosition();
      setCanvasObjects([
        ...canvasObjects,
        {
          type: 'text',
          content: currentTypingText,
          x: worldPos.x,
          y: worldPos.y,
          scale: 1,
          fontSize: baseFontSize / scale,
          id: Date.now()
        }
      ]);
      
      setCurrentTypingText('');
      
      // 캔버스 오프셋을 멀티라인 크기만큼 이동
      const lines = currentTypingText.split('\n');
      const moveDistance = (baseFontSize * 1.6) * lines.length;
      setCanvasOffset({
        x: canvasOffset.x,
        y: canvasOffset.y - moveDistance
      });
      
      // AI 처리 시작
      return processAICommand(command);
    }
    
    return null;
  }, [
    parseCommand,
    pushUndo,
    getCurrentWorldPosition,
    setCanvasObjects,
    canvasObjects,
    setCurrentTypingText,
    baseFontSize,
    scale,
    setCanvasOffset,
    canvasOffset,
    processAICommand
  ]);

  return {
    processAICommand,
    handleAICommand
  };
};
