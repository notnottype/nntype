import { ThemeColors } from '../types';

/**
 * UI 관련 상수 정의
 * 
 * 변수명 규칙:
 * - uiFontSize: UI에서 실제 표시되는 폰트 크기 (픽셀 단위)
 * - canvasZoom: 캔버스 줌/확대 레벨 (1.0 = 100%)
 * - textSize: 텍스트 오브젝트의 논리적 크기 (포인트 단위)
 */
export const INITIAL_UI_FONT_SIZE_PX = 20;
export const INITIAL_BASE_FONT_SIZE_PT = 10;
export const TEXT_BOX_WIDTH_MM = 160;
export const A4_MARGIN_LR_MM = 25;
export const A4_MARGIN_TOP_MM = 30;
export const A4_WIDTH_MM = TEXT_BOX_WIDTH_MM + (A4_MARGIN_LR_MM * 2);
export const A4_HEIGHT_MM = A4_WIDTH_MM * (297 / 210);
export const MAX_CHARS_PER_LINE = 52;
export const SCREEN_MARGIN_PX = 25;

// 캔버스 줌 레벨들 (1.0 = 100% 기본 크기)
export const CANVAS_ZOOM_LEVELS = [
  0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
];

// UI 폰트 크기 레벨들 (픽셀 단위)
export const UI_FONT_SIZE_LEVELS_PX = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 36, 42, 48, 56, 64];

// Base 폰트 크기 레벨들 (포인트 단위)
export const BASE_FONT_SIZE_LEVELS_PT = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48];

export const THEME_COLORS: Record<'dark' | 'light', ThemeColors> = {
  dark: {
    background: '#2a2a2a',
    text: 'rgba(255, 255, 255, 0.9)',
    grid: 'rgba(255, 255, 255, 0.03)',
    selection: 'rgba(59, 130, 246, 0.08)',
    selectionBorder: 'rgba(59, 130, 246, 0.3)',
    hover: 'rgba(135, 206, 235, 0.15)',
    hoverBorder: 'rgba(135, 206, 235, 0.8)',
    a4Guide: 'rgba(59, 130, 246, 0.3)',
    inputBg: 'rgba(0, 0, 0, 0.01)', // 99% 투명
    inputBorder: 'rgba(59, 130, 246, 0.5)',
  },
  light: {
    background: '#ffffff',
    text: 'rgba(0, 0, 0, 0.9)',
    grid: 'rgba(0, 0, 0, 0.03)',
    selection: 'rgba(59, 130, 246, 0.06)',
    selectionBorder: 'rgba(59, 130, 246, 0.25)',
    hover: 'rgba(135, 206, 235, 0.1)',
    hoverBorder: 'rgba(135, 206, 235, 0.7)',
    a4Guide: 'rgba(59, 130, 246, 0.4)',
    inputBg: 'rgba(255, 255, 255, 0.01)', // 99% 투명
    inputBorder: 'rgba(59, 130, 246, 0.5)',
  }
};
