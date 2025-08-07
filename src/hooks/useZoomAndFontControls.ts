import { useCallback } from 'react';
import { 
  UI_FONT_SIZE_LEVELS_PX,
  BASE_FONT_SIZE_LEVELS_PT,
  INITIAL_UI_FONT_SIZE_PX,
  INITIAL_BASE_FONT_SIZE_PT,
  CANVAS_ZOOM_LEVELS
} from '../constants';
import { findFontSizeLevel, findZoomLevel, calculateTextBoxOffset } from '../utils';
import { pointsToPx, pxToPoints } from '../utils/units';
import useCanvasStore from '../store/canvasStore';

export const useZoomAndFontControls = (getTextBoxWidth: () => number) => {
  const {
    baseFontSize,
    setBaseFontSize,
    baseFontSizePt,
    setBaseFontSizePt,
    scale,
    setScale,
    canvasOffset,
    setCanvasOffset,
    typewriterX,
    typewriterY,
    maxCharsPerLine,
    setSelectedObject,
    setSelectedObjects,
    setCanvasObjects
  } = useCanvasStore();

  const maintainTypewriterLTWorldPosition = useCallback((newBaseFontSize: number, newScale: number) => {
    // 1. 현재 타이프라이터 LT 위치의 월드 좌표 계산
    const currentTextBoxWidth = maxCharsPerLine * baseFontSize * 0.6; // 현재 크기로 직접 계산
    const currentLTScreen = {
      x: typewriterX - currentTextBoxWidth / 2,
      y: typewriterY - baseFontSize / 2
    };
    const currentLTWorld = {
      x: (currentLTScreen.x - canvasOffset.x) / scale,
      y: (currentLTScreen.y - canvasOffset.y) / scale
    };
    
    // 2. 새 폰트 크기에서의 텍스트박스 크기 계산
    const newTextBoxWidth = maxCharsPerLine * newBaseFontSize * 0.6;
    const newLTScreen = {
      x: typewriterX - newTextBoxWidth / 2,
      y: typewriterY - newBaseFontSize / 2
    };
    
    // 3. 같은 월드 좌표가 같은 화면 위치에 오도록 새 오프셋 계산
    const newOffset = {
      x: newLTScreen.x - currentLTWorld.x * newScale,
      y: newLTScreen.y - currentLTWorld.y * newScale
    };
    
    console.log('LT Position Maintenance:', {
      current: {
        baseFontSize,
        scale,
        textBoxWidth: currentTextBoxWidth,
        ltScreen: currentLTScreen,
        ltWorld: currentLTWorld,
        offset: canvasOffset
      },
      new: {
        baseFontSize: newBaseFontSize,
        scale: newScale,
        textBoxWidth: newTextBoxWidth,
        ltScreen: newLTScreen,
        offset: newOffset
      },
      typewriter: { x: typewriterX, y: typewriterY },
      maxCharsPerLine
    });
    
    // 4. 모든 상태를 한번에 업데이트
    setBaseFontSize(newBaseFontSize);
    setScale(newScale);
    setCanvasOffset(newOffset);
  }, [baseFontSize, scale, canvasOffset, typewriterX, typewriterY, maxCharsPerLine, setBaseFontSize, setScale, setCanvasOffset]);

  const handleUISizeChange = useCallback((increase: boolean) => {
    const currentIndex = findFontSizeLevel(baseFontSize, UI_FONT_SIZE_LEVELS_PX);
    const newIndex = increase 
      ? Math.min(UI_FONT_SIZE_LEVELS_PX.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const newFontSize = UI_FONT_SIZE_LEVELS_PX[newIndex];
      maintainTypewriterLTWorldPosition(newFontSize, scale);
    }
  }, [baseFontSize, scale, maintainTypewriterLTWorldPosition]);

  const handleBaseFontSizeChange = useCallback((increase: boolean) => {
    const currentIndex = findFontSizeLevel(baseFontSizePt, BASE_FONT_SIZE_LEVELS_PT);
    const newIndex = increase 
      ? Math.min(BASE_FONT_SIZE_LEVELS_PT.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const newBaseFontSizePt = BASE_FONT_SIZE_LEVELS_PT[newIndex];
      const ptRatio = newBaseFontSizePt / baseFontSizePt;
      const newScale = scale * ptRatio;
      
      maintainTypewriterLTWorldPosition(baseFontSize, newScale);
      setBaseFontSizePt(newBaseFontSizePt);
    }
  }, [baseFontSizePt, scale, baseFontSize, maintainTypewriterLTWorldPosition, setBaseFontSizePt]);

  const zoomToLevel = useCallback((targetScale: number) => {
    maintainTypewriterLTWorldPosition(baseFontSize, targetScale);
  }, [baseFontSize, maintainTypewriterLTWorldPosition]);

  const resetUIZoom = useCallback(() => {
    maintainTypewriterLTWorldPosition(INITIAL_UI_FONT_SIZE_PX, 1.0);
  }, [maintainTypewriterLTWorldPosition]);

  const resetBaseFont = useCallback(() => {
    if (baseFontSizePt !== INITIAL_BASE_FONT_SIZE_PT) {
      const ptRatio = INITIAL_BASE_FONT_SIZE_PT / baseFontSizePt;
      const newScale = scale / ptRatio;
      
      maintainTypewriterLTWorldPosition(baseFontSize, newScale);
      setBaseFontSizePt(INITIAL_BASE_FONT_SIZE_PT);
    }
  }, [baseFontSizePt, scale, baseFontSize, maintainTypewriterLTWorldPosition, setBaseFontSizePt]);

  const resetCanvas = useCallback(() => {
    maintainTypewriterLTWorldPosition(INITIAL_UI_FONT_SIZE_PX, 1.0);
    setBaseFontSizePt(INITIAL_BASE_FONT_SIZE_PT);
    setSelectedObject(null);
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasObjects([]);
    setSelectedObjects([]);
  }, [
    maintainTypewriterLTWorldPosition, 
    setBaseFontSizePt, 
    setSelectedObject, 
    setCanvasOffset, 
    setCanvasObjects, 
    setSelectedObjects
  ]);

  return {
    handleUISizeChange,
    handleBaseFontSizeChange,
    zoomToLevel,
    resetUIZoom,
    resetBaseFont,
    resetCanvas,
    maintainTypewriterLTWorldPosition
  };
};
