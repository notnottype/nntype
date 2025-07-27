import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasObjectType, CanvasState, Theme } from '../types';
import { INITIAL_UI_FONT_SIZE_PX, MAX_CHARS_PER_LINE } from '../constants';
import { measureTextWidth } from '../utils';

export const useCanvas = () => {
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
  const [pxPerMm, setPxPerMm] = useState(96 / 25.4);
  const [showInfo, setShowInfo] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [showTextBox, setShowTextBox] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const [baseFontSize, setBaseFontSize] = useState(INITIAL_UI_FONT_SIZE_PX);

  const typewriterX = canvasWidth / 2;
  const typewriterY = canvasHeight / 2;

  const measureText = useCallback((text: string, fontSize: number = baseFontSize) => {
    return measureTextWidth(text, fontSize, canvasRef.current, fontLoaded);
  }, [baseFontSize, fontLoaded]);

  const getTextBoxWidth = useCallback(() => {
    return measureText('A'.repeat(MAX_CHARS_PER_LINE));
  }, [measureText]);

  const worldToScreen = useCallback((worldX: number, worldY: number) => ({
    x: worldX * scale + canvasOffset.x,
    y: worldY * scale + canvasOffset.y
  }), [scale, canvasOffset]);

  const screenToWorld = useCallback((screenX: number, screenY: number) => ({
    x: (screenX - canvasOffset.x) / scale,
    y: (screenY - canvasOffset.y) / scale
  }), [scale, canvasOffset]);

  const getCurrentLineHeight = useCallback(() => {
    if (selectedObject && selectedObject.type === 'text') {
      return selectedObject.fontSize * scale * 1.2;
    }
    return baseFontSize * 1.2;
  }, [selectedObject, baseFontSize, scale]);

  // 타이프라이터 전용 라인 높이 함수 (외부 상태에 의존하지 않음)
  const getTypewriterLineHeight = useCallback(() => {
    return baseFontSize * 1.6;
  }, [baseFontSize]);

  const getCurrentWorldPosition = useCallback(() => {
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize / 2;
    // 타이프라이터 박스의 실제 높이를 기준으로 베이스라인 계산
    const actualTypewriterHeight = baseFontSize * 1.6; // TypewriterInput의 실제 높이와 일치
    const textBoxBaseline = textBoxTop + actualTypewriterHeight;
    return screenToWorld(textBoxLeft, textBoxBaseline);
  }, [getTextBoxWidth, screenToWorld, typewriterX, typewriterY, baseFontSize]);

  const centerTypewriter = useCallback(() => {
    setCanvasOffset({
      x: typewriterX,
      y: typewriterY
    });
  }, [typewriterX, typewriterY]);

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

  // Initialize pixel per mm measurement
  useEffect(() => {
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

  // Handle window resize
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

  return {
    // State
    canvasRef,
    canvasObjects,
    setCanvasObjects,
    currentTypingText,
    setCurrentTypingText,
    isComposing,
    setIsComposing,
    isDragging,
    setIsDragging,
    isDraggingText,
    setIsDraggingText,
    dragStart,
    setDragStart,
    scale,
    setScale,
    isTyping,
    setIsTyping,
    fontLoaded,
    setFontLoaded,
    selectedObject,
    setSelectedObject,
    isExportMenuOpen,
    setIsExportMenuOpen,
    canvasWidth,
    canvasHeight,
    canvasOffset,
    setCanvasOffset,
    isSpacePressed,
    setIsSpacePressed,
    showGrid,
    setShowGrid,
    pxPerMm,
    showInfo,
    setShowInfo,
    showShortcuts,
    setShowShortcuts,
    showTextBox,
    setShowTextBox,
    theme,
    setTheme,
    baseFontSize,
    setBaseFontSize,
    typewriterX,
    typewriterY,
    
    // Methods
    measureText,
    getTextBoxWidth,
    worldToScreen,
    screenToWorld,
    getCurrentLineHeight,
    getTypewriterLineHeight,
    getCurrentWorldPosition,
    centerTypewriter,
    zoomToLevel,
  };
};