import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Move, Download, Upload, Grid, FileText, Image, Code, RotateCcw, Trash2, Eye, EyeOff, ZoomIn, ZoomOut, FileDown, Sun, Moon } from 'lucide-react';

// 오브젝트 타입들 정의
interface TextObjectType {
  id: number;
  type: 'text';
  content: string;
  x: number;
  y: number;
  scale: number;
  fontSize: number; // 월드 단위 폰트 크기
}

interface A4GuideObjectType {
  id: number;
  type: 'a4guide';
  x: number; // 좌상단 월드 좌표
  y: number;
  width: number; // 월드 단위 크기
  height: number;
}

type CanvasObjectType = TextObjectType | A4GuideObjectType;

// 테마 타입
type Theme = 'light' | 'dark';

// 단축키 정보 오버레이 컴포넌트
const ShortcutsOverlay = ({ theme }: { theme: Theme }) => {
  return (
    <div className={`absolute top-4 right-4 ${
      theme === 'dark' 
        ? 'bg-black/80 text-white' 
        : 'bg-white/90 text-gray-900'
    } backdrop-blur-sm p-4 rounded-xl shadow-md text-xs font-mono`}>
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
        <div>Delete selected: Del / Button</div>
      </div>
    </div>
  );
};
const CanvasInfoOverlay = ({ canvasOffset, scale, canvasObjects, selectedObject, typewriterX, typewriterY, baseFontSize, initialFontSize, getTextBoxWidth, screenToWorld, theme }: {
  canvasOffset: { x: number; y: number; };
  scale: number;
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  typewriterX: number;
  typewriterY: number;
  baseFontSize: number;
  initialFontSize: number;
  getTextBoxWidth: () => number;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number; };
  theme: Theme;
}) => {
  const textBoxWidth = getTextBoxWidth();
  const textBoxLeft = typewriterX - textBoxWidth / 2;
  const textBoxTop = typewriterY - baseFontSize / 2;
  const textBoxRight = textBoxLeft + textBoxWidth;
  const textBoxBottom = textBoxTop + baseFontSize;

  // 4개 모서리 윈도우/월드 좌표
  const corners = [
    { label: 'LT', sx: textBoxLeft, sy: textBoxTop }, // 좌상
    { label: 'RT', sx: textBoxRight, sy: textBoxTop }, // 우상
    { label: 'LB', sx: textBoxLeft, sy: textBoxBottom }, // 좌하
    { label: 'RB', sx: textBoxRight, sy: textBoxBottom }, // 우하
  ].map(corner => ({
    ...corner,
    world: screenToWorld(corner.sx, corner.sy)
  }));

  const worldPos = screenToWorld(textBoxLeft, textBoxTop);

  return (
    <div className={`absolute top-4 left-4 ${
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
        <div>UI Size: {(baseFontSize / initialFontSize).toFixed(2)}x ({baseFontSize}px)</div>
        <div>Objects: {canvasObjects.length}</div>
        <div>Origin: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
        {corners.map(c => (
          <div key={c.label} className="mt-1">
            <span className="font-bold">{c.label}</span>:
            <span> win({Math.round(c.sx)}, {Math.round(c.sy)})</span>
            <span> world({Math.round(c.world.x)}, {Math.round(c.world.y)})</span>
          </div>
        ))}
        {selectedObject && (
          <div className={`mt-2 pt-2 border-t ${
            theme === 'dark' ? 'border-gray-600 text-green-400' : 'border-gray-300 text-green-600'
          }`}>
            Selected: {selectedObject.type === 'text' 
              ? `"${selectedObject.content.substring(0, 20)}${selectedObject.content.length > 20 ? '...' : ''}"` 
              : 'A4 Guide'}
          </div>
        )}
      </div>
    </div>
  );
};

const InfiniteTypewriterCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObjectType[]>([]);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState<CanvasObjectType | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 64);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Dynamically measure CSS pixels per millimeter (accounts for DPI / zoom)
  const [pxPerMm, setPxPerMm] = useState(96 / 25.4); // fallback default

  // A4 guide calculations based on 160mm textbox width
  const TEXT_BOX_WIDTH_MM = 160;
  const A4_MARGIN_LR_MM = 25;
  const A4_MARGIN_TOP_MM = 30;
  const A4_WIDTH_MM = TEXT_BOX_WIDTH_MM + (A4_MARGIN_LR_MM * 2); // 210mm
  const A4_HEIGHT_MM = A4_WIDTH_MM * (297 / 210); // A4 aspect ratio

  const [showInfo, setShowInfo] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [showTextBox, setShowTextBox] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');

  // Typewriter settings
  const typewriterX = canvasWidth / 2;
  const typewriterY = canvasHeight / 2;
  const maxCharsPerLine = 52; // 한글 기준 52자로 조정
  const INITIAL_FONT_SIZE = 20; // 20px = 10pt (논리적 표시용)
  const [baseFontSize, setBaseFontSize] = useState(INITIAL_FONT_SIZE);

  // 현재 활성 텍스트의 line-height 계산 (선택된 요소 우선, 없으면 현재 입력 폰트 사용)
  const getCurrentLineHeight = useCallback(() => {
    if (selectedObject && selectedObject.type === 'text') {
      return selectedObject.fontSize * scale * 1.8; // 선택된 요소의 렌더링 크기 기반
    }
    return baseFontSize * 1.8; // 현재 입력 폰트 크기 기반
  }, [selectedObject, baseFontSize, scale]);

  useEffect(() => {
    // Create a hidden element 100mm wide to measure
    const ruler = document.createElement('div');
    ruler.style.width = '100mm';
    ruler.style.position = 'absolute';
    ruler.style.visibility = 'hidden';
    document.body.appendChild(ruler);
    const measuredPxPerMm = ruler.getBoundingClientRect().width / 100;
    if (measuredPxPerMm && !Number.isNaN(measuredPxPerMm)) {
      setPxPerMm(measuredPxPerMm);
    }
    document.body.removeChild(ruler);
  }, []);


  
  // Theme colors
  const colors = {
    dark: {
      background: '#0a0a0a',
      text: 'rgba(255, 255, 255, 0.9)',
      grid: 'rgba(255, 255, 255, 0.05)',
      selection: 'rgba(59, 130, 246, 0.2)',
      a4Guide: 'rgba(59, 130, 246, 0.3)',
      inputBg: 'rgba(0, 0, 0, 0.3)',
      inputBorder: 'rgba(59, 130, 246, 0.3)',
    },
    light: {
      background: '#ffffff',
      text: 'rgba(0, 0, 0, 0.9)',
      grid: 'rgba(0, 0, 0, 0.05)',
      selection: 'rgba(59, 130, 246, 0.2)',
      a4Guide: 'rgba(59, 130, 246, 0.4)',
      inputBg: 'rgba(255, 255, 255, 0.4)',
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
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize / 2;
    const textBoxBaseline = textBoxTop + baseFontSize * 1.2;
    return screenToWorld(textBoxLeft, textBoxBaseline);
  }, [getTextBoxWidth, screenToWorld, typewriterX, typewriterY, baseFontSize]);

  const isPointInObject = useCallback((obj: CanvasObjectType, screenX: number, screenY: number) => {
    if (obj.type === 'text') {
      const textObj = obj as TextObjectType;
      const screenPos = worldToScreen(textObj.x, textObj.y);
      const fontSize = textObj.fontSize * scale;
      const textWidth = measureTextWidth(textObj.content, fontSize);
      const textHeight = fontSize;
      
      return screenX >= screenPos.x && 
             screenX <= screenPos.x + textWidth &&
             screenY >= screenPos.y - textHeight &&
             screenY <= screenPos.y + 4;
    } else if (obj.type === 'a4guide') {
      const a4Obj = obj as A4GuideObjectType;
      const screenPos = worldToScreen(a4Obj.x, a4Obj.y);
      const screenWidth = a4Obj.width * scale;
      const screenHeight = a4Obj.height * scale;
      const borderWidth = 10; // 클릭 가능한 보더 영역 폭 (px)
      
      // 전체 영역 내부에 있는지 확인
      const inOuterRect = screenX >= screenPos.x &&
                          screenX <= screenPos.x + screenWidth &&
                          screenY >= screenPos.y &&
                          screenY <= screenPos.y + screenHeight;
      
      // 내부 영역(보더 제외)에 있는지 확인
      const inInnerRect = screenX >= screenPos.x + borderWidth &&
                          screenX <= screenPos.x + screenWidth - borderWidth &&
                          screenY >= screenPos.y + borderWidth &&
                          screenY <= screenPos.y + screenHeight - borderWidth;
      
      // 보더 영역에만 있을 때만 클릭 감지 (전체 영역에 있지만 내부 영역에는 없을 때)
      return inOuterRect && !inInnerRect;
    }
    return false;
  }, [scale, measureTextWidth, worldToScreen]);

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
    // 현재 활성 텍스트의 line-height와 동일한 단위로 그리드 그리기
    const baseGridSize = getCurrentLineHeight();
    const gridSize = baseGridSize;
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
  }, [canvasOffset, scale, canvasWidth, canvasHeight, theme, getCurrentLineHeight]);



  const drawCanvasObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.textBaseline = 'alphabetic';
    
    // A4가이드를 먼저 그려서 배경에 배치 (z-index 낮게)
    canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
      const a4Obj = obj as A4GuideObjectType;
      const screenPos = worldToScreen(a4Obj.x, a4Obj.y);
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
      const screenPos = worldToScreen(textObj.x, textObj.y);
      
      if (screenPos.x > -200 && screenPos.x < canvasWidth + 200 && screenPos.y > -50 && screenPos.y < canvasHeight + 50) {
        const fontSize = textObj.fontSize * scale;
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
  }, [canvasObjects, scale, selectedObject, canvasWidth, canvasHeight, worldToScreen, measureTextWidth, theme]);

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
    drawCanvasObjects(ctx);
    
  }, [canvasOffset, scale, canvasObjects, selectedObject, getTextBoxWidth, drawGrid, drawCanvasObjects, canvasWidth, canvasHeight, typewriterX, typewriterY, baseFontSize, screenToWorld, showGrid, theme]);

  useEffect(() => {
    const animate = () => {
      render();
      requestAnimationFrame(animate);
    };
    animate();
  }, [render]);

  const SCREEN_MARGIN_PX = 25; // 원하는 화면 상단/좌측 여백



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

    canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
      const textObj = obj as TextObjectType;
      const textObjScale = textObj.scale || 1;
      const effectiveFontSizeInWorld = textObj.fontSize; // 저장된 폰트 크기를 사용
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
      const actualTextWidth = measureTextWidthForExport(currentTypingText, baseFontSize);
      const textHeight = baseFontSize;

      minX = Math.min(minX, worldPos.x);
      minY = Math.min(minY, worldPos.y);
      maxX = Math.max(maxX, worldPos.x + actualTextWidth);
      maxY = Math.max(maxY, worldPos.y + textHeight);
    }

    if (canvasObjects.length === 0 && !currentTypingText.trim()) {
      return { minX: -10, minY: -10, maxX: 10, maxY: 10 };
    }

    return { minX, minY, maxX, maxY };
  }, [canvasObjects, currentTypingText, baseFontSize, maxCharsPerLine, getCurrentWorldPosition]);

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

      canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
      const textObj = obj as TextObjectType;
        const screenX = textObj.x * currentScale + currentOffset.x;
        const screenY = textObj.y * currentScale + currentOffset.y;

        const fontSize = textObj.fontSize * currentScale; // 저장된 폰트 크기를 사용
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(textObj.content, screenX, screenY);
      });

      if (currentTypingText.trim()) {
        const worldPos = getCurrentWorldPosition();
        const screenX = worldPos.x * currentScale + currentOffset.x;
        const screenY = worldPos.y * currentScale + currentOffset.y;
        const fontSize = baseFontSize * currentScale; // 입력창 폰트 크기를 사용
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(currentTypingText, screenX, screenY);
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

    drawContentForExport(tempCtx, { x: tempOffsetX, y: tempOffsetY }, exportScaleFactor);

    const link = document.createElement('a');
    link.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
    URL.revokeObjectURL(link.href);
  }, [canvasObjects, currentTypingText, baseFontSize, calculateContentBoundingBox, getCurrentWorldPosition, theme]);

  const exportAsJSON = useCallback(() => {
    setIsExportMenuOpen(false);
    const data = {
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
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasObjects, canvasOffset, scale, typewriterX, typewriterY, showGrid, showTextBox, theme]);

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
    bg.setAttribute("fill", "#ffffff");
    svg.appendChild(bg);

    canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
      const textObj = obj as TextObjectType;
      const fontSize = textObj.fontSize; // 저장된 폰트 크기를 사용
      
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", String(textObj.x));
      text.setAttribute("y", String(textObj.y));
      text.setAttribute("font-family", '"JetBrains Mono", monospace');
      text.setAttribute("font-size", String(fontSize));
      text.setAttribute("dominant-baseline", "alphabetic");
      text.setAttribute("fill", "#000000");
      text.textContent = textObj.content;
      
      svg.appendChild(text);
    });

    if (currentTypingText.trim()) {
      const worldPos = getCurrentWorldPosition();
      const fontSize = baseFontSize; // 입력창 폰트 크기를 사용
      
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", String(worldPos.x));
      text.setAttribute("y", String(worldPos.y));
      text.setAttribute("font-family", '"JetBrains Mono", monospace');
      text.setAttribute("font-size", String(fontSize));
      text.setAttribute("dominant-baseline", "alphabetic");
      text.setAttribute("fill", "#000000");
      text.textContent = currentTypingText;
      
      svg.appendChild(text);
    }

    // A4Guide 오브젝트들 SVG로 변환
    canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
      const a4Obj = obj as A4GuideObjectType;
      const a4Rect = document.createElementNS(svgNS, "rect");
      a4Rect.setAttribute("x", String(a4Obj.x));
      a4Rect.setAttribute("y", String(a4Obj.y));
      a4Rect.setAttribute("width", String(a4Obj.width));
      a4Rect.setAttribute("height", String(a4Obj.height));
      a4Rect.setAttribute("stroke", "#888888");
      a4Rect.setAttribute("stroke-width", "2");
      a4Rect.setAttribute("fill", "none");
      a4Rect.setAttribute("stroke-dasharray", "10,5");
      svg.appendChild(a4Rect);

      const a4Text = document.createElementNS(svgNS, "text");
      a4Text.setAttribute("x", String(a4Obj.x + 10));
      a4Text.setAttribute("y", String(a4Obj.y + 20));
      a4Text.setAttribute("font-family", '"Inter", sans-serif');
      a4Text.setAttribute("font-size", "14");
      a4Text.setAttribute("dominant-baseline", "alphabetic");
      a4Text.setAttribute("fill", "#888888");
      a4Text.textContent = 'A4';
      svg.appendChild(a4Text);
    });
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasObjects, currentTypingText, baseFontSize, calculateContentBoundingBox, getCurrentWorldPosition, theme]);

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
          setCanvasObjects([]);
          setCurrentTypingText('');
          setSelectedObject(null);
          
          const importedObjects = data.elements.map((elem: any) => ({
            id: elem.id || Date.now() + Math.random(),
            type: 'text' as const,
            content: elem.content || '',
            x: elem.x || 0,
            y: elem.y || 0,
            scale: elem.scale || 1,
            fontSize: elem.fontSize || 20, // 저장된 폰트 크기 로드 (20px = 10pt)
          }));
          
          setCanvasObjects(importedObjects);
          
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
            if (typeof data.appState.showTextBox !== 'undefined') {
              setShowTextBox(data.appState.showTextBox);
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

  // UI Size 조절 함수 (논리적 폰트 크기는 유지, 화면 표시 px만 변경, 월드 좌표 유지)
  const handleUISizeChange = (up: boolean) => {
    const fontSizeLevels = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64];
    
    const currentIndex = fontSizeLevels.findIndex(level => Math.abs(level - baseFontSize) < 0.01);
    
    let newIndex = up
      ? Math.min(fontSizeLevels.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const currentFontSize = baseFontSize;
      const currentScale = scale;
      const currentOffset = canvasOffset;
      
      const newFontSize = fontSizeLevels[newIndex];
      const ratio = newFontSize / currentFontSize;
      const newScale = currentScale * ratio;
      
      // 현재 상태 값들로 screenToWorld 함수 생성
      const currentScreenToWorld = (screenX: number, screenY: number) => ({
        x: (screenX - currentOffset.x) / currentScale,
        y: (screenY - currentOffset.y) / currentScale
      });
      
      // 현재 상태 값들로 measureTextWidth 함수 생성
      const measureTextWidthWithFont = (text: string, fontSize: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !fontLoaded) return text.length * 12;
        const ctx = canvas.getContext('2d');
        if (!ctx) return text.length * 12;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        return ctx.measureText(text).width;
      };
      
      // 1. 현재 텍스트박스의 LT 월드 좌표 계산 (변경 전)
      const currentTextBoxWidth = measureTextWidthWithFont('A'.repeat(maxCharsPerLine), currentFontSize);
      const currentLTScreen = {
        x: typewriterX - currentTextBoxWidth / 2,
        y: typewriterY - currentFontSize / 2
      };
      const currentLTWorld = currentScreenToWorld(currentLTScreen.x, currentLTScreen.y);
      
      // 2. 새로운 텍스트박스의 LT 화면 좌표 계산 (변경 후)
      const newTextBoxWidth = measureTextWidthWithFont('A'.repeat(maxCharsPerLine), newFontSize);
      const newLTScreen = {
        x: typewriterX - newTextBoxWidth / 2,
        y: typewriterY - newFontSize / 2
      };
      
      // 3. 같은 월드 좌표가 새로운 LT 화면 위치에 오도록 offset 조정
      const targetScreenX = currentLTWorld.x * newScale;
      const targetScreenY = currentLTWorld.y * newScale;
      
      const newOffsetX = newLTScreen.x - targetScreenX;
      const newOffsetY = newLTScreen.y - targetScreenY;
      
      // 4. 상태 업데이트
      setBaseFontSize(newFontSize);
      setScale(newScale);
      setCanvasOffset({
        x: newOffsetX,
        y: newOffsetY
      });
    }
  };

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
          handleUISizeChange(true); // up
          return;
        } else if (e.key === '-') {
          e.preventDefault();
          handleUISizeChange(false); // down
          return;
        }
      }
      
      // Delete 키 처리 - 텍스트 입력 필드에 포커스가 없을 때만
      if (e.key === 'Delete' && selectedObject && !isInputFocused) {
        e.preventDefault();
        setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
        setSelectedObject(null);
        return;
      }
      
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const moveDistance = getCurrentLineHeight(); // 현재 활성 텍스트의 line-height와 통일
        
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
  }, [scale, selectedObject, getCurrentLineHeight, zoomToLevel, setCanvasObjects, setSelectedObject, setCanvasOffset, handleUISizeChange]);

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
    
    const clickedObject = canvasObjects.find(obj => isPointInObject(obj, mouseX, mouseY));
    
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

  // 스냅 단위로 값을 조정하는 함수
  const snapToGrid = (value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingText && selectedObject) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      // 월드 단위로 변환한 이동 거리를 그리드 단위로 스냅
      const worldDeltaX = deltaX / scale;
      const worldDeltaY = deltaY / scale;
      const worldGridSize = getCurrentLineHeight() / scale; // 월드 단위 그리드 크기
      
      const snappedWorldDeltaX = snapToGrid(worldDeltaX, worldGridSize);
      const snappedWorldDeltaY = snapToGrid(worldDeltaY, worldGridSize);
      
      // 실제로 이동할 거리가 있을 때만 업데이트
      if (Math.abs(snappedWorldDeltaX) >= worldGridSize || Math.abs(snappedWorldDeltaY) >= worldGridSize) {
        setCanvasObjects(prev => prev.map(obj => 
          obj.id === selectedObject.id 
            ? { ...obj, x: obj.x + snappedWorldDeltaX, y: obj.y + snappedWorldDeltaY }
            : obj
        ));
        
        setSelectedObject(prev => prev ? 
          { ...prev, x: prev.x + snappedWorldDeltaX, y: prev.y + snappedWorldDeltaY } 
          : null
        );
        
        // 스냅된 이동량만큼 dragStart 업데이트
        const screenDeltaX = snappedWorldDeltaX * scale;
        const screenDeltaY = snappedWorldDeltaY * scale;
        setDragStart({ 
          x: dragStart.x + screenDeltaX, 
          y: dragStart.y + screenDeltaY 
        });
      }
    } else if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // 캔버스 패닝도 그리드 단위로 스냅
      const currentLineHeight = getCurrentLineHeight();
      const snappedDeltaX = snapToGrid(deltaX, currentLineHeight);
      const snappedDeltaY = snapToGrid(deltaY, currentLineHeight);
      
      // 실제로 이동할 거리가 있을 때만 업데이트
      if (Math.abs(snappedDeltaX) >= currentLineHeight || Math.abs(snappedDeltaY) >= currentLineHeight) {
        setCanvasOffset(prev => ({
          x: prev.x + snappedDeltaX,
          y: prev.y + snappedDeltaY
        }));
        
        setDragStart({ 
          x: dragStart.x + snappedDeltaX, 
          y: dragStart.y + snappedDeltaY 
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingText(false);
    
    // 드래그가 끝난 후 텍스트 입력 필드에 포커스 복원 (텍스트 박스가 보일 때만)
    if (showTextBox) {
      setTimeout(() => {
        const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
        if (input) input.focus();
      }, 0);
    }
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
  };

  const clearAll = () => {
    setCanvasObjects([]);
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
        setCanvasObjects(prev => [
          ...prev,
          {
            type: 'text',
            content: currentTypingText,
            x: worldPos.x,
            y: worldPos.y,
            scale: 1,
            fontSize: baseFontSize / scale, // 월드 px로 변환해서 저장!
            id: Date.now()
          }
        ]);
        setCurrentTypingText('');
        setCanvasOffset(prev => ({
          x: prev.x,
          y: prev.y - getCurrentLineHeight()
        }));
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setCurrentTypingText('');
    }
  };

  useEffect(() => {
    if (showTextBox) {
      const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
      if (input) input.focus();
    }
  }, [showTextBox]);

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
              onClick={() => {
                // A4Guide 생성
                const textBoxWorldCenter = screenToWorld(typewriterX, typewriterY);
                const textBoxWorldTopLeft = screenToWorld(
                  typewriterX - getTextBoxWidth() / 2,
                  typewriterY - baseFontSize / 2
                );
                
                const a4WidthWorld = A4_WIDTH_MM * pxPerMm;
                const a4HeightWorld = A4_HEIGHT_MM * pxPerMm;
                const a4MarginTopWorld = A4_MARGIN_TOP_MM * pxPerMm;
                
                const a4OriginX = textBoxWorldCenter.x - a4WidthWorld / 2;
                const a4OriginY = textBoxWorldTopLeft.y - a4MarginTopWorld;
                
                setCanvasObjects(prev => [
                  ...prev,
                  {
                    id: Date.now(),
                    type: 'a4guide',
                    x: a4OriginX,
                    y: a4OriginY,
                    width: a4WidthWorld,
                    height: a4HeightWorld
                  }
                ]);
              }}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Add A4 Guide"
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
              onClick={() => setShowTextBox(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                showTextBox 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle Text Box"
            >
              {showTextBox ? <Type className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
        {showTextBox && (
          <>
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
                height: Math.max(getCurrentLineHeight(), baseFontSize + 16),
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: baseFontSize,
                background: colors[theme].inputBg,
                border: `1px solid ${colors[theme].inputBorder}`,
                outline: 'none',
                color: colors[theme].text,
                zIndex: 20,
                backdropFilter: 'blur(8px)',
                borderRadius: '4px',
                padding: 0,
                lineHeight: `${getCurrentLineHeight()}px`,
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
              {baseFontSize}px ({((baseFontSize / scale) / 2).toFixed(1)}pt)
            </div>
          </>
        )}

        {/* Canvas Info Overlay */}
        {showInfo && (
          <CanvasInfoOverlay
            canvasOffset={canvasOffset}
            scale={scale}
            canvasObjects={canvasObjects}
            selectedObject={selectedObject}
            typewriterX={typewriterX}
            typewriterY={typewriterY}
            baseFontSize={baseFontSize}
            initialFontSize={INITIAL_FONT_SIZE}
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
        {showTextBox && currentTypingText && (
          <div className={`absolute bottom-4 left-4 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-mono ${
            theme === 'dark'
              ? 'bg-black/80 text-white'
              : 'bg-white/90 text-gray-900'
          }`}>
            Typing: "{currentTypingText}"
          </div>
        )}
        
        {selectedObject && (
          <div className={`absolute bottom-4 right-4 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-mono border flex items-center gap-3 ${
            theme === 'dark'
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
          }`}>
            <span>
              Selected: {selectedObject.type === 'text' 
                ? `"${(selectedObject as TextObjectType).content.substring(0, 30)}${(selectedObject as TextObjectType).content.length > 30 ? '...' : ''}"` 
                : 'A4 Guide'}
            </span>
            <button
              onClick={() => {
                setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
                setSelectedObject(null);
              }}
              className={`p-1 rounded transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                  : 'hover:bg-red-500/20 text-red-600 hover:text-red-500'
              }`}
              title="Delete selected object"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
