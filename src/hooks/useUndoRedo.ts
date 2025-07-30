import { useState, useCallback } from 'react';
import { CanvasObjectType } from '../types';

export interface CanvasSnapshot {
  canvasObjects: CanvasObjectType[];
  currentTypingText: string;
  timestamp: number;
}

export const useUndoRedo = (
  initialCanvasObjects: CanvasObjectType[] = [],
  initialTypingText: string = ''
) => {
  const [undoStack, setUndoStack] = useState<CanvasSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasSnapshot[]>([]);

  // Push current state to undo stack
  const pushUndo = useCallback((canvasObjects: CanvasObjectType[], currentTypingText: string) => {
    const snapshot: CanvasSnapshot = {
      canvasObjects: JSON.parse(JSON.stringify(canvasObjects)), // Deep copy
      currentTypingText,
      timestamp: Date.now()
    };

    setUndoStack(prev => {
      const newStack = [...prev, snapshot];
      // Limit stack size to prevent memory issues
      return newStack.length > 50 ? newStack.slice(-50) : newStack;
    });
    
    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, []);

  // Undo last action
  const undo = useCallback(() => {
    if (undoStack.length === 0) return null;

    const lastSnapshot = undoStack[undoStack.length - 1];
    
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastSnapshot]);
    
    return lastSnapshot;
  }, [undoStack]);

  // Redo last undone action
  const redo = useCallback(() => {
    if (redoStack.length === 0) return null;

    const nextSnapshot = redoStack[redoStack.length - 1];
    
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, nextSnapshot]);
    
    return nextSnapshot;
  }, [redoStack]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    undoStack,
    redoStack,
    pushUndo,
    undo,
    redo,
    clearHistory,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  };
};