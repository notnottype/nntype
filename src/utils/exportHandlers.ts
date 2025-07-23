import { 
  calculateContentBoundingBox,
  drawContentForExport,
  downloadCanvas,
  createExportData,
  downloadFile,
  createSVGElement,
  addSVGBackground,
  addTextObjectToSVG,
  addCurrentTypingTextToSVG,
  addA4GuideToSVG,
  calculateSVGOutputSize,
  serializeSVG
} from './index'
import { CanvasObjectType, TextObjectType, A4GuideObjectType, Theme } from '../types'

export const createPNGExporter = (
  canvasObjects: CanvasObjectType[],
  currentTypingText: string,
  baseFontSize: number,
  getCurrentWorldPosition: () => { x: number; y: number },
  theme: Theme,
  THEME_COLORS: any
) => {
  return () => {
    const measureText = (text: string, fontSize: number) => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return text.length * 12;
      tempCtx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
      return tempCtx.measureText(text).width;
    };

    const bbox = calculateContentBoundingBox(
      canvasObjects,
      currentTypingText,
      baseFontSize,
      getCurrentWorldPosition,
      measureText
    );

    const padding = 50;
    const contentWidth = bbox.maxX - bbox.minX;
    const contentHeight = bbox.maxY - bbox.minY;

    const exportScaleFactor = 2;
    const exportWidth = contentWidth * exportScaleFactor + padding * 2;
    const exportHeight = contentHeight * exportScaleFactor + padding * 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportWidth;
    tempCanvas.height = exportHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      console.error("Could not get 2D context for PNG export.");
      return;
    }

    tempCtx.fillStyle = THEME_COLORS[theme].background;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    const tempOffsetX = padding - bbox.minX * exportScaleFactor;
    const tempOffsetY = padding - bbox.minY * exportScaleFactor;

    drawContentForExport(
      tempCtx,
      canvasObjects,
      currentTypingText,
      getCurrentWorldPosition,
      baseFontSize,
      { x: tempOffsetX, y: tempOffsetY },
      exportScaleFactor,
      theme,
      THEME_COLORS
    );

    downloadCanvas(tempCanvas, `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.png`);
  };
};

export const createJSONExporter = (
  canvasObjects: CanvasObjectType[],
  canvasOffset: { x: number; y: number },
  scale: number,
  typewriterX: number,
  typewriterY: number,
  showGrid: boolean,
  showTextBox: boolean,
  theme: Theme
) => {
  return () => {
    const data = createExportData(
      canvasObjects,
      canvasOffset,
      scale,
      typewriterX,
      typewriterY,
      showGrid,
      showTextBox,
      theme
    );
    
    downloadFile(
      JSON.stringify(data, null, 2),
      `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  };
};

export const createSVGExporter = (
  canvasObjects: CanvasObjectType[],
  currentTypingText: string,
  baseFontSize: number,
  getCurrentWorldPosition: () => { x: number; y: number },
  theme: Theme
) => {
  return () => {
    const measureText = (text: string, fontSize: number) => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return text.length * 12;
      tempCtx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
      return tempCtx.measureText(text).width;
    };

    const bbox = calculateContentBoundingBox(
      canvasObjects,
      currentTypingText,
      baseFontSize,
      getCurrentWorldPosition,
      measureText
    );

    const svgPaddingWorld = 20;
    const contentWidth = bbox.maxX - bbox.minX;
    const contentHeight = bbox.maxY - bbox.minY;

    const viewBoxMinX = bbox.minX - svgPaddingWorld;
    const viewBoxMinY = bbox.minY - svgPaddingWorld;
    const viewBoxWidth = contentWidth + 2 * svgPaddingWorld;
    const viewBoxHeight = contentHeight + 2 * svgPaddingWorld;

    const { width: outputWidth, height: outputHeight } = calculateSVGOutputSize(viewBoxWidth, viewBoxHeight, 1000);
    
    const svg = createSVGElement(viewBoxMinX, viewBoxMinY, viewBoxWidth, viewBoxHeight, outputWidth, outputHeight);
    addSVGBackground(svg, "#ffffff");

    canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
      addTextObjectToSVG(svg, obj as TextObjectType, "#000000");
    });

    if (currentTypingText.trim()) {
      const worldPos = getCurrentWorldPosition();
      addCurrentTypingTextToSVG(svg, currentTypingText, worldPos, baseFontSize, "#000000");
    }

    canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
      addA4GuideToSVG(svg, obj as A4GuideObjectType);
    });
    
    const svgString = serializeSVG(svg);
    downloadFile(svgString, `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.svg`, 'image/svg+xml');
  };
};