import { useCallback, useEffect } from 'react';
import { CanvasMode } from '../types';
import { 
  CANVAS_ZOOM_LEVELS,
  INITIAL_UI_FONT_SIZE_PX,
  INITIAL_BASE_FONT_SIZE_PT
} from '../constants';
import { findZoomLevel } from '../utils';
import useCanvasStore from '../store/canvasStore';

export const useKeyboardEvents = (
  isComposing: boolean,
  handleUISizeChange: (increase: boolean) => void,
  resetUIZoom: () => void,
  handleBaseFontSizeChange: (increase: boolean) => void,
  resetBaseFont: () => void,
  zoomToLevel: (level: number) => void
) => {
  const {
    scale,
    canvasOffset,
    setCanvasOffset,
    currentMode,
    selectionState,
    setSelectionState,
    selectedObjects,
    setSelectedObjects,
    selectedObject,
    setSelectedObject,
    canvasObjects,
    setCanvasObjects,
    selectedLinks,
    setSelectedLinks,
    deleteLink,
    baseFontSize,
    baseFontSizePt,
    setBaseFontSizePt
  } = useCanvasStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // IME 조합 중이면 단축키 무시
    if (isComposing) return;
    
    const input = document.getElementById('typewriter-input') as HTMLInputElement;
    const isInputFocused = document.activeElement === input;
    
    if (e.key === 'Escape') {
      // Handle escape key logic here
      return;
    }
    
    const currentZoomIndex = findZoomLevel(scale, CANVAS_ZOOM_LEVELS);
    
    // Display Font Size: Ctrl/Cmd + +/- (화면에 표시되는 폰트 크기 조정)
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleUISizeChange(true);
        return;
      } else if (e.key === '-') {
        e.preventDefault();
        handleUISizeChange(false);
        return;
      } else if (e.key === '0') {
        e.preventDefault();
        resetUIZoom();
        return;
      } else if (e.key === 'Home' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetBaseFont();
        resetUIZoom();
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
          const textObj = selectedObject as any;
          navigator.clipboard.writeText(textObj.content).catch(err => {
            console.error('Failed to copy to clipboard:', err);
          });
        }
        return;
      }
    }
    
    // Logical Font Size: Alt/Option + +/- (텍스트 객체 논리적 크기 조정)
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
        e.preventDefault();
        handleBaseFontSizeChange(true);
        return;
      }
      if (e.key === '-' || e.key === '_' || e.code === 'Minus') {
        e.preventDefault();
        handleBaseFontSizeChange(false);
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        resetBaseFont();
        return;
      }
    }
    
    // Canvas Zoom: Shift + Alt + +/- (캔버스 확대/축소)
    if (e.shiftKey && e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.key === '=' || e.key === '+' || e.code === 'Equal') {
        e.preventDefault();
        const newZoomIndex = Math.min(CANVAS_ZOOM_LEVELS.length - 1, currentZoomIndex + 1);
        if (newZoomIndex !== currentZoomIndex) {
          zoomToLevel(CANVAS_ZOOM_LEVELS[newZoomIndex]);
        }
        return;
      }
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
      
      if (currentMode === CanvasMode.SELECT && selectionState.selectedObjects.size > 0) {
        const selectedIds = Array.from(selectionState.selectedObjects);
        setCanvasObjects(canvasObjects.filter(obj => !selectedIds.includes(obj.id.toString())));
        setSelectionState({ selectedObjects: new Set(), dragArea: null });
        setSelectedObjects([]);
        setSelectedObject(null);
      } else if (selectedObjects.length > 0) {
        const selectedIds = selectedObjects.map(obj => obj.id);
        setCanvasObjects(canvasObjects.filter(obj => !selectedIds.includes(obj.id)));
        setSelectedObjects([]);
        setSelectedObject(null);
      } else if (selectedObject) {
        setCanvasObjects(canvasObjects.filter(obj => obj.id !== selectedObject.id));
        setSelectedObject(null);
      } else if (selectedLinks.size > 0) {
        const selectedLinkIds = Array.from(selectedLinks);
        selectedLinkIds.forEach(id => deleteLink(id));
        setSelectedLinks(new Set());
      }
      return;
    }
    
    // Arrow key canvas movement
    if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const moveDistance = baseFontSize * 1.6;
      const newOffset = (() => {
        switch (e.key) {
          case 'ArrowUp':
            return { x: canvasOffset.x, y: canvasOffset.y + moveDistance };
          case 'ArrowDown':
            return { x: canvasOffset.x, y: canvasOffset.y - moveDistance };
          case 'ArrowLeft':
            return { x: canvasOffset.x + moveDistance, y: canvasOffset.y };
          case 'ArrowRight':
            return { x: canvasOffset.x - moveDistance, y: canvasOffset.y };
          default:
            return canvasOffset;
        }
      })();
      
      setCanvasOffset(newOffset);
      return;
    }
  }, [
    isComposing,
    scale,
    canvasOffset,
    currentMode,
    selectionState,
    selectedObjects,
    selectedObject,
    canvasObjects,
    selectedLinks,
    baseFontSize,
    handleUISizeChange,
    resetUIZoom,
    handleBaseFontSizeChange,
    resetBaseFont,
    zoomToLevel,
    setCanvasOffset,
    setSelectionState,
    setSelectedObjects,
    setSelectedObject,
    setCanvasObjects,
    setSelectedLinks,
    deleteLink
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { handleKeyDown };
};