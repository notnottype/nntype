import { useCallback, useEffect } from 'react';
import { CanvasObjectType, TextObjectType, A4GuideObjectType, ThemeColors } from '../types';

interface UseCanvasRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasObjects: CanvasObjectType[];
  canvasWidth: number;
  canvasHeight: number;
  canvasOffset: { x: number; y: number };
  scale: number;
  selectedObject: CanvasObjectType | null;
  showGrid: boolean;
  theme: ThemeColors;
  getCurrentLineHeight: () => number;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  measureText: (text: string, fontSize: number) => number;
}

export const useCanvasRenderer = ({
  canvasRef,
  canvasObjects,
  canvasWidth,
  canvasHeight,
  canvasOffset,
  scale,
  selectedObject,
  showGrid,
  theme,
  getCurrentLineHeight,
  worldToScreen,
  measureText,
}: UseCanvasRendererProps) => {

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const baseGridSize = getCurrentLineHeight();
    const gridSize = baseGridSize;
    const offsetX = canvasOffset.x % gridSize;
    const offsetY = canvasOffset.y % gridSize;
    
    ctx.strokeStyle = theme.grid;
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
  }, [canvasOffset, canvasWidth, canvasHeight, theme, getCurrentLineHeight]);

  const drawCanvasObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.textBaseline = 'alphabetic';
    
    // Draw A4 guides first (background)
    canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
      const a4Obj = obj as A4GuideObjectType;
      const screenPos = worldToScreen(a4Obj.x, a4Obj.y);
      const screenWidth = a4Obj.width * scale;
      const screenHeight = a4Obj.height * scale;
      
      if (selectedObject && selectedObject.id === a4Obj.id) {
        ctx.fillStyle = theme.selection;
        ctx.fillRect(screenPos.x - 4, screenPos.y - 4, screenWidth + 8, screenHeight + 8);
      }
      
      ctx.strokeStyle = theme.a4Guide;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
      ctx.setLineDash([]);
      
      ctx.fillStyle = theme.a4Guide;
      ctx.font = `${14 * scale}px "Inter", sans-serif`;
      ctx.fillText('A4', screenPos.x + 10 * scale, screenPos.y + 20 * scale);
    });
    
    // Draw text objects (foreground)
    canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
      const textObj = obj as TextObjectType;
      const screenPos = worldToScreen(textObj.x, textObj.y);
      
      if (screenPos.x > -200 && screenPos.x < canvasWidth + 200 && screenPos.y > -50 && screenPos.y < canvasHeight + 50) {
        const fontSize = textObj.fontSize * scale;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        
        if (selectedObject && selectedObject.id === textObj.id) {
          ctx.fillStyle = theme.selection;
          const textWidth = measureText(textObj.content, fontSize);
          ctx.fillRect(screenPos.x - 4, screenPos.y - fontSize, textWidth + 8, fontSize + 8);
        }
        
        ctx.fillStyle = theme.text;
        ctx.fillText(textObj.content, screenPos.x, screenPos.y);
      }
    });
  }, [canvasObjects, scale, selectedObject, canvasWidth, canvasHeight, worldToScreen, measureText, theme]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Background
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    if (showGrid) {
      drawGrid(ctx);
    }
    drawCanvasObjects(ctx);
  }, [canvasRef, theme, canvasWidth, canvasHeight, showGrid, drawGrid, drawCanvasObjects]);

  useEffect(() => {
    const animate = () => {
      render();
      requestAnimationFrame(animate);
    };
    animate();
  }, [render]);

  return { render };
};