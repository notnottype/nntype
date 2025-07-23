import { CanvasObjectType, TextObjectType, A4GuideObjectType, Theme } from '../types';

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
        ctx.fillStyle = colors[theme].selection;
        const textWidth = measureTextWidth(textObj.content, fontSize);
        const textHeight = fontSize;
        ctx.fillRect(screenPos.x - 4, screenPos.y - textHeight, textWidth + 8, textHeight + 8);
      }
      
      ctx.fillStyle = colors[theme].text;
      ctx.fillText(textObj.content, screenPos.x, screenPos.y);
    }
  });
};

export const drawHoverHighlight = (
  ctx: CanvasRenderingContext2D,
  hoveredObject: CanvasObjectType,
  scale: number,
  worldToScreenFn: (x: number, y: number) => { x: number; y: number },
  measureTextWidth: (text: string, fontSize: number) => number
) => {
  ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)';
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash([]);
  
  if (hoveredObject.type === 'text') {
    const textObj = hoveredObject as TextObjectType;
    const screenPos = worldToScreenFn(textObj.x, textObj.y);
    const fontSize = textObj.fontSize * scale;
    const textWidth = measureTextWidth(textObj.content, fontSize);
    const textHeight = fontSize;
    const padding = 4;
    ctx.strokeRect(
      screenPos.x - padding, 
      screenPos.y - textHeight - padding, 
      textWidth + padding * 2, 
      textHeight + padding * 2
    );
  } else if (hoveredObject.type === 'a4guide') {
    const a4Obj = hoveredObject as A4GuideObjectType;
    const screenPos = worldToScreenFn(a4Obj.x, a4Obj.y);
    const screenWidth = a4Obj.width * scale;
    const screenHeight = a4Obj.height * scale;
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