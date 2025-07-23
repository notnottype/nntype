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

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Type, Move, Download, Import, Grid, FileText, Image, Code, RotateCcw, Trash2, Eye, EyeOff, Sun, Moon, Layers, Info, NotepadTextDashed, TextCursorInput } from 'lucide-react';
import { Header } from './Header';
import { CanvasContainer } from './CanvasContainer';
import { createPNGExporter, createJSONExporter, createSVGExporter } from '../utils/exportHandlers';
import { 
  measureTextWidth, 
  snapToGrid, 
  isPointInObject, 
  calculateContentBoundingBox,
  worldToScreen,
  screenToWorld,
  drawGrid,
  drawCanvasObjects,
  drawHoverHighlight,
  setupCanvasHiDPI,
  loadGoogleFonts,
  getCurrentLineHeight,
  findFontSizeLevel,
  findZoomLevel,
  calculateTextBoxOffset,
  calculateA4GuidePosition,
  calculateDPIPixelsPerMM,
  drawContentForExport,
  createExportData,
  downloadFile,
  downloadCanvas,
  createSVGElement,
  addSVGBackground,
  addTextObjectToSVG,
  addA4GuideToSVG,
  addCurrentTypingTextToSVG,
  calculateSVGOutputSize,
  serializeSVG
} from '../utils';
import { 
  INITIAL_UI_FONT_SIZE_PX,
  INITIAL_BASE_FONT_SIZE_PT,
  CANVAS_ZOOM_LEVELS,
  UI_FONT_SIZE_LEVELS_PX,
  BASE_FONT_SIZE_LEVELS_PT,
  TEXT_BOX_WIDTH_MM,
  A4_MARGIN_LR_MM,
  A4_MARGIN_TOP_MM,
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  THEME_COLORS
} from '../constants';
import { pxToPoints, pointsToPx } from '../utils/units';
import { CanvasObjectType, A4GuideObjectType, Theme } from '../types';
import { ExportMenu } from './ExportMenu';
import { saveSession, loadSession, clearSession } from '../utils/sessionStorage';

