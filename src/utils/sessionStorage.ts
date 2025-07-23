/**
 * Session Storage Utilities
 * Handles saving and restoring application state to localStorage
 */

import { CanvasObjectType, Theme } from '../types';

export interface SessionData {
  version: string;
  timestamp: number;
  canvasObjects: CanvasObjectType[];
  canvasOffset: { x: number; y: number };
  scale: number;
  typewriterPosition: { x: number; y: number };
  currentTypingText: string;
  baseFontSize: number;
  maxCharsPerLine: number;
  showGrid: boolean;
  showTextBox: boolean;
  showInfo: boolean;
  showShortcuts: boolean;
  theme: Theme;
  selectedObjectId?: number;
}

const SESSION_STORAGE_KEY = 'excalitype-session';
const SESSION_VERSION = '1.0.0';

export const saveSession = (data: Omit<SessionData, 'version' | 'timestamp'>): void => {
  try {
    const sessionData: SessionData = {
      ...data,
      version: SESSION_VERSION,
      timestamp: Date.now()
    };
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.warn('Failed to save session:', error);
  }
};

export const loadSession = (): SessionData | null => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const sessionData: SessionData = JSON.parse(stored);
    
    // Version compatibility check
    if (sessionData.version !== SESSION_VERSION) {
      console.warn('Session version mismatch, clearing old session');
      clearSession();
      return null;
    }
    
    // Check if session is not too old (7 days)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() - sessionData.timestamp > maxAge) {
      console.warn('Session too old, clearing');
      clearSession();
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.warn('Failed to load session:', error);
    clearSession();
    return null;
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear session:', error);
  }
};

export const hasSession = (): boolean => {
  return localStorage.getItem(SESSION_STORAGE_KEY) !== null;
};
