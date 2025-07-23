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
  typewriterLTWorldPosition: { x: number; y: number }; // LT 월드 좌표
  currentTypingText: string;
  baseFontSize: number;
  baseFontSizePt: number; // Base Font Size (포인트)
  maxCharsPerLine: number;
  showGrid: boolean;
  showTextBox: boolean;
  showInfo: boolean;
  showShortcuts: boolean;
  theme: Theme;
  selectedObjectId?: number;
}

const SESSION_STORAGE_KEY = 'excalitype-session';
const SESSION_VERSION = '1.1.0'; // Updated for LT position support
const MAX_SESSION_SIZE = 2 * 1024 * 1024; // 2MB 제한

export const saveSession = (data: Omit<SessionData, 'version' | 'timestamp'>): void => {
  try {
    const sessionData: SessionData = {
      ...data,
      version: SESSION_VERSION,
      timestamp: Date.now()
    };
    
    const serialized = JSON.stringify(sessionData);
    
    // 세션 데이터 크기 제한 확인
    if (serialized.length > MAX_SESSION_SIZE) {
      console.warn('Session data too large, truncating canvas objects');
      // 캔버스 객체 수를 제한하여 크기 줄이기
      const truncatedData = {
        ...sessionData,
        canvasObjects: sessionData.canvasObjects.slice(-50) // 최신 50개만 유지
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(truncatedData));
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    }
  } catch (error) {
    console.warn('Failed to save session:', error);
    // 저장 실패 시 오래된 세션 데이터 정리 시도
    try {
      clearSession();
      const minimalData = {
        ...data,
        canvasObjects: data.canvasObjects.slice(-20), // 최신 20개만
        version: SESSION_VERSION,
        timestamp: Date.now()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(minimalData));
    } catch (retryError) {
      console.error('Failed to save even minimal session data:', retryError);
    }
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
