import { useMemo } from 'react';
import { CanvasObject, Theme } from '../types';
import { createPNGExporter, createJSONExporter, createSVGExporter } from '../utils/exportHandlers';
import { calculateContentBoundingBox } from '../utils';

interface UseExportLogicProps {
  canvasObjects: CanvasObject[];
  currentTypingText: string;
  baseFontSize: number;
  getCurrentWorldPosition: () => { x: number; y: number };
  canvasOffset: { x: number; y: number };
  scale: number;
  typewriterX: number;
  typewriterY: number;
  showGrid: boolean;
  showTextBox: boolean;
  theme: Theme;
  THEME_COLORS: any;
}

export const useExportLogic = ({
  canvasObjects,
  currentTypingText,
  baseFontSize,
  getCurrentWorldPosition,
  canvasOffset,
  scale,
  typewriterX,
  typewriterY,
  showGrid,
  showTextBox,
  theme,
  THEME_COLORS
}: UseExportLogicProps) => {
  
  // Reuse canvas for text measurement to prevent memory leaks
  const getTempCanvas = () => {
    const tempCanvas = document.createElement('canvas');
    return tempCanvas;
  };

  const calculateBounds = () => {
    const measureText = (text: string, fontSize: number) => {
      const tempCanvas = getTempCanvas();
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return text.length * 12;
      tempCtx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
      return tempCtx.measureText(text).width;
    };

    return calculateContentBoundingBox(
      canvasObjects,
      currentTypingText,
      baseFontSize,
      getCurrentWorldPosition,
      measureText
    );
  };

  const exportAsPNG = useMemo(() => 
    createPNGExporter(
      canvasObjects,
      currentTypingText,
      baseFontSize,
      getCurrentWorldPosition,
      theme,
      THEME_COLORS
    ),
    [canvasObjects, currentTypingText, baseFontSize, getCurrentWorldPosition, theme, THEME_COLORS]
  );

  const exportAsJSON = useMemo(() =>
    createJSONExporter(
      canvasObjects,
      canvasOffset,
      scale,
      typewriterX,
      typewriterY,
      showGrid,
      showTextBox,
      theme
    ),
    [canvasObjects, canvasOffset, scale, typewriterX, typewriterY, showGrid, showTextBox, theme]
  );

  const exportAsSVG = useMemo(() =>
    createSVGExporter(
      canvasObjects,
      currentTypingText,
      baseFontSize,
      getCurrentWorldPosition,
      theme
    ),
    [canvasObjects, currentTypingText, baseFontSize, getCurrentWorldPosition, theme]
  );

  return {
    exportAsPNG,
    exportAsJSON,
    exportAsSVG,
    calculateBounds
  };
};
