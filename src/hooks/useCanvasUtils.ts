import { useCallback } from 'react';
import { CanvasObject, TextObject, GuideObject } from '../types';
import { calculateA4GuidePosition } from '../utils';
import { 
  TEXT_BOX_WIDTH_MM,
  A4_MARGIN_LR_MM,
  A4_MARGIN_TOP_MM,
  A4_WIDTH_MM,
  A4_HEIGHT_MM
} from '../constants';

interface UseCanvasUtilsProps {
  maxCharsPerLine: number;
  typewriterX: number;
  typewriterY: number;
  getTextBoxWidth: () => number;
  baseFontSize: number;
  screenToWorldLocal: (screenX: number, screenY: number) => { x: number; y: number };
  setCanvasObjects: (objects: CanvasObject[]) => void;
  canvasObjects: CanvasObject[];
}

export const useCanvasUtils = ({
  maxCharsPerLine,
  typewriterX,
  typewriterY,
  getTextBoxWidth,
  baseFontSize,
  screenToWorldLocal,
  setCanvasObjects,
  canvasObjects
}: UseCanvasUtilsProps) => {

  // Helper function to check if object has position properties
  const hasPosition = useCallback((obj: CanvasObject): obj is TextObject | GuideObject => {
    return obj.type === 'text' || obj.type === 'guide';
  }, []);

  const handleAddA4Guide = useCallback(() => {
    if (maxCharsPerLine !== 80) return;
    
    const textBoxWorldCenter = screenToWorldLocal(typewriterX, typewriterY);
    const textBoxWorldTopLeft = screenToWorldLocal(
      typewriterX - getTextBoxWidth() / 2,
      typewriterY - baseFontSize / 2
    );
    const actualTextBoxWidth = getTextBoxWidth();
    
    const a4Guide = calculateA4GuidePosition(
      textBoxWorldCenter,
      textBoxWorldTopLeft,
      actualTextBoxWidth,
      TEXT_BOX_WIDTH_MM,
      A4_MARGIN_LR_MM,
      A4_MARGIN_TOP_MM,
      A4_WIDTH_MM,
      A4_HEIGHT_MM
    );
    
    setCanvasObjects([
      ...canvasObjects,
      {
        id: Date.now(),
        type: 'guide',
        guideType: 'a4',
        x: a4Guide.x,
        y: a4Guide.y,
        width: a4Guide.width,
        height: a4Guide.height
      } as GuideObject
    ]);
  }, [
    maxCharsPerLine,
    typewriterX,
    typewriterY,
    getTextBoxWidth,
    baseFontSize,
    screenToWorldLocal,
    setCanvasObjects,
    canvasObjects
  ]);

  const importFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result || typeof result !== 'string') throw new Error('Invalid file');
        const data = JSON.parse(result);
        
        if (data.type === "infinite-typewriter-canvas" && data.elements) {
          const importedObjects = data.elements.map((elem: any) => ({
            id: elem.id || Date.now() + Math.random(),
            type: 'text' as const,
            content: elem.content || '',
            x: elem.x || 0,
            y: elem.y || 0,
            scale: elem.scale || 1,
            fontSize: elem.fontSize || 20, // 저장된 폰트 크기 로드 (20px = 10pt)
          }));
          
          setCanvasObjects(importedObjects);
          
          // Import app state if available
          if (data.appState) {
            // Note: This would need to be handled by the parent component
            // as it requires access to multiple state setters
            console.log('App state found in import:', data.appState);
          }
        }
      } catch (error) {
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  }, [setCanvasObjects]);

  const clearAll = useCallback(() => {
    setCanvasObjects([]);
  }, [setCanvasObjects]);

  const handleMaxCharsChange = useCallback((newMaxChars: number, setMaxCharsPerLine: (chars: number) => void, setCanvasOffset: (offset: { x: number; y: number }) => void, scale: number) => {
    if (newMaxChars === maxCharsPerLine) return;

    // 1. 현재 입력창의 LT 월드 좌표 구하기
    const prevTextBoxWidth = getTextBoxWidth();
    const prevLTScreen = {
      x: typewriterX - prevTextBoxWidth / 2,
      y: typewriterY - baseFontSize / 2,
    };
    const prevLTWorld = screenToWorldLocal(prevLTScreen.x, prevLTScreen.y);

    // 2. 새 폭에 맞는 입력창 폭 계산 (임시 계산)
    const tempTextBoxWidth = prevTextBoxWidth * (newMaxChars / maxCharsPerLine);
    const newLTScreen = {
      x: typewriterX - tempTextBoxWidth / 2,
      y: typewriterY - baseFontSize / 2,
    };

    // 3. 새 offset 계산 (LT 월드 좌표가 동일한 위치에 오도록)
    const newOffsetX = newLTScreen.x - prevLTWorld.x * scale;
    const newOffsetY = newLTScreen.y - prevLTWorld.y * scale;

    setMaxCharsPerLine(newMaxChars);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  }, [
    maxCharsPerLine,
    typewriterX,
    typewriterY,
    getTextBoxWidth,
    baseFontSize,
    screenToWorldLocal
  ]);

  return {
    hasPosition,
    handleAddA4Guide,
    importFile,
    clearAll,
    handleMaxCharsChange
  };
};
