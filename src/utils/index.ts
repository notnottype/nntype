// Re-export all utility functions from specialized modules
export * from './canvasUtils';
export * from './exportUtils';
export * from './coordinateUtils';
export * from './fontUtils';
export * from './svgUtils';

// Legacy functions kept for backward compatibility
import { CanvasObjectType, TextObjectType, A4GuideObjectType } from '../types';

export const measureTextWidth = (
  text: string, 
  fontSize: number, 
  canvas: HTMLCanvasElement | null, 
  fontLoaded: boolean
): number => {
  if (!canvas || !fontLoaded) return text.length * 12;
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * 12;
  ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
  return ctx.measureText(text).width;
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const isPointInTextObject = (
  obj: TextObjectType,
  screenX: number,
  screenY: number,
  scale: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
): boolean => {
  const screenPos = worldToScreen(obj.x, obj.y);
  const fontSize = obj.fontSize * scale;
  const textWidth = measureText(obj.content, fontSize);
  const textHeight = fontSize;
  
  const padding = 5;
  return screenX >= screenPos.x - padding && 
         screenX <= screenPos.x + textWidth + padding &&
         screenY >= screenPos.y - textHeight - padding &&
         screenY <= screenPos.y + padding;
};

export const isPointInA4GuideObject = (
  obj: A4GuideObjectType,
  screenX: number,
  screenY: number,
  scale: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number }
): boolean => {
  const screenPos = worldToScreen(obj.x, obj.y);
  const screenWidth = obj.width * scale;
  const screenHeight = obj.height * scale;
  const borderWidth = 10;
  
  const inOuterRect = screenX >= screenPos.x &&
                      screenX <= screenPos.x + screenWidth &&
                      screenY >= screenPos.y &&
                      screenY <= screenPos.y + screenHeight;
  
  const inInnerRect = screenX >= screenPos.x + borderWidth &&
                      screenX <= screenPos.x + screenWidth - borderWidth &&
                      screenY >= screenPos.y + borderWidth &&
                      screenY <= screenPos.y + screenHeight - borderWidth;
  
  return inOuterRect && !inInnerRect;
};

export const isPointInObject = (
  obj: CanvasObjectType,
  screenX: number,
  screenY: number,
  scale: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
): boolean => {
  if (obj.type === 'text') {
    return isPointInTextObject(obj, screenX, screenY, scale, worldToScreen, measureText);
  } else if (obj.type === 'a4guide') {
    return isPointInA4GuideObject(obj, screenX, screenY, scale, worldToScreen);
  }
  return false;
};

export const wrapTextToLines = (text: string, maxCharsPerLine: number): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      // 연속된 빈 줄을 하나로 합치기: 마지막 줄이 빈 줄이 아닐 때만 빈 줄 추가
      // if (lines.length > 0 && lines[lines.length - 1] !== '') {
      //   lines.push('');
      // }
      continue;
    }
    
    if (paragraph.length <= maxCharsPerLine) {
      lines.push(paragraph);
      continue;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      if (word.length > maxCharsPerLine) {
        // 단어가 너무 길면 강제로 잘라냄
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = '';
        }
        
        let remainingWord = word;
        while (remainingWord.length > maxCharsPerLine) {
          lines.push(remainingWord.substring(0, maxCharsPerLine));
          remainingWord = remainingWord.substring(maxCharsPerLine);
        }
        
        if (remainingWord) {
          currentLine = remainingWord + ' ';
        }
      } else {
        const testLine = currentLine + word + ' ';
        if (testLine.length <= maxCharsPerLine + 1) { // +1 for the trailing space
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine.trim());
          }
          currentLine = word + ' ';
        }
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
  }
  
  return lines;
};

export const calculateContentBoundingBox = (
  objects: CanvasObjectType[],
  currentTypingText: string,
  baseFontSize: number,
  getCurrentWorldPosition: () => { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  objects.filter(obj => obj.type === 'text').forEach(obj => {
    const textObj = obj as TextObjectType;
    const effectiveFontSizeInWorld = textObj.fontSize;
    const textWorldWidth = measureText(textObj.content, effectiveFontSizeInWorld);
    const textWorldHeight = effectiveFontSizeInWorld;

    const worldLeft = textObj.x;
    const worldTop = textObj.y - textWorldHeight;
    const worldRight = textObj.x + textWorldWidth;
    const worldBottom = textObj.y + 4;

    minX = Math.min(minX, worldLeft);
    minY = Math.min(minY, worldTop);
    maxX = Math.max(maxX, worldRight);
    maxY = Math.max(maxY, worldBottom);
  });

  if (currentTypingText.trim()) {
    const worldPos = getCurrentWorldPosition();
    const actualTextWidth = measureText(currentTypingText, baseFontSize);
    const textHeight = baseFontSize;

    minX = Math.min(minX, worldPos.x);
    minY = Math.min(minY, worldPos.y);
    maxX = Math.max(maxX, worldPos.x + actualTextWidth);
    maxY = Math.max(maxY, worldPos.y + textHeight);
  }

  if (objects.length === 0 && !currentTypingText.trim()) {
    return { minX: -10, minY: -10, maxX: 10, maxY: 10 };
  }

  return { minX, minY, maxX, maxY };
};