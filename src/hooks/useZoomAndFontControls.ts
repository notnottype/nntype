import { useCallback } from 'react';
import { 
  UI_FONT_SIZE_LEVELS_PX,
  BASE_FONT_SIZE_LEVELS_PT,
  INITIAL_UI_FONT_SIZE_PX,
  INITIAL_BASE_FONT_SIZE_PT,
  CANVAS_ZOOM_LEVELS
} from '../constants';
import { findFontSizeLevel, findZoomLevel, calculateTextBoxOffset } from '../utils';
import { pointsToPx, pxToPoints, pointsToPxWithDPI, pxToPointsWithDPI, getDisplayDPI } from '../utils/units';
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

  const maintainTypewriterLTWorldPosition = useCallback((newBaseFontSize: number, newScale: number, newBaseFontSizePt?: number) => {
    // 1. 현재 타이프라이터 LT 위치의 월드 좌표 계산 (정확한 텍스트 폭 사용)
    const currentTextBoxWidth = getTextBoxWidth();
    const currentLTScreen = {
      x: typewriterX - currentTextBoxWidth / 2,
      y: typewriterY - baseFontSize / 2
    };
    const currentLTWorld = {
      x: (currentLTScreen.x - canvasOffset.x) / scale,
      y: (currentLTScreen.y - canvasOffset.y) / scale
    };
    
    // 2. 디스플레이 폰트와 로지컬 폰트의 독립성 유지
    const finalBaseFontSize = newBaseFontSize;
    const finalBaseFontSizePt = newBaseFontSizePt !== undefined ? newBaseFontSizePt : baseFontSizePt;
    
    // 3. 새 폰트 크기에서의 텍스트박스 크기 계산
    const monospaceFontRatio = 0.6;
    const newTextBoxWidth = maxCharsPerLine * finalBaseFontSize * monospaceFontRatio;
    const newLTScreen = {
      x: typewriterX - newTextBoxWidth / 2,
      y: typewriterY - finalBaseFontSize / 2
    };
    
    // 4. 같은 월드 좌표가 같은 화면 위치에 오도록 새 오프셋 계산
    const newOffset = {
      x: newLTScreen.x - currentLTWorld.x * newScale,
      y: newLTScreen.y - currentLTWorld.y * newScale
    };
    
    console.log('LT Position Maintenance (Independent Fonts):', {
      current: {
        baseFontSize,
        baseFontSizePt,
        scale,
        textBoxWidth: currentTextBoxWidth,
        ltScreen: currentLTScreen,
        ltWorld: currentLTWorld,
        offset: canvasOffset
      },
      new: {
        baseFontSize: finalBaseFontSize,
        baseFontSizePt: finalBaseFontSizePt,
        scale: newScale,
        textBoxWidth: newTextBoxWidth,
        ltScreen: newLTScreen,
        offset: newOffset
      },
      typewriter: { x: typewriterX, y: typewriterY },
      maxCharsPerLine,
      independence: {
        displayFontChanged: finalBaseFontSize !== baseFontSize,
        logicalFontChanged: finalBaseFontSizePt !== baseFontSizePt,
        independent: true
      }
    });
    
    // 5. 상태 업데이트 (독립적으로)
    setBaseFontSize(finalBaseFontSize);
    setBaseFontSizePt(finalBaseFontSizePt);
    setScale(newScale);
    setCanvasOffset(newOffset);
  }, [baseFontSize, baseFontSizePt, scale, canvasOffset, typewriterX, typewriterY, maxCharsPerLine, setBaseFontSize, setBaseFontSizePt, setScale, setCanvasOffset, getTextBoxWidth]);

  const handleUISizeChange = useCallback((increase: boolean) => {
    const currentIndex = findFontSizeLevel(baseFontSize, UI_FONT_SIZE_LEVELS_PX);
    const newIndex = increase 
      ? Math.min(UI_FONT_SIZE_LEVELS_PX.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const newFontSize = UI_FONT_SIZE_LEVELS_PX[newIndex];
      // 디스플레이 폰트 크기 변화 비율 계산
      const fontSizeRatio = newFontSize / baseFontSize;
      const newScale = scale * fontSizeRatio; // 디스플레이 폰트가 커지면 캔버스도 확대
      
      // Cmd +/- : 디스플레이 폰트와 캔버스 스케일을 함께 변경, 로지컬 폰트(baseFontSizePt)는 유지
      maintainTypewriterLTWorldPosition(newFontSize, newScale, baseFontSizePt);
    }
  }, [baseFontSize, baseFontSizePt, scale, maintainTypewriterLTWorldPosition]);

  const handleBaseFontSizeChange = useCallback((increase: boolean) => {
    const currentIndex = findFontSizeLevel(baseFontSizePt, BASE_FONT_SIZE_LEVELS_PT);
    const newIndex = increase 
      ? Math.min(BASE_FONT_SIZE_LEVELS_PT.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    
    if (newIndex !== currentIndex) {
      const newBaseFontSizePt = BASE_FONT_SIZE_LEVELS_PT[newIndex];
      // 포인트 크기 변화 비율 계산 (역비율 적용 - 메인 브랜치 방식)
      const ptRatio = newBaseFontSizePt / baseFontSizePt;
      const newScale = scale / ptRatio; // Logical Font Size 증가 시 캔버스 축소 (역비율)
      
      // Alt +/- : 로지컬 폰트만 변경, 디스플레이 폰트(baseFontSize)는 유지
      maintainTypewriterLTWorldPosition(baseFontSize, newScale, newBaseFontSizePt);
    }
  }, [baseFontSizePt, baseFontSize, scale, maintainTypewriterLTWorldPosition]);

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
