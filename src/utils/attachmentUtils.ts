import { CanvasObject, TextObject, GuideObject } from '../types';

// Calculate smart edge attachment points for an object
export const getAttachmentPoints = (
  obj: CanvasObject,
  scale: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
) => {
  const attachmentPoints: Array<{
    position: 'top' | 'right' | 'bottom' | 'left' | 'center';
    worldPos: { x: number; y: number };
    screenPos: { x: number; y: number };
  }> = [];

  if (obj.type === 'text') {
    const textObj = obj as TextObject;
    const lines = textObj.content.split('\n');
    const lineHeight = textObj.fontSize * 1.6;
    let maxWidth = 0;
    
    // Calculate max width
    lines.forEach(line => {
      const lineWidth = measureText(line, textObj.fontSize) / scale;
      maxWidth = Math.max(maxWidth, lineWidth);
    });
    
    const totalHeight = lines.length > 1 
      ? (lines.length - 1) * lineHeight + textObj.fontSize 
      : textObj.fontSize;
    
    // Calculate attachment points in world coordinates
    const centerX = textObj.x + maxWidth / 2;
    const centerY = textObj.y + totalHeight / 2 - textObj.fontSize;
    
    const points = [
      { position: 'top' as const, worldPos: { x: centerX, y: textObj.y - textObj.fontSize } },
      { position: 'right' as const, worldPos: { x: textObj.x + maxWidth, y: centerY } },
      { position: 'bottom' as const, worldPos: { x: centerX, y: textObj.y + totalHeight - textObj.fontSize } },
      { position: 'left' as const, worldPos: { x: textObj.x, y: centerY } },
      { position: 'center' as const, worldPos: { x: centerX, y: centerY } }
    ];
    
    points.forEach(point => {
      const screenPos = worldToScreen(point.worldPos.x, point.worldPos.y);
      attachmentPoints.push({
        position: point.position,
        worldPos: point.worldPos,
        screenPos
      });
    });
  } else if (obj.type === 'guide') {
    const guideObj = obj as GuideObject;
    const centerX = guideObj.x + guideObj.width / 2;
    const centerY = guideObj.y + guideObj.height / 2;
    
    const points = [
      { position: 'top' as const, worldPos: { x: centerX, y: guideObj.y } },
      { position: 'right' as const, worldPos: { x: guideObj.x + guideObj.width, y: centerY } },
      { position: 'bottom' as const, worldPos: { x: centerX, y: guideObj.y + guideObj.height } },
      { position: 'left' as const, worldPos: { x: guideObj.x, y: centerY } },
      { position: 'center' as const, worldPos: { x: centerX, y: centerY } }
    ];
    
    points.forEach(point => {
      const screenPos = worldToScreen(point.worldPos.x, point.worldPos.y);
      attachmentPoints.push({
        position: point.position,
        worldPos: point.worldPos,
        screenPos
      });
    });
  }
  
  return attachmentPoints;
};

// Find nearest attachment point to a screen position
export const getNearestAttachmentPoint = (
  attachmentPoints: Array<{
    position: 'top' | 'right' | 'bottom' | 'left' | 'center';
    worldPos: { x: number; y: number };
    screenPos: { x: number; y: number };
  }>,
  screenX: number,
  screenY: number,
  maxDistance: number = 20 // pixels
): {
  position: 'top' | 'right' | 'bottom' | 'left' | 'center';
  worldPos: { x: number; y: number };
  screenPos: { x: number; y: number };
} | null => {
  let nearestPoint = null;
  let minDistance = maxDistance;
  
  attachmentPoints.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(point.screenPos.x - screenX, 2) + 
      Math.pow(point.screenPos.y - screenY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  });
  
  return nearestPoint;
};

