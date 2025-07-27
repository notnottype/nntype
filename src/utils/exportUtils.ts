import { CanvasObjectType, TextObjectType, A4GuideObjectType, Theme, ExportData } from '../types';

export const drawContentForExport = (
  ctx: CanvasRenderingContext2D,
  canvasObjects: CanvasObjectType[],
  currentTypingText: string,
  getCurrentWorldPosition: () => { x: number; y: number },
  baseFontSize: number,
  currentOffset: { x: number; y: number },
  currentScale: number,
  theme: Theme,
  colors: any
) => {
  ctx.textBaseline = 'alphabetic';

  canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
    const textObj = obj as TextObjectType;
    const screenX = textObj.x * currentScale + currentOffset.x;
    const screenY = textObj.y * currentScale + currentOffset.y;

    const fontSize = textObj.fontSize * currentScale;
    ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = textObj.color || colors[theme].text;
    
    // Handle multi-line text
    const lines = textObj.content.split('\n');
    const lineHeight = fontSize * 1.6;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, screenX, screenY + (index * lineHeight));
    });
  });

  if (currentTypingText.trim()) {
    const worldPos = getCurrentWorldPosition();
    const screenX = worldPos.x * currentScale + currentOffset.x;
    const screenY = worldPos.y * currentScale + currentOffset.y;
    const fontSize = baseFontSize * currentScale;
    ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
    
    // Handle multi-line text
    const lines = currentTypingText.split('\n');
    const lineHeight = fontSize * 1.6;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, screenX, screenY + (index * lineHeight));
    });
  }

  // A4Guide 오브젝트들 렌더링
  canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
    const a4Obj = obj as A4GuideObjectType;
    const a4ScreenX = a4Obj.x * currentScale + currentOffset.x;
    const a4ScreenY = a4Obj.y * currentScale + currentOffset.y;
    const a4ScreenWidth = a4Obj.width * currentScale;
    const a4ScreenHeight = a4Obj.height * currentScale;

    ctx.strokeStyle = colors[theme].a4Guide;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(a4ScreenX, a4ScreenY, a4ScreenWidth, a4ScreenHeight);
    ctx.setLineDash([]);

    ctx.fillStyle = colors[theme].a4Guide;
    ctx.font = `${14 * currentScale}px "Inter", sans-serif`;
    ctx.fillText('A4', a4ScreenX + 10 * currentScale, a4ScreenY + 20 * currentScale);
  });
};

export const createExportData = (
  canvasObjects: CanvasObjectType[],
  canvasOffset: { x: number; y: number },
  scale: number,
  typewriterX: number,
  typewriterY: number,
  showGrid: boolean,
  showTextBox: boolean,
  theme: Theme
): ExportData => {
  return {
    version: "1.0",
    type: "infinite-typewriter-canvas",
    elements: canvasObjects.map(obj => {
      if (obj.type === 'text') {
        const textObj = obj as TextObjectType;
        return {
          id: textObj.id,
          type: textObj.type,
          content: textObj.content,
          x: textObj.x,
          y: textObj.y,
          scale: textObj.scale,
          fontSize: textObj.fontSize
        };
      } else if (obj.type === 'a4guide') {
        const a4Obj = obj as A4GuideObjectType;
        return {
          id: a4Obj.id,
          type: a4Obj.type,
          x: a4Obj.x,
          y: a4Obj.y,
          width: a4Obj.width,
          height: a4Obj.height
        };
      }
      return obj;
    }),
    appState: {
      canvasOffset: canvasOffset,
      scale: scale,
      typewriterPosition: {
        x: typewriterX,
        y: typewriterY
      },
      showGrid: showGrid,
      showTextBox: showTextBox,
      theme: theme
    }
  };
};

export const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL();
  link.click();
  URL.revokeObjectURL(link.href);
};