import { CanvasObjectType, TextObjectType, A4GuideObjectType, Theme, SelectionRectangle } from '../types';

export const worldToScreen = (
  worldX: number, 
  worldY: number, 
  scale: number, 
  canvasOffset: { x: number; y: number }
) => ({
  x: worldX * scale + canvasOffset.x,
  y: worldY * scale + canvasOffset.y
});

export const screenToWorld = (
  screenX: number, 
  screenY: number, 
  scale: number, 
  canvasOffset: { x: number; y: number }
) => ({
  x: (screenX - canvasOffset.x) / scale,
  y: (screenY - canvasOffset.y) / scale
});

export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  canvasOffset: { x: number; y: number },
  gridSize: number,
  gridColor: string
) => {
  const offsetX = canvasOffset.x % gridSize;
  const offsetY = canvasOffset.y % gridSize;
  
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  
  for (let x = offsetX; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  
  for (let y = offsetY; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
};

export const drawCanvasObjects = (
  ctx: CanvasRenderingContext2D,
  canvasObjects: CanvasObjectType[],
  scale: number,
  selectedObject: CanvasObjectType | null,
  canvasWidth: number,
  canvasHeight: number,
  worldToScreenFn: (x: number, y: number) => { x: number; y: number },
  measureTextWidth: (text: string, fontSize: number) => number,
  theme: Theme,
  colors: any
) => {
  ctx.textBaseline = 'alphabetic';
  
  // A4가이드를 먼저 그려서 배경에 배치
  canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
    const a4Obj = obj as A4GuideObjectType;
    const screenPos = worldToScreenFn(a4Obj.x, a4Obj.y);
    const screenWidth = a4Obj.width * scale;
    const screenHeight = a4Obj.height * scale;
    
    if (selectedObject && selectedObject.id === a4Obj.id) {
      ctx.fillStyle = colors[theme].selection;
      ctx.fillRect(screenPos.x - 4, screenPos.y - 4, screenWidth + 8, screenHeight + 8);
    }
    
    ctx.strokeStyle = colors[theme].a4Guide;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
    ctx.setLineDash([]);
    
    ctx.fillStyle = colors[theme].a4Guide;
    ctx.font = `${14 * scale}px "Inter", sans-serif`;
    ctx.fillText('A4', screenPos.x + 10 * scale, screenPos.y + 20 * scale);
  });
  
  // 텍스트 오브젝트들을 나중에 그려서 전경에 배치
  canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
    const textObj = obj as TextObjectType;
    const screenPos = worldToScreenFn(textObj.x, textObj.y);
    
    if (screenPos.x > -200 && screenPos.x < canvasWidth + 200 && 
        screenPos.y > -50 && screenPos.y < canvasHeight + 50) {
      const fontSize = textObj.fontSize * scale;
      ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
      
      if (selectedObject && selectedObject.id === textObj.id) {
        // Handle multi-line text for selection highlight
        const lines = textObj.content.split('\n');
        const lineHeight = fontSize * 1.6;
        let maxWidth = 0;
        
        // Calculate the maximum width among all lines
        lines.forEach(line => {
          const lineWidth = measureTextWidth(line, fontSize);
          maxWidth = Math.max(maxWidth, lineWidth);
        });
        
        // 마지막 줄은 fontSize만, 나머지 줄들은 lineHeight 적용
        const totalHeight = lines.length > 1 
          ? (lines.length - 1) * lineHeight + fontSize 
          : fontSize;
        
        const rectX = screenPos.x;
        const rectY = screenPos.y - fontSize;
        const rectWidth = maxWidth;
        const rectHeight = totalHeight;
        
        // Draw background fill first
        ctx.fillStyle = colors[theme].selection;
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        
        // Draw border on top
        ctx.strokeStyle = colors[theme].selectionBorder;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
      }
      
      ctx.fillStyle = textObj.color || colors[theme].text;
      
      // Handle multi-line text
      const lines = textObj.content.split('\n');
      const lineHeight = fontSize * 1.6;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, screenPos.x, screenPos.y + (index * lineHeight));
      });
    }
  });
};