// Draw attachment point indicators as edge areas instead of dots
export const drawAttachmentPoints = (
  ctx: CanvasRenderingContext2D,
  attachmentPoints: Array<{
    position: 'top' | 'right' | 'bottom' | 'left' | 'center';
    worldPos: { x: number; y: number };
    screenPos: { x: number; y: number };
  }>,
  highlightedPoint: { position: string; worldPos: { x: number; y: number } } | null = null,
  obj?: CanvasObject,
  scale?: number,
  worldToScreen?: (x: number, y: number) => { x: number; y: number },
  measureText?: (text: string, fontSize: number) => number
) => {
  ctx.save();
  
  // If we have object data, draw edge areas instead of points
  if (obj && scale && worldToScreen && measureText) {
    let bounds;
    
    if (obj.type === 'text') {
      const textObj = obj as TextObject;
      const lines = textObj.content.split('\n');
      const lineHeight = textObj.fontSize * 1.6;
      let maxWidth = 0;
      
      lines.forEach(line => {
        const lineWidth = measureText(line, textObj.fontSize) / scale;
        maxWidth = Math.max(maxWidth, lineWidth);
      });
      
      const totalHeight = lines.length > 1 
        ? (lines.length - 1) * lineHeight + textObj.fontSize 
        : textObj.fontSize;
      
      bounds = {
        x: textObj.x,
        y: textObj.y - textObj.fontSize,
        width: maxWidth,
        height: totalHeight
      };
    } else if (obj.type === 'guide') {
      const guideObj = obj as GuideObject;
      bounds = {
        x: guideObj.x,
        y: guideObj.y,
        width: guideObj.width,
        height: guideObj.height
      };
    }
    
    if (bounds) {
      const screenBounds = {
        x: worldToScreen(bounds.x, bounds.y).x,
        y: worldToScreen(bounds.x, bounds.y).y,
        width: bounds.width * scale,
        height: bounds.height * scale
      };
      
      // Draw edge areas with subtle highlighting
      const edgeThickness = 4 * scale;
      
      attachmentPoints.forEach(point => {
        const isHighlighted = highlightedPoint && 
          highlightedPoint.position === point.position &&
          Math.abs(highlightedPoint.worldPos.x - point.worldPos.x) < 0.1 &&
          Math.abs(highlightedPoint.worldPos.y - point.worldPos.y) < 0.1;
        
        ctx.strokeStyle = isHighlighted ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = isHighlighted ? 3 : 2;
        
        ctx.beginPath();
        
        switch (point.position) {
          case 'top':
            ctx.moveTo(screenBounds.x, screenBounds.y);
            ctx.lineTo(screenBounds.x + screenBounds.width, screenBounds.y);
            break;
          case 'right':
            ctx.moveTo(screenBounds.x + screenBounds.width, screenBounds.y);
            ctx.lineTo(screenBounds.x + screenBounds.width, screenBounds.y + screenBounds.height);
            break;
          case 'bottom':
            ctx.moveTo(screenBounds.x, screenBounds.y + screenBounds.height);
            ctx.lineTo(screenBounds.x + screenBounds.width, screenBounds.y + screenBounds.height);
            break;
          case 'left':
            ctx.moveTo(screenBounds.x, screenBounds.y);
            ctx.lineTo(screenBounds.x, screenBounds.y + screenBounds.height);
            break;
          case 'center':
            // Draw a small dot at center for center attachment
            ctx.arc(point.screenPos.x, point.screenPos.y, isHighlighted ? 6 : 4, 0, Math.PI * 2);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
            break;
        }
        
        if (point.position !== 'center') {
          ctx.stroke();
        }
      });
    }
  } else {
    // Fallback to dots if object data not available
    attachmentPoints.forEach(point => {
      const isHighlighted = highlightedPoint && 
        highlightedPoint.position === point.position &&
        Math.abs(highlightedPoint.worldPos.x - point.worldPos.x) < 0.1 &&
        Math.abs(highlightedPoint.worldPos.y - point.worldPos.y) < 0.1;
      
      ctx.beginPath();
      ctx.arc(point.screenPos.x, point.screenPos.y, isHighlighted ? 8 : 6, 0, Math.PI * 2);
      
      if (isHighlighted) {
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 1;
      }
      
      ctx.fill();
      ctx.stroke();
    });
  }
  
  ctx.restore();
};