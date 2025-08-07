// Re-export all utility functions from specialized modules
export * from './canvasUtils';
export * from './exportUtils';
export * from './coordinateUtils';
export * from './fontUtils';
export * from './svgUtils';

// Legacy functions kept for backward compatibility
import { CanvasObject, TextObject, GuideObject } from '../types';

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
  obj: TextObject,
  screenX: number,
  screenY: number,
  scale: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
): boolean => {
  const screenPos = worldToScreen(obj.x, obj.y);
  const fontSize = obj.fontSize * scale;
  
  // Handle multi-line text
  const lines = obj.content.split('\n');
  const lineHeight = fontSize * 1.6;
  let maxWidth = 0;
  
  lines.forEach(line => {
    const lineWidth = measureText(line, fontSize);
    maxWidth = Math.max(maxWidth, lineWidth);
  });
  
  // 마지막 줄은 fontSize만, 나머지 줄들은 lineHeight 적용
  const totalHeight = lines.length > 1 
    ? (lines.length - 1) * lineHeight + fontSize 
    : fontSize;
  const padding = 2; // 클릭 감지를 위한 최소 패딩
  
  return screenX >= screenPos.x - padding && 
         screenX <= screenPos.x + maxWidth + padding &&
         screenY >= screenPos.y - fontSize - padding &&
         screenY <= screenPos.y + totalHeight - fontSize + padding;
};

export const isPointInA4GuideObject = (
  obj: GuideObject,
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
  obj: CanvasObject,
  screenX: number,
  screenY: number,
  scale: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
): boolean => {
  if (obj.type === 'text') {
    return isPointInTextObject(obj, screenX, screenY, scale, worldToScreen, measureText);
  } else if (obj.type === 'guide') {
    return isPointInA4GuideObject(obj, screenX, screenY, scale, worldToScreen);
  }
  return false;
};

export const wrapTextToLines = (
  text: string, 
  maxCharsPerLine: number, 
  maxPixelWidth?: number, 
  fontSize?: number, 
  measureTextFn?: (text: string, fontSize: number) => number
): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  
  // 픽셀 기반 측정이 가능한 경우 사용
  const usePixelMeasurement = maxPixelWidth && fontSize && measureTextFn;
  
  const checkLineWidth = (line: string): boolean => {
    if (usePixelMeasurement) {
      return measureTextFn!(line, fontSize!) <= maxPixelWidth!;
    } else {
      return line.length <= maxCharsPerLine;
    }
  };
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      // 연속된 빈 줄을 하나로 합치기: 마지막 줄이 빈 줄이 아닐 때만 빈 줄 추가
      // if (lines.length > 0 && lines[lines.length - 1] !== '') {
      //   lines.push('');
      // }
      continue;
    }
    
    if (checkLineWidth(paragraph)) {
      lines.push(paragraph);
      continue;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      // 단어가 너무 긴 경우 처리
      if (!checkLineWidth(word)) {
        // 현재 줄이 있으면 먼저 추가
        if (currentLine) {
          lines.push(currentLine.trim());
          currentLine = '';
        }
        
        // 긴 단어를 강제로 잘라냄
        let remainingWord = word;
        while (!checkLineWidth(remainingWord) && remainingWord.length > 1) {
          // 이진 탐색으로 최적 길이 찾기
          let left = 1;
          let right = remainingWord.length - 1;
          let bestLength = 1;
          
          while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const testChunk = remainingWord.substring(0, mid);
            
            if (checkLineWidth(testChunk)) {
              bestLength = mid;
              left = mid + 1;
            } else {
              right = mid - 1;
            }
          }
          
          lines.push(remainingWord.substring(0, bestLength));
          remainingWord = remainingWord.substring(bestLength);
        }
        
        if (remainingWord) {
          currentLine = remainingWord + ' ';
        }
      } else {
        const testLine = currentLine + word + ' ';
        if (checkLineWidth(testLine)) {
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
  objects: CanvasObject[],
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
    const textObj = obj as TextObject;
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

/**
 * Debounce utility function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle utility function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