export const drawHoverHighlight = (
  ctx: CanvasRenderingContext2D,
  hoveredObject: CanvasObjectType,
  scale: number,
  worldToScreenFn: (x: number, y: number) => { x: number; y: number },
  measureTextWidth: (text: string, fontSize: number) => number,
  theme: Theme,
  colors: any
) => {
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  
  if (hoveredObject.type === 'text') {
    const textObj = hoveredObject as TextObjectType;
    const screenPos = worldToScreenFn(textObj.x, textObj.y);
    const fontSize = textObj.fontSize * scale;
    
    // Handle multi-line text for hover highlight
    const lines = textObj.content.split('\n');
    const lineHeight = fontSize * 1.6;
    let maxWidth = 0;
    
    // Calculate the maximum width among all lines
    lines.forEach(line => {
      const lineWidth = measureTextWidth(line, fontSize);
      maxWidth = Math.max(maxWidth, lineWidth);
    });
    
    // 마지막 줄은 fontSize만, 나머지 줄들은 lineHeight 적용
    const totalHeight = lines.length > 1 
      ? (lines.length - 1) * lineHeight + fontSize 
      : fontSize;
    
    const rectX = screenPos.x;
    const rectY = screenPos.y - fontSize;
    const rectWidth = maxWidth;
    const rectHeight = totalHeight;
    
    // Draw background fill first
    ctx.fillStyle = colors[theme].hover;
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    
    // Draw border on top
    ctx.strokeStyle = colors[theme].hoverBorder;
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
  } else if (hoveredObject.type === 'a4guide') {
    const a4Obj = hoveredObject as A4GuideObjectType;
    const screenPos = worldToScreenFn(a4Obj.x, a4Obj.y);
    const screenWidth = a4Obj.width * scale;
    const screenHeight = a4Obj.height * scale;
    
    // Draw background fill first
    ctx.fillStyle = colors[theme].hover;
    ctx.fillRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
    
    // Draw border on top
    ctx.strokeStyle = colors[theme].hoverBorder;
    ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
  }
};

export const setupCanvasHiDPI = (canvas: HTMLCanvasElement, width: number, height: number) => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
};

// Multi-select utility functions
export const createSelectionRectangle = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
): SelectionRectangle => {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  return { x, y, width, height };
};

export const isObjectInSelectionRect = (
  object: CanvasObjectType,
  selectionRect: SelectionRectangle,
  scale: number,
  canvasOffset: { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
): boolean => {
  if (object.type === 'text') {
    const textObj = object as TextObjectType;
    const screenPos = worldToScreen(textObj.x, textObj.y, scale, canvasOffset);
    const fontSize = textObj.fontSize * scale;
    
    // Handle multi-line text for selection rectangle intersection
    const lines = textObj.content.split('\n');
    const lineHeight = fontSize * 1.6;
    let maxWidth = 0;
    
    // Calculate the maximum width among all lines
    lines.forEach(line => {
      const lineWidth = measureText(line, fontSize);
      maxWidth = Math.max(maxWidth, lineWidth);
    });
    
    // 마지막 줄은 fontSize만, 나머지 줄들은 lineHeight 적용
    const totalHeight = lines.length > 1 
      ? (lines.length - 1) * lineHeight + fontSize 
      : fontSize;
    
    // Check if text object intersects with selection rectangle
    const textLeft = screenPos.x;
    const textTop = screenPos.y - fontSize;
    const textRight = screenPos.x + maxWidth;
    const textBottom = screenPos.y + totalHeight - fontSize;
    
    const rectLeft = selectionRect.x;
    const rectTop = selectionRect.y;
    const rectRight = selectionRect.x + selectionRect.width;
    const rectBottom = selectionRect.y + selectionRect.height;
    
    return !(textRight < rectLeft || textLeft > rectRight || textBottom < rectTop || textTop > rectBottom);
  }
  
  if (object.type === 'a4guide') {
    const guideObj = object as A4GuideObjectType;
    const screenPos = worldToScreen(guideObj.x, guideObj.y, scale, canvasOffset);
    const guideWidth = guideObj.width * scale;
    const guideHeight = guideObj.height * scale;
    
    // Check if A4 guide intersects with selection rectangle
    const guideLeft = screenPos.x;
    const guideTop = screenPos.y;
    const guideRight = screenPos.x + guideWidth;
    const guideBottom = screenPos.y + guideHeight;
    
    const rectLeft = selectionRect.x;
    const rectTop = selectionRect.y;
    const rectRight = selectionRect.x + selectionRect.width;
    const rectBottom = selectionRect.y + selectionRect.height;
    
    return !(guideRight < rectLeft || guideLeft > rectRight || guideBottom < rectTop || guideTop > rectBottom);
  }
  
  return false;
};

export const getObjectsInSelectionRect = (
  objects: CanvasObjectType[],
  selectionRect: SelectionRectangle,
  scale: number,
  canvasOffset: { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
): CanvasObjectType[] => {
  return objects.filter(obj => 
    isObjectInSelectionRect(obj, selectionRect, scale, canvasOffset, measureText)
  );
};

export const drawSelectionRectangle = (
  ctx: CanvasRenderingContext2D,
  selectionRect: SelectionRectangle,
  theme: Theme
) => {
  const selectionColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)';
  const borderColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.6)';
  
  // Fill selection rectangle
  ctx.fillStyle = selectionColor;
  ctx.fillRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
  
  // Draw selection rectangle border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
  ctx.setLineDash([]);
};

