/**
 * Session Management Hook
 * 
 * © 2025 Hyeonsong Kim (@kimhxsong)
 * Contact: kimhxsong@gmail.com
 * 
 * Handles session loading, saving, and LT position restoration.
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { saveSession, loadSession } from '../utils/sessionStorage';
import { CanvasObject } from '../types';
import useCanvasStore from '../store/canvasStore';

export const useSessionManager = () => {
  const {
    canvasObjects,
    setCanvasObjects,
    currentTypingText,
    setCurrentTypingText,
    scale,
    setScale,
    canvasOffset,
    setCanvasOffset,
    typewriterX,
    typewriterY,
    baseFontSize,
    baseFontSizePt,
    setBaseFontSizePt,
    maxCharsPerLine,
    setMaxCharsPerLine,
    showGrid,
    toggleGrid,
    showInfo,
    toggleInfo,
    showShortcuts,
    toggleShortcuts,
    showTextBox,
    setShowTextBox,
    theme,
    toggleTheme,
    setFontLoaded,
    fontLoaded,
    setGetTextBoxWidth,
    setSelectedObject,
    setNeedsLTPositionRestore,
    selectedObject,
    needsLTPositionRestore
  } = useCanvasStore();

  // Auto-save session when state changes (optimized)
  const saveTimeoutRef = useRef<number | null>(null);
  const uiSaveTimeoutRef = useRef<number | null>(null);

  // Helper function to get current LT world position
  const getCurrentLTWorldPosition = useCallback(() => {
    const textBoxWidth = maxCharsPerLine * baseFontSize * 0.6; // Approximate calculation
    const currentLTScreen = {
      x: typewriterX - textBoxWidth / 2,
      y: typewriterY - baseFontSize / 2
    };
    return {
      x: (currentLTScreen.x - canvasOffset.x) / scale,
      y: (currentLTScreen.y - canvasOffset.y) / scale
    };
  }, [typewriterX, typewriterY, baseFontSize, canvasOffset, scale, maxCharsPerLine]);

  // Load session on component mount
  const loadInitialSession = useCallback(() => {
    const sessionData = loadSession();
    if (sessionData) {
      console.log('Restoring session from:', new Date(sessionData.timestamp));
      
      // Restore canvas state  
      setCanvasObjects(sessionData.canvasObjects);
      setScale(sessionData.scale);
      setCurrentTypingText(sessionData.currentTypingText);
      if (sessionData.baseFontSizePt) {
        setBaseFontSizePt(sessionData.baseFontSizePt);
      }
      setMaxCharsPerLine(sessionData.maxCharsPerLine);
      
      // LT 월드 좌표를 기반으로 캔버스 오프셋 계산하여 타이프라이터 위치 복구
      if (sessionData.typewriterLTWorldPosition) {
        console.log('Restoring typewriter LT position:', sessionData.typewriterLTWorldPosition);
        setNeedsLTPositionRestore(sessionData.typewriterLTWorldPosition);
      } else {
        // LT 위치 정보가 없으면 저장된 오프셋 사용 (기존 방식)
        setCanvasOffset(sessionData.canvasOffset);
      }
      
      // Restore UI state
      if (sessionData.showGrid !== showGrid) toggleGrid();
      setShowTextBox(sessionData.showTextBox);
      if (sessionData.showInfo !== showInfo) toggleInfo();
      if (sessionData.showShortcuts !== showShortcuts) toggleShortcuts();
      if (sessionData.theme !== theme) toggleTheme();
      
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
      setCanvasOffset({ x: typewriterX, y: typewriterY });
    }
  }, [
    setCanvasObjects, setScale, setCurrentTypingText, setBaseFontSizePt, setMaxCharsPerLine,
    setCanvasOffset, showGrid, toggleGrid, setShowTextBox, showInfo, toggleInfo,
    showShortcuts, toggleShortcuts, theme, toggleTheme, typewriterX, typewriterY
  ]);

  // Auto-save session when state changes
  const setupAutoSave = useCallback(() => {
    if (!fontLoaded) return;
    
    // Clear previous timeout to debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const saveCurrentSession = () => {
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
        selectedObjectId: selectedObject?.id ? Number(selectedObject.id) : undefined
      });
      saveTimeoutRef.current = null;
    };

    // Debounce saving to avoid too frequent saves
    const saveDelay = canvasObjects.length > 100 ? 5000 : canvasObjects.length > 50 ? 3000 : 1000;
    saveTimeoutRef.current = setTimeout(saveCurrentSession, saveDelay);
  }, [
    fontLoaded, canvasObjects, currentTypingText, getCurrentLTWorldPosition,
    canvasOffset, scale, typewriterX, typewriterY, baseFontSize, baseFontSizePt,
    maxCharsPerLine, showGrid, showTextBox, showInfo, showShortcuts, theme, selectedObject
  ]);

  // UI 상태 변경 시 저장
  const setupUISave = useCallback(() => {
    if (!fontLoaded) return;
    
    // Clear previous timeout to prevent accumulation
    if (uiSaveTimeoutRef.current) {
      clearTimeout(uiSaveTimeoutRef.current);
    }
    
    const saveUIState = () => {
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
        selectedObjectId: selectedObject?.id ? Number(selectedObject.id) : undefined
      });
      uiSaveTimeoutRef.current = null;
    };

    uiSaveTimeoutRef.current = setTimeout(saveUIState, 1000);
  }, [
    fontLoaded, getCurrentLTWorldPosition, canvasObjects, canvasOffset, scale,
    typewriterX, typewriterY, currentTypingText, baseFontSize, baseFontSizePt,
    maxCharsPerLine, showGrid, showTextBox, showInfo, showShortcuts, theme, selectedObject
  ]);

  // Save session before page unload
  const setupBeforeUnload = useCallback(() => {
    const handleBeforeUnload = () => {
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
        selectedObjectId: selectedObject?.id ? Number(selectedObject.id) : undefined
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    getCurrentLTWorldPosition, canvasObjects, scale, currentTypingText, baseFontSize,
    baseFontSizePt, maxCharsPerLine, showGrid, showTextBox, showInfo, showShortcuts,
    theme, selectedObject
  ]);

  // LT 위치 복구 처리
  const handleLTPositionRestore = useCallback(() => {
    if (needsLTPositionRestore && fontLoaded) {
      console.log('Restoring LT position after state initialization:', needsLTPositionRestore);
      
      const textBoxWidth = maxCharsPerLine * baseFontSize * 0.6;
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
  }, [needsLTPositionRestore, fontLoaded, typewriterX, typewriterY, maxCharsPerLine, baseFontSize, scale, setCanvasOffset]);

  // Effects
  useEffect(() => {
    loadInitialSession();
  }, []);

  useEffect(() => {
    setupAutoSave();
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [setupAutoSave]);

  useEffect(() => {
    setupUISave();
    
    return () => {
      if (uiSaveTimeoutRef.current) {
        clearTimeout(uiSaveTimeoutRef.current);
        uiSaveTimeoutRef.current = null;
      }
    };
  }, [setupUISave]);

  useEffect(() => {
    return setupBeforeUnload();
  }, [setupBeforeUnload]);

  useEffect(() => {
    handleLTPositionRestore();
  }, [handleLTPositionRestore]);

  return {
    selectedObject,
    setSelectedObject,
    needsLTPositionRestore,
    getCurrentLTWorldPosition
  };
};
