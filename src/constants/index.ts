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

// 캔버스 줌 레벨들 (1.0 = 100% 기본 크기) - 정확한 비율 계산 기반
export const CANVAS_ZOOM_LEVELS = [
  0.1, 0.125, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0, 2.25, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0
];

// UI 폰트 크기 레벨들 (픽셀 단위)
export const UI_FONT_SIZE_LEVELS_PX = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 36, 42, 48, 56, 64];

// Base 폰트 크기 레벨들 (포인트 단위) - 더 다양한 크기 지원
export const BASE_FONT_SIZE_LEVELS_PT = [
  // 매우 작은 크기 (4-8pt)
  4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 
  // 작은 크기 (8-12pt)
  8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12,
  // 중간 크기 (12-18pt)
  12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 17, 18,
  // 큰 크기 (18-24pt)
  19, 20, 21, 22, 23, 24,
  // 매우 큰 크기 (24pt+)
  26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 48, 52, 56, 60, 64, 72
];

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
