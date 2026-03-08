// src/types/base.ts
// Figma Plugin API 믹스인 아키텍처를 참고한 기본 노드 시스템.
// Reference: https://www.figma.com/plugin-docs/api/properties/

/**
 * 모든 캔버스 노드의 고유 식별자.
 * 기존 number/string 혼용에서 string UUID로 통일.
 */
export type NodeId = string;

/**
 * 고유 노드 ID 생성.
 * crypto.randomUUID() 사용, 미지원 환경은 timestamp+random 폴백.
 */
export function generateNodeId(): NodeId {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 2D 좌표 (월드 좌표계).
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * Figma BlendMode 호환 블렌드 모드.
 * 캔버스 앱에서 실용적인 서브셋만 포함.
 */
export type BlendMode =
  | 'NORMAL'
  | 'MULTIPLY'
  | 'SCREEN'
  | 'OVERLAY'
  | 'DARKEN'
  | 'LIGHTEN';

/**
 * 모든 캔버스 노드의 공통 속성.
 * Figma BaseNodeMixin + SceneNodeMixin (부분) 매핑.
 */
export interface BaseNodeMixin {
  /** 고유 식별자 (string UUID). */
  id: NodeId;

  /** 판별 필드 (discriminated union). */
  type: string;

  /** 사람이 읽을 수 있는 이름. Figma BaseNodeMixin.name 매핑. */
  name?: string;

  /** 캔버스에서 표시 여부. 기본값: true. */
  visible?: boolean;

  /** 잠금 상태 (비대화형). 기본값: false. */
  locked?: boolean;
}

/**
 * 위치 및 크기 속성.
 * Figma LayoutMixin 매핑 (간소화).
 * 모든 좌표는 월드 단위.
 */
export interface LayoutMixin {
  /** X 위치 (월드 좌표). */
  x: number;

  /** Y 위치 (월드 좌표). */
  y: number;

  /** 너비 (월드 단위). 텍스트는 자동 계산 가능하므로 optional. */
  width?: number;

  /** 높이 (월드 단위). 텍스트는 자동 계산 가능하므로 optional. */
  height?: number;

  /** 회전 각도 (도, 시계방향). 기본값: 0. */
  rotation?: number;
}

/**
 * 시각적 블렌딩 속성.
 * Figma BlendMixin 매핑.
 */
export interface BlendMixin {
  /** 투명도 0(투명)~1(불투명). 기본값: 1. */
  opacity?: number;

  /** 합성 블렌드 모드. 기본값: 'NORMAL'. */
  blendMode?: BlendMode;
}

/**
 * Fill, Stroke, Effect 속성.
 * Figma GeometryMixin + MinimalFillsMixin + MinimalStrokesMixin 매핑.
 */
export interface GeometryMixin {
  /** Fill 페인트 배열. Figma와 동일하게 아래→위 순서 평가. */
  fills?: import('./paint').Paint[];

  /** Stroke 페인트 배열. */
  strokes?: import('./paint').Paint[];

  /** Stroke 두께 (월드 단위). 기본값: 1. */
  strokeWeight?: number;

  /** Stroke 정렬. 기본값: 'CENTER'. */
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';

  /** 시각 효과 (그림자, 블러). */
  effects?: import('./effects').Effect[];
}

/**
 * 노드 메타데이터.
 * 기존 TextObject._metadata 패턴을 확장.
 */
export interface NodeMetadata {
  /** 생성 시각 (ISO 8601). */
  createdAt: string;

  /** 수정 시각 (ISO 8601). */
  updatedAt: string;

  /** 소속 채널 ID 배열. */
  channelIds: string[];

  /** 임의 키-값 데이터. Figma pluginData 컨셉. */
  pluginData?: Record<string, string>;
}
