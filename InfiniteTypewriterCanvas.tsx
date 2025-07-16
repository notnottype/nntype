import React, { useState, useRef, useEffect, useCallback } from 'react';

// 텍스트 오브젝트 타입 정의
interface TextObjectType {
  id: number;
  content: string;
  x: number;
  y: number;
  scale: number;
}

const InfiniteTypewriterCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [textObjects, setTextObjects] = useState<TextObjectType[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState<TextObjectType | null>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 64); // 헤더 높이 고려
  
  // Typewriter settings
  // typewriterX, typewriterY를 중앙에 위치하도록 동적으로 계산
  const typewriterX = canvasWidth / 2;
  const typewriterY = canvasHeight / 2;
  const typewriterLineHeight = 36;
  const maxCharsPerLine = 40;
  const baseFontSize = 20;
  
  // Load Google Fonts - Added Nanum Gothic Coding font
  useEffect(() => {
    const link = document.createElement('link');
    // Add Nanum Gothic Coding font
    link.href = 'https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding&family=Noto+Sans+Mono:wght@400&family=JetBrains+Mono:wght@400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    const checkFont = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          // Verify if "Nanum Gothic Coding" font is loaded
          const testCanvas = document.createElement('canvas');
          const testCtx = testCanvas.getContext('2d');
          if (testCtx) {
            testCtx.font = '12px "Nanum Gothic Coding", monospace'; // Changed test font
            testCtx.fillText('한글테스트', 0, 0);
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
  
  // Measure text width - Prioritize Nanum Gothic Coding font
  const measureTextWidth = useCallback((text, fontSize = baseFontSize) => {
    const canvas = canvasRef.current;
    if (!canvas || !fontLoaded) return text.length * 12; // Temporary value before font loads
    const ctx = canvas.getContext('2d');
    if (!ctx) return text.length * 12;
    // Changed to prioritize "Nanum Gothic Coding" font
    ctx.font = `${fontSize}px "Nanum Gothic Coding", "Noto Sans Mono", "JetBrains Mono", monospace`;
    return ctx.measureText(text).width;
  }, [baseFontSize, fontLoaded]);

  // Get base text box width
  const getTextBoxWidth = useCallback(() => {
    return measureTextWidth('A'.repeat(maxCharsPerLine));
  }, [measureTextWidth]);

  // Convert world coordinates to screen coordinates
  const worldToScreen = (worldX, worldY) => ({
    x: worldX * scale + canvasOffset.x,
    y: worldY * scale + canvasOffset.y
  });

  // Convert screen coordinates to world coordinates
  const screenToWorld = (screenX, screenY) => ({
    x: (screenX - canvasOffset.x) / scale,
    y: (screenY - canvasOffset.y) / scale
  });

  // Fix typewriter text box top-left corner when zooming
  const zoomToLevel = useCallback((newScale) => {
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize;
    
    // Current world coordinates of the text box top-left
    const currentWorldPos = screenToWorld(textBoxLeft, textBoxTop);
    
    // Calculate new screen position for the same world coordinates at the new scale
    const newScreenX = currentWorldPos.x * newScale;
    const newScreenY = currentWorldPos.y * newScale;
    
    // Adjust offset so the text box appears at its original screen position
    const newOffsetX = textBoxLeft - newScreenX;
    const newOffsetY = textBoxTop - newScreenY;
    
    // Update scale and offset simultaneously
    setScale(newScale);
    setCanvasOffset({
      x: newOffsetX,
      y: newOffsetY
    });
  }, [getTextBoxWidth, canvasOffset, scale]);

  // Get current typewriter position (world coordinates)
  const getCurrentWorldPosition = useCallback(() => {
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2; // Screen left position
    
    // Convert text baseline position to world coordinates
    return screenToWorld(textBoxLeft, typewriterY);
  }, [getTextBoxWidth, typewriterY, canvasOffset, scale]); // Added canvasOffset, scale to dependencies

  // Check if a point is within a text object
  const isPointInText = useCallback((textObj, screenX, screenY) => {
    const screenPos = worldToScreen(textObj.x, textObj.y);
    // Vectorized text: size determined by current scale multiplied by stored scale
    const fontSize = baseFontSize * (textObj.scale || 1) * scale;
    const textWidth = measureTextWidth(textObj.content, fontSize);
    const textHeight = fontSize;
    
    // Calculate click area based on text baseline
    return screenX >= screenPos.x && 
           screenX <= screenPos.x + textWidth &&
           screenY >= screenPos.y - textHeight &&
           screenY <= screenPos.y + 4;
  }, [baseFontSize, scale, measureTextWidth, canvasOffset]); // Added canvasOffset to dependencies

  // 윈도우 리사이즈/마운트 시 typewriter 박스가 항상 중앙에 오도록 보정
  useEffect(() => {
    const centerTypewriter = () => {
      // 현재 typewriter의 월드 좌표
      const world = screenToWorld(canvasWidth / 2, canvasHeight / 2);
      setCanvasOffset({
        x: canvasWidth / 2 - world.x * scale,
        y: canvasHeight / 2 - world.y * scale
      });
    };
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 64;
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
      setTimeout(centerTypewriter, 0);
    };
    window.addEventListener('resize', handleResize);
    // 마운트 시 1회만 중앙 보정
    setTimeout(centerTypewriter, 0);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw grid
  const drawGrid = (ctx) => {
    const baseGridSize = 20;
    const gridSize = baseGridSize * scale;
    const offsetX = canvasOffset.x % gridSize;
    const offsetY = canvasOffset.y % gridSize;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
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
  };

  // Draw typewriter cursor
  const drawTypewriterCursor = useCallback((ctx) => {
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const currentTextWidth = measureTextWidth(currentText);
    const cursorX = textBoxLeft + currentTextWidth;
    // Display typewriter area
    ctx.fillStyle = 'rgba(100, 150, 255, 0.12)';
    ctx.fillRect(textBoxLeft - 24, typewriterY - typewriterLineHeight + 8, textBoxWidth + 48, typewriterLineHeight * 1.5);
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(textBoxLeft - 24, typewriterY - typewriterLineHeight + 8, textBoxWidth + 48, typewriterLineHeight * 1.5);
    // Cursor blinking
    if (isTyping && Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = '#333';
      ctx.fillRect(cursorX, typewriterY - typewriterLineHeight + 10, 3, typewriterLineHeight * 1.1);
    }
  }, [getTextBoxWidth, measureTextWidth, currentText, isTyping, typewriterX, typewriterY, typewriterLineHeight]);

  // Render text objects - Prioritize Nanum Gothic Coding font
  const drawTextObjects = useCallback((ctx) => {
    // Set text baseline to default
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#333';
    
    textObjects.forEach(textObj => {
      const screenPos = worldToScreen(textObj.x, textObj.y);
      
      // Draw only visible text on screen
      if (screenPos.x > -200 && screenPos.x < canvasWidth + 200 && screenPos.y > -50 && screenPos.y < canvasHeight + 50) {
        // Vectorized text: size determined by current scale multiplied by stored scale
        const fontSize = baseFontSize * (textObj.scale || 1) * scale;
        ctx.font = `${fontSize}px "Nanum Gothic Coding", "Noto Sans Mono", "JetBrains Mono", monospace`; // Font changed
        
        // Highlight selected object
        if (selectedObject && selectedObject.id === textObj.id) {
          ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
          const textWidth = measureTextWidth(textObj.content, fontSize);
          // Calculate highlight area based on baseline
          ctx.fillRect(screenPos.x - 2, screenPos.y - fontSize + 2, textWidth + 4, fontSize + 4);
        }
        
        ctx.fillStyle = '#333';
        // Render text (based on baseline)
        ctx.fillText(textObj.content, screenPos.x, screenPos.y);
      }
    });
    
    // Current typing text in typewriter (fixed screen size - not affected by zoom)
    if (currentText) {
      ctx.font = `${baseFontSize}px "Nanum Gothic Coding", "Noto Sans Mono", "JetBrains Mono", monospace`; // Font changed
      ctx.fillStyle = '#333';
      const textBoxWidth = getTextBoxWidth();
      const textBoxLeft = typewriterX - textBoxWidth / 2;
      ctx.fillText(currentText, textBoxLeft, typewriterY);
    }
  }, [textObjects, baseFontSize, scale, selectedObject, currentText, getTextBoxWidth, measureTextWidth, canvasOffset, canvasWidth, canvasHeight, typewriterX, typewriterY]); // Added canvasOffset to dependencies

  // Canvas rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Improve anti-aliasing (already well set)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    drawGrid(ctx);
    drawTextObjects(ctx);
    drawTypewriterCursor(ctx);
    
    // Display coordinate information
    ctx.fillStyle = '#666';
    ctx.font = '12px "Nanum Gothic Coding", monospace'; // Font changed
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`Canvas: (${Math.round(-canvasOffset.x)}, ${Math.round(-canvasOffset.y)})`, 10, 20);
    ctx.fillText(`Scale: ${scale.toFixed(2)}x`, 10, 35);
    ctx.fillText(`Objects: ${textObjects.length}`, 10, 50);
    
    // Display typewriter text box top-left world coordinates
    const textBoxWidth = getTextBoxWidth();
    const textBoxLeft = typewriterX - textBoxWidth / 2;
    const textBoxTop = typewriterY - baseFontSize;
    const worldPos = screenToWorld(textBoxLeft, textBoxTop);
    ctx.fillText(`TypeWriter Corner: (${Math.round(worldPos.x)}, ${Math.round(worldPos.y)})`, 10, 65);
    
    if (selectedObject) {
      ctx.fillText(`Selected: "${selectedObject.content}"`, 10, 80);
    }
  }, [canvasOffset, scale, textObjects, currentText, isTyping, fontLoaded, selectedObject, getTextBoxWidth, drawTextObjects, drawTypewriterCursor, canvasWidth, canvasHeight, typewriterX, typewriterY]);

  // Rendering loop
  useEffect(() => {
    const animate = () => {
      render();
      requestAnimationFrame(animate);
    };
    animate();
  }, [render]);

  // Export functions
  const exportAsJSON = () => {
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
        }
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = () => {
    setIsExportMenuOpen(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Export current canvas content as PNG
    const link = document.createElement('a');
    link.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportAsSVG = useCallback(() => {
    setIsExportMenuOpen(false);
    // Create SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", String(canvasWidth));
    svg.setAttribute("height", String(canvasHeight));
    svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`); // Fixed viewBox for consistent rendering
    
    // Background
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", String(canvasWidth));
    bg.setAttribute("height", String(canvasHeight));
    bg.setAttribute("fill", "white");
    svg.appendChild(bg);
    
    // Grid (optional)
    const gridGroup = document.createElementNS(svgNS, "g");
    gridGroup.setAttribute("stroke", "#e0e0e0");
    gridGroup.setAttribute("stroke-width", "0.5");
    
    const baseGridSize = 20;
    const gridSize = baseGridSize * scale;
    const offsetX = canvasOffset.x % gridSize;
    const offsetY = canvasOffset.y % gridSize;
    
    // Vertical lines
    for (let x = offsetX; x < canvasWidth; x += gridSize) {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", String(x));
      line.setAttribute("y1", "0");
      line.setAttribute("x2", String(x));
      line.setAttribute("y2", String(canvasHeight));
      gridGroup.appendChild(line);
    }
    
    // Horizontal lines
    for (let y = offsetY; y < canvasHeight; y += gridSize) {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", String(y));
      line.setAttribute("x2", String(canvasWidth));
      line.setAttribute("y2", String(y));
      gridGroup.appendChild(line);
    }
    
    svg.appendChild(gridGroup);
    
    // Text objects
    textObjects.forEach(textObj => {
      const screenPos = worldToScreen(textObj.x, textObj.y);
      
      // Add only visible text to screen
      if (screenPos.x > -200 && screenPos.x < canvasWidth + 200 && screenPos.y > -50 && screenPos.y < canvasHeight + 50) {
        const fontSize = baseFontSize * (textObj.scale || 1) * scale;
        
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", String(screenPos.x));
        text.setAttribute("y", String(screenPos.y));
        // Prioritize "Nanum Gothic Coding" font
        text.setAttribute("font-family", '"Nanum Gothic Coding", "Noto Sans Mono", "JetBrains Mono", monospace');
        text.setAttribute("font-size", String(fontSize));
        text.setAttribute("fill", "#333");
        text.textContent = textObj.content;
        
        svg.appendChild(text);
      }
    });
    
    // Current typing text
    if (currentText) {
      const textBoxWidth = getTextBoxWidth();
      const textBoxLeft = typewriterX - textBoxWidth / 2;
      
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", String(textBoxLeft));
      text.setAttribute("y", String(typewriterY));
      // Prioritize "Nanum Gothic Coding" font
      text.setAttribute("font-family", '"Nanum Gothic Coding", "Noto Sans Mono", "JetBrains Mono", monospace');
      text.setAttribute("font-size", String(baseFontSize));
      text.setAttribute("fill", "#333");
      text.textContent = currentText;
      
      svg.appendChild(text);
    }
    
    // Convert to SVG string and download
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typewriter-canvas-${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasOffset, scale, textObjects, currentText, baseFontSize, getTextBoxWidth, canvasWidth, canvasHeight, typewriterX, typewriterY]);

  // Import file
  const importFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result || typeof result !== 'string') throw new Error('Invalid file');
        const data = JSON.parse(result);
        
        if (data.type === "infinite-typewriter-canvas" && data.elements) {
          // Initialize existing data
          setTextObjects([]);
          setCurrentText('');
          setSelectedObject(null);
          
          // Restore text objects
          const importedObjects = data.elements.map(elem => ({
            id: elem.id || Date.now() + Math.random(),
            content: elem.content || '',
            x: elem.x || 0,
            y: elem.y || 0,
            scale: elem.scale || 1
          }));
          
          setTextObjects(importedObjects);
          
          // Restore app state
          if (data.appState) {
            if (data.appState.canvasOffset) {
              setCanvasOffset(data.appState.canvasOffset);
            }
            if (data.appState.scale) {
              setScale(data.appState.scale);
            }
          }
        }
      } catch (error) {
        // Using a custom message box instead of alert()
        console.error('Import error:', error);
        // In a real app, you'd show a custom modal/toast here
        alert('파일을 읽는 중 오류가 발생했습니다.'); 
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close dropdown with ESC key
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
      
      // Handle zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
        const currentIndex = zoomLevels.findIndex(level => Math.abs(level - scale) < 0.01);
        
        if (e.key === '=' || e.key === '+') {
          // Ctrl/Cmd + = or + : Zoom in
          e.preventDefault();
          const newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
          return;
        } else if (e.key === '-') {
          // Ctrl/Cmd + - : Zoom out
          e.preventDefault();
          const newIndex = Math.max(0, currentIndex - 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(zoomLevels[newIndex]);
          }
          return;
        } else if (e.key === '0') {
          // Ctrl/Cmd + 0 : Reset to 100% zoom
          e.preventDefault();
          if (Math.abs(scale - 1) > 0.01) {
            zoomToLevel(1);
          }
          return;
        }
      }
      
      // Delete selected object with Delete key
      if (e.key === 'Delete' && selectedObject) {
        setTextObjects(prev => prev.filter(obj => obj.id !== selectedObject.id));
        setSelectedObject(null);
        return;
      }
      
      // Move canvas with Shift + Arrow keys
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const moveDistance = baseFontSize * 1.5; // Same spacing as Enter key
        
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
      
      if (e.key === 'Enter') {
        if (currentText.trim()) {
          const worldPos = getCurrentWorldPosition();
          setTextObjects(prev => [...prev, {
            content: currentText,
            x: worldPos.x,
            y: worldPos.y,
            scale: 1 / scale, // Store scale inverse to maintain screen size
            id: Date.now()
          }]);
          setCurrentText('');
        }
        // Move canvas up by typewriter line-height
        setCanvasOffset(prev => ({
          x: prev.x,
          y: prev.y - typewriterLineHeight
        }));
      } else if (e.key === 'Backspace') {
        setCurrentText(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setSelectedObject(null);
        setIsExportMenuOpen(false);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const newText = currentText + e.key;
        setCurrentText(newText);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentText, scale, selectedObject, baseFontSize, zoomToLevel, getCurrentWorldPosition]);

  // Mouse events
  const handleMouseDown = (e) => {
    // Close dropdown on click outside
    if (isExportMenuOpen && !e.target.closest('.export-dropdown')) {
      setIsExportMenuOpen(false);
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check for text object selection
    const clickedObject = textObjects.find(obj => isPointInText(obj, mouseX, mouseY));
    
    if (clickedObject) {
      setSelectedObject(clickedObject);
      setIsDraggingText(true);
      setDragStart({ x: mouseX, y: mouseY });
    } else {
      setSelectedObject(null);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingText && selectedObject) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      // Move text object (world coordinates)
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
  };

  // Wheel event (zoom) - based on typewriter text box top-left
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
    const currentIndex = zoomLevels.findIndex(level => Math.abs(level - scale) < 0.01);
    
    let newIndex;
    if (e.deltaY > 0) {
      // Zoom out
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      // Zoom in
      newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex) {
      zoomToLevel(zoomLevels[newIndex]);
    }
  }, [scale, zoomToLevel]);

  // Reset function
  const resetCanvas = () => {
    setCanvasOffset({ x: 0, y: 0 });
    setScale(1);
    setSelectedObject(null);
  };

  const clearAll = () => {
    setTextObjects([]);
    setCurrentText('');
    setSelectedObject(null);
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-sm p-4 flex items-center gap-4 flex-wrap">
        <h1 className="text-xl font-bold">무한 캔버스 타이프라이터</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetCanvas}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            중앙으로
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            모두 지우기
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer text-sm">
            불러오기
            <input
              type="file"
              accept=".json"
              onChange={importFile}
              className="hidden"
            />
          </label>
          
          <div className="relative export-dropdown">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
              내보내기 ▼
            </button>
            {isExportMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-10 min-w-32">
                <button
                  onClick={exportAsJSON}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  JSON 파일
                </button>
                <button
                  onClick={exportAsPNG}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  PNG 이미지
                </button>
                <button
                  onClick={exportAsSVG}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  SVG 벡터
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-600 flex-1">
          드래그로 이동 | 휠로 줌 | Ctrl/Cmd + +/- 줌 | Ctrl/Cmd + 0 리셋 | 텍스트 드래그 가능
        </div>
      </div>
      
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border border-gray-300 cursor-move"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          tabIndex={0}
        />
        
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow">
          <div className="text-sm font-medium mb-2">벡터화 타이프라이터</div>
          <div className="text-xs text-gray-600">
            • <strong>작성중 텍스트:</strong> 화면 크기 고정 (줌 영향 없음)<br/>
            • <strong>완성된 텍스트:</strong> 입력 시 화면 크기를 월드에서 유지<br/>
            • 예: 200% 줌에서 입력 → 100% 줌으로 축소 시 텍스트도 축소<br/>
            • 타이프라이터 텍스트박스 좌측 상단 기준 확대/축소<br/>
            • 텍스트 클릭으로 선택 및 드래그 이동<br/>
            • 줌 단축키: Ctrl/Cmd + (+/-) 확대/축소, Ctrl/Cmd + 0 리셋<br/>
            • Delete 키로 선택된 텍스트 삭제, Escape로 선택 해제<br/>
            • 월드 좌표계 기반 정확한 위치 관리<br/>
            • Shift + 방향키로 정밀 이동<br/>
            • 줌: 50% → 75% → 100% → 125% → 150% → 200% → 300%<br/>
            • 파일 내보내기: JSON (작업 파일), PNG (이미지), SVG (벡터)<br/>
            • 파일 불러오기: JSON 작업 파일 불러오기 지원<br/>
            • 한글 monospace 폰트 지원 (**Nanum Gothic Coding**, Noto Sans Mono, JetBrains Mono)
          </div>
        </div>
        
        {currentText && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-2 rounded">
            입력 중: "{currentText}"
          </div>
        )}
        
        {selectedObject && (
          <div className="absolute bottom-4 right-4 bg-green-600 bg-opacity-80 text-white p-2 rounded">
            선택됨: "{selectedObject.content}"
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteTypewriterCanvas;
