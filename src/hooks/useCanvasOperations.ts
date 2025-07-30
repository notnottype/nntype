import { useCallback, useRef } from 'react';
import { CanvasObjectType } from '../types';
import { 
  worldToScreen,
  screenToWorld,
  measureTextWidth,
  isPointInObject
} from '../utils';

export const useCanvasOperations = (
  scale: number,
  canvasOffset: { x: number; y: number },
  fontLoaded: boolean
) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Coordinate transformation utilities
  const worldToScreenLocal = useCallback((worldX: number, worldY: number) => {
    return worldToScreen(worldX, worldY, scale, canvasOffset);
  }, [scale, canvasOffset]);

  const screenToWorldLocal = useCallback((screenX: number, screenY: number) => {
    return screenToWorld(screenX, screenY, scale, canvasOffset);
  }, [scale, canvasOffset]);

  // Text measurement utility
  const measureTextWidthLocal = useCallback((text: string, fontSize: number) => {
    return measureTextWidth(text, fontSize, canvasRef.current, fontLoaded);
  }, [fontLoaded]);

  // Object collision detection utility
  const isPointInObjectLocal = useCallback((obj: CanvasObjectType, screenX: number, screenY: number) => {
    return isPointInObject(obj, screenX, screenY, scale, worldToScreenLocal, measureTextWidthLocal);
  }, [scale, worldToScreenLocal, measureTextWidthLocal]);

  // Find object at screen coordinates
  const findObjectAtPoint = useCallback((canvasObjects: CanvasObjectType[], screenX: number, screenY: number) => {
    return canvasObjects.find(obj => isPointInObjectLocal(obj, screenX, screenY));
  }, [isPointInObjectLocal]);

  // Get mouse position relative to canvas
  const getMousePosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  return {
    canvasRef,
    worldToScreenLocal,
    screenToWorldLocal,
    measureTextWidthLocal,
    isPointInObjectLocal,
    findObjectAtPoint,
    getMousePosition
  };
};