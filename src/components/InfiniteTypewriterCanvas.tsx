import React, { useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Trash2 } from 'lucide-react';
import { useCanvas } from '../hooks/useCanvas';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { useKeyboardEvents } from '../hooks/useKeyboardEvents';
import { Header } from './Header';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { CanvasInfoOverlay } from './CanvasInfoOverlay';
import { 
  THEME_COLORS, 
  ZOOM_LEVELS, 
  FONT_SIZE_LEVELS, 
  A4_WIDTH_MM, 
  A4_HEIGHT_MM, 
  A4_MARGIN_TOP_MM, 
  INITIAL_FONT_SIZE 
} from '../constants';
import { isPointInObject, snapToGrid, calculateContentBoundingBox } from '../utils';
import { TextObjectType, ExportData } from '../types';

const InfiniteTypewriterCanvas = () => {
  const {
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
    measureText,
    getTextBoxWidth,
    worldToScreen,
    screenToWorld,
    getCurrentLineHeight,
    getCurrentWorldPosition,
    centerTypewriter,
    zoomToLevel,
  } = useCanvas();

  const colors = THEME_COLORS[theme];

  useCanvasRenderer({
    canvasRef,
    canvasObjects,
    canvasWidth,
    canvasHeight,
    canvasOffset,
    scale,
    selectedObject,
    showGrid,
    theme: colors,
    getCurrentLineHeight,
    worldToScreen,
    measureText,
  });

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
  }, [setFontLoaded]);

  const resetCanvas = useCallback(() => {
    setScale(1);
    centerTypewriter();
    setSelectedObject(null);
  }, [setScale, centerTypewriter, setSelectedObject]);

  const clearAll = useCallback(() => {
    setCanvasObjects([]);
    setCurrentTypingText('');
    setSelectedObject(null);
  }, [setCanvasObjects, setCurrentTypingText, setSelectedObject]);

  const handleUISizeChange = useCallback((up: boolean) => {
    const currentIndex = FONT_SIZE_LEVELS.findIndex(level => Math.abs(level - baseFontSize) < 0.01);
    
    let newIndex = up
      ? Math.min(FONT_SIZE_LEVELS.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const currentFontSize = baseFontSize;
      const currentScale = scale;
      const currentOffset = canvasOffset;
      
      const newFontSize = FONT_SIZE_LEVELS[newIndex];
      const ratio = newFontSize / currentFontSize;
      const newScale = currentScale * ratio;
      
      const currentScreenToWorld = (screenX: number, screenY: number) => ({
        x: (screenX - currentOffset.x) / currentScale,
        y: (screenY - currentOffset.y) / currentScale
      });
      
      const measureTextWidthWithFont = (text: string, fontSize: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !fontLoaded) return text.length * 12;
        const ctx = canvas.getContext('2d');
        if (!ctx) return text.length * 12;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        return ctx.measureText(text).width;
      };
      
      const currentTextBoxWidth = measureTextWidthWithFont('A'.repeat(52), currentFontSize);
      const currentLTScreen = {
        x: typewriterX - currentTextBoxWidth / 2,
        y: typewriterY - currentFontSize / 2
      };
      const currentLTWorld = currentScreenToWorld(currentLTScreen.x, currentLTScreen.y);
      
      const newTextBoxWidth = measureTextWidthWithFont('A'.repeat(52), newFontSize);
      const newLTScreen = {
        x: typewriterX - newTextBoxWidth / 2,
        y: typewriterY - newFontSize / 2
      };
      
      const targetScreenX = currentLTWorld.x * newScale;
      const targetScreenY = currentLTWorld.y * newScale;
      
      const newOffsetX = newLTScreen.x - targetScreenX;
      const newOffsetY = newLTScreen.y - targetScreenY;
      
      setBaseFontSize(newFontSize);
      setScale(newScale);
      setCanvasOffset({
        x: newOffsetX,
        y: newOffsetY
      });
    }
  }, [baseFontSize, scale, canvasOffset, typewriterX, typewriterY, canvasRef, fontLoaded, setBaseFontSize, setScale, setCanvasOffset]);

  useKeyboardEvents({
    scale,
    selectedObject,
    baseFontSize,
    canvasOffset,
    getCurrentLineHeight,
    zoomToLevel,
    setCanvasObjects,
    setSelectedObject,
    setCanvasOffset,
    setIsExportMenuOpen,
    setIsSpacePressed,
    setBaseFontSize,
    setScale,
    resetCanvas,
    handleUISizeChange,
  });

  // Export functions
  const exportAsJSON = useCallback(() => {
    setIsExportMenuOpen(false);
    const data: ExportData = {
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
          return {
            id: obj.id,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
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
  }, [canvasObjects, canvasOffset, scale, typewriterX, typewriterY, showGrid, showTextBox, theme, setIsExportMenuOpen]);

  const exportAsPNG = useCallback(() => {
    setIsExportMenuOpen(false);
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

    tempCtx.fillStyle = colors.background;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    const tempOffsetX = padding - bbox.minX * exportScaleFactor;
    const tempOffsetY = padding - bbox.minY * exportScaleFactor;

    tempCtx.textBaseline = 'alphabetic';
    tempCtx.fillStyle = colors.text;

    canvasObjects.filter(obj => obj.type === 'text').forEach(obj => {
      const textObj = obj as TextObjectType;
      const screenX = textObj.x * exportScaleFactor + tempOffsetX;
      const screenY = textObj.y * exportScaleFactor + tempOffsetY;

      const fontSize = textObj.fontSize * exportScaleFactor;
      tempCtx.font = `${fontSize}px "JetBrains Mono", monospace`;
      tempCtx.fillText(textObj.content, screenX, screenY);
    });

    if (currentTypingText.trim()) {
      const worldPos = getCurrentWorldPosition();
      const screenX = worldPos.x * exportScaleFactor + tempOffsetX;
      const screenY = worldPos.y * exportScaleFactor + tempOffsetY;
      const fontSize = baseFontSize * exportScaleFactor;
      tempCtx.font = `${fontSize}px "JetBrains Mono", monospace`;
      tempCtx.fillText(currentTypingText, screenX, screenY);
    }

    canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
      const a4ScreenX = obj.x * exportScaleFactor + tempOffsetX;
      const a4ScreenY = obj.y * exportScaleFactor + tempOffsetY;
      const a4ScreenWidth = obj.width * exportScaleFactor;
      const a4ScreenHeight = obj.height * exportScaleFactor;

      tempCtx.strokeStyle = colors.a4Guide;
      tempCtx.lineWidth = 2;
      tempCtx.setLineDash([10, 5]);
      tempCtx.strokeRect(a4ScreenX, a4ScreenY, a4ScreenWidth, a4ScreenHeight);
      tempCtx.setLineDash([]);

      tempCtx.fillStyle = colors.a4Guide;
      tempCtx.font = `${14 * exportScaleFactor}px "Inter", sans-serif`;
      tempCtx.fillText('A4', a4ScreenX + 10 * exportScaleFactor, a4ScreenY + 20 * exportScaleFactor);
    });

    const link = document.createElement('a');
    link.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
    URL.revokeObjectURL(link.href);
  }, [canvasObjects, currentTypingText, baseFontSize, getCurrentWorldPosition, measureText, colors, setIsExportMenuOpen]);

  const exportAsSVG = useCallback(() => {
    setIsExportMenuOpen(false);
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
      const fontSize = textObj.fontSize;
      
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
      const fontSize = baseFontSize;
      
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

    canvasObjects.filter(obj => obj.type === 'a4guide').forEach(obj => {
      const a4Rect = document.createElementNS(svgNS, "rect");
      a4Rect.setAttribute("x", String(obj.x));
      a4Rect.setAttribute("y", String(obj.y));
      a4Rect.setAttribute("width", String(obj.width));
      a4Rect.setAttribute("height", String(obj.height));
      a4Rect.setAttribute("stroke", "#888888");
      a4Rect.setAttribute("stroke-width", "2");
      a4Rect.setAttribute("fill", "none");
      a4Rect.setAttribute("stroke-dasharray", "10,5");
      svg.appendChild(a4Rect);

      const a4Text = document.createElementNS(svgNS, "text");
      a4Text.setAttribute("x", String(obj.x + 10));
      a4Text.setAttribute("y", String(obj.y + 20));
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
  }, [canvasObjects, currentTypingText, baseFontSize, calculateContentBoundingBox, getCurrentWorldPosition, measureText, setIsExportMenuOpen]);

  const importFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
            type: elem.type || 'text',
            content: elem.content || '',
            x: elem.x || 0,
            y: elem.y || 0,
            scale: elem.scale || 1,
            fontSize: elem.fontSize || 20,
            width: elem.width,
            height: elem.height,
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
  }, [setCanvasObjects, setCurrentTypingText, setSelectedObject, setCanvasOffset, setScale, setShowGrid, setShowTextBox, setTheme]);

  const addA4Guide = useCallback(() => {
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
        type: 'a4guide' as const,
        x: a4OriginX,
        y: a4OriginY,
        width: a4WidthWorld,
        height: a4HeightWorld
      }
    ]);
  }, [screenToWorld, typewriterX, typewriterY, getTextBoxWidth, baseFontSize, pxPerMm, setCanvasObjects]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const target = e.target as HTMLElement;
    if (isExportMenuOpen && (!target || !target.closest || !target.closest('.export-dropdown'))) {
      setIsExportMenuOpen(false);
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const clickedObject = canvasObjects.find(obj => 
      isPointInObject(obj, mouseX, mouseY, scale, worldToScreen, measureText)
    );
    
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
  }, [isExportMenuOpen, canvasRef, canvasObjects, scale, worldToScreen, measureText, isSpacePressed, setIsExportMenuOpen, setSelectedObject, setIsDraggingText, setDragStart, setIsDragging, setIsDraggingText]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingText && selectedObject) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      const worldDeltaX = deltaX / scale;
      const worldDeltaY = deltaY / scale;
      const worldGridSize = getCurrentLineHeight() / scale;
      
      const snappedWorldDeltaX = snapToGrid(worldDeltaX, worldGridSize);
      const snappedWorldDeltaY = snapToGrid(worldDeltaY, worldGridSize);
      
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
      
      const currentLineHeight = getCurrentLineHeight();
      const snappedDeltaX = snapToGrid(deltaX, currentLineHeight);
      const snappedDeltaY = snapToGrid(deltaY, currentLineHeight);
      
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
  }, [isDraggingText, selectedObject, canvasRef, dragStart, scale, getCurrentLineHeight, isDragging, setCanvasObjects, setSelectedObject, setDragStart, setCanvasOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDraggingText(false);
    
    if (showTextBox) {
      setTimeout(() => {
        const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
        if (input) input.focus();
      }, 0);
    }
  }, [setIsDragging, setIsDraggingText, showTextBox]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    
    e.preventDefault();
    const currentIndex = ZOOM_LEVELS.findIndex(level => Math.abs(level - scale) < 0.01);
    
    let newIndex;
    if (e.deltaY > 0) {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex) {
      zoomToLevel(ZOOM_LEVELS[newIndex]);
    }
  }, [scale, zoomToLevel]);

  // Input handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTypingText(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 100);
  }, [setCurrentTypingText, setIsTyping]);

  const handleCompositionStart = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(true);
  }, [setIsComposing]);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    setCurrentTypingText(e.currentTarget.value); 
  }, [setIsComposing, setCurrentTypingText]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!isComposing) {
        const worldPos = getCurrentWorldPosition();
        setCanvasObjects(prev => [
          ...prev,
          {
            type: 'text' as const,
            content: currentTypingText,
            x: worldPos.x,
            y: worldPos.y,
            scale: 1,
            fontSize: baseFontSize / scale,
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
  }, [isComposing, getCurrentWorldPosition, setCanvasObjects, currentTypingText, baseFontSize, scale, setCurrentTypingText, setCanvasOffset, getCurrentLineHeight]);

  // Focus input when text box is shown
  useEffect(() => {
    if (showTextBox) {
      const input = document.getElementById('typewriter-input') as HTMLInputElement | null;
      if (input) input.focus();
    }
  }, [showTextBox]);

  return (
    <div className={`w-full h-screen flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
      <Header
        theme={theme}
        showGrid={showGrid}
        showInfo={showInfo}
        showShortcuts={showShortcuts}
        showTextBox={showTextBox}
        isExportMenuOpen={isExportMenuOpen}
        onResetCanvas={resetCanvas}
        onClearAll={clearAll}
        onImportFile={importFile}
        onToggleExportMenu={() => setIsExportMenuOpen(!isExportMenuOpen)}
        onExportJSON={exportAsJSON}
        onExportPNG={exportAsPNG}
        onExportSVG={exportAsSVG}
        onToggleGrid={() => setShowGrid(prev => !prev)}
        onAddA4Guide={addA4Guide}
        onToggleInfo={() => setShowInfo(prev => !prev)}
        onToggleShortcuts={() => setShowShortcuts(prev => !prev)}
        onToggleTextBox={() => setShowTextBox(prev => !prev)}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      />
      
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
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                outline: 'none',
                color: colors.text,
                zIndex: 20,
                backdropFilter: 'blur(8px)',
                borderRadius: '4px',
                padding: 0,
                lineHeight: `${getCurrentLineHeight()}px`,
                boxSizing: 'border-box'
              }}
            />
            
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
              const currentIndex = ZOOM_LEVELS.findIndex(level => Math.abs(level - scale) < 0.01);
              const newIndex = Math.max(0, currentIndex - 1);
              if (newIndex !== currentIndex) {
                zoomToLevel(ZOOM_LEVELS[newIndex]);
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
              const currentIndex = ZOOM_LEVELS.findIndex(level => Math.abs(level - scale) < 0.01);
              const newIndex = Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1);
              if (newIndex !== currentIndex) {
                zoomToLevel(ZOOM_LEVELS[newIndex]);
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