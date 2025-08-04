/**
 * NNType - Infinite Typewriter Canvas
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
  serializeSVG,
  createSelectionRectangle,
  getObjectsInSelectionRect,
  drawSelectionRectangle,
  drawMultiSelectHighlight
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
import { CanvasObjectType, A4GuideObjectType, Theme, AICommand, SelectionRectangle } from '../types';
import { aiService } from '../services/aiService';
import { wrapTextToLines } from '../utils';
import { ExportMenu } from './ExportMenu';
import { ApiKeyInput } from './ApiKeyInput';
import { saveSession, loadSession, clearSession } from '../utils/sessionStorage';

const parseCommand = (text: string): AICommand | null => {
  const trimmedText = text.trim();
  if (trimmedText.startsWith('/gpt ')) {
    const question = trimmedText.substring(5).trim();
    if (question) {
      return { type: 'gpt', question };
    }
  }
  return null;
};

const InfiniteTypewriterCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObjectType[]>(() => {
    const sessionData = loadSession();
    return sessionData?.canvasObjects || [];
  });
  const [currentTypingText, setCurrentTypingText] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.currentTypingText || '';
  });
  const [isComposing, setIsComposing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragPreviewObjects, setDragPreviewObjects] = useState<CanvasObjectType[]>([]);
  const [scale, setScale] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.scale || 1;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState<CanvasObjectType | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<CanvasObjectType[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRectangle | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseInTextBox, setIsMouseInTextBox] = useState(false);
  const [hoveredObject, setHoveredObject] = useState<CanvasObjectType | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 64);
  const [canvasOffset, setCanvasOffset] = useState(() => {
    // 초기 렌더링 시 세션에서 LT 위치 복구하여 깜빡임 방지
    const sessionData = loadSession();
    if (sessionData?.typewriterLTWorldPosition) {
      try {
        // 정확한 세션 데이터 값으로 계산
        const initialTypewriterX = window.innerWidth / 2;
        const initialTypewriterY = (window.innerHeight - 64) / 2;
        
        // 정확한 텍스트 박스 너비 계산 (세션 데이터 사용)
        const textBoxWidth = sessionData.maxCharsPerLine * (sessionData.baseFontSize * 0.6);
        
        const currentLTScreen = {
          x: initialTypewriterX - textBoxWidth / 2,
          y: initialTypewriterY - sessionData.baseFontSize / 2
        };
        
        const targetScreenX = sessionData.typewriterLTWorldPosition.x * sessionData.scale;
        const targetScreenY = sessionData.typewriterLTWorldPosition.y * sessionData.scale;
        
        console.log('Initial canvas offset calculation:', {
          typewriterLT: sessionData.typewriterLTWorldPosition,
          scale: sessionData.scale,
          currentLTScreen,
          targetScreen: { x: targetScreenX, y: targetScreenY },
          calculatedOffset: {
            x: currentLTScreen.x - targetScreenX,
            y: currentLTScreen.y - targetScreenY
          }
        });
        
        return {
          x: currentLTScreen.x - targetScreenX,
          y: currentLTScreen.y - targetScreenY
        };
      } catch (error) {
        console.warn('Failed to calculate initial offset:', error);
        return { x: 0, y: 0 };
      }
    }
    return { x: 0, y: 0 };
  });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showGrid, setShowGrid] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.showGrid ?? true;
  });

  // Dynamically measure CSS pixels per millimeter (accounts for DPI / zoom)
  const [pxPerMm, setPxPerMm] = useState(96 / 25.4); // fallback default

  const [showInfo, setShowInfo] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.showInfo ?? true;
  });
  const [showShortcuts, setShowShortcuts] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.showShortcuts ?? true;
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showTextBox, setShowTextBox] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.showTextBox ?? true;
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const sessionData = loadSession();
    return sessionData?.theme || 'light';
  });

  const [aiState, setAIState] = useState({
    isProcessing: false,
    error: null as string | null,
    lastResponse: null as string | null
  });

  const [maxCharsPerLine, setMaxCharsPerLine] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.maxCharsPerLine || 80;
  }); // 한글 기준 80자, 동적 변경
  const [baseFontSize, setBaseFontSize] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.baseFontSize || INITIAL_UI_FONT_SIZE_PX;
  }); // UI 폰트 크기 (픽셀)
  const [baseFontSizePt, setBaseFontSizePt] = useState(() => {
    const sessionData = loadSession();
    return sessionData?.baseFontSizePt || INITIAL_BASE_FONT_SIZE_PT;
  }); // Base 폰트 크기 (포인트)
  const [needsLTPositionRestore, setNeedsLTPositionRestore] = useState<{ x: number; y: number } | null>(null); // LT 위치 복구 플래그
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
      setScale(sessionData.scale);
      setCurrentTypingText(sessionData.currentTypingText);
      setBaseFontSize(sessionData.baseFontSize);
      if (sessionData.baseFontSizePt) {
        setBaseFontSizePt(sessionData.baseFontSizePt);
      }
      setMaxCharsPerLine(sessionData.maxCharsPerLine);
      
      // LT 월드 좌표를 기반으로 캔버스 오프셋 계산하여 타이프라이터 위치 복구
      if (sessionData.typewriterLTWorldPosition) {
        console.log('Restoring typewriter LT position:', sessionData.typewriterLTWorldPosition);
        
        // LT 위치 복구를 위한 플래그 설정 (별도 useEffect에서 처리)
        setNeedsLTPositionRestore(sessionData.typewriterLTWorldPosition);
      } else {
        // LT 위치 정보가 없으면 저장된 오프셋 사용 (기존 방식)
        setCanvasOffset(sessionData.canvasOffset);
      }
      
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
      console.log('No session found, centering typewriter');
      setTimeout(centerTypewriter, 0);
    }
  }, []);


  // Typewriter settings
  const typewriterX = canvasWidth / 2;
  const typewriterY = canvasHeight / 2;

  // Auto-save session when state changes (optimized)
  const saveTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Don't save during initial load
    if (!fontLoaded) return;
    
    // Clear previous timeout to debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const saveCurrentSession = () => {
      // 실시간 LT 월드 좌표 직접 계산 (getTextBoxWidth 의존성 해결)
      const textBoxWidth = measureTextWidth('A'.repeat(maxCharsPerLine), baseFontSize, canvasRef.current, fontLoaded);
      const currentLTScreen = {
        x: typewriterX - textBoxWidth / 2,
        y: typewriterY - baseFontSize / 2
      };
      const currentLTWorld = {
        x: (currentLTScreen.x - canvasOffset.x) / scale,
        y: (currentLTScreen.y - canvasOffset.y) / scale
      };
      
      saveSession({
        canvasObjects,
        canvasOffset,
        scale,
        typewriterPosition: { x: typewriterX, y: typewriterY },
        typewriterLTWorldPosition: currentLTWorld,
        currentTypingText,
        baseFontSize,
        baseFontSizePt,
        maxCharsPerLine,
        showGrid,
        showTextBox,
        showInfo,
        showShortcuts,
        theme,
        selectedObjectId: selectedObject?.id
      });
      saveTimeoutRef.current = null;
    };

    // Debounce saving to avoid too frequent saves (객체 수에 따라 저장 빈도 조절)
    const saveDelay = canvasObjects.length > 100 ? 5000 : canvasObjects.length > 50 ? 3000 : 1000;
    saveTimeoutRef.current = setTimeout(saveCurrentSession, saveDelay);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [
    canvasObjects, // 실제 콘텐츠 변경 시에만 LT 위치 업데이트
    currentTypingText, // 타이핑 중인 텍스트 변경
    fontLoaded
  ]);

  // Save session before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 실시간 LT 월드 좌표 사용
      const currentLTWorld = getCurrentLTWorldPosition();
      
      saveSession({
        canvasObjects,
        canvasOffset,
        scale,
        typewriterPosition: { x: typewriterX, y: typewriterY },
        typewriterLTWorldPosition: currentLTWorld,
        currentTypingText,
        baseFontSize,
        baseFontSizePt,
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
    // canvasOffset,  // 윈도우 리사이즈 시 LT 고정을 위해 제외
    scale,
    // typewriterX,   // 윈도우 리사이즈로 변경되는 값이므로 제외
    // typewriterY,   // 윈도우 리사이즈로 변경되는 값이므로 제외
    currentTypingText,
    baseFontSize,
    baseFontSizePt,
    maxCharsPerLine,
    showGrid,
    showTextBox,
    showInfo,
    showShortcuts,
    theme,
    selectedObject
  ]);

  // UI 상태 변경 시 저장 (LT 위치는 유지) - optimized  
  const uiSaveTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!fontLoaded) return;
    
    // Clear previous timeout to prevent accumulation
    if (uiSaveTimeoutRef.current) {
      clearTimeout(uiSaveTimeoutRef.current);
    }
    
    const saveUIState = () => {
      // UI 상태 변경 시에도 현재 실시간 LT 위치 사용 (더 정확한 위치 추적)
      const currentLTWorld = getCurrentLTWorldPosition();
      
      saveSession({
        canvasObjects,
        canvasOffset,
        scale,
        typewriterPosition: { x: typewriterX, y: typewriterY },
        typewriterLTWorldPosition: currentLTWorld, // 현재 실시간 LT 위치 사용
        currentTypingText,
        baseFontSize,
        baseFontSizePt,
        maxCharsPerLine,
        showGrid,
        showTextBox,
        showInfo,
        showShortcuts,
        theme,
        selectedObjectId: selectedObject?.id
      });
      uiSaveTimeoutRef.current = null;
    };

    uiSaveTimeoutRef.current = setTimeout(saveUIState, 1000);
    
    return () => {
      if (uiSaveTimeoutRef.current) {
        clearTimeout(uiSaveTimeoutRef.current);
        uiSaveTimeoutRef.current = null;
      }
    };
  }, [
    scale,
    baseFontSize,
    baseFontSizePt,
    maxCharsPerLine,
    showGrid,
    showTextBox,
    showInfo,
    showShortcuts,
    theme,
    selectedObject,
    fontLoaded
  ]);
  
  // 메모리 누수 방지: measureTextWidth 함수를 캐시
  const measureTextWidthLocal = useCallback((text: string, fontSize: number = baseFontSize) => {
    return measureTextWidth(text, fontSize, canvasRef.current, fontLoaded);
  }, [baseFontSize, fontLoaded]);

  const getTextBoxWidth = useCallback(() => {
    return measureTextWidthLocal('A'.repeat(maxCharsPerLine));
  }, [measureTextWidthLocal, maxCharsPerLine]);

  // 공통 measureTextWidth 함수 (메모리 누수 방지)
  const createMeasureTextWidthFn = useCallback(() => {
    return (text: string, fontSize: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !fontLoaded) return text.length * 12;
      const ctx = canvas.getContext('2d');
      if (!ctx) return text.length * 12;
      ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
      return ctx.measureText(text).width;
    };
  }, [fontLoaded]);

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

  // 현재 LT 월드 좌표를 실시간으로 계산하는 함수
  const getCurrentLTWorldPosition = useCallback(() => {
    const textBoxWidth = getTextBoxWidth();
    const currentLTScreen = {
      x: typewriterX - textBoxWidth / 2,
      y: typewriterY - baseFontSize / 2
    };
    return {
      x: (currentLTScreen.x - canvasOffset.x) / scale,
      y: (currentLTScreen.y - canvasOffset.y) / scale
    };
  }, [getTextBoxWidth, typewriterX, typewriterY, baseFontSize, canvasOffset, scale]);

  // LT 위치 복구 처리 (모든 상태가 설정된 후)
  useEffect(() => {
    if (needsLTPositionRestore && fontLoaded && getTextBoxWidth) {
      console.log('Restoring LT position after state initialization:', needsLTPositionRestore);
      
      // getCurrentLTWorldPosition과 정확히 동일한 방식으로 계산 (누적 오차 방지)
      const textBoxWidth = getTextBoxWidth();
      const currentLTScreen = {
        x: typewriterX - textBoxWidth / 2,
        y: typewriterY - baseFontSize / 2
      };
      
      // 저장된 LT 월드 좌표를 스크린 좌표로 변환
      const targetScreenX = needsLTPositionRestore.x * scale;
      const targetScreenY = needsLTPositionRestore.y * scale;
      
      // 캔버스 오프셋 계산
      const restoredOffset = {
        x: currentLTScreen.x - targetScreenX,
        y: currentLTScreen.y - targetScreenY
      };
      
      console.log('LT restoration - currentLTScreen:', currentLTScreen, 'targetScreen:', { x: targetScreenX, y: targetScreenY }, 'offset:', restoredOffset);
      setCanvasOffset(restoredOffset);
      setNeedsLTPositionRestore(null); // 복구 완료 후 플래그 제거
    }
  }, [needsLTPositionRestore, fontLoaded, typewriterX, typewriterY, getTextBoxWidth, baseFontSize, scale]);

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
      // 1. 실시간 LT World 좌표 사용 (세션 데이터 지연 문제 해결)
      const targetLTWorld = getCurrentLTWorldPosition();
      
      // 2. 새로운 윈도우 크기 설정
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 64;
      const newTypewriterX = newWidth / 2;
      const newTypewriterY = newHeight / 2;
      
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      
      // 3. 새로운 화면 중앙에서 저장된 LT World 좌표 유지
      setTimeout(() => {
        const newLTScreen = {
          x: newTypewriterX - getTextBoxWidth() / 2,
          y: newTypewriterY - baseFontSize / 2
        };
        
        const targetScreenX = targetLTWorld.x * scale;
        const targetScreenY = targetLTWorld.y * scale;
        
        const newOffset = {
          x: newLTScreen.x - targetScreenX,
          y: newLTScreen.y - targetScreenY
        };
        
        setCanvasOffset(newOffset);
      }, 0);
    };
    window.addEventListener('resize', handleResize);
    
    // 초기 로드 시에만 centerTypewriter 실행
    return () => window.removeEventListener('resize', handleResize);
  }, [getCurrentLTWorldPosition, getTextBoxWidth, baseFontSize, scale]);

  // 초기 중앙 배치는 세션 로드에서 처리 (중복 제거)

  const drawGridLocal = useCallback((ctx: CanvasRenderingContext2D) => {
    // 고정된 기준 그리드 크기 사용 (선택된 객체와 무관)
    const baseGridSize = baseFontSize;
    drawGrid(ctx, canvasWidth, canvasHeight, canvasOffset, baseGridSize, THEME_COLORS[theme].grid);
  }, [canvasOffset, canvasWidth, canvasHeight, theme, baseFontSize]);



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

  // 드래그 프리뷰 객체 렌더링 함수 (호버 스타일과 동일한 보더박스)
  const drawDragPreviewObjects = useCallback((ctx: CanvasRenderingContext2D) => {
    if (dragPreviewObjects.length === 0) return;
    
    dragPreviewObjects.forEach(obj => {
      // 기존 hover highlight와 동일한 스타일 사용
      drawHoverHighlight(ctx, obj, scale, worldToScreenLocal, measureTextWidthLocal, theme, THEME_COLORS);
    });
  }, [dragPreviewObjects, scale, worldToScreenLocal, measureTextWidthLocal, theme]);

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
      drawHoverHighlight(ctx, hoveredObject, scale, worldToScreenLocal, measureTextWidthLocal, theme, THEME_COLORS);
    }
    
    // 멀티 셀렉트된 오브젝트 하이라이트 표시
    if (selectedObjects.length > 0) {
      drawMultiSelectHighlight(ctx, selectedObjects, scale, canvasOffset, measureTextWidthLocal, theme);
    }
    
    // 드래그 프리뷰 표시 (드래그 중일 때만)
    if (isDraggingText && dragPreviewObjects.length > 0) {
      drawDragPreviewObjects(ctx);
    }
    
    // 셀렉션 사각형 표시
    if (selectionRect && isSelecting) {
      drawSelectionRectangle(ctx, selectionRect, theme);
    }
    
  }, [canvasWidth, canvasHeight, theme, showGrid, drawGridLocal, drawCanvasObjectsLocal, hoveredObject, selectedObjects, selectionRect, isSelecting, scale, worldToScreenLocal, canvasOffset, measureTextWidthLocal]);

  const animationRef = useRef<number | null>(null);
  const renderTriggeredRef = useRef(false);

  // Only render when needed instead of continuous animation loop
  useEffect(() => {
    if (!renderTriggeredRef.current) {
      renderTriggeredRef.current = true;
      const renderFrame = () => {
        render();
        renderTriggeredRef.current = false;
      };
      animationRef.current = requestAnimationFrame(renderFrame);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      renderTriggeredRef.current = false;
    };
  }, [render]);

  const SCREEN_MARGIN_PX = 25; // 원하는 화면 상단/좌측 여백



  // Reuse canvas for text measurement to prevent memory leaks
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const getTempCanvas = useCallback(() => {
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
    }
    return tempCanvasRef.current;
  }, []);

  const calculateBounds = useCallback(() => {
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
  }, [canvasObjects, currentTypingText, baseFontSize, getCurrentWorldPosition, getTempCanvas]);

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

  // 타이프라이터 LT 월드 좌표 유지하면서 상태 변경하는 공통 함수 (현재 상태 기준)
  const maintainTypewriterLTWorldPosition = (
    newFontSize: number,
    newScale: number
  ) => {
    const measureTextWidthFn = createMeasureTextWidthFn();
    
    // 1. 호출 시점의 현재 타이프라이터 LT 월드 좌표 계산
    const currentTextBoxWidth = measureTextWidthFn('A'.repeat(maxCharsPerLine), baseFontSize);
    const currentLTScreen = {
      x: typewriterX - currentTextBoxWidth / 2,
      y: typewriterY - baseFontSize / 2
    };
    const currentLTWorld = {
      x: (currentLTScreen.x - canvasOffset.x) / scale,
      y: (currentLTScreen.y - canvasOffset.y) / scale
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
  };

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
      
      maintainTypewriterLTWorldPosition(newFontSize, newScale);
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
      
      // UI 폰트 크기는 유지하면서 스케일만 조정하여 LT 월드 좌표 유지
      maintainTypewriterLTWorldPosition(baseFontSize, newScale);
      // Base Font Size만 업데이트
      setBaseFontSizePt(newBaseFontSizePt);
    }
  };

  // UI Zoom 리셋 (UI 폰트 사이즈를 초기값으로, 스케일을 1.0으로)
  const resetUIZoom = useCallback(() => {
    // LT World 좌표 유지하면서 UI 폰트 사이즈와 스케일만 초기화
    maintainTypewriterLTWorldPosition(INITIAL_UI_FONT_SIZE_PX, 1.0);
  }, [maintainTypewriterLTWorldPosition]);

  // Base Font 리셋 (Base Font Size를 초기값으로)
  const resetBaseFont = useCallback(() => {
    if (baseFontSizePt !== INITIAL_BASE_FONT_SIZE_PT) {
      // 포인트 크기 변화 비율 계산 (역비율 적용)
      const ptRatio = INITIAL_BASE_FONT_SIZE_PT / baseFontSizePt;
      const newScale = scale / ptRatio; // Base Font Size 변경 시 캔버스 스케일 역비율 조정
      
      // UI 폰트 크기는 유지하면서 스케일만 조정하여 LT 월드 좌표 유지
      maintainTypewriterLTWorldPosition(baseFontSize, newScale);
      // Base Font Size를 초기값으로 업데이트
      setBaseFontSizePt(INITIAL_BASE_FONT_SIZE_PT);
    }
  }, [baseFontSizePt, scale, baseFontSize, maintainTypewriterLTWorldPosition]);

  const resetCanvas = useCallback(() => {
    // 전체 캔버스 리셋 (모든 값 초기화)
    maintainTypewriterLTWorldPosition(INITIAL_UI_FONT_SIZE_PX, 1.0);
    setBaseFontSizePt(INITIAL_BASE_FONT_SIZE_PT);
    setSelectedObject(null);
    clearSession(); // 세션도 함께 클리어
  }, [maintainTypewriterLTWorldPosition, setSelectedObject]);
  
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
          resetUIZoom(); // UI Zoom 리셋
          return;
        } else if (e.key === 'Home' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetCanvas();
          return;
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          // Copy functionality for multi-selected objects
          if (selectedObjects.length > 0) {
            const textContent = selectedObjects
              .filter(obj => obj.type === 'text')
              .map(obj => (obj as any).content)
              .join('\n');
            
            if (textContent) {
              navigator.clipboard.writeText(textContent).catch(err => {
                console.error('Failed to copy to clipboard:', err);
              });
            }
          } else if (selectedObject && selectedObject.type === 'text') {
            // Fallback for single selected object
            const textObj = selectedObject as any;
            navigator.clipboard.writeText(textObj.content).catch(err => {
              console.error('Failed to copy to clipboard:', err);
            });
          }
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
        // 0 인식: Base Font Size 리셋
        if (e.key === '0') {
          e.preventDefault();
          resetBaseFont(); // Base Font 리셋
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
      if (e.key === 'Delete' && !isInputFocused) {
        e.preventDefault();
        if (selectedObjects.length > 0) {
          // Delete multi-selected objects
          const selectedIds = selectedObjects.map(obj => obj.id);
          setCanvasObjects(prev => prev.filter(obj => !selectedIds.includes(obj.id)));
          setSelectedObjects([]);
          setSelectedObject(null);
        } else if (selectedObject) {
          // Delete single selected object
          setCanvasObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
          setSelectedObject(null);
        }
        return;
      }
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const moveDistance = baseFontSize * 1.6;
        setCanvasOffset(prev => {
          const newOffset = (() => {
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
          })();

          // 방향키 이동 후 세션 데이터 업데이트 (비동기)
          setTimeout(() => {
            const currentLTWorldPosition = getCurrentLTWorldPosition();
            if (currentLTWorldPosition) {
              saveSession({
                canvasObjects,
                canvasOffset: newOffset,
                scale,
                typewriterPosition: { x: typewriterX, y: typewriterY },
                typewriterLTWorldPosition: currentLTWorldPosition,
                currentTypingText,
                baseFontSize,
                baseFontSizePt,
                maxCharsPerLine,
                showGrid,
                showTextBox,
                showInfo,
                showShortcuts,
                theme,
                selectedObjectId: selectedObject?.id
              });
            }
          }, 0);

          return newOffset;
        });
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, selectedObject, selectedObjects, getCurrentLineHeight, zoomToLevel, setCanvasObjects, setSelectedObject, setSelectedObjects, setCanvasOffset, handleUISizeChange, handleBaseFontSizeChange, resetUIZoom, resetBaseFont, resetCanvas]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const clickedObject = canvasObjects.find(obj => isPointInObjectLocal(obj, mouseX, mouseY));
    
    if (clickedObject) {
      // Check if Cmd key is pressed for additive selection
      if (e.metaKey && !isSpacePressed) {
        // Cmd+click: Add/remove from multi-selection without dragging
        const isClickedObjectSelected = selectedObjects.some(obj => obj.id === clickedObject.id);
        
        if (isClickedObjectSelected) {
          // Remove from selection
          const newSelectedObjects = selectedObjects.filter(obj => obj.id !== clickedObject.id);
          setSelectedObjects(newSelectedObjects);
          
          // If only one object left, make it the single selected object
          if (newSelectedObjects.length === 1) {
            setSelectedObject(newSelectedObjects[0]);
            setSelectedObjects([]);
          } else if (newSelectedObjects.length === 0) {
            setSelectedObject(null);
          } else {
            setSelectedObject(null);
          }
        } else {
          // Add to selection
          if (selectedObjects.length === 0 && selectedObject) {
            // If there's a single selected object, start multi-selection with it
            setSelectedObjects([selectedObject, clickedObject]);
            setSelectedObject(null);
          } else if (selectedObjects.length > 0) {
            // Add to existing multi-selection
            setSelectedObjects([...selectedObjects, clickedObject]);
            setSelectedObject(null);
          } else {
            // First object selection
            setSelectedObject(clickedObject);
            setSelectedObjects([]);
          }
        }
      } else {
        // Normal click: Check if clicked object is part of multi-selection
        const isClickedObjectSelected = selectedObjects.some(obj => obj.id === clickedObject.id);
        
        if (isClickedObjectSelected && selectedObjects.length > 1) {
          // If clicked object is part of multi-selection, drag all selected objects
          setIsDraggingText(true);
          setDragStart({ x: mouseX, y: mouseY });
          // Keep current multi-selection
        } else {
          // Single object selection and drag
          setSelectedObject(clickedObject);
          setSelectedObjects([]);
          setIsDraggingText(true);
          setDragStart({ x: mouseX, y: mouseY });
        }
      }
    } else if (isSpacePressed || (e.metaKey && !clickedObject)) {
      // Space 키가 눌렸거나, Cmd 키가 눌렸지만 클릭된 객체가 없을 때 캔버스 드래그
      setSelectedObject(null);
      setSelectedObjects([]);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Start multi-select if no object clicked and not panning
      setSelectedObject(null);
      setSelectedObjects([]);
      setIsSelecting(true);
      setSelectionRect(null);
      setIsDragging(false);
      setIsDraggingText(false);
      setDragStart({ x: mouseX, y: mouseY });
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
    
    if (isDraggingText) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      // 드래그 중에는 실시간으로 자유롭게 이동 (그리드 스냅 없음)
      const worldDeltaX = deltaX / scale;
      const worldDeltaY = deltaY / scale;
      
      // 움직임이 있을 때만 업데이트
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        // 드래그 프리뷰 계산: 최종 스냅될 위치 미리보기
        const worldGridSize = baseFontSize / scale;
        let previewObjects: CanvasObjectType[] = [];
        
        if (selectedObjects.length > 1) {
          // Group drag: move all selected objects
          const selectedIds = selectedObjects.map(obj => obj.id);
          setCanvasObjects(prev => prev.map(obj => 
            selectedIds.includes(obj.id)
              ? { ...obj, x: obj.x + worldDeltaX, y: obj.y + worldDeltaY }
              : obj
          ));
          
          // Update selectedObjects array
          setSelectedObjects(prev => prev.map(obj => ({
            ...obj, 
            x: obj.x + worldDeltaX, 
            y: obj.y + worldDeltaY
          })));
          
          // 멀티 선택 프리뷰 계산
          const referenceObj = selectedObjects[0];
          const currentWorldX = referenceObj.x + worldDeltaX;
          const currentWorldY = referenceObj.y + worldDeltaY;
          const snappedWorldX = snapToGrid(currentWorldX, worldGridSize);
          const snappedWorldY = snapToGrid(currentWorldY, worldGridSize);
          const snapDeltaX = snappedWorldX - referenceObj.x;
          const snapDeltaY = snappedWorldY - referenceObj.y;
          
          previewObjects = selectedObjects.map(obj => ({
            ...obj,
            x: obj.x + snapDeltaX,
            y: obj.y + snapDeltaY
          }));
        } else if (selectedObject) {
          // Single object drag
          setCanvasObjects(prev => prev.map(obj => 
            obj.id === selectedObject.id 
              ? { ...obj, x: obj.x + worldDeltaX, y: obj.y + worldDeltaY }
              : obj
          ));
          
          setSelectedObject(prev => prev ? 
            { ...prev, x: prev.x + worldDeltaX, y: prev.y + worldDeltaY } 
            : null
          );
          
          // 단일 선택 프리뷰 계산
          const currentWorldX = selectedObject.x + worldDeltaX;
          const currentWorldY = selectedObject.y + worldDeltaY;
          const snappedWorldX = snapToGrid(currentWorldX, worldGridSize);
          const snappedWorldY = snapToGrid(currentWorldY, worldGridSize);
          
          previewObjects = [{
            ...selectedObject,
            x: snappedWorldX,
            y: snappedWorldY
          }];
        }
        
        // 프리뷰 객체 업데이트
        setDragPreviewObjects(previewObjects);
        
        // 이동량만큼 dragStart 업데이트 (누적 방지)
        setDragStart({ 
          x: mouseX, 
          y: mouseY 
        });
      }
    } else if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // 그리드 단위로 스냅 (UI 폰트 크기 기반)
      const gridSize = baseFontSize * 1.8;
      const snappedDeltaX = snapToGrid(deltaX, gridSize);
      const snappedDeltaY = snapToGrid(deltaY, gridSize);
      
      // 실제로 이동할 거리가 있을 때만 업데이트
      if (Math.abs(snappedDeltaX) >= gridSize || Math.abs(snappedDeltaY) >= gridSize) {
        setCanvasOffset(prev => ({
          x: prev.x + snappedDeltaX,
          y: prev.y + snappedDeltaY
        }));
        
        setDragStart({ 
          x: dragStart.x + snappedDeltaX, 
          y: dragStart.y + snappedDeltaY 
        });
      }
    } else if (isSelecting) {
      // Update selection rectangle during drag
      const currentRect = createSelectionRectangle(
        dragStart.x,
        dragStart.y,
        mouseX,
        mouseY
      );
      setSelectionRect(currentRect);
      
      // Find objects in selection area
      const selectedObjs = getObjectsInSelectionRect(
        canvasObjects,
        currentRect,
        scale,
        canvasOffset,
        (text: string, fontSize: number) => measureTextWidth(text, fontSize, canvasRef.current, fontLoaded)
      );
      setSelectedObjects(selectedObjs);
    }
  };

  const handleMouseUp = () => {
    // 드래그 완료 시 그리드 스냅 적용
    if (isDraggingText) {
      const worldGridSize = baseFontSize / scale;
      
      if (selectedObjects.length > 1) {
        // 멀티 선택 그리드 스냅
        const referenceObj = selectedObjects[0];
        const snappedWorldX = snapToGrid(referenceObj.x, worldGridSize);
        const snappedWorldY = snapToGrid(referenceObj.y, worldGridSize);
        const snapDeltaX = snappedWorldX - referenceObj.x;
        const snapDeltaY = snappedWorldY - referenceObj.y;
        
        if (snapDeltaX !== 0 || snapDeltaY !== 0) {
          const selectedIds = selectedObjects.map(obj => obj.id);
          setCanvasObjects(prev => prev.map(obj => 
            selectedIds.includes(obj.id)
              ? { ...obj, x: obj.x + snapDeltaX, y: obj.y + snapDeltaY }
              : obj
          ));
          
          setSelectedObjects(prev => prev.map(obj => ({
            ...obj, 
            x: obj.x + snapDeltaX, 
            y: obj.y + snapDeltaY
          })));
        }
      } else if (selectedObject) {
        // 단일 선택 그리드 스냅
        const snappedWorldX = snapToGrid(selectedObject.x, worldGridSize);
        const snappedWorldY = snapToGrid(selectedObject.y, worldGridSize);
        
        if (snappedWorldX !== selectedObject.x || snappedWorldY !== selectedObject.y) {
          setCanvasObjects(prev => prev.map(obj => 
            obj.id === selectedObject.id 
              ? { ...obj, x: snappedWorldX, y: snappedWorldY }
              : obj
          ));
          
          setSelectedObject(prev => prev ? 
            { ...prev, x: snappedWorldX, y: snappedWorldY } 
            : null
          );
        }
      }
    }
    
    setIsDragging(false);
    setIsDraggingText(false);
    
    // 드래그 프리뷰 초기화
    setDragPreviewObjects([]);
    
    // End multi-select
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionRect(null);
      // selectedObjects는 이미 설정되어 있음
    }
    
    // 드래그가 끝난 후 텍스트 입력 필드에 포커스 복원 (텍스트 박스가 보일 때만)
    if (showTextBox) {
      setTimeout(() => {
        const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
        if (input) input.focus();
      }, 0);
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    // Ctrl/Cmd 키와 함께 사용할 때만 UI Size 변경
    if (!(e.ctrlKey || e.metaKey)) return;
    
    e.preventDefault();
    
    // UI Size를 이산적으로 변경
    if (e.deltaY > 0) {
      // 휠을 아래로 스크롤하면 UI Size 감소
      handleUISizeChange(false);
    } else {
      // 휠을 위로 스크롤하면 UI Size 증가
      handleUISizeChange(true);
    }
  }, [handleUISizeChange]);

  // Non-passive wheel event listener setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // const resetCanvas = useCallback(() => {
  //   setScale(1);
  //   centerTypewriter();
  //   setSelectedObject(null);
  // }, [setScale, centerTypewriter, setSelectedObject]);


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentTypingText(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 100);
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(true);
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
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

  // AI 처리 함수
  const processAICommand = useCallback(async (command: AICommand) => {
    setAIState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const response = await aiService.askGPT(command.question);
      
      if (response.success && response.content) {
        setAIState(prev => ({ ...prev, lastResponse: response.content }));
        
        // 응답을 현재 타이프라이터 박스 폭에 맞게 줄바꿈 처리
        // 월드 좌표계 기준으로 통일해서 UI 픽셀 크기와 무관하게 일관된 결과 보장
        const worldFontSize = baseFontSize / scale;
        const textBoxPixelWidth = getTextBoxWidth();
        const worldBoxWidth = textBoxPixelWidth / scale; // 월드 좌표계 폭으로 변환
        
        const wrappedLines = wrapTextToLines(
          response.content, 
          maxCharsPerLine, 
          worldBoxWidth, 
          worldFontSize, 
          (text: string, fontSize: number) => measureTextWidthLocal(text, fontSize) / scale
        );
        const worldPos = getCurrentWorldPosition();
        
        pushUndo(); // 상태 변경 전 스냅샷 저장
        
        // 각 줄을 별도의 텍스트 오브젝트로 생성 (현재 타이프라이터 위치에서 시작)
        const worldLineHeight = (baseFontSize / scale) * 1.6;
        const newObjects = wrappedLines.map((line, index) => ({
          type: 'text' as const,
          content: line,
          x: worldPos.x,
          y: worldPos.y + ((index + 1) * worldLineHeight),
          scale: 1,
          fontSize: baseFontSize / scale,
          id: Date.now() + index,
          isAIResponse: true,
          color: '#3b82f6'
        }));
        
        setCanvasObjects(prev => [...prev, ...newObjects]);
        
        // 타이프라이터를 마지막 텍스트 아래로 이동
        const totalHeight = wrappedLines.length * worldLineHeight * scale;
        setCanvasOffset(prev => ({
          x: prev.x,
          y: prev.y - totalHeight
        }));
        
      } else {
        setAIState(prev => ({ ...prev, error: response.error || 'AI 처리 중 오류가 발생했습니다.' }));
      }
    } catch (error) {
      setAIState(prev => ({ ...prev, error: 'AI 서비스 연결에 실패했습니다.' }));
    } finally {
      setAIState(prev => ({ ...prev, isProcessing: false }));
      
      // AI 응답 처리 완료 후 입력창에 포커스를 다시 주고 /gpt 프리픽스 설정
      setTimeout(() => {
        const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
        if (input && showTextBox) {
          // AI 명령어였다면 /gpt 를 입력창에 미리 입력해둠
          setCurrentTypingText('/gpt ');
          input.focus();
          // 커서를 맨 끝으로 이동
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 0);
    }
  }, [baseFontSize, scale, selectedObject, getCurrentLineHeight, getCurrentWorldPosition, pushUndo, maxCharsPerLine, showTextBox]);

  // [UNDO/REDO] 상태 변경이 일어나는 주요 지점에 pushUndo() 호출
  // 예시: 텍스트 추가, 오브젝트 이동/삭제, 패닝, 줌, 전체 삭제 등
  // 텍스트 추가
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle backslash + Enter for line breaks (without adding text to canvas)
    if (e.key === 'Enter') {
      // Check if the text ends with backslash and user pressed Enter
      const textValue = e.currentTarget.value;
      const cursorPosition = e.currentTarget.selectionStart || 0;
      const textBeforeCursor = textValue.substring(0, cursorPosition);
      
      if (textBeforeCursor.endsWith('\\')) {
        // Remove the backslash and add a line break
        const newText = textValue.substring(0, cursorPosition - 1) + '\n' + textValue.substring(cursorPosition);
        setCurrentTypingText(newText);
        
        // Prevent default Enter behavior
        e.preventDefault();
        
        // Set cursor position after the newline
        setTimeout(() => {
          const textarea = e.currentTarget;
          if (textarea) {
            textarea.selectionStart = textarea.selectionEnd = cursorPosition;
          }
        }, 0);
        return;
      }
      
      // Regular Enter behavior - add text to canvas
      if (!isComposing) {
        if (currentTypingText.trim() !== '') {
          // AI 명령어 감지
          const command = parseCommand(currentTypingText);
          
          if (command && command.type === 'gpt') {
            // AI 명령어 처리
            pushUndo(); // 상태 변경 전 스냅샷 저장
            
            // 질문을 먼저 텍스트 오브젝트로 추가
            const worldPos = getCurrentWorldPosition();
            setCanvasObjects(prev => [
              ...prev,
              {
                type: 'text',
                content: currentTypingText,
                x: worldPos.x,
                y: worldPos.y,
                scale: 1,
                fontSize: baseFontSize / scale,
                id: Date.now()
              }
            ]);
            
            setCurrentTypingText('');
            
            // 캔버스 오프셋을 멀티라인 크기만큼 이동
            const lines = currentTypingText.split('\n');
            const moveDistance = (baseFontSize * 1.6) * lines.length;
            setCanvasOffset(prev => ({
              x: prev.x,
              y: prev.y - moveDistance
            }));
            
            // AI 처리 시작
            processAICommand(command);
          } else {
            // 일반 텍스트 처리
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
            
            // 오브젝트 생성 여부와 상관없이 줄바꿈(캔버스 오프셋 이동)은 항상 실행
            // 멀티라인 텍스트의 줄 수만큼 이동
            const lines = currentTypingText.split('\n');
            const moveDistance = (baseFontSize * 1.6) * lines.length;
            setCanvasOffset(prev => ({
              x: prev.x,
              y: prev.y - moveDistance
            }));
          }
        } else {
          // 빈 텍스트일 때도 줄바꿈
          setCanvasOffset(prev => ({
            x: prev.x,
            y: prev.y - (baseFontSize * 1.6)
          }));
        }
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
        title="전체 리셋 (Cmd+R)"
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
        onApiKeyClick={() => setShowApiKeyInput(true)}
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
        aiState={aiState}
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

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <ApiKeyInput
          theme={theme}
          onClose={() => setShowApiKeyInput(false)}
        />
      )}
    </div>
  );
};

export default InfiniteTypewriterCanvas;
