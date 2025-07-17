import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Move, Download, Upload, Grid, FileText, Image, Code, RotateCcw, Trash2, Eye, EyeOff, ZoomIn, ZoomOut, FileDown, Sun, Moon } from 'lucide-react';

// 텍스트 오브젝트 타입 정의
interface TextObjectType {
  id: number;
  content: string;
  x: number;
  y: number;
  scale: number;
}

// 테마 타입
type Theme = 'light' | 'dark';

// 단축키 정보 오버레이 컴포넌트
const ShortcutsOverlay = ({ theme }: { theme: Theme }) => {
  return (
    <div className={`absolute top-20 right-4 ${
      theme === 'dark' 
        ? 'bg-black/80 text-white' 
        : 'bg-white/90 text-gray-900'
    } backdrop-blur-sm p-4 rounded-xl shadow-xl text-xs font-mono`}>
      <div className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        Shortcuts
      </div>
      <div className="space-y-1">
        <div>Pan canvas: Space + Drag</div>
        <div>Move view: Shift + ↑↓←→</div>
        <div>Zoom: Ctrl + Scroll</div>
        <div>Zoom in/out: Ctrl + / -</div>
        <div>UI Size: Alt + / -</div>
        <div>Reset zoom: Ctrl + 0</div>
        <div>Reset view: Cmd + R</div>
        <div>Delete selected: Del</div>
      </div>
    </div>
  );
};
const CanvasInfoOverlay = ({ canvasOffset, scale, textObjects, selectedObject, typewriterX, typewriterY, baseFontSize, getTextBoxWidth, screenToWorld, theme }: {
  canvasOffset: { x: number; y: number; };
  scale: number;
  textObjects: TextObjectType[];
  selectedObject: TextObjectType | null;
  typewriterX: number;
  typewriterY: number;
  baseFontSize: number;
  getTextBoxWidth: () => number;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number; };
  theme: Theme;
}) => {
  const textBoxWidth = getTextBoxWidth();
  const textBoxLeft = typewriterX - textBoxWidth / 2;
  const textBoxTop = typewriterY - baseFontSize / 2;
  const worldPos = screenToWorld(textBoxLeft, textBoxTop);

  return (
    <div className={`absolute top-20 left-4 ${
      theme === 'dark' 
        ? 'bg-black/80 text-white' 
        : 'bg-white/90 text-gray-900'
    } backdrop-blur-sm p-4 rounded-xl shadow-xl text-xs font-mono`}>
      <div className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        Canvas Info
      </div>
      <div className="space-y-1">
        <div>Offset: ({Math.round(-canvasOffset.x)}, {Math.round(-canvasOffset.y)})</div>
        <div>Scale: {scale.toFixed(2)}x</div>
        <div>Objects: {textObjects.length}</div>
        <div>Origin: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
        {selectedObject && (
          <div className={`mt-2 pt-2 border-t ${
            theme === 'dark' ? 'border-gray-600 text-green-400' : 'border-gray-300 text-green-600'
          }`}>
            Selected: "{selectedObject.content.substring(0, 20)}{selectedObject.content.length > 20 ? '...' : ''}"
          </div>
        )}
      </div>
    </div>
  );
};

const InfiniteTypewriterCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [textObjects, setTextObjects] = useState<TextObjectType[]>([]);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState<TextObjectType | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 64);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showA4Guide, setShowA4Guide] = useState(false);
  const [a4GuideOriginWorld, setA4GuideOriginWorld] = useState<{ x: number; y: number } | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');

  // Typewriter settings
  const typewriterX = canvasWidth / 2;
  const typewriterY = canvasHeight / 2;
  const typewriterLineHeight = 36;
  const maxCharsPerLine = 52; // 한글 기준 52자로 조정
  const [baseFontSize, setBaseFontSize] = useState(20);

  // Constants for A4 paper size
  const A4_WIDTH_WORLD = 210 * 3.7795;
  const A4_HEIGHT_WORLD = 297 * 3.7795;
  const A4_LEFT_MARGIN_WORLD = 10;
  const A4_TOP_MARGIN_WORLD = 10;
  
  // Theme colors
  const colors = {
    dark: {
      background: '#0a0a0a',
      text: 'rgba(255, 255, 255, 0.9)',
      grid: 'rgba(255, 255, 255, 0.05)',
      selection: 'rgba(59, 130, 246, 0.2)',
      a4Guide: 'rgba(59, 130, 246, 0.3)',
      inputBg: 'rgba(0, 0, 0, 0.6)',
      inputBorder: 'rgba(59, 130, 246, 0.3)',
    },
    light: {
      background: '#ffffff',
      text: 'rgba(0, 0, 0, 0.9)',
      grid: 'rgba(0, 0, 0, 0.05)',
      selection: 'rgba(59, 130, 246, 0.2)',
      a4Guide: 'rgba(59, 130, 246, 0.4)',
      inputBg: 'rgba(255, 255, 255, 0.8)',
      inputBorder: 'rgba(59, 130, 246, 0.4)',
    }
  };

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    const checkFont = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          const testCanvas = document.createElement('canvas');
          const testCtx = testCanvas.getContext('2d');
          if (testCtx) {
            testCtx.font = '12px "JetBrains Mono", monospace';
            testCtx.fillText('Test', 0, 0);
          }
          setTimeout(() => setFontLoaded(true), 100);
        });
      } else {
        setTimeout(() => setFontLoaded(true), 1500);
      }
    };
    checkFont();
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);
  
  const measureTextWidth = useCallback((text: string, fontSize: number = baseFontSize) => {
    const canvas = canvasRef.current;
    if (!canvas || !fontLoaded) return text.length * 12;
    const ctx = canvas.getContext('2d');
    if (!ctx) return text.length * 12;
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    return ctx.measureText(text).width;
  }, [baseFontSize, fontLoaded]);

  const getTextBoxWidth = useCallback(() => {
    return measureTextWidth('A'.repeat(maxCharsPerLine));
  }, [measureTextWidth, maxCharsPerLine]);

  const worldToScreen = useCallback((worldX: number, worldY: number) => ({
    x: worldX * scale + canvasOffset.x,
    y: worldY * scale + canvasOffset.y
  }), [scale, canvasOffset]);

  const screenToWorld = useCallback((screenX: number, screenY: number) => ({
    x: (screenX - canvasOffset.x) / scale,
    y: (screenY - canvasOffset.y) / scale
  }), [scale, canvasOffset]);

  const zoomToLevel = useCallback((newScale: number) => {
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize / 2;
    
    const currentWorldPos = screenToWorld(textBoxLeft, textBoxTop);
    
    const newScreenX = currentWorldPos.x * newScale;
    const newScreenY = currentWorldPos.y * newScale;
    
    const newOffsetX = textBoxLeft - newScreenX;
    const newOffsetY = textBoxTop - newScreenY;
    
    setScale(newScale);
    setCanvasOffset({
      x: newOffsetX,
      y: newOffsetY
    });
  }, [getTextBoxWidth, screenToWorld, typewriterX, typewriterY, baseFontSize]);

  const getCurrentWorldPosition = useCallback(() => {
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2 + 8; // 8px 패딩 추가
    // 텍스트 베이스라인을 고려한 Y 위치 계산
    const textBoxBaseline = typewriterY + baseFontSize / 2 - 4;
    return screenToWorld(textBoxLeft, textBoxBaseline);
  }, [getTextBoxWidth, screenToWorld, typewriterX, typewriterY, baseFontSize]);

  const isPointInText = useCallback((textObj: TextObjectType, screenX: number, screenY: number) => {
    const screenPos = worldToScreen(textObj.x, textObj.y);
    const fontSize = baseFontSize * (textObj.scale || 1) * scale;
    const textWidth = measureTextWidth(textObj.content, fontSize);
    const textHeight = fontSize;
    
    return screenX >= screenPos.x && 
           screenX <= screenPos.x + textWidth &&
           screenY >= screenPos.y - textHeight &&
           screenY <= screenPos.y + 4;
  }, [baseFontSize, scale, measureTextWidth, worldToScreen]);

  const centerTypewriter = useCallback(() => {
    setCanvasOffset({
      x: typewriterX,
      y: typewriterY
    });
  }, [typewriterX, typewriterY]);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 64;
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      setTimeout(centerTypewriter, 0); 
    };
    window.addEventListener('resize', handleResize);
    setTimeout(centerTypewriter, 0);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerTypewriter]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const baseGridSize = 20;
    const gridSize = baseGridSize * scale;
    const offsetX = canvasOffset.x % gridSize;
    const offsetY = canvasOffset.y % gridSize;
    
    ctx.strokeStyle = colors[theme].grid;
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
  }, [canvasOffset, scale, canvasWidth, canvasHeight, theme]);

  const drawA4Guide = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!a4GuideOriginWorld) return;

    const screenPos = worldToScreen(a4GuideOriginWorld.x, a4GuideOriginWorld.y);
    const screenWidth = A4_WIDTH_WORLD * scale;
    const screenHeight = A4_HEIGHT_WORLD * scale;

    ctx.strokeStyle = colors[theme].a4Guide;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
    ctx.setLineDash([]);

    ctx.fillStyle = colors[theme].a4Guide;
    ctx.font = `${14 * scale}px "Inter", sans-serif`;
    ctx.fillText('A4', screenPos.x + 10 * scale, screenPos.y + 20 * scale);
  }, [scale, worldToScreen, a4GuideOriginWorld, A4_WIDTH_WORLD, A4_HEIGHT_WORLD, theme]);

  const drawTextObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.textBaseline = 'alphabetic';
    
    textObjects.forEach(textObj => {
      const screenPos = worldToScreen(textObj.x, textObj.y);
      
      if (screenPos.x > -200 && screenPos.x < canvasWidth + 200 && screenPos.y > -50 && screenPos.y < canvasHeight + 50) {
        const fontSize = baseFontSize * (textObj.scale || 1) * scale;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        
        if (selectedObject && selectedObject.id === textObj.id) {
          ctx.fillStyle = colors[theme].selection;
          const textWidth = measureTextWidth(textObj.content, fontSize);
          ctx.fillRect(screenPos.x - 4, screenPos.y - fontSize, textWidth + 8, fontSize + 8);
        }
        
        ctx.fillStyle = colors[theme].text;
        ctx.fillText(textObj.content, screenPos.x, screenPos.y);
      }
    });
  }, [textObjects, baseFontSize, scale, selectedObject, canvasWidth, canvasHeight, worldToScreen, measureTextWidth, theme]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Background
    ctx.fillStyle = colors[theme].background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    if (showGrid) {
      drawGrid(ctx);
    }
    if (showA4Guide) {
      drawA4Guide(ctx);
    }
    drawTextObjects(ctx);
    
  }, [canvasOffset, scale, textObjects, selectedObject, getTextBoxWidth, drawGrid, drawTextObjects, canvasWidth, canvasHeight, typewriterX, typewriterY, baseFontSize, screenToWorld, showGrid, showA4Guide, drawA4Guide, theme]);

  useEffect(() => {
    const animate = () => {
      render();
      requestAnimationFrame(animate);
    };
    animate();
  }, [render]);

  useEffect(() => {
    if (showA4Guide && !a4GuideOriginWorld) {
      const textBoxWorldTopLeft = screenToWorld(
        typewriterX - getTextBoxWidth() / 2,
        typewriterY - baseFontSize / 2
      );
      const a4OriginX = textBoxWorldTopLeft.x - A4_LEFT_MARGIN_WORLD;
      const a4OriginY = textBoxWorldTopLeft.y - A4_TOP_MARGIN_WORLD;
      setA4GuideOriginWorld({ x: a4OriginX, y: a4OriginY });
    } else if (!showA4Guide && a4GuideOriginWorld) {
      setA4GuideOriginWorld(null);
    }
  }, [showA4Guide, a4GuideOriginWorld, screenToWorld, typewriterX, getTextBoxWidth, typewriterY, baseFontSize, A4_LEFT_MARGIN_WORLD, A4_TOP_MARGIN_WORLD]);

  const calculateContentBoundingBox = useCallback(() => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      console.error("Could not get 2D context for temporary canvas.");
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const measureTextWidthForExport = (text: string, fontSize: number) => {
      tempCtx.font = `${fontSize}px "JetBrains Mono", monospace`;
      return tempCtx.measureText(text).width;
    };

    textObjects.forEach(textObj => {
      const textObjScale = textObj.scale || 1;
      const effectiveFontSizeInWorld = baseFontSize * textObjScale;
      const textWorldWidth = measureTextWidthForExport(textObj.content, effectiveFontSizeInWorld);
      const textWorldHeight = effectiveFontSizeInWorld;

      const worldLeft = textObj.x;
      const worldTop = textObj.y - textWorldHeight;
      const worldRight = textObj.x + textWorldWidth;
      const worldBottom = textObj.y + 4;

      minX = Math.min(minX, worldLeft);
      minY = Math.min(minY, worldTop);
      maxX = Math.max(maxX, worldRight);
      maxY = Math.max(maxY, worldBottom);
    });

    if (currentTypingText.trim()) {
      const worldPos = getCurrentWorldPosition();
      const textBoxWidth = measureTextWidthForExport('A'.repeat(maxCharsPerLine), baseFontSize);
      const textHeight = baseFontSize;

      minX = Math.min(minX, worldPos.x);
      minY = Math.min(minY, worldPos.y);
      maxX = Math.max(maxX, worldPos.x + textBoxWidth);
      maxY = Math.max(maxY, worldPos.y + textHeight);
    }

    if (showA4Guide && a4GuideOriginWorld) {
      minX = Math.min(minX, a4GuideOriginWorld.x);
      minY = Math.min(minY, a4GuideOriginWorld.y);
      maxX = Math.max(maxX, a4GuideOriginWorld.x + A4_WIDTH_WORLD);
      maxY = Math.max(maxY, a4GuideOriginWorld.y + A4_HEIGHT_WORLD);
    }

    if (textObjects.length === 0 && !currentTypingText.trim() && (!showA4Guide || !a4GuideOriginWorld)) {
      return { minX: -10, minY: -10, maxX: 10, maxY: 10 };
    }

    return { minX, minY, maxX, maxY };
  }, [textObjects, currentTypingText, baseFontSize, maxCharsPerLine, getCurrentWorldPosition, showA4Guide, a4GuideOriginWorld, A4_WIDTH_WORLD, A4_HEIGHT_WORLD]);

  const exportAsPNG = useCallback(() => {
    setIsExportMenuOpen(false);
    const bbox = calculateContentBoundingBox();

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

    tempCtx.fillStyle = colors[theme].background;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    const tempOffsetX = padding - bbox.minX * exportScaleFactor;
    const tempOffsetY = padding - bbox.minY * exportScaleFactor;

    const drawContentForExport = (ctx: CanvasRenderingContext2D, currentOffset: { x: number, y: number }, currentScale: number) => {
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = colors[theme].text;

      textObjects.forEach(textObj => {
        const screenX = textObj.x * currentScale + currentOffset.x;
        const screenY = textObj.y * currentScale + currentOffset.y;

        const fontSize = baseFontSize * (textObj.scale || 1) * currentScale;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(textObj.content, screenX, screenY);
      });

      if (currentTypingText.trim()) {
        const worldPos = getCurrentWorldPosition();
        const screenX = worldPos.x * currentScale + currentOffset.x;
        const screenY = worldPos.y * currentScale + currentOffset.y;
        const fontSize = baseFontSize * currentScale;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(currentTypingText, screenX, screenY);
      }

      if (showA4Guide && a4GuideOriginWorld) {
        const a4ScreenX = a4GuideOriginWorld.x * currentScale + currentOffset.x;
        const a4ScreenY = a4GuideOriginWorld.y * currentScale + currentOffset.y;
        const a4ScreenWidth = A4_WIDTH_WORLD * currentScale;
        const a4ScreenHeight = A4_HEIGHT_WORLD * currentScale;

        ctx.strokeStyle = colors[theme].a4Guide;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(a4ScreenX, a4ScreenY, a4ScreenWidth, a4ScreenHeight);
        ctx.setLineDash([]);

        ctx.fillStyle = colors[theme].a4Guide;
        ctx.font = `${14 * currentScale}px "Inter", sans-serif`;
        ctx.fillText('A4', a4ScreenX + 10 * currentScale, a4ScreenY + 20 * currentScale);
      }
    };

    drawContentForExport(tempCtx, { x: tempOffsetX, y: tempOffsetY }, exportScaleFactor);

    const link = document.createElement('a');
    link.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
    URL.revokeObjectURL(link.href);
  }, [textObjects, currentTypingText, baseFontSize, calculateContentBoundingBox, getCurrentWorldPosition, showA4Guide, a4GuideOriginWorld, A4_WIDTH_WORLD, A4_HEIGHT_WORLD, theme]);

  const exportAsJSON = useCallback(() => {
    setIsExportMenuOpen(false);
    const data = {
      version: "1.0",
      type: "infinite-typewriter-canvas",
      elements: textObjects.map(obj => ({
        id: obj.id,
        content: obj.content,
        x: obj.x,
        y: obj.y,
        scale: obj.scale,
        type: "text"
      })),
      appState: {
        canvasOffset: canvasOffset,
        scale: scale,
        typewriterPosition: {
          x: typewriterX,
          y: typewriterY
        },
        showGrid: showGrid,
        showA4Guide: showA4Guide,
        a4GuideOriginWorld: a4GuideOriginWorld,
        theme: theme
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [textObjects, canvasOffset, scale, typewriterX, typewriterY, showGrid, showA4Guide, a4GuideOriginWorld, theme]);

  const exportAsSVG = useCallback(() => {
    setIsExportMenuOpen(false);
    const bbox = calculateContentBoundingBox();

    const svgPaddingWorld = 20; 
    const contentWidth = bbox.maxX - bbox.minX;
    const contentHeight = bbox.maxY - bbox.minY;

    const viewBoxMinX = bbox.minX - svgPaddingWorld;
    const viewBoxMinY = bbox.minY - svgPaddingWorld;
    const viewBoxWidth = contentWidth + 2 * svgPaddingWorld;
    const viewBoxHeight = contentHeight + 2 * svgPaddingWorld;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    
    const maxSvgOutputSize = 1000; 
    let outputWidth = viewBoxWidth;
    let outputHeight = viewBoxHeight;

    if (outputWidth > maxSvgOutputSize || outputHeight > maxSvgOutputSize) {
      const aspectRatio = outputWidth / outputHeight;
      if (aspectRatio > 1) {
        outputWidth = maxSvgOutputSize;
        outputHeight = maxSvgOutputSize / aspectRatio;
      } else {
        outputHeight = maxSvgOutputSize;
        outputWidth = maxSvgOutputSize * aspectRatio;
      }
    }

    svg.setAttribute("width", String(outputWidth));
    svg.setAttribute("height", String(outputHeight));
    svg.setAttribute("viewBox", `${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`);
    
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", colors[theme].background);
    svg.appendChild(bg);

    textObjects.forEach(textObj => {
      const fontSize = baseFontSize * (textObj.scale || 1);
      
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", String(textObj.x));
      text.setAttribute("y", String(textObj.y));
      text.setAttribute("font-family", '"JetBrains Mono", monospace');
      text.setAttribute("font-size", String(fontSize));
      text.setAttribute("fill", colors[theme].text);
      text.textContent = textObj.content;
      
      svg.appendChild(text);
    });

    if (currentTypingText.trim()) {
      const worldPos = getCurrentWorldPosition();
      const fontSize = baseFontSize;
      
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", String(worldPos.x));
      text.setAttribute("y", String(worldPos.y));
      text.setAttribute("font-family", '"JetBrains Mono", monospace');
      text.setAttribute("font-size", String(fontSize));
      text.setAttribute("fill", colors[theme].text);
      text.textContent = currentTypingText;
      
      svg.appendChild(text);
    }

    if (showA4Guide && a4GuideOriginWorld) {
      const a4Rect = document.createElementNS(svgNS, "rect");
      a4Rect.setAttribute("x", String(a4GuideOriginWorld.x));
      a4Rect.setAttribute("y", String(a4GuideOriginWorld.y));
      a4Rect.setAttribute("width", String(A4_WIDTH_WORLD));
      a4Rect.setAttribute("height", String(A4_HEIGHT_WORLD));
      a4Rect.setAttribute("stroke", colors[theme].a4Guide);
      a4Rect.setAttribute("stroke-width", "2");
      a4Rect.setAttribute("fill", "none");
      a4Rect.setAttribute("stroke-dasharray", "10,5");
      svg.appendChild(a4Rect);

      const a4Text = document.createElementNS(svgNS, "text");
      a4Text.setAttribute("x", String(a4GuideOriginWorld.x + 10));
      a4Text.setAttribute("y", String(a4GuideOriginWorld.y + 20));
      a4Text.setAttribute("font-family", '"Inter", sans-serif');
      a4Text.setAttribute("font-size", "14");
      a4Text.setAttribute("fill", colors[theme].a4Guide);
      a4Text.textContent = 'A4';
      svg.appendChild(a4Text);
    }
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [textObjects, currentTypingText, baseFontSize, calculateContentBoundingBox, getCurrentWorldPosition, showA4Guide, a4GuideOriginWorld, A4_WIDTH_WORLD, A4_HEIGHT_WORLD, theme]);

  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result || typeof result !== 'string') throw new Error('Invalid file');
        const data = JSON.parse(result);
        
        if (data.type === "infinite-typewriter-canvas" && data.elements) {
          setTextObjects([]);
          setCurrentTypingText('');
          setSelectedObject(null);
          
          const importedObjects = data.elements.map((elem: any) => ({
            id: elem.id || Date.now() + Math.random(),
            content: elem.content || '',
            x: elem.x || 0,
            y: elem.y || 0,
            scale: elem.scale || 1
          }));
          
          setTextObjects(importedObjects);
          
          if (data.appState) {
            if (data.appState.canvasOffset) {
              setCanvasOffset(data.appState.canvasOffset);
            }
            if (data.appState.scale) {
              setScale(data.appState.scale);
            }
            if (typeof data.appState.showGrid !== 'undefined') {
              setShowGrid(data.appState.showGrid);
            }
            if (typeof data.appState.showA4Guide !== 'undefined') {
              setShowA4Guide(data.appState.showA4Guide);
            }
            if (data.appState.a4GuideOriginWorld) {
              setA4GuideOriginWorld(data.appState.a4GuideOriginWorld);
            }
            if (data.appState.theme) {
              setTheme(data.appState.theme);
            }
          }
        }
      } catch (error) {
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };

  // Keyboard event handlers for Spacebar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(true);
        e.preventDefault();
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 텍스트 입력 필드에 포커스가 있을 때는 Delete 키 처리를 하지 않음
      const input = document.getElementById('typewriter-input') as HTMLInputElement;
      const isInputFocused = document.activeElement === input;
      
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
      
      const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
      const currentIndex = zoomLevels.findIndex(level => Math.abs(level - scale) < 0.01);
      
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          const newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
          return;
        } else if (e.key === '-') {
          e.preventDefault();
          const newIndex = Math.max(0, currentIndex - 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
          return;
        } else if (e.key === '0') {
          e.preventDefault();
          if (Math.abs(scale - 1) > 0.01) {
            zoomToLevel(1);
          }
          return;
        } else if (e.key === 'Home' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetCanvas();
          return;
        }
      }

      // Alt 키와 함께 폰트 크기 조정
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setBaseFontSize(prev => Math.min(40, prev + 2)); // 최대 40px
          return;
        } else if (e.key === '-') {
          e.preventDefault();
          setBaseFontSize(prev => Math.max(12, prev - 2)); // 최소 12px
          return;
        }
      }
      
      // Delete 키 처리 - 텍스트 입력 필드에 포커스가 없을 때만
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject && !isInputFocused) {
        e.preventDefault();
        setTextObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
        setSelectedObject(null);
        return;
      }
      
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const moveDistance = typewriterLineHeight; // line-height와 통일
        
        setCanvasOffset(prev => {
          switch (e.key) {
            case 'ArrowUp':
              return { x: prev.x, y: prev.y + moveDistance };
            case 'ArrowDown':
              return { x: prev.x, y: prev.y - moveDistance };
            case 'ArrowLeft':
              return { x: prev.x + moveDistance, y: prev.y };
            case 'ArrowRight':
              return { x: prev.x - moveDistance, y: prev.y };
            default:
              return prev;
          }
        });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, selectedObject, typewriterLineHeight, zoomToLevel, setTextObjects, setSelectedObject, setCanvasOffset]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const target = e.target as HTMLElement;
    if (isExportMenuOpen && (!target || !target.closest || !target.closest('.export-dropdown'))) {
      setIsExportMenuOpen(false);
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const clickedObject = textObjects.find(obj => isPointInText(obj, mouseX, mouseY));
    
    if (clickedObject) {
      setSelectedObject(clickedObject);
      setIsDraggingText(true);
      setDragStart({ x: mouseX, y: mouseY });
    } else if (isSpacePressed) {
      setSelectedObject(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setSelectedObject(null);
      setIsDragging(false);
      setIsDraggingText(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingText && selectedObject) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      setTextObjects(prev => prev.map(obj => 
        obj.id === selectedObject.id 
          ? { ...obj, x: obj.x + deltaX / scale, y: obj.y + deltaY / scale }
          : obj
      ));
      
      setSelectedObject(prev => prev ? 
        { ...prev, x: prev.x + deltaX / scale, y: prev.y + deltaY / scale } 
        : null
      );
      
      setDragStart({ x: mouseX, y: mouseY });
    } else if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setCanvasOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingText(false);
    
    // 드래그가 끝난 후 텍스트 입력 필드에 포커스 복원
    setTimeout(() => {
      const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
      if (input) input.focus();
    }, 0);
  };

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    // Ctrl/Cmd 키와 함께 사용할 때만 줌
    if (!(e.ctrlKey || e.metaKey)) return;
    
    e.preventDefault();
    const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
    const currentIndex = zoomLevels.findIndex(level => Math.abs(level - scale) < 0.01);
    
    let newIndex;
    if (e.deltaY > 0) {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex) {
      zoomToLevel(zoomLevels[newIndex]);
    }
  }, [scale, zoomToLevel]);

  const resetCanvas = () => {
    setScale(1);
    centerTypewriter();
    setSelectedObject(null);
    if (showA4Guide) {
      const textBoxWorldTopLeft = screenToWorld(
        typewriterX - getTextBoxWidth() / 2,
        typewriterY - baseFontSize / 2
      );
      const a4OriginX = textBoxWorldTopLeft.x - A4_LEFT_MARGIN_WORLD;
      const a4OriginY = textBoxWorldTopLeft.y - A4_TOP_MARGIN_WORLD;
      setA4GuideOriginWorld({ x: a4OriginX, y: a4OriginY });
    }
  };

  const clearAll = () => {
    setTextObjects([]);
    setCurrentTypingText('');
    setSelectedObject(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTypingText(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 100);
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    setCurrentTypingText(e.currentTarget.value); 
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isComposing) {
        const worldPos = getCurrentWorldPosition();
        // 빈 문자열도 처리
        setTextObjects(prev => [...prev, {
          content: currentTypingText,
          x: worldPos.x,
          y: worldPos.y,
          scale: 1 / scale,
          id: Date.now()
        }]);
        setCurrentTypingText('');
        setCanvasOffset(prev => ({
          x: prev.x,
          y: prev.y - typewriterLineHeight
        }));
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setCurrentTypingText('');
    }
  };

  useEffect(() => {
    const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
    if (input) input.focus();
  }, []);

  const DEFAULT_FONT_SIZE = 20;

  // UI Size 조절 함수
  const handleUISizeChange = (newFontSize: number) => {
    // 1. 변경 전 입력 박스 좌측 상단의 월드 좌표
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize / 2;
    const worldBefore = screenToWorld(textBoxLeft, textBoxTop);

    // 2. scale 변경
    const newScale = DEFAULT_FONT_SIZE / newFontSize;
    setBaseFontSize(newFontSize);
    setScale(newScale);

    // 3. 변경 후 입력 박스 좌측 상단이 같은 월드 좌표를 가리키도록 offset 보정
    // (이 코드는 setState 비동기이므로, useEffect로 scale/baseFontSize가 바뀐 후에 실행해야 할 수도 있음)
    setTimeout(() => {
      const newTextBoxWidth = getTextBoxWidth();
      const newTextBoxLeft = typewriterX - newTextBoxWidth / 2;
      const newTextBoxTop = typewriterY - newFontSize / 2;
      // 새로운 offset = 화면상의 입력박스 좌측상단 - (변경 전 월드좌표 * 새로운 scale)
      setCanvasOffset({
        x: newTextBoxLeft - worldBefore.x * newScale,
        y: newTextBoxTop - worldBefore.y * newScale,
      });
    }, 0);
  };

  return (
    <div className={`w-full h-screen flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${
        theme === 'dark' 
          ? 'bg-black/90 border-gray-800' 
          : 'bg-white/90 border-gray-200'
      } backdrop-blur-sm border-b p-4 flex items-center justify-between relative z-50`}>
        <div className="flex items-center gap-6">
          <h1 className={`text-lg font-medium flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Type className="w-5 h-5" />
            Infinite Canvas
          </h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={resetCanvas}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={clearAll}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className={`flex items-center gap-2 border-l pl-6 ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <label className={`p-2 rounded-lg transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
                   title="Import">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={importFile}
                className="hidden"
              />
            </label>
            
            <div className="relative export-dropdown z-[10000]">
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
              {isExportMenuOpen && (
                <div className={`absolute top-full left-0 mt-2 rounded-lg shadow-2xl z-[10001] overflow-hidden border-2 ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-300'
                }`}>
                  <button
                    onClick={exportAsJSON}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    JSON
                  </button>
                  <button
                    onClick={exportAsPNG}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    PNG
                  </button>
                  <button
                    onClick={exportAsSVG}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm ${
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    SVG
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-2 border-l pl-6 ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setShowGrid(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowA4Guide(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showA4Guide 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle A4 Guide"
            >
              <FileDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInfo(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showInfo 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle Canvas Info"
            >
              {showInfo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowShortcuts(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showShortcuts 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle Shortcuts"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`absolute inset-0 ${isSpacePressed ? 'cursor-grab' : 'cursor-crosshair'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          tabIndex={0}
        />
        
        {/* Input Field */}
        <input
          id="typewriter-input"
          type="text"
          value={currentTypingText}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.focus();
          }}
          style={{
            position: 'absolute',
            left: typewriterX - getTextBoxWidth() / 2,
            top: typewriterY - baseFontSize / 2,
            width: getTextBoxWidth(),
            height: Math.max(typewriterLineHeight, baseFontSize + 16), // baseFontSize에 따라 높이 조정
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: baseFontSize,
            background: colors[theme].inputBg,
            border: `1px solid ${colors[theme].inputBorder}`,
            outline: 'none',
            color: colors[theme].text,
            zIndex: 20,
            backdropFilter: 'blur(8px)',
            borderRadius: '4px',
            padding: '0 8px',
            lineHeight: `${typewriterLineHeight}px`,
            boxSizing: 'border-box'
          }}
        />
        
        {/* Font Size Indicator */}
        <div
          style={{
            position: 'absolute',
            left: typewriterX - getTextBoxWidth() / 2 - 100,
            top: typewriterY - baseFontSize / 2,
            fontSize: '11px',
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            background: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
            padding: '6px 10px',
            borderRadius: '4px',
            zIndex: 20,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          {baseFontSize}px ({(baseFontSize / scale).toFixed(1)}pt)
        </div>

        {/* Canvas Info Overlay */}
        {showInfo && (
          <CanvasInfoOverlay
            canvasOffset={canvasOffset}
            scale={scale}
            textObjects={textObjects}
            selectedObject={selectedObject}
            typewriterX={typewriterX}
            typewriterY={typewriterY}
            baseFontSize={baseFontSize}
            getTextBoxWidth={getTextBoxWidth}
            screenToWorld={screenToWorld}
            theme={theme}
          />
        )}

        {/* Shortcuts Overlay */}
        {showShortcuts && (
          <ShortcutsOverlay theme={theme} />
        )}

        {/* Status Messages */}
        {currentTypingText && (
          <div className={`absolute bottom-4 left-4 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-mono ${
            theme === 'dark'
              ? 'bg-black/80 text-white'
              : 'bg-white/90 text-gray-900'
          }`}>
            Typing: "{currentTypingText}"
          </div>
        )}
        
        {selectedObject && (
          <div className={`absolute bottom-4 right-4 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-mono border ${
            theme === 'dark'
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
          }`}>
            Selected: "{selectedObject.content.substring(0, 30)}{selectedObject.content.length > 30 ? '...' : ''}"
          </div>
        )}

        {/* Zoom Indicator */}
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 backdrop-blur-sm px-3 py-1.5 rounded-full ${
          theme === 'dark' ? 'bg-black/80' : 'bg-white/90'
        }`}>
          <button
            onClick={() => {
              const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
              const currentIndex = zoomLevels.findIndex(level => Math.abs(level - scale) < 0.01);
              const newIndex = Math.max(0, currentIndex - 1);
              if (newIndex !== currentIndex) {
                zoomToLevel(zoomLevels[newIndex]);
              }
            }}
            className={`p-1 transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className={`text-xs font-mono w-12 text-center ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {(scale * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => {
              const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
              const currentIndex = zoomLevels.findIndex(level => Math.abs(level - scale) < 0.01);
              const newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
              if (newIndex !== currentIndex) {
                zoomToLevel(zoomLevels[newIndex]);
              }
            }}
            className={`p-1 transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfiniteTypewriterCanvas;
