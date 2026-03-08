// src/types/paint.ts
// Figma 호환 색상 및 페인트 시스템.
// Reference: Figma Paint, SolidPaint, GradientPaint, ImagePaint

/**
 * RGBA 색상 (Figma 0-1 정규화 범위).
 * Figma RGBA 타입에 직접 매핑.
 */
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * RGB 색상 (알파 없음, Figma SolidPaint.color 용).
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * 그라디언트 정지점.
 * Figma ColorStop 매핑.
 */
export interface ColorStop {
  /** 그라디언트 위치, 0-1. */
  position: number;
  /** 해당 위치의 색상. */
  color: RGBA;
}

/**
 * 단색 Fill/Stroke.
 * Figma SolidPaint 매핑.
 */
export interface SolidPaint {
  type: 'SOLID';
  color: RGB;
  /** 페인트 레이어 투명도, 0-1. 기본값: 1. */
  opacity?: number;
  /** 표시 여부. 기본값: true. */
  visible?: boolean;
}

/**
 * 선형 그라디언트 Fill/Stroke.
 * Figma GradientPaint (GRADIENT_LINEAR) 매핑.
 * Figma의 변환 행렬 대신 시작/끝 점 사용 (간소화).
 */
export interface LinearGradientPaint {
  type: 'GRADIENT_LINEAR';
  gradientStops: ColorStop[];
  /** 시작점 (바운딩박스 비율, 0-1). */
  gradientStart?: { x: number; y: number };
  /** 끝점 (바운딩박스 비율, 0-1). */
  gradientEnd?: { x: number; y: number };
  opacity?: number;
  visible?: boolean;
}

/**
 * 방사형 그라디언트 Fill/Stroke.
 * Figma GradientPaint (GRADIENT_RADIAL) 매핑.
 */
export interface RadialGradientPaint {
  type: 'GRADIENT_RADIAL';
  gradientStops: ColorStop[];
  /** 중심점 (바운딩박스 비율). */
  center?: { x: number; y: number };
  /** 반지름 (바운딩박스 대각선 비율). */
  radius?: number;
  opacity?: number;
  visible?: boolean;
}

/**
 * 이미지 Fill/Stroke.
 * Figma ImagePaint 매핑.
 * NNType에서는 imageRef가 URL/data URI (Figma의 해시가 아님).
 */
export interface ImagePaint {
  type: 'IMAGE';
  /** 이미지 참조: URL, data URI, 또는 blob URL. */
  imageRef: string;
  /** 컨테이너 내 이미지 스케일 방식. */
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  /** 이미지 회전 (도). 기본값: 0. */
  imageRotation?: number;
  opacity?: number;
  visible?: boolean;
}

/**
 * 모든 페인트 타입의 유니온.
 * `type` 필드로 판별.
 */
export type Paint =
  | SolidPaint
  | LinearGradientPaint
  | RadialGradientPaint
  | ImagePaint;

/**
 * 그라디언트 페인트 편의 유니온.
 */
export type GradientPaint = LinearGradientPaint | RadialGradientPaint;
