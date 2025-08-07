import { useCallback, useRef } from 'react';
import { 
  drawGrid,
  drawCanvasObjects,
  drawHoverHighlight,
  drawSelectionRectangle,
  worldToScreen
} from '../utils';
import { renderLink, renderLinkPreview } from '../utils/linkUtils';
import { renderSelectionRect } from '../utils/selectionUtils';
import { CanvasMode } from '../types';
import useCanvasStore from '../store/canvasStore';

export const useCanvasRenderer = (selectedObject?: any, dragPreviewObjects?: any[]) => {
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
    canvasObjects,
    isDraggingText
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

  // Create a shared canvas context for text measurement
  const measurementCanvas = useRef<HTMLCanvasElement | null>(null);
  const measurementCtx = useRef<CanvasRenderingContext2D | null>(null);
  
  if (!measurementCanvas.current) {
    measurementCanvas.current = document.createElement('canvas');
    measurementCtx.current = measurementCanvas.current.getContext('2d');
  }
  
  const measureTextWidthLocal = useCallback((text: string, fontSize: number) => {
    const ctx = measurementCtx.current;
    if (!ctx) {
      // Fallback to approximate calculation
      return text.length * fontSize * 0.6;
    }
    
    // Set the same font used for rendering
    ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
    const metrics = ctx.measureText(text);
    return metrics.width;
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
    if (!dragPreviewObjects || dragPreviewObjects.length === 0) return;
    
    // Draw drag preview with hover highlight style
    const colors = {
      dark: { 
        hover: 'rgba(59, 130, 246, 0.25)',
        hoverBorder: 'rgba(147, 197, 253, 0.8)'
      },
      light: { 
        hover: 'rgba(59, 130, 246, 0.2)',
        hoverBorder: 'rgba(96, 165, 250, 0.7)'
      }
    };
    
    dragPreviewObjects.forEach(obj => {
      drawHoverHighlight(ctx, obj, scale, worldToScreenLocal, measureTextWidthLocal, theme, colors);
    });
  }, [dragPreviewObjects, scale, worldToScreenLocal, measureTextWidthLocal, theme]);

  const drawPinIndicator = useCallback((ctx: CanvasRenderingContext2D) => {
    if (currentMode !== CanvasMode.LINK && currentMode !== CanvasMode.SELECT) return;
    
    const pinScreenX = pinPosition.worldX * scale + canvasOffset.x;
    const pinScreenY = pinPosition.worldY * scale + canvasOffset.y;
    
    // Pin drawing logic
    
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
    
    // Draw selection highlights FIRST (as background) - using same style as hover
    // Don't draw selection highlights when dragging (drag preview will handle it)
    const allSelectedObjects = selectedObjects.length > 0 
      ? selectedObjects 
      : (selectedObject ? [selectedObject] : []);
    
    if (allSelectedObjects.length > 0 && !isDraggingText) {
      const selectionColors = {
        dark: { 
          hover: 'rgba(59, 130, 246, 0.2)',
          hoverBorder: 'rgba(147, 197, 253, 0.7)'
        },
        light: { 
          hover: 'rgba(59, 130, 246, 0.15)',
          hoverBorder: 'rgba(96, 165, 250, 0.6)'
        }
      };
      
      // Draw each selected object individually like hover
      allSelectedObjects.forEach(obj => {
        drawHoverHighlight(ctx, obj, scale, worldToScreenLocal, measureTextWidthLocal, theme, selectionColors);
      });
    }
    
    // Draw hover highlight (on top of selection but below objects)
    if (hoveredObject) {
      const colors = {
        dark: { 
          hover: 'rgba(59, 130, 246, 0.15)',
          hoverBorder: 'rgba(147, 197, 253, 0.6)'
        },
        light: { 
          hover: 'rgba(59, 130, 246, 0.1)',
          hoverBorder: 'rgba(96, 165, 250, 0.5)'
        }
      };
      drawHoverHighlight(ctx, hoveredObject, scale, worldToScreenLocal, measureTextWidthLocal, theme, colors);
    }
    
    // Draw canvas objects LAST so text appears on top
    drawCanvasObjectsLocal(ctx);
    
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
    
    // Selection highlights moved to before objects are drawn
    
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
    selectedObject,
    selectionState,
    drawPinIndicator,
    worldToScreenLocal,
    dragPreviewObjects,
    isDraggingText,
    pinPosition
  ]);

  return {
    render,
    measureTextWidthLocal,
    worldToScreenLocal
  };
};