1
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
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 64);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Dynamically measure CSS pixels per millimeter (accounts for DPI / zoom)
  const [pxPerMm, setPxPerMm] = useState(96 / 25.4); // fallback default

  const [showInfo, setShowInfo] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [showTextBox, setShowTextBox] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  const [maxCharsPerLine, setMaxCharsPerLine] = useState(80); // 한글 기준 80자, 동적 변경
  const [baseFontSize, setBaseFontSize] = useState(INITIAL_UI_FONT_SIZE_PX); // UI 폰트 크기 (픽셀)
  const [baseFontSizePt, setBaseFontSizePt] = useState(INITIAL_BASE_FONT_SIZE_PT); // Base 폰트 크기 (포인트)
  const [typewriterPosition, setTypewriterPosition] = useState({ 
    x: window.innerWidth / 2, 
    y: (window.innerHeight - 64) / 2 
  });

  useEffect(() => {
    setPxPerMm(calculateDPIPixelsPerMM());
  }, []);



  // Load Google Fonts
  useEffect(() => {
    loadGoogleFonts().then(() => setFontLoaded(true));
  }, []);

  // Load session on component mount
  useEffect(() => {
    const sessionData = loadSession();
    if (sessionData) {
      console.log('Restoring session from:', new Date(sessionData.timestamp));
      
      // Restore canvas state
      setCanvasObjects(sessionData.canvasObjects);
      setCanvasOffset(sessionData.canvasOffset);
      setScale(sessionData.scale);
      setCurrentTypingText(sessionData.currentTypingText);
      setBaseFontSize(sessionData.baseFontSize);
      setMaxCharsPerLine(sessionData.maxCharsPerLine);
      
      // Restore UI state
      setShowGrid(sessionData.showGrid);
      setShowTextBox(sessionData.showTextBox);
      setShowInfo(sessionData.showInfo);
      setShowShortcuts(sessionData.showShortcuts);
      setTheme(sessionData.theme);
      
      // Restore selected object if exists
      if (sessionData.selectedObjectId) {
        const selectedObj = sessionData.canvasObjects.find(obj => obj.id === sessionData.selectedObjectId);
        if (selectedObj) {
          setSelectedObject(selectedObj);
        }
      }
    } else {
      // No session found, use initial centering
      setTimeout(centerTypewriter, 0);
    }
  }, []);

  // Typewriter settings
  const typewriterX = canvasWidth / 2;
  const typewriterY = canvasHeight / 2;

  // Auto-save session when state changes
  useEffect(() => {
    // Don't save during initial load
    if (!fontLoaded) return;
    
    const saveCurrentSession = () => {
      saveSession({
        canvasObjects,
        canvasOffset,
        scale,
        typewriterPosition: { x: typewriterX, y: typewriterY },
        currentTypingText,
        baseFontSize,
        maxCharsPerLine,
        showGrid,
        showTextBox,
        showInfo,
        showShortcuts,
        theme,
        selectedObjectId: selectedObject?.id
      });
    };

    // Debounce saving to avoid too frequent saves
    const timeoutId = setTimeout(saveCurrentSession, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    canvasObjects,
    canvasOffset,
    scale,
    typewriterX,
    typewriterY,
    currentTypingText,
    baseFontSize,
    maxCharsPerLine,
    showGrid,
    showTextBox,
    showInfo,
    showShortcuts,
    theme,
    selectedObject,
    fontLoaded
  ]);

  // Save session before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSession({
        canvasObjects,
        canvasOffset,
        scale,
        typewriterPosition: { x: typewriterX, y: typewriterY },
        currentTypingText,
        baseFontSize,
        maxCharsPerLine,
        showGrid,
        showTextBox,
        showInfo,
        showShortcuts,
        theme,
        selectedObjectId: selectedObject?.id
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    canvasObjects,
    canvasOffset,
    scale,
    typewriterX,
    typewriterY,
    currentTypingText,
    baseFontSize,
    maxCharsPerLine,
    showGrid,
    showTextBox,
    showInfo,
    showShortcuts,
    theme,
    selectedObject
  ]);
  
  const measureTextWidthLocal = useCallback((text: string, fontSize: number = baseFontSize) => {
    return measureTextWidth(text, fontSize, canvasRef.current, fontLoaded);
  }, [baseFontSize, fontLoaded]);

  const getTextBoxWidth = useCallback(() => {
    return measureTextWidthLocal('A'.repeat(maxCharsPerLine));
  }, [measureTextWidthLocal, maxCharsPerLine]);

  const worldToScreenLocal = useCallback((worldX: number, worldY: number) => 
    worldToScreen(worldX, worldY, scale, canvasOffset), [scale, canvasOffset]);

  const screenToWorldLocal = useCallback((screenX: number, screenY: number) => 
    screenToWorld(screenX, screenY, scale, canvasOffset), [scale, canvasOffset]);

  const zoomToLevel = useCallback((newScale: number) => {
    const currentTextBoxWidth = getTextBoxWidth();
    const newTextBoxWidth = measureTextWidthLocal('A'.repeat(maxCharsPerLine), baseFontSize);
    const newOffset = calculateTextBoxOffset(
      newScale, 
      scale, 
      canvasOffset, 
      typewriterX, 
      typewriterY, 
      currentTextBoxWidth, 
      newTextBoxWidth, 
      baseFontSize
    );

    setScale(newScale);
    setCanvasOffset(newOffset);
  }, [getTextBoxWidth, measureTextWidthLocal, scale, canvasOffset, typewriterX, typewriterY, baseFontSize, maxCharsPerLine]);

  const getCurrentWorldPosition = useCallback(() => {
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize / 2;
    const textBoxBaseline = textBoxTop + baseFontSize * 1.2;
    return screenToWorldLocal(textBoxLeft, textBoxBaseline);
  }, [getTextBoxWidth, screenToWorldLocal, typewriterX, typewriterY, baseFontSize]);

  const isPointInObjectLocal = useCallback((obj: CanvasObjectType, screenX: number, screenY: number) => {
    return isPointInObject(obj, screenX, screenY, scale, worldToScreenLocal, measureTextWidthLocal);
  }, [scale, worldToScreenLocal, measureTextWidthLocal]);

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

  const drawGridLocal = useCallback((ctx: CanvasRenderingContext2D) => {
    const baseGridSize = getCurrentLineHeight(selectedObject, baseFontSize, scale);
    drawGrid(ctx, canvasWidth, canvasHeight, canvasOffset, baseGridSize, THEME_COLORS[theme].grid);
  }, [canvasOffset, canvasWidth, canvasHeight, theme, selectedObject, baseFontSize, scale]);



  const drawCanvasObjectsLocal = useCallback((ctx: CanvasRenderingContext2D) => {
    drawCanvasObjects(
      ctx,
      canvasObjects,
      scale,
      selectedObject,
      canvasWidth,
      canvasHeight,
      worldToScreenLocal,
      measureTextWidthLocal,
      theme,
      THEME_COLORS
    );
  }, [canvasObjects, scale, selectedObject, canvasWidth, canvasHeight, worldToScreenLocal, measureTextWidthLocal, theme]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Background
    ctx.fillStyle = THEME_COLORS[theme].background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    if (showGrid) {
      drawGridLocal(ctx);
    }
    drawCanvasObjectsLocal(ctx);
    
    // 호버된 오브젝트 하이라이트 표시
    if (hoveredObject) {
      drawHoverHighlight(ctx, hoveredObject, scale, worldToScreenLocal, measureTextWidthLocal);
    }
    
  }, [canvasWidth, canvasHeight, theme, showGrid, drawGridLocal, drawCanvasObjectsLocal, hoveredObject, scale, worldToScreenLocal, measureTextWidthLocal]);

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



  const calculateBounds = useCallback(() => {
    const measureText = (text: string, fontSize: number) => {
      const tempCanvas = document.createElement('canvas');
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
  }, [canvasObjects, currentTypingText, baseFontSize, getCurrentWorldPosition]);

  const exportAsPNG = useMemo(() => 
    createPNGExporter(
      canvasObjects,
      currentTypingText,
      baseFontSize,
      getCurrentWorldPosition,
      theme,
      THEME_COLORS
    ),
    [canvasObjects, currentTypingText, baseFontSize, getCurrentWorldPosition, theme]
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

  const handleAddA4Guide = useCallback(() => {
    if (maxCharsPerLine !== 80) return;
    
    const textBoxWorldCenter = screenToWorldLocal(typewriterX, typewriterY);
    const textBoxWorldTopLeft = screenToWorldLocal(
      typewriterX - getTextBoxWidth() / 2,
      typewriterY - baseFontSize / 2
    );
    const actualTextBoxWidth = getTextBoxWidth();
    
    const a4Guide = calculateA4GuidePosition(
      textBoxWorldCenter,
      textBoxWorldTopLeft,
      actualTextBoxWidth,
      TEXT_BOX_WIDTH_MM,
      A4_MARGIN_LR_MM,
      A4_MARGIN_TOP_MM,
      A4_WIDTH_MM,
      A4_HEIGHT_MM
    );
    
    setCanvasObjects(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'a4guide',
        x: a4Guide.x,
        y: a4Guide.y,
        width: a4Guide.width,
        height: a4Guide.height
      } as A4GuideObjectType
    ]);
  }, [maxCharsPerLine, typewriterX, typewriterY, getTextBoxWidth, baseFontSize, screenToWorldLocal]);

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

  // 타이프라이터 LT 월드 좌표 유지하면서 상태 변경하는 공통 함수
  const maintainTypewriterLTWorldPosition = useCallback((
    newFontSize: number,
    newScale: number,
    measureTextWidthFn: (text: string, fontSize: number) => number
  ) => {
    const currentOffset = canvasOffset;
    const currentScale = scale;
    const currentFontSize = baseFontSize;
    
    // 1. 현재 타이프라이터 LT의 월드 좌표 계산
    const currentTextBoxWidth = measureTextWidthFn('A'.repeat(maxCharsPerLine), currentFontSize);
    const currentLTScreen = {
      x: typewriterX - currentTextBoxWidth / 2,
      y: typewriterY - currentFontSize / 2
    };
    const currentLTWorld = {
      x: (currentLTScreen.x - currentOffset.x) / currentScale,
      y: (currentLTScreen.y - currentOffset.y) / currentScale
    };
    
    // 2. 새로운 설정에서 타이프라이터 LT의 화면 좌표 계산
    const newTextBoxWidth = measureTextWidthFn('A'.repeat(maxCharsPerLine), newFontSize);
    const newLTScreen = {
      x: typewriterX - newTextBoxWidth / 2,
      y: typewriterY - newFontSize / 2
    };
    
    // 3. 동일한 월드 좌표가 새로운 LT 화면 위치에 오도록 오프셋 계산
    const targetScreenX = currentLTWorld.x * newScale;
    const targetScreenY = currentLTWorld.y * newScale;
    
    const newOffset = {
      x: newLTScreen.x - targetScreenX,
      y: newLTScreen.y - targetScreenY
    };
    
    // 4. 상태 업데이트
    setBaseFontSize(newFontSize);
    setScale(newScale);
    setCanvasOffset(newOffset);
  }, [canvasOffset, scale, baseFontSize, maxCharsPerLine, typewriterX, typewriterY]);

  // UI Font Size 조절 함수 (픽셀 기반 - 타이프라이터 입력박스 크기 조정)
  const handleUISizeChange = (up: boolean) => {
    const currentIndex = findFontSizeLevel(baseFontSize, UI_FONT_SIZE_LEVELS_PX);
    
    let newIndex = up
      ? Math.min(UI_FONT_SIZE_LEVELS_PX.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const newFontSize = UI_FONT_SIZE_LEVELS_PX[newIndex];
      const fontSizeRatio = newFontSize / baseFontSize;
      const newScale = scale * fontSizeRatio;
      
      // measureTextWidth 함수 생성
      const measureTextWidthWithFont = (text: string, fontSize: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !fontLoaded) return text.length * 12;
        const ctx = canvas.getContext('2d');
        if (!ctx) return text.length * 12;
        ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
        return ctx.measureText(text).width;
      };
      
      maintainTypewriterLTWorldPosition(newFontSize, newScale, measureTextWidthWithFont);
      // UI Font Size만 조정하고 Base Font Size는 독립적으로 유지
    }
  };

  // Base Font Size 조절 함수 (포인트 기반 - 텍스트 객체 논리적 크기 조정)
  const handleBaseFontSizeChange = (up: boolean) => {
    const currentIndex = findFontSizeLevel(baseFontSizePt, BASE_FONT_SIZE_LEVELS_PT);
    
    let newIndex = up
      ? Math.min(BASE_FONT_SIZE_LEVELS_PT.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const newBaseFontSizePt = BASE_FONT_SIZE_LEVELS_PT[newIndex];
      const newBaseFontSizePx = pointsToPx(newBaseFontSizePt);
      
      // 포인트 크기 변화 비율 계산 (역비율 적용)
      const ptRatio = newBaseFontSizePt / baseFontSizePt;
      const newScale = scale / ptRatio; // Base Font Size 증가 시 캔버스 축소 (역비율)
      
      // measureTextWidth 함수 생성 (현재 UI 폰트 크기 유지)
      const measureTextWidthWithFont = (text: string, fontSize: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !fontLoaded) return text.length * 12;
        const ctx = canvas.getContext('2d');
        if (!ctx) return text.length * 12;
        ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
        return ctx.measureText(text).width;
      };
      
      // UI 폰트 크기는 유지하면서 스케일만 조정하여 LT 월드 좌표 유지
      maintainTypewriterLTWorldPosition(baseFontSize, newScale, measureTextWidthWithFont);
      // Base Font Size만 업데이트
      setBaseFontSizePt(newBaseFontSizePt);
    }
  };

  const resetCanvas = useCallback(() => {
    setScale(1);
    setBaseFontSize(INITIAL_UI_FONT_SIZE_PX); // UI Font Size 초기화
    setBaseFontSizePt(INITIAL_BASE_FONT_SIZE_PT); // Base Font Size 초기화
    centerTypewriter();
    setSelectedObject(null);
    clearSession(); // 세션도 함께 클리어
  }, [setScale, centerTypewriter, setSelectedObject]);
  
  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // IME 조합 중이면 단축키 무시
      if (isComposing) return;
      const input = document.getElementById('typewriter-input') as HTMLInputElement;
      const isInputFocused = document.activeElement === input;
      if (e.key === 'Escape') {
      }
      const currentZoomIndex = findZoomLevel(scale, CANVAS_ZOOM_LEVELS);
      // UI Font Size: Ctrl/Cmd + +/- (UI에서 표시되는 폰트 크기 조정)
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
      // Base Font Size: Alt/Option + +/- (텍스트 객체 논리적 크기 조정)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        // + 인식: =, +, Equal(Shift+Equal)
        if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
          e.preventDefault();
          handleBaseFontSizeChange(true);
          return;
        }
        // - 인식: -, _, Minus(Shift+Minus)
        if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
          e.preventDefault();
          handleBaseFontSizeChange(false);
          return;
        }
      }
      // Canvas Zoom: Shift + Alt + +/- (캔버스 확대/축소)
      if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
        // + 인식: =, +, Equal(Shift+Equal)
        if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
          e.preventDefault();
          const newZoomIndex = Math.min(CANVAS_ZOOM_LEVELS.length - 1, currentZoomIndex + 1);
          if (newZoomIndex !== currentZoomIndex) {
            zoomToLevel(CANVAS_ZOOM_LEVELS[newZoomIndex]);
          }
          return;
        }
        // - 인식: -, _, Minus(Shift+Minus)
        if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
          e.preventDefault();
          const newZoomIndex = Math.max(0, currentZoomIndex - 1);
          if (newZoomIndex !== currentZoomIndex) {
            zoomToLevel(CANVAS_ZOOM_LEVELS[newZoomIndex]);
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
        const moveDistance = getCurrentLineHeight(selectedObject, baseFontSize, scale);
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
  }, [scale, selectedObject, getCurrentLineHeight, zoomToLevel, setCanvasObjects, setSelectedObject, setCanvasOffset, handleUISizeChange, resetCanvas]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const clickedObject = canvasObjects.find(obj => isPointInObjectLocal(obj, mouseX, mouseY));
    
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

  // 마우스가 텍스트박스 영역에 있는지 확인하는 함수
  const isPointInTextBox = useCallback((mouseX: number, mouseY: number) => {
    // 텍스트박스의 월드 좌표 계산
    const textBoxWorldCenter = screenToWorldLocal(typewriterX, typewriterY);
    const textBoxWidth = getTextBoxWidth();
    const textBoxHeight = baseFontSize;
    
    // 마우스 위치를 월드 좌표로 변환
    const mouseWorldPos = screenToWorldLocal(mouseX, mouseY);
    
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
      const objectUnderMouse = canvasObjects.find(obj => isPointInObjectLocal(obj, mouseX, mouseY));
      setHoveredObject(objectUnderMouse || null);
    }
    
    if (isDraggingText && selectedObject) {
      
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      // 월드 단위로 변환한 이동 거리를 그리드 단위로 스냅
      const worldDeltaX = deltaX / scale;
      const worldDeltaY = deltaY / scale;
      const worldGridSize = getCurrentLineHeight(selectedObject, baseFontSize, scale) / scale; // 월드 단위 그리드 크기
      
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
      const currentLineHeight = getCurrentLineHeight(selectedObject, baseFontSize, scale);
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
    const currentIndex = findZoomLevel(scale, zoomLevels);
    
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
          y: prev.y - getCurrentLineHeight(selectedObject, baseFontSize, scale)
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
    <ExportMenu
      onExportPNG={exportAsPNG}
      onExportSVG={exportAsSVG}
      onExportJSON={exportAsJSON}
      theme={theme}
    />
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
        const textBoxWorldCenter = screenToWorldLocal(typewriterX, typewriterY);
        const textBoxWorldTopLeft = screenToWorldLocal(
          typewriterX - getTextBoxWidth() / 2,
          typewriterY - baseFontSize / 2
        );
        const actualTextBoxWidth = getTextBoxWidth();
        
        const a4Guide = calculateA4GuidePosition(
          textBoxWorldCenter,
          textBoxWorldTopLeft,
          actualTextBoxWidth,
          TEXT_BOX_WIDTH_MM,
          A4_MARGIN_LR_MM,
          A4_MARGIN_TOP_MM,
          A4_WIDTH_MM,
          A4_HEIGHT_MM
        );
        setCanvasObjects(prev => [
          ...prev,
          {
            id: Date.now(),
            type: 'a4guide',
            x: a4Guide.x,
            y: a4Guide.y,
            width: a4Guide.width,
            height: a4Guide.height
          } as A4GuideObjectType
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
    const prevLTWorld = screenToWorldLocal(prevLTScreen.x, prevLTScreen.y);

    // 2. 새 폭에 맞는 입력창 폭 계산
    const tempTextBoxWidth = measureTextWidthLocal('A'.repeat(newMaxChars));
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
    if (canvasRef.current) {
      setupCanvasHiDPI(canvasRef.current, canvasWidth, canvasHeight);
    }
  }, [canvasWidth, canvasHeight]);

  const isComposingRef = useRef(false);

  return (
    <div className={`w-full h-screen flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      <Header
        theme={theme}
        showGrid={showGrid}
        showInfo={showInfo}
        showShortcuts={showShortcuts}
        maxCharsPerLine={maxCharsPerLine}
        onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onShowGridToggle={() => setShowGrid(prev => !prev)}
        onShowInfoToggle={() => setShowInfo(prev => !prev)}
        onShowShortcutsToggle={() => setShowShortcuts(prev => !prev)}
        onImportFile={importFile}
        onExportPNG={exportAsPNG}
        onExportSVG={exportAsSVG}
        onExportJSON={exportAsJSON}
        onAddA4Guide={handleAddA4Guide}
        onClearAll={clearAll}
      />

      <CanvasContainer
        canvasRef={canvasRef}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        isSpacePressed={isSpacePressed}
        hoveredObject={hoveredObject}
        isMouseInTextBox={isMouseInTextBox}
        theme={theme}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredObject(null);
          setIsMouseInTextBox(false);
        }}
        onWheel={handleWheel}
        showTextBox={showTextBox}
        currentTypingText={currentTypingText}
        typewriterX={typewriterX}
        typewriterY={typewriterY}
        baseFontSize={baseFontSize}
        baseFontSizePt={baseFontSizePt}
        scale={scale}
        maxCharsPerLine={maxCharsPerLine}
        selectedObject={selectedObject}
        undoStack={undoStack}
        redoStack={redoStack}
        getTextBoxWidth={getTextBoxWidth}
        getCurrentLineHeight={getCurrentLineHeight}
        handleInputChange={handleInputChange}
        handleInputKeyDown={handleInputKeyDown}
        handleCompositionStart={handleCompositionStart}
        handleCompositionEnd={handleCompositionEnd}
        handleMaxCharsChange={handleMaxCharsChange}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        THEME_COLORS={THEME_COLORS}
        showInfo={showInfo}
        showShortcuts={showShortcuts}
        canvasOffset={canvasOffset}
        canvasObjects={canvasObjects}
        mousePosition={mousePosition}
        INITIAL_FONT_SIZE={INITIAL_UI_FONT_SIZE_PX}
        screenToWorld={(screenX, screenY) => screenToWorld(screenX, screenY, scale, canvasOffset)}
        onDeleteSelected={() => {
          if (selectedObject) {
            setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
            setSelectedObject(null);
          }
        }}
        onZoomIn={() => {
          const zoomLevels = [
            0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
          ];
          const currentIndex = findZoomLevel(scale, zoomLevels);
          const newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
        }}
        onZoomOut={() => {
          const zoomLevels = [
            0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
          ];
          const currentIndex = findZoomLevel(scale, zoomLevels);
          const newIndex = Math.max(0, currentIndex - 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
        }}
      />
    </div>
  );
};

export default InfiniteTypewriterCanvas;
