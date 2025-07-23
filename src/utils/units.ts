/**
 * 단위 변환 유틸리티
 * 
 * 이 파일은 다양한 단위 간 변환을 담당합니다:
 * - px (픽셀): 화면에 실제 표시되는 물리적 단위
 * - pt (포인트): 타이포그래피 논리적 단위 (1pt = 1/72 inch)
 * - 캔버스 줌 레벨과 UI 폰트 크기는 서로 독립적인 개념
 */

/**
 * 표준 픽셀-포인트 변환 비율
 * 웹 표준: 96px = 72pt 따라서 1px = 0.75pt
 */
export const PX_TO_PT_RATIO = 0.75;

/**
 * 픽셀을 포인트로 변환
 * @param pixels 픽셀 값
 * @returns 포인트 값
 */
export const pxToPoints = (pixels: number): number => {
  return pixels * PX_TO_PT_RATIO;
};

/**
 * 포인트를 픽셀로 변환
 * @param points 포인트 값
 * @returns 픽셀 값
 */
export const pointsToPx = (points: number): number => {
  return points / PX_TO_PT_RATIO;
};

/**
 * UI 폰트 크기(픽셀)를 월드 좌표계 폰트 크기로 변환
 * @param uiFontSizePx UI에서 표시되는 폰트 크기 (픽셀)
 * @param canvasZoomLevel 캔버스 줌 레벨 (1.0 = 100%)
 * @returns 월드 좌표계 폰트 크기 (픽셀)
 */
export const uiToWorldFontSize = (uiFontSizePx: number, canvasZoomLevel: number): number => {
  return uiFontSizePx / canvasZoomLevel;
};

/**
 * 월드 좌표계 폰트 크기를 UI 폰트 크기(픽셀)로 변환
 * @param worldFontSizePx 월드 좌표계 폰트 크기 (픽셀)
 * @param canvasZoomLevel 캔버스 줌 레벨 (1.0 = 100%)
 * @returns UI에서 표시되는 폰트 크기 (픽셀)
 */
export const worldToUIFontSize = (worldFontSizePx: number, canvasZoomLevel: number): number => {
  return worldFontSizePx * canvasZoomLevel;
};