import { useState, useCallback } from 'react';
import { CanvasObjectType, Theme } from '../types';
import { loadSession } from '../utils/sessionStorage';
import { INITIAL_UI_FONT_SIZE_PX, INITIAL_BASE_FONT_SIZE_PT } from '../constants';

export interface SessionState {
  canvasObjects: CanvasObjectType[];
  currentTypingText: string;
  scale: number;
  baseFontSize: number;
  baseFontSizePt: number;
  maxCharsPerLine: number;
  uiState: {
    showGrid: boolean;
    showInfo: boolean;
    showShortcuts: boolean;
    showApiKeyInput: boolean;
    showTextBox: boolean;
    theme: Theme;
  };
}

export const useSessionState = () => {
  // Initialize state from session data
  const initializeStateFromSession = useCallback(() => {
    const sessionData = loadSession();
    return {
      canvasObjects: sessionData?.canvasObjects || [],
      currentTypingText: sessionData?.currentTypingText || '',
      scale: sessionData?.scale || 1,
      baseFontSize: sessionData?.baseFontSize || INITIAL_UI_FONT_SIZE_PX,
      baseFontSizePt: sessionData?.baseFontSizePt || INITIAL_BASE_FONT_SIZE_PT,
      maxCharsPerLine: sessionData?.maxCharsPerLine || 80,
      uiState: {
        showGrid: sessionData?.showGrid ?? true,
        showInfo: sessionData?.showInfo ?? true,
        showShortcuts: sessionData?.showShortcuts ?? true,
        showApiKeyInput: false,
        showTextBox: sessionData?.showTextBox ?? true,
        theme: (sessionData?.theme || 'light') as Theme,
      }
    };
  }, []);

  const [sessionState, setSessionState] = useState<SessionState>(initializeStateFromSession);

  // Update specific parts of session state
  const updateCanvasObjects = useCallback((value: CanvasObjectType[] | ((prev: CanvasObjectType[]) => CanvasObjectType[])) => {
    setSessionState(prev => ({
      ...prev,
      canvasObjects: typeof value === 'function' ? value(prev.canvasObjects) : value
    }));
  }, []);

  const updateCurrentTypingText = useCallback((value: string | ((prev: string) => string)) => {
    setSessionState(prev => ({
      ...prev,
      currentTypingText: typeof value === 'function' ? value(prev.currentTypingText) : value
    }));
  }, []);

  const updateScale = useCallback((value: number | ((prev: number) => number)) => {
    setSessionState(prev => ({
      ...prev,
      scale: typeof value === 'function' ? value(prev.scale) : value
    }));
  }, []);

  const updateBaseFontSize = useCallback((value: number | ((prev: number) => number)) => {
    setSessionState(prev => ({
      ...prev,
      baseFontSize: typeof value === 'function' ? value(prev.baseFontSize) : value
    }));
  }, []);

  const updateBaseFontSizePt = useCallback((value: number | ((prev: number) => number)) => {
    setSessionState(prev => ({
      ...prev,
      baseFontSizePt: typeof value === 'function' ? value(prev.baseFontSizePt) : value
    }));
  }, []);

  const updateMaxCharsPerLine = useCallback((value: number | ((prev: number) => number)) => {
    setSessionState(prev => ({
      ...prev,
      maxCharsPerLine: typeof value === 'function' ? value(prev.maxCharsPerLine) : value
    }));
  }, []);

  const updateUIState = useCallback((value: Partial<SessionState['uiState']> | ((prev: SessionState['uiState']) => SessionState['uiState'])) => {
    setSessionState(prev => ({
      ...prev,
      uiState: typeof value === 'function' ? value(prev.uiState) : { ...prev.uiState, ...value }
    }));
  }, []);

  return {
    sessionState,
    setSessionState,
    updateCanvasObjects,
    updateCurrentTypingText,
    updateScale,
    updateBaseFontSize,
    updateBaseFontSizePt,
    updateMaxCharsPerLine,
    updateUIState,
    initializeStateFromSession
  };
};