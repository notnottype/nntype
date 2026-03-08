// src/types/effects.ts
// Figma 호환 시각 효과 타입.
// Reference: Figma Effect, DropShadowEffect, InnerShadowEffect, BlurEffect

import type { RGBA } from './paint.js';
import type { BlendMode } from './base.js';

/**
 * 드롭 섀도우 효과.
 * Figma Effect (DROP_SHADOW) 매핑.
 */
export interface DropShadowEffect {
  type: 'DROP_SHADOW';
  color: RGBA;
  offset: { x: number; y: number };
  /** 블러 반경 (월드 단위). */
  radius: number;
  /** 확산 거리. 기본값: 0. */
  spread?: number;
  /** 표시 여부. 기본값: true. */
  visible?: boolean;
  blendMode?: BlendMode;
}

/**
 * 내부 섀도우 효과.
 * Figma Effect (INNER_SHADOW) 매핑.
 */
export interface InnerShadowEffect {
  type: 'INNER_SHADOW';
  color: RGBA;
  offset: { x: number; y: number };
  radius: number;
  spread?: number;
  visible?: boolean;
  blendMode?: BlendMode;
}

/**
 * 레이어 블러 효과.
 * Figma Effect (LAYER_BLUR) 매핑.
 */
export interface LayerBlurEffect {
  type: 'LAYER_BLUR';
  radius: number;
  visible?: boolean;
}

/**
 * 배경 블러 효과 (프로스티드 글라스).
 * Figma Effect (BACKGROUND_BLUR) 매핑.
 */
export interface BackgroundBlurEffect {
  type: 'BACKGROUND_BLUR';
  radius: number;
  visible?: boolean;
}

/**
 * 모든 효과 타입의 유니온.
 * `type` 필드로 판별.
 */
export type Effect =
  | DropShadowEffect
  | InnerShadowEffect
  | LayerBlurEffect
  | BackgroundBlurEffect;
