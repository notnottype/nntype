import { useCallback, useMemo, useRef } from 'react';
import { 
  drawGrid,
  drawCanvasObjects,
  drawHoverHighlight,
  drawSelectionRectangle,
  drawMultiSelectHighlight,
  worldToScreen,
  measureTextWidth
} from '../utils';
import { renderLink, renderLinkPreview } from '../utils/linkUtils';
import { renderSelectionRect } from '../utils/selectionUtils';
import { CanvasMode, Theme, THEME_COLORS } from '../types';
import useCanvasStore from '../store/canvasStore';

export const useCanvasRenderer = () => {
  const {
    canvasWidth,
    canvasHeight,
    theme,
    showGrid,
    hoveredObject,
    selectedObjects,
    selectionRect,
    isSelecting,
    scale,
    canvasOffset,
    currentMode,
    links,
    linkState,
    selectionState,
    pinPosition,
    pinHoveredObject,
    hoveredLink,
    selectedLinks,
    canvasObjects
  } = useCanvasStore();

  const drawGridLocal = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    const gridSize = 20; // Fixed grid size in pixels, not scaled
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    drawGrid(ctx, canvasWidth, canvasHeight, canvasOffset, gridSize, gridColor);
  }, [canvasWidth, canvasHeight, scale, canvasOffset, theme, showGrid]);

  const worldToScreenLocal = useCallback((worldX: number, worldY: number) => {
    return worldToScreen(worldX, worldY, scale, canvasOffset);
  }, [scale, canvasOffset]);

  const measureTextWidthLocal = useCallback((text: string, fontSize: number) => {
    return text.length * fontSize * 0.6; // Approximate width calculation
  }, []);

  const drawCanvasObjectsLocal = useCallback((ctx: CanvasRenderingContext2D) => {
    drawCanvasObjects(
      ctx, 
      canvasObjects, 
      scale, 
      null, // selectedObject - we'll need to get this from store
      canvasWidth, 
      canvasHeight, 
      worldToScreenLocal, 
      measureTextWidthLocal, 
      theme, 
      { dark: { background: '#0f172a', text: '#f8fafc', a4Guide: '#64748b' }, light: { background: '#ffffff', text: '#1e293b', a4Guide: '#64748b' } }, // colors
      selectedObjects
    );
  }, [canvasObjects, scale, canvasWidth, canvasHeight, worldToScreenLocal, measureTextWidthLocal, theme, selectedObjects]);

  const drawDragPreviewObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    if (selectedObjects.length === 0) return;
    
    ctx.save();
    ctx.globalAlpha = 0.5;
    
    selectedObjects.forEach(obj => {
      if (obj.type === 'text') {
        const textObj = obj as any;
        const screenPos = worldToScreenLocal(textObj.x, textObj.y);
        const fontSize = textObj.fontSize * scale;
        
        ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
        ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const lines = textObj.content.split('\n');
        lines.forEach((line: string, index: number) => {
          ctx.fillText(line, screenPos.x, screenPos.y + (index * fontSize * 1.6));
        });
      }
    });
    
    ctx.restore();
  }, [selectedObjects, worldToScreenLocal, scale, theme]);

  const drawPinIndicator = useCallback((ctx: CanvasRenderingContext2D) => {
    if (currentMode !== CanvasMode.LINK && currentMode !== CanvasMode.SELECT) return;
    
    const pinScreenX = pinPosition.worldX * scale + canvasOffset.x;
    const pinScreenY = pinPosition.worldY * scale + canvasOffset.y;
    
    ctx.save();
    
    const isHoveringObject = pinHoveredObject !== null;
    const pinColor = currentMode === CanvasMode.LINK ? '#ff6b6b' : '#4a9eff';
    const hoverColor = currentMode === CanvasMode.LINK ? '#ff4444' : '#2563eb';
    
    ctx.strokeStyle = isHoveringObject ? hoverColor : pinColor;
    ctx.fillStyle = isHoveringObject ? hoverColor : pinColor;
    ctx.lineWidth = isHoveringObject ? 2 : 1;
    
    const crossSize = isHoveringObject ? 12 : 10;
    ctx.beginPath();
    ctx.moveTo(pinScreenX - crossSize, pinScreenY);
    ctx.lineTo(pinScreenX + crossSize, pinScreenY);
    ctx.moveTo(pinScreenX, pinScreenY - crossSize);
    ctx.lineTo(pinScreenX, pinScreenY + crossSize);
    ctx.stroke();
    
    if (isHoveringObject) {
      ctx.beginPath();
      ctx.arc(pinScreenX, pinScreenY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const arrowOffset = crossSize + 5;
    const arrowSize = isHoveringObject ? 6 : 4;
    ctx.beginPath();
    ctx.moveTo(pinScreenX, pinScreenY + arrowOffset);
    ctx.lineTo(pinScreenX - arrowSize, pinScreenY + arrowOffset + arrowSize);
    ctx.lineTo(pinScreenX + arrowSize, pinScreenY + arrowOffset + arrowSize);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }, [currentMode, pinPosition, canvasOffset, scale, pinHoveredObject]);

  const render = useCallback((canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Background
    ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw grid
    drawGridLocal(ctx);
    
    // Draw canvas objects
    drawCanvasObjectsLocal(ctx);
    
    // Draw hover highlight
    if (hoveredObject) {
      drawHoverHighlight(ctx, hoveredObject, scale, canvasOffset, measureTextWidthLocal, theme);
    }
    
    // Draw drag preview
    drawDragPreviewObjects(ctx);
    
    // Draw selection rectangle
    if (selectionRect && isSelecting) {
      drawSelectionRectangle(ctx, selectionRect, theme);
    }
    
    // Draw links
    links.forEach(link => {
      const fromObject = canvasObjects.find(obj => obj.id.toString() === link.from);
      const toObject = canvasObjects.find(obj => obj.id.toString() === link.to);
      
      if (fromObject && toObject) {
        const isSelected = selectedLinks.has(link.id);
        const isHovered = hoveredLink?.id === link.id;
        renderLink(ctx, link, fromObject, toObject, scale, canvasOffset, isSelected, isHovered, measureTextWidthLocal);
      }
    });
    
    // Draw link preview
    if (currentMode === CanvasMode.LINK && linkState.previewPath) {
      renderLinkPreview(ctx, linkState.previewPath.from, linkState.previewPath.to, scale, canvasOffset);
    }
    
    // Draw selection highlights
    if (currentMode === CanvasMode.SELECT && selectedObjects.length > 0) {
      drawMultiSelectHighlight(ctx, selectedObjects, scale, canvasOffset, measureTextWidthLocal, theme);
    }
    
    // Draw selection area
    if (currentMode === CanvasMode.SELECT && selectionState.dragArea) {
      const rect = {
        x: selectionState.dragArea.start.x,
        y: selectionState.dragArea.start.y,
        width: selectionState.dragArea.end.x - selectionState.dragArea.start.x,
        height: selectionState.dragArea.end.y - selectionState.dragArea.start.y
      };
      renderSelectionRect(ctx, rect, scale, canvasOffset);
    }
    
    // Draw pin indicator
    drawPinIndicator(ctx);
  }, [
    canvasWidth,
    canvasHeight,
    drawGridLocal,
    drawCanvasObjectsLocal,
    hoveredObject,
    scale,
    canvasOffset,
    measureTextWidthLocal,
    theme,
    drawDragPreviewObjects,
    selectionRect,
    isSelecting,
    links,
    canvasObjects,
    selectedLinks,
    hoveredLink,
    currentMode,
    linkState,
    selectedObjects,
    selectionState,
    drawPinIndicator
  ]);

  return {
    render,
    measureTextWidthLocal,
    worldToScreenLocal
  };
};