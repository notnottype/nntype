// src/types/figma-export.ts
// NNType 캔버스 오브젝트를 Figma 호환 포맷으로 직렬화하기 위한 타입.
// Figma Plugin API 노드 구조 미러링.
//
// Reference: https://www.figma.com/plugin-docs/api/nodes/
//
// 사용법: Figma export 함수가 CanvasNode[] -> FigmaExportDocument 변환 시 사용.

import type { RGB, RGBA } from './paint.js';
import type { CanvasNode } from './nodes.js';

// ============================================================
// FIGMA 색상 타입
// ============================================================

export type FigmaColor = RGB;
export type FigmaRGBA = RGBA;

// ============================================================
// FIGMA 페인트 타입
// ============================================================

export interface FigmaSolidPaint {
  type: 'SOLID';
  color: FigmaColor;
  opacity?: number;
  visible?: boolean;
}

/**
 * Figma GradientPaint.
 * 2x3 어파인 변환 행렬로 그라디언트 방향 표현.
 */
export interface FigmaGradientPaint {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  gradientTransform: [[number, number, number], [number, number, number]];
  gradientStops: Array<{ position: number; color: FigmaRGBA }>;
  opacity?: number;
  visible?: boolean;
}

/**
 * Figma ImagePaint.
 * imageHash는 figma.createImage()로 업로드 후 받는 해시.
 * Export 시에는 원본 소스 URL을 넣어 Figma 플러그인이 다운로드/업로드.
 */
export interface FigmaImagePaint {
  type: 'IMAGE';
  imageHash: string;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  opacity?: number;
  visible?: boolean;
}

export type FigmaPaint = FigmaSolidPaint | FigmaGradientPaint | FigmaImagePaint;

// ============================================================
// FIGMA 이펙트 타입
// ============================================================

export interface FigmaDropShadowEffect {
  type: 'DROP_SHADOW';
  color: FigmaRGBA;
  offset: { x: number; y: number };
  radius: number;
  spread?: number;
  visible: boolean;
  blendMode: string;
}

export interface FigmaInnerShadowEffect {
  type: 'INNER_SHADOW';
  color: FigmaRGBA;
  offset: { x: number; y: number };
  radius: number;
  spread?: number;
  visible: boolean;
  blendMode: string;
}

export interface FigmaBlurEffect {
  type: 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  radius: number;
  visible: boolean;
}

export type FigmaEffect = FigmaDropShadowEffect | FigmaInnerShadowEffect | FigmaBlurEffect;

// ============================================================
// FIGMA 노드 타입 (export 포맷)
// ============================================================

/**
 * 모든 Figma export 노드의 기본 속성.
 */
export interface FigmaBaseNode {
  /** Figma 노드 타입. */
  figmaType: string;
  /** 원본 NNType 노드 ID (Figma pluginData에 저장). */
  sourceId: string;
  /** 원본 NNType 노드 타입. */
  sourceType: CanvasNode['type'];
  /** Figma 레이어 패널 이름. */
  name: string;
  /** 위치 및 크기. */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
}

/**
 * Figma TextNode export 포맷.
 * NNType TextNode에서 매핑.
 */
export interface FigmaTextNode extends FigmaBaseNode {
  figmaType: 'TEXT';
  sourceType: 'text';
  /** 텍스트 내용. Figma TextNode.characters 매핑. */
  characters: string;
  fontSize: number;
  fontName: { family: string; style: string };
  textAlignHorizontal: string;
  textAlignVertical: string;
  lineHeight?: { value: number; unit: string };
  letterSpacing?: { value: number; unit: string };
  textDecoration?: string;
  fills: FigmaPaint[];
  effects?: FigmaEffect[];
}

/**
 * Figma RectangleNode export 포맷.
 * GuideNode, ImageNode, VideoNode 매핑에 사용.
 */
export interface FigmaRectangleNode extends FigmaBaseNode {
  figmaType: 'RECTANGLE';
  cornerRadius?: number;
  fills: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: string;
  effects?: FigmaEffect[];
  /**
   * NNType 전용 데이터 (Figma pluginData에 저장).
   * 이미지: { src, alt, scaleMode }
   * 비디오: { src, poster, autoplay, loop, sourceType }
   * 가이드: { guideType }
   */
  pluginData?: Record<string, string>;
}

/**
 * Figma ConnectorNode export 포맷.
 * NNType LinkNode에서 매핑.
 * 참고: ConnectorNode는 FigJam에서만 사용 가능.
 * Figma Design에서는 라인 지오메트리로 표현.
 */
export interface FigmaConnectorNode extends FigmaBaseNode {
  figmaType: 'CONNECTOR';
  sourceType: 'link';
  connectorStart: {
    endpointNodeId: string;
    position: { x: number; y: number };
  };
  connectorEnd: {
    endpointNodeId: string;
    position: { x: number; y: number };
  };
  strokes: FigmaPaint[];
  strokeWeight?: number;
  connectorLineType?: 'STRAIGHT' | 'ELBOWED';
}

export type FigmaNode =
  | FigmaTextNode
  | FigmaRectangleNode
  | FigmaConnectorNode;

// ============================================================
// FIGMA 문서 (최상위 export)
// ============================================================

/**
 * Figma export 문서 전체.
 * Figma 플러그인이 소비하는 JSON 포맷.
 */
export interface FigmaExportDocument {
  /** Export 포맷 버전. */
  version: string;
  /** 생성기 식별자. */
  generator: 'nntype';
  /** Export 시각 (ISO 8601). */
  exportedAt: string;
  /** 소스 NNType 문서 메타데이터. */
  source: {
    /** 모든 export 콘텐츠의 월드 바운딩박스. */
    boundingBox: { x: number; y: number; width: number; height: number };
    /** 원본 문서의 노드 수. */
    nodeCount: number;
    /** NNType 앱 버전. */
    appVersion: string;
  };
  /** Figma 호환 포맷의 모든 노드. */
  nodes: FigmaNode[];
  /**
   * Figma에 업로드해야 할 이미지 참조.
   * imageRef(URL)를 참조하는 Figma 노드 ID 매핑.
   */
  imageReferences: Array<{
    src: string;
    nodeIds: string[];
  }>;
}

// ============================================================
// 노드 매핑 테이블
// ============================================================

/**
 * NNType → Figma 노드 타입 매핑.
 * Export 함수에서 변환 전략 결정에 사용.
 *
 * | NNType Node | Figma Node       | 비고                                     |
 * |-------------|------------------|------------------------------------------|
 * | TextNode    | TextNode         | 직접 매핑                                |
 * | ImageNode   | RectangleNode    | 이미지를 fill paint로 변환               |
 * | VideoNode   | RectangleNode    | poster를 fill로, 비디오 URL은 pluginData |
 * | GuideNode   | RectangleNode    | 점선 stroke, 투명 fill                   |
 * | LinkNode    | ConnectorNode    | FigJam 전용; Design에서는 라인           |
 */
export interface NodeTypeMapping {
  text: FigmaTextNode;
  image: FigmaRectangleNode;
  video: FigmaRectangleNode;
  guide: FigmaRectangleNode;
  link: FigmaConnectorNode;
}
