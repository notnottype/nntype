import { useEffect } from 'react';
import { CanvasObjectType } from '../types';
import { ZOOM_LEVELS, FONT_SIZE_LEVELS } from '../constants';

interface UseKeyboardEventsProps {
  scale: number;
  selectedObject: CanvasObjectType | null;
  baseFontSize: number;
  canvasOffset: { x: number; y: number };
  getCurrentLineHeight: () => number;
  zoomToLevel: (scale: number) => void;
  setCanvasObjects: React.Dispatch<React.SetStateAction<CanvasObjectType[]>>;
  setSelectedObject: React.Dispatch<React.SetStateAction<CanvasObjectType | null>>;
  setCanvasOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsExportMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSpacePressed: React.Dispatch<React.SetStateAction<boolean>>;
  setBaseFontSize: React.Dispatch<React.SetStateAction<number>>;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  resetCanvas: () => void;
  handleUISizeChange: (up: boolean) => void;
}

export const useKeyboardEvents = ({
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
}: UseKeyboardEventsProps) => {
  
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(true);
        e.preventDefault();
      }
    };

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
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
  }, [setIsSpacePressed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const input = document.getElementById('typewriter-input') as HTMLInputElement;
      const isInputFocused = document.activeElement === input;
      
      if (e.key === 'Escape') {
        setIsExportMenuOpen(false);
      }
      
      const currentIndex = ZOOM_LEVELS.findIndex(level => Math.abs(level - scale) < 0.01);
      
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          const newIndex = Math.min(ZOOM_LEVELS.length - 1, currentIndex + 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(ZOOM_LEVELS[newIndex]);
          }
          return;
        } else if (e.key === '-') {
          e.preventDefault();
          const newIndex = Math.max(0, currentIndex - 1);
          if (newIndex !== currentIndex) {
            zoomToLevel(ZOOM_LEVELS[newIndex]);
          }
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

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleUISizeChange(true);
          return;
        } else if (e.key === '-') {
          e.preventDefault();
          handleUISizeChange(false);
          return;
        }
      }
      
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
  }, [
    scale,
    selectedObject,
    getCurrentLineHeight,
    zoomToLevel,
    setCanvasObjects,
    setSelectedObject,
    setCanvasOffset,
    setIsExportMenuOpen,
    handleUISizeChange,
    resetCanvas,
  ]);
};