export const drawMultiSelectHighlight = (
  ctx: CanvasRenderingContext2D,
  objects: CanvasObjectType[],
  scale: number,
  canvasOffset: { x: number; y: number },
  measureText: (text: string, fontSize: number) => number,
  theme: Theme
) => {
  if (objects.length === 0) return;
  
  const highlightColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
  const borderColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.6)';
  
  // Calculate bounding box for all selected objects
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  objects.forEach(obj => {
    if (obj.type === 'text') {
      const textObj = obj as TextObjectType;
      const screenPos = worldToScreen(textObj.x, textObj.y, scale, canvasOffset);
      const fontSize = textObj.fontSize * scale;
      
      // Handle multi-line text for multi-select highlight
      const lines = textObj.content.split('\n');
      const lineHeight = fontSize * 1.6;
      let maxWidth = 0;
      
      // Calculate the maximum width among all lines
      lines.forEach(line => {
        const lineWidth = measureText(line, fontSize);
        maxWidth = Math.max(maxWidth, lineWidth);
      });
      
      // 마지막 줄은 fontSize만, 나머지 줄들은 lineHeight 적용
      const totalHeight = lines.length > 1 
        ? (lines.length - 1) * lineHeight + fontSize 
        : fontSize;
      
      const left = screenPos.x;
      const top = screenPos.y - fontSize;
      const right = screenPos.x + maxWidth;
      const bottom = screenPos.y + totalHeight - fontSize;
      
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    } else if (obj.type === 'a4guide') {
      const guideObj = obj as A4GuideObjectType;
      const screenPos = worldToScreen(guideObj.x, guideObj.y, scale, canvasOffset);
      const guideWidth = guideObj.width * scale;
      const guideHeight = guideObj.height * scale;
      
      const left = screenPos.x;
      const top = screenPos.y;
      const right = screenPos.x + guideWidth;
      const bottom = screenPos.y + guideHeight;
      
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    }
  });
  
  if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
    // 패딩 제거 - 정확한 텍스트 경계에 맞춘 하이라이트
    const boundingBoxX = minX;
    const boundingBoxY = minY;
    const boundingBoxWidth = maxX - minX;
    const boundingBoxHeight = maxY - minY;
    
    // Fill bounding box with highlight color
    ctx.fillStyle = highlightColor;
    ctx.fillRect(boundingBoxX, boundingBoxY, boundingBoxWidth, boundingBoxHeight);
    
    // Draw bounding box border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(boundingBoxX, boundingBoxY, boundingBoxWidth, boundingBoxHeight);
    ctx.setLineDash([]);
  }
};