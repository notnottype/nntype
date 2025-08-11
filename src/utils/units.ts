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
 * 하지만 실제 디스플레이 DPI를 고려하여 더 정확한 계산 사용
 */
export const PX_TO_PT_RATIO = 0.75;

/**
 * 실제 디스플레이 DPI를 고려한 pt-px 변환
 * @param points 포인트 값
 * @param dpi 디스플레이 DPI (기본값: 96)
 * @returns 픽셀 값
 */
export const pointsToPxWithDPI = (points: number, dpi: number = 96): number => {
  return (points * dpi) / 72; // 72 points per inch
};

/**
 * 실제 디스플레이 DPI를 고려한 px-pt 변환
 * @param pixels 픽셀 값
 * @param dpi 디스플레이 DPI (기본값: 96)
 * @returns 포인트 값
 */
export const pxToPointsWithDPI = (pixels: number, dpi: number = 96): number => {
  return (pixels * 72) / dpi; // 72 points per inch
};

/**
 * 현재 디스플레이의 실제 DPI 계산
 * @returns 실제 DPI 값
 */
export const getDisplayDPI = (): number => {
  // 1인치를 표현하는 div 요소를 생성하여 실제 픽셀 수를 측정
  const testElement = document.createElement('div');
  testElement.style.width = '1in';
  testElement.style.height = '1in';
  testElement.style.position = 'absolute';
  testElement.style.left = '-100px';
  testElement.style.top = '-100px';
  testElement.style.visibility = 'hidden';
  
  document.body.appendChild(testElement);
  const dpi = testElement.offsetWidth;
  document.body.removeChild(testElement);
  
  return dpi || 96; // 측정 실패 시 기본값 96 DPI 반환
};

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