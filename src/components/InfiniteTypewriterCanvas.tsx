/**
 * ExcaliType - Infinite Typewriter Canvas
 * 
 * © 2025 Hyeonsong Kim (@kimhxsong)
 * Contact: kimhxsong@gmail.com
 * 
 * A modern, infinite typewriter canvas built with React.
 * Supports Korean monospaced fonts, vector/image/JSON export, and infinite zoom & pan.
 * 
 * This code contains AI-generated content that has been further developed and customized.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Move, Download, Upload, Import, Grid, FileText, Image, Code, RotateCcw, Trash2, Eye, EyeOff, ZoomIn, ZoomOut, FileDown, Sun, Moon, CornerUpLeft, CornerUpRight, Layers, Info, NotepadTextDashed, TextCursorInput } from 'lucide-react';

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
    <div
      className={`absolute top-4 right-4 ${
        theme === 'dark'
          ? 'bg-black/40 text-white'
          : 'bg-white/50 text-gray-900'
      } backdrop-blur-sm rounded-xl shadow-sm text-[11px] font-mono`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontSize: '11px',
        padding: '12px',
        maxHeight: '45vh',
        minWidth: '260px', // minWidth 확장 (중복 제거)
        maxWidth: '340px',
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
        overflowY: 'auto',
      }}
    >
      <div className={`font-semibold mb-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} style={{whiteSpace: 'nowrap'}}>
        <Layers className="w-4 h-4 opacity-80" />
        Keyboard Shortcuts
      </div>
      <div className="border-b border-gray-300/40 mb-2" />
      <div className="space-y-2">
        <div className="font-bold text-xs mt-1 mb-0.5" style={{whiteSpace: 'nowrap'}}>Undo/Redo</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Undo</span>: <span className="font-mono">Ctrl+Z</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Redo</span>: <span className="font-mono">Ctrl+Shift+Z</span>, <span className="font-mono">Ctrl+Y</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>View & Navigation</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Pan Canvas</span>: <span className="font-mono">Space + Drag</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Move View</span>: <span className="font-mono">Shift + Arrow Keys</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Scale In/Out</span>: <span className="font-mono">Alt/Option + +/-</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Reset Zoom</span>: <span className="font-mono">Ctrl + 0</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Reset View</span>: <span className="font-mono">Cmd + R</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Editing</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">UI Size</span>: <span className="font-mono">Ctrl/Cmd + +/-</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Delete Selected</span>: <span className="font-mono">Del</span></div>
        </div>
      </div>
    </div>
  );
};

const CanvasInfoOverlay = ({ canvasOffset, scale, canvasObjects, selectedObject, hoveredObject, mousePosition, isMouseInTextBox, typewriterX, typewriterY, baseFontSize, initialFontSize, getTextBoxWidth, screenToWorld, theme }: {
  canvasOffset: { x: number; y: number; };
  scale: number;
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  hoveredObject: CanvasObjectType | null;
  mousePosition: { x: number; y: number };
  isMouseInTextBox: boolean;
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

  // 4 corners (window/world)
  const corners = [
    { label: 'Top Left', sx: textBoxLeft, sy: textBoxTop },
    { label: 'Top Right', sx: textBoxRight, sy: textBoxTop },
    { label: 'Bottom Left', sx: textBoxLeft, sy: textBoxBottom },
    { label: 'Bottom Right', sx: textBoxRight, sy: textBoxBottom },
  ].map(corner => ({
    ...corner,
    world: screenToWorld(corner.sx, corner.sy)
  }));

  const worldPos = screenToWorld(textBoxLeft, textBoxTop);

  return (
    <div
      className={`absolute top-4 left-4 ${
        theme === 'dark'
          ? 'bg-black/40 text-white'
          : 'bg-white/50 text-gray-900'
      } backdrop-blur-sm rounded-xl shadow-sm text-[11px] font-mono`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontSize: '11px',
        padding: '12px',
        maxHeight: '32vh',
        minWidth: '260px', // minWidth 확장 (중복 제거)
        maxWidth: '340px',
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
        overflowY: 'auto',
      }}
    >
      <div className={`font-semibold mb-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} style={{whiteSpace: 'nowrap'}}>
        <Info className="w-4 h-4 opacity-80" />
        Canvas Info
      </div>
      <div className="border-b border-gray-300/40 mb-2" />
      <div className="space-y-2">
        <div className="font-bold text-xs mt-1 mb-0.5" style={{whiteSpace: 'nowrap'}}>View State</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Offset</span>: <span className="font-mono">({Math.round(-canvasOffset.x)}, {Math.round(-canvasOffset.y)})</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Zoom</span>: <span className="font-mono">{scale.toFixed(2)}x</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">UI Size</span>: <span className="font-mono">{(baseFontSize / initialFontSize).toFixed(2)}x ({baseFontSize}px)</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Objects</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Object Count</span>: <span className="font-mono">{canvasObjects.length}</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Typewriter Box</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Origin (Top Left)</span>: <span className="font-mono">({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</span></div>
          {corners.map(c => (
            <div key={c.label} style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">{c.label}</span>: <span className="font-mono">win({Math.round(c.sx)}, {Math.round(c.sy)}) / world({Math.round(c.world.x)}, {Math.round(c.world.y)})</span></div>
          ))}
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Mouse</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Screen</span>: <span className="font-mono">({mousePosition.x}, {mousePosition.y})</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">World</span>: <span className="font-mono">({Math.round(screenToWorld(mousePosition.x, mousePosition.y).x)}, {Math.round(screenToWorld(mousePosition.x, mousePosition.y).y)})</span></div>
        </div>
        {hoveredObject && (
          <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Hovered Object</div>
        )}
        {hoveredObject && (
          <div className="pl-2 text-yellow-700 dark:text-yellow-300" style={{whiteSpace: 'nowrap'}}>
            {hoveredObject.type === 'text' ? `Text: "${hoveredObject.content.substring(0, 15)}${hoveredObject.content.length > 15 ? '...' : ''}"` : 'A4 Guide'}
          </div>
        )}
        {selectedObject && (
          <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Selected Object</div>
        )}
        {selectedObject && (
          <div className="pl-2 text-green-700 dark:text-green-300" style={{whiteSpace: 'nowrap'}}>
            {selectedObject.type === 'text' ? `Text: "${selectedObject.content.substring(0, 20)}${selectedObject.content.length > 20 ? '...' : ''}"` : 'A4 Guide'}
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInTextBox, setIsMouseInTextBox] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<CanvasObjectType | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 64);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Dynamically measure CSS pixels per millimeter (accounts for DPI / zoom)
  const [pxPerMm, setPxPerMm] = useState(96 / 25.4); // fallback default

  // A4 guide calculations based on 80-character textbox width
  const TEXT_BOX_WIDTH_MM = 160;
  const A4_MARGIN_LR_MM = 25;
  const A4_MARGIN_TOP_MM = 30;
  const A4_WIDTH_MM = TEXT_BOX_WIDTH_MM + (A4_MARGIN_LR_MM * 2); // 210mm
  const A4_HEIGHT_MM = A4_WIDTH_MM * (297 / 210); // A4 aspect ratio

  const [showInfo, setShowInfo] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [showTextBox, setShowTextBox] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  // Typewriter settings
  const typewriterX = canvasWidth / 2;
  const typewriterY = canvasHeight / 2;
  const [maxCharsPerLine, setMaxCharsPerLine] = useState(80); // 한글 기준 80자, 동적 변경
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
          inputBg: 'rgba(0, 0, 0, 0.01)', // 99% 투명
    inputBorder: 'rgba(59, 130, 246, 0.2)',
    },
    light: {
      background: '#ffffff',
      text: 'rgba(0, 0, 0, 0.9)',
      grid: 'rgba(0, 0, 0, 0.05)',
      selection: 'rgba(59, 130, 246, 0.2)',
      a4Guide: 'rgba(59, 130, 246, 0.4)',
          inputBg: 'rgba(255, 255, 255, 0.01)', // 99% 투명
    inputBorder: 'rgba(59, 130, 246, 0.2)',
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
    ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
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
    // 1. 현재 입력창 LT의 월드 좌표 구하기
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize / 2;
    const currentLTWorld = screenToWorld(textBoxLeft, textBoxTop);

    // 2. 새 scale에서 입력창 LT가 같은 화면 위치에 오도록 offset 계산
    const newTextBoxWidth = measureTextWidth('A'.repeat(maxCharsPerLine), baseFontSize);
    const newTextBoxLeft = typewriterX - newTextBoxWidth / 2;
    const newTextBoxTop = typewriterY - baseFontSize / 2;
    const newOffsetX = newTextBoxLeft - currentLTWorld.x * newScale;
    const newOffsetY = newTextBoxTop - currentLTWorld.y * newScale;

    setScale(newScale);
    setCanvasOffset({
      x: newOffsetX,
      y: newOffsetY
    });
  }, [getTextBoxWidth, screenToWorld, typewriterX, typewriterY, baseFontSize, measureTextWidth, maxCharsPerLine]);

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
      
      // measureTextWidth 함수에 정확한 폰트 크기 전달
      const textWidth = measureTextWidth(textObj.content, fontSize);
      const textHeight = fontSize;
      
      // 텍스트 베이스라인을 기준으로 위아래로 여유 공간 추가
      const padding = 5; // 클릭 영역 확장을 위한 패딩
      return screenX >= screenPos.x - padding && 
             screenX <= screenPos.x + textWidth + padding &&
             screenY >= screenPos.y - textHeight - padding &&
             screenY <= screenPos.y + padding;
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
        ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
        
        if (selectedObject && selectedObject.id === textObj.id) {
          ctx.fillStyle = colors[theme].selection;
          const textWidth = measureTextWidth(textObj.content, fontSize);
          const textHeight = fontSize;
          ctx.fillRect(screenPos.x - 4, screenPos.y - textHeight, textWidth + 8, textHeight + 8);
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
    
    // 호버된 오브젝트 하이라이트 표시
    if (hoveredObject) {
      ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)'; // 연한 하늘색
      ctx.lineWidth = 1; // 더 얇은 선
      ctx.lineJoin = 'round'; // 둥근 모서리
      ctx.lineCap = 'round'; // 둥근 끝점
      ctx.setLineDash([]); // 실선
      
      if (hoveredObject.type === 'text') {
        const textObj = hoveredObject as TextObjectType;
        const screenPos = worldToScreen(textObj.x, textObj.y);
        const fontSize = textObj.fontSize * scale;
        const textWidth = measureTextWidth(textObj.content, fontSize);
        const textHeight = fontSize;
        // 텍스트 영역 주변에 하이라이트 박스
        const padding = 4;
        ctx.strokeRect(
          screenPos.x - padding, 
          screenPos.y - textHeight - padding, 
          textWidth + padding * 2, 
          textHeight + padding * 2
        );
      } else if (hoveredObject.type === 'a4guide') {
        const a4Obj = hoveredObject as A4GuideObjectType;
        const screenPos = worldToScreen(a4Obj.x, a4Obj.y);
        const screenWidth = a4Obj.width * scale;
        const screenHeight = a4Obj.height * scale;
        
        // A4 가이드 전체 영역에 하이라이트
        ctx.strokeRect(screenPos.x, screenPos.y, screenWidth, screenHeight);
      }
    }
    
  }, [canvasOffset, scale, canvasObjects, selectedObject, hoveredObject, getTextBoxWidth, drawGrid, drawCanvasObjects, canvasWidth, canvasHeight, typewriterX, typewriterY, baseFontSize, screenToWorld, worldToScreen, showGrid, theme, measureTextWidth, colors]);

  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
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
      tempCtx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
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
        ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(textObj.content, screenX, screenY);
      });

      if (currentTypingText.trim()) {
        const worldPos = getCurrentWorldPosition();
        const screenX = worldPos.x * currentScale + currentOffset.x;
        const screenY = worldPos.y * currentScale + currentOffset.y;
        const fontSize = baseFontSize * currentScale; // 입력창 폰트 크기를 사용
        ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
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
      if (document.activeElement?.id === 'typewriter-input') return;
      if (e.key === ' ') {
        setIsSpacePressed(true);
        e.preventDefault();
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.id === 'typewriter-input') return;
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
    const fontSizeLevels = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 36, 42, 48, 56, 64];
    
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
        ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
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

  const resetCanvas = useCallback(() => {
    setScale(1);
    centerTypewriter();
    setSelectedObject(null);
  }, [setScale, centerTypewriter, setSelectedObject]);
  
  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // IME 조합 중이면 단축키 무시
      if (isComposing) return;
      const input = document.getElementById('typewriter-input') as HTMLInputElement;
      const isInputFocused = document.activeElement === input;
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
      const zoomLevels = [
        0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
      ];
      let currentIndex = zoomLevels.findIndex(level => Math.abs(level - scale) < 0.01);
      // If exact match not found, find closest level
      if (currentIndex === -1) {
        currentIndex = zoomLevels.reduce((prev, curr, index) => {
          return (Math.abs(curr - scale) < Math.abs(zoomLevels[prev] - scale)) ? index : prev;
        }, 0);
      }
      // UI Size: Ctrl/Cmd + +/-
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleUISizeChange(true); // up
          return;
        } else if (e.key === '-') {
          e.preventDefault();
          handleUISizeChange(false); // down
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
      // Scale: Alt/Option + +/-
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        // + 인식: =, +, Equal(Shift+Equal)
        if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
          e.preventDefault();
          const newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
          return;
        }
        // - 인식: -, _, Minus(Shift+Minus)
        if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
          e.preventDefault();
          const newIndex = Math.max(0, currentIndex - 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
          return;
        }
      }
      // Delete key
      if (e.key === 'Delete' && selectedObject && !isInputFocused) {
        e.preventDefault();
        setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
        setSelectedObject(null);
        return;
      }
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const moveDistance = getCurrentLineHeight();
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
  }, [scale, selectedObject, getCurrentLineHeight, zoomToLevel, setCanvasObjects, setSelectedObject, setCanvasOffset, handleUISizeChange, resetCanvas, setIsExportMenuOpen]);

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

  // 마우스가 텍스트박스 영역에 있는지 확인하는 함수
  const isPointInTextBox = useCallback((mouseX: number, mouseY: number) => {
    // 텍스트박스의 월드 좌표 계산
    const textBoxWorldCenter = screenToWorld(typewriterX, typewriterY);
    const textBoxWidth = getTextBoxWidth();
    const textBoxHeight = baseFontSize;
    
    // 마우스 위치를 월드 좌표로 변환
    const mouseWorldPos = screenToWorld(mouseX, mouseY);
    
    // 월드 좌표에서 텍스트박스 영역 계산
    const textBoxWorldLeft = textBoxWorldCenter.x - (textBoxWidth / scale) / 2;
    const textBoxWorldRight = textBoxWorldLeft + (textBoxWidth / scale);
    const textBoxWorldTop = textBoxWorldCenter.y - (textBoxHeight / scale) / 2;
    const textBoxWorldBottom = textBoxWorldTop + (textBoxHeight / scale);
    
    return mouseWorldPos.x >= textBoxWorldLeft && mouseWorldPos.x <= textBoxWorldRight && 
           mouseWorldPos.y >= textBoxWorldTop && mouseWorldPos.y <= textBoxWorldBottom;
  }, [getTextBoxWidth, typewriterX, typewriterY, baseFontSize, screenToWorld, scale]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 마우스 위치 업데이트 및 텍스트박스 영역 확인
    setMousePosition({ x: mouseX, y: mouseY });
    setIsMouseInTextBox(isPointInTextBox(mouseX, mouseY));
    
    // 마우스가 오브젝트 위에 있는지 확인 (드래그 중이 아닐 때만)
    if (!isDraggingText) {
      const objectUnderMouse = canvasObjects.find(obj => isPointInObject(obj, mouseX, mouseY));
      setHoveredObject(objectUnderMouse || null);
    }
    
    if (isDraggingText && selectedObject) {
      
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
    const zoomLevels = [
      0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
    ];
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

  // const resetCanvas = useCallback(() => {
  //   setScale(1);
  //   centerTypewriter();
  //   setSelectedObject(null);
  // }, [setScale, centerTypewriter, setSelectedObject]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTypingText(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 100);
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(true);
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    isComposingRef.current = false;
    setCurrentTypingText(e.currentTarget.value); 
  };


  useEffect(() => {
    if (showTextBox) {
      const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
      if (input) input.focus();
    }
  }, [showTextBox]);

  // [UNDO/REDO] 상태 스냅샷 타입 정의
  interface CanvasSnapshot {
    canvasObjects: CanvasObjectType[];
    canvasOffset: { x: number; y: number };
    scale: number;
    currentTypingText: string;
    baseFontSize: number;
  }

  const [undoStack, setUndoStack] = useState<CanvasSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasSnapshot[]>([]);

  // [UNDO/REDO] 현재 상태를 스냅샷으로 반환하는 함수
  const getSnapshot = useCallback((): CanvasSnapshot => ({
    canvasObjects: JSON.parse(JSON.stringify(canvasObjects)),
    canvasOffset: { ...canvasOffset },
    scale,
    currentTypingText,
    baseFontSize,
  }), [canvasObjects, canvasOffset, scale, currentTypingText, baseFontSize]);

  // [UNDO/REDO] 스냅샷을 상태에 적용하는 함수
  const applySnapshot = useCallback((snap: CanvasSnapshot) => {
    setCanvasObjects(snap.canvasObjects);
    setCanvasOffset(snap.canvasOffset);
    setScale(snap.scale);
    setCurrentTypingText(snap.currentTypingText);
    setBaseFontSize(snap.baseFontSize);
  }, [setCanvasObjects, setCanvasOffset, setScale, setCurrentTypingText, setBaseFontSize]);

  // [UNDO/REDO] 상태 변경 시 undoStack에 push
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev, getSnapshot()]);
    setRedoStack([]); // 새로운 작업이 발생하면 redo 스택 초기화
  }, [getSnapshot]);

  // [UNDO/REDO] undo 함수
  const handleUndo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, getSnapshot()]);
      applySnapshot(last);
      return prev.slice(0, -1);
    });
  }, [applySnapshot, getSnapshot]);

  // [UNDO/REDO] redo 함수
  const handleRedo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoStack(u => [...u, getSnapshot()]);
      applySnapshot(last);
      return prev.slice(0, -1);
    });
  }, [applySnapshot, getSnapshot]);

  // [UNDO/REDO] 상태 변경이 일어나는 주요 지점에 pushUndo() 호출
  // 예시: 텍스트 추가, 오브젝트 이동/삭제, 패닝, 줌, 전체 삭제 등
  // 텍스트 추가
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isComposing) {
        if (currentTypingText.trim() !== '') {
          pushUndo(); // 상태 변경 전 스냅샷 저장
          const worldPos = getCurrentWorldPosition();
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
        }
        // 오브젝트 생성 여부와 상관없이 줄바꿈(캔버스 오프셋 이동)은 항상 실행
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

  // 오브젝트 이동/삭제, 패닝, 줌, 전체 삭제 등에도 pushUndo() 추가
  // 예시: 오브젝트 삭제
  const handleDeleteSelected = () => {
    if (selectedObject) {
      pushUndo();
      setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
      setSelectedObject(null);
    }
  };

  // 전체 삭제
  const clearAll = () => {
    setCanvasObjects([]);
    setCurrentTypingText('');
    setSelectedObject(null);
  };

  // 패닝, 줌 등에도 pushUndo() 추가 필요(핸들러 내부에 삽입)
  // ... existing code ...
  // [UNDO/REDO] 단축키 핸들러 추가 (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
  useEffect(() => {
    const handleUndoRedoKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          e.preventDefault();
        } else if (e.key === 'y' || e.key === 'Y') {
          handleRedo();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleUndoRedoKey);
    return () => window.removeEventListener('keydown', handleUndoRedoKey);
  }, [handleUndo, handleRedo]);

  // ... existing code ...
  // [UNDO/REDO] UI 버튼 추가 (헤더 또는 우측 하단 등)
  // 예시: 헤더에 Undo/Redo 버튼 추가
  // ... 기존 헤더 코드 위에 추가 ...
  <div className="flex items-center gap-2">
    {/* Reset 단독 그룹 */}
    <div className="flex items-center gap-2">
      <button
        onClick={resetCanvas}
        className={`p-2 rounded-lg border-2 transition-colors ${
          theme === 'dark'
            ? 'bg-blue-900/70 border-blue-600 text-blue-300 hover:bg-blue-800 hover:text-white'
            : 'bg-blue-100/80 border-blue-400 text-blue-700 hover:bg-blue-200 hover:text-blue-900'
        }`}
        style={{fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}
        title="초기화"
      >
        <RotateCcw className="w-5 h-5" color={theme === 'dark' ? '#60a5fa' : '#2563eb'} />
      </button>
    </div>
    <div className="border-l h-6 mx-2" />
    {/* 파일 관련 */}
    <label className={`p-2 rounded-lg transition-colors cursor-pointer ${
      theme === 'dark'
        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`} title="Import">
      <Import className="w-4 h-4" />
      <input type="file" accept=".json" onChange={importFile} className="hidden" />
    </label>
    <div className="relative">
      <button
        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        title="Export"
      >
        <Upload className="w-4 h-4" />
      </button>
      {isExportMenuOpen && (
        <div className={`export-dropdown absolute right-0 mt-2 min-w-[140px] rounded shadow-lg z-50 p-1 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <button onClick={exportAsPNG} className={`block w-full text-left px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Export as PNG</button>
          <button onClick={exportAsSVG} className={`block w-full text-left px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Export as SVG</button>
          <button onClick={exportAsJSON} className={`block w-full text-left px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Export as JSON</button>
        </div>
      )}
    </div>
    <div className="border-l h-6 mx-2" />
    {/* 보기/설정 관련 */}
    <button
      onClick={() => setShowTextBox(prev => !prev)}
      className={`p-2 rounded-lg transition-colors ${
        showTextBox 
          ? 'text-blue-500 bg-blue-500/10' 
          : theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      title="텍스트 입력창 토글"
    >
      <TextCursorInput className="w-4 h-4" />
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
      title="캔버스 정보 토글"
    >
      <Info className="w-4 h-4" />
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
      title="단축키 안내 토글"
    >
      <Layers className="w-4 h-4" />
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
    <button
      onClick={clearAll}
      className={`p-2 rounded-lg transition-colors ${
        theme === 'dark'
          ? 'text-gray-400 hover:text-white hover:bg-gray-800'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      title="Reset"
    >
      <Trash2 className="w-4 h-4" />
    </button>
    <div className="border-l h-6 mx-2" />
    {/* 편집/도구 관련 */}
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
        if (maxCharsPerLine !== 80) return; // 80자 모드에서만 동작
        // A4Guide 생성
        const textBoxWorldCenter = screenToWorld(typewriterX, typewriterY);
        const textBoxWorldTopLeft = screenToWorld(
          typewriterX - getTextBoxWidth() / 2,
          typewriterY - baseFontSize / 2
        );
        // 실제 텍스트박스 픽셀 폭을 160mm로 가정하고 A4 가이드 계산
        const actualTextBoxWidth = getTextBoxWidth(); // 현재 80자 기준 픽셀 폭
        const mmPerPixel = TEXT_BOX_WIDTH_MM / actualTextBoxWidth; // 160mm / 실제픽셀폭
        const a4MarginLRPixels = A4_MARGIN_LR_MM / mmPerPixel; // 25mm를 픽셀로 변환
        const a4WidthWorld = actualTextBoxWidth + (a4MarginLRPixels * 2); // 텍스트박스 + 좌우 여백
        const a4HeightWorld = a4WidthWorld * (A4_HEIGHT_MM / A4_WIDTH_MM); // A4 비율 유지
        const a4MarginTopPixels = A4_MARGIN_TOP_MM / mmPerPixel; // 30mm를 픽셀로 변환
        const a4OriginX = textBoxWorldCenter.x - a4WidthWorld / 2;
        const a4OriginY = textBoxWorldTopLeft.y - a4MarginTopPixels;
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
      disabled={maxCharsPerLine !== 80}
      className={`p-2 rounded-lg transition-colors ${
        maxCharsPerLine !== 80
          ? (theme === 'dark'
              ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed opacity-50'
              : 'text-gray-400 bg-gray-100/60 cursor-not-allowed opacity-50')
          : (theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
      }`}
      title="Add A4 Guide"
    >
      <NotepadTextDashed className="w-4 h-4" />
    </button>
  </div>
  // ... 기존 헤더 코드 ...

  // 폭 변경 시에도 입력창 LT 월드 좌표 고정
  const handleMaxCharsChange = (newMaxChars: number) => {
    if (newMaxChars === maxCharsPerLine) return;

    // 1. 현재 입력창의 LT 월드 좌표 구하기
    const prevTextBoxWidth = getTextBoxWidth();
    const prevLTScreen = {
      x: typewriterX - prevTextBoxWidth / 2,
      y: typewriterY - baseFontSize / 2,
    };
    const prevLTWorld = screenToWorld(prevLTScreen.x, prevLTScreen.y);

    // 2. 새 폭에 맞는 입력창 폭 계산
    const tempTextBoxWidth = measureTextWidth('A'.repeat(newMaxChars));
    const newLTScreen = {
      x: typewriterX - tempTextBoxWidth / 2,
      y: typewriterY - baseFontSize / 2,
    };

    // 3. 새 offset 계산 (LT 월드 좌표가 동일한 위치에 오도록)
    const newOffsetX = newLTScreen.x - prevLTWorld.x * scale;
    const newOffsetY = newLTScreen.y - prevLTWorld.y * scale;

    setMaxCharsPerLine(newMaxChars);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  };

  useEffect(() => {
    // HiDPI(레티나) 대응: 캔버스 해상도 업스케일
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [canvasWidth, canvasHeight]);

  const isComposingRef = useRef(false);

  return (
    <div className={`w-full h-screen flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${
        theme === 'dark' 
          ? 'bg-black/90 border-gray-800' 
          : 'bg-white/90 border-gray-200'
      } backdrop-blur-sm border-b p-4 flex items-center justify-between relative z-50`}>
        {/* 좌측: 타이틀 */}
        <div className="flex items-center gap-6 min-w-[180px]">
          <h1 className={`text-lg font-medium flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <Type className="w-5 h-5" />
            Infinite Canvas Typewriter
          </h1>
        </div>
        {/* 중앙: 파일/도구/삭제 */}
        <div className="flex items-center gap-2 justify-center flex-1 relative">
          {/* 파일 관련 */}
          <label className={`p-2 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`} title="Import">
            <Import className="w-4 h-4" />
            <input type="file" accept=".json" onChange={importFile} className="hidden" />
          </label>
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Export"
            >
              <Upload className="w-4 h-4" />
            </button>
            {isExportMenuOpen && (
              <div className={`export-dropdown absolute right-0 mt-2 min-w-[140px] rounded shadow-lg z-50 p-1 ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <button onClick={exportAsPNG} className={`block w-full text-left px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Export as PNG</button>
                <button onClick={exportAsSVG} className={`block w-full text-left px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Export as SVG</button>
                <button onClick={exportAsJSON} className={`block w-full text-left px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Export as JSON</button>
              </div>
            )}
          </div>
          {/* 구분선 */}
          <span className="mx-2 text-gray-400 select-none">|</span>
          {/* 도구 관련 */}
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
              if (maxCharsPerLine !== 80) return; // 80자 모드에서만 동작
              // A4Guide 생성
              const textBoxWorldCenter = screenToWorld(typewriterX, typewriterY);
              const textBoxWorldTopLeft = screenToWorld(
                typewriterX - getTextBoxWidth() / 2,
                typewriterY - baseFontSize / 2
              );
              // 실제 텍스트박스 픽셀 폭을 160mm로 가정하고 A4 가이드 계산
              const actualTextBoxWidth = getTextBoxWidth(); // 현재 80자 기준 픽셀 폭
              const mmPerPixel = TEXT_BOX_WIDTH_MM / actualTextBoxWidth; // 160mm / 실제픽셀폭
              const a4MarginLRPixels = A4_MARGIN_LR_MM / mmPerPixel; // 25mm를 픽셀로 변환
              const a4WidthWorld = actualTextBoxWidth + (a4MarginLRPixels * 2); // 텍스트박스 + 좌우 여백
              const a4HeightWorld = a4WidthWorld * (A4_HEIGHT_MM / A4_WIDTH_MM); // A4 비율 유지
              const a4MarginTopPixels = A4_MARGIN_TOP_MM / mmPerPixel; // 30mm를 픽셀로 변환
              const a4OriginX = textBoxWorldCenter.x - a4WidthWorld / 2;
              const a4OriginY = textBoxWorldTopLeft.y - a4MarginTopPixels;
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
            disabled={maxCharsPerLine !== 80}
            className={`p-2 rounded-lg transition-colors ${
              maxCharsPerLine !== 80
                ? (theme === 'dark'
                    ? 'text-gray-600 bg-gray-800/40 cursor-not-allowed opacity-50'
                    : 'text-gray-400 bg-gray-100/60 cursor-not-allowed opacity-50')
                : (theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
            }`}
            title="Add A4 Guide"
          >
            <NotepadTextDashed className="w-4 h-4" />
          </button>
          {/* 구분선 */}
          <span className="mx-2 text-gray-400 select-none">|</span>
          {/* 삭제(Reset) 버튼 */}
          <button
            onClick={clearAll}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Reset"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {/* 우측: 다크모드, info, shortcuts */}
        <div className="flex items-center gap-2 min-w-[180px] justify-end">
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
          <button
            onClick={() => setShowInfo(prev => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              showInfo 
                ? 'text-blue-500 bg-blue-500/10' 
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="캔버스 정보 토글"
          >
            <Info className="w-4 h-4" />
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
            title="단축키 안내 토글"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`absolute inset-0 ${
            (() => {
              if (isSpacePressed) {
                return isMouseInTextBox ? 'cursor-grab' : 'cursor-default';
              }
              if (hoveredObject && isMouseInTextBox) {
                return 'cursor-move'; // 오브젝트 이동 가능을 명확히 표시
              }
              if (isMouseInTextBox) {
                return 'cursor-text';
              }
              return 'cursor-default';
            })()
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setHoveredObject(null);
            setIsMouseInTextBox(false);
          }}
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
            {/* 폭 선택 버튼: 입력창 아래 중앙 */}
            <div
              style={{
                position: 'absolute',
                left: typewriterX - getTextBoxWidth() / 2,
                top: typewriterY + baseFontSize / 2 + 24,
                width: getTextBoxWidth(),
                display: 'flex',
                justifyContent: 'center',
                zIndex: 30,
                pointerEvents: 'auto',
              }}
            >
              {[40, 60, 80].map((chars, idx, arr) => (
                <React.Fragment key={chars}>
                  <button
                    onClick={() => handleMaxCharsChange(chars)}
                    disabled={maxCharsPerLine === chars}
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: maxCharsPerLine === chars
                        ? '#60a5fa' // 하이라이트 하늘색
                        : (theme === 'dark' ? '#bfc9d1' : '#bfc9d1'), // 연한 회색
                      fontWeight: maxCharsPerLine === chars ? 500 : 400, // 더 얇게
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 13,
                      padding: '1px 8px',
                      cursor: maxCharsPerLine === chars ? 'default' : 'pointer',
                      opacity: maxCharsPerLine === chars ? 1 : 0.7,
                      transition: 'color 0.15s, opacity 0.15s',
                    }}
                    title={`${chars}자 폭으로 변경`}
                  >
                    {chars}
                  </button>
                  {idx < arr.length - 1 && (
                    <span style={{ color: theme === 'dark' ? '#bfc9d1' : '#bfc9d1', fontSize: 13, margin: '0 2px' }}>-</span>
                  )}
                </React.Fragment>
              ))}
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
          hoveredObject={hoveredObject}
          mousePosition={mousePosition}
          isMouseInTextBox={isMouseInTextBox}
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
              const zoomLevels = [
                0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
              ];
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
              const zoomLevels = [
                0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
              ];
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

        {/* Undo/Redo 버튼 */}
        <div
          style={{
            position: 'absolute',
            left: typewriterX + getTextBoxWidth() / 2 - 68, // 기존 -48에서 -76으로 더 왼쪽으로 이동
            top: typewriterY + baseFontSize / 2 + 12,
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            zIndex: 30,
            padding: '4px 20px 4px 4px',
            borderRadius: '10px',
            background: 'transparent',
          }}
        >
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#aaa',
              cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            title="실행 취소 (Undo)"
            onMouseOver={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(200,200,200,0.08)' : 'rgba(200,200,200,0.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <CornerUpLeft className="w-4 h-4" color="#aaa" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#aaa',
              cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            title="다시 실행 (Redo)"
            onMouseOver={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(200,200,200,0.08)' : 'rgba(200,200,200,0.15)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <CornerUpRight className="w-4 h-4" color="#aaa" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfiniteTypewriterCanvas;
