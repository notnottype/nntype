// src/types/nodes.ts
// 모든 구체 캔버스 노드 타입.
// 기본 믹스인을 확장하고 타입별 속성을 추가.
// `type` 필드 기반 discriminated union.

import type {
  BaseNodeMixin,
  LayoutMixin,
  BlendMixin,
  GeometryMixin,
  NodeMetadata,
  NodeId,
} from './base.js';
import type { Paint } from './paint.js';
import type { Effect } from './effects.js';

// ============================================================
// TEXT NODE
// ============================================================

/**
 * 수평 텍스트 정렬.
 * Figma TextNode.textAlignHorizontal 매핑.
 */
export type TextAlignHorizontal = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';

/**
 * 수직 텍스트 정렬.
 * Figma TextNode.textAlignVertical 매핑.
 */
export type TextAlignVertical = 'TOP' | 'CENTER' | 'BOTTOM';

/**
 * 텍스트 자동 리사이즈 동작.
 * Figma TextNode.textAutoResize 매핑.
 */
export type TextAutoResize = 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';

/**
 * 텍스트 데코레이션.
 * Figma TextDecoration 매핑.
 */
export type TextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';

/**
 * 폰트 두께 (100-900).
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * 행간 설정.
 * Figma LineHeight 유니온 타입 매핑.
 */
export type LineHeight =
  | { unit: 'PIXELS'; value: number }
  | { unit: 'PERCENT'; value: number }
  | { unit: 'AUTO' };

/**
 * 자간 설정.
 * Figma LetterSpacing 매핑.
 */
export type LetterSpacing =
  | { unit: 'PIXELS'; value: number }
  | { unit: 'PERCENT'; value: number };

/**
 * 텍스트 노드 -- 캔버스 위의 텍스트 콘텐츠.
 *
 * 기존 TextObject와 하위 호환:
 * - content, fontSize, scale, color, isAIResponse, _metadata 모두 보존.
 * - 새 Figma 호환 속성은 전부 optional.
 *
 * Figma 매핑: TextNode
 * 차이점: Figma는 `characters`, NNType은 `content` 사용.
 */
export interface TextNode extends BaseNodeMixin, LayoutMixin, BlendMixin {
  type: 'text';

  // --- 기존 속성 (보존) ---

  /** 텍스트 내용. Figma TextNode.characters 매핑. */
  content: string;

  /** 폰트 크기 (월드 단위). Figma TextNode.fontSize 매핑. */
  fontSize: number;

  /** 오브젝트별 스케일 팩터. NNType 전용 (Figma에 없음). */
  scale: number;

  /** AI 생성 텍스트 여부. NNType 전용. */
  isAIResponse?: boolean;

  /**
   * 텍스트 색상 (CSS 문자열). Figma 호환을 위해 fills 사용 권장.
   * @deprecated fills에 SolidPaint를 사용하세요.
   */
  color?: string;

  /** 채널/메타데이터 시스템. */
  _metadata?: NodeMetadata;

  // --- 새 Figma 호환 텍스트 속성 (모두 optional) ---

  /** 폰트 패밀리. 기본값: 'JetBrains Mono'. */
  fontFamily?: string;

  /** 폰트 두께 (100-900). 기본값: 400. */
  fontWeight?: FontWeight;

  /** 폰트 스타일. 기본값: 'normal'. */
  fontStyle?: 'normal' | 'italic';

  /** 수평 텍스트 정렬. 기본값: 'LEFT'. */
  textAlignHorizontal?: TextAlignHorizontal;

  /** 수직 텍스트 정렬. 기본값: 'TOP'. */
  textAlignVertical?: TextAlignVertical;

  /** 텍스트 자동 리사이즈. 기본값: 'WIDTH_AND_HEIGHT'. */
  textAutoResize?: TextAutoResize;

  /** 행간 설정. */
  lineHeight?: LineHeight;

  /** 자간 설정. */
  letterSpacing?: LetterSpacing;

  /** 텍스트 데코레이션. */
  textDecoration?: TextDecoration;

  /** Fill 페인트. 설정 시 color보다 우선. */
  fills?: Paint[];

  /** Stroke 페인트 (텍스트 외곽선). */
  strokes?: Paint[];

  /** Stroke 두께 (텍스트 외곽선). */
  strokeWeight?: number;

  /** 시각 효과 (그림자, 블러). */
  effects?: Effect[];
}

// ============================================================
// IMAGE NODE
// ============================================================

/**
 * 이미지 스케일 모드.
 * Figma ImagePaint.scaleMode 매핑.
 */
export type ImageScaleMode = 'FILL' | 'FIT' | 'CROP' | 'TILE';

/**
 * 이미지 노드 -- 캔버스 위의 래스터 이미지.
 *
 * Figma에서 이미지는 RectangleNode + IMAGE 페인트 fill이지만,
 * NNType에서는 first-class 노드 타입으로 단순한 API를 제공.
 * Figma export 레이어에서 RectangleNode + ImagePaint로 매핑.
 *
 * Figma 매핑: RectangleNode with fills = [{ type: 'IMAGE', ... }]
 */
export interface ImageNode extends BaseNodeMixin, LayoutMixin, BlendMixin, GeometryMixin {
  type: 'image';

  /** 이미지 소스 URL, data URI, 또는 blob URL. */
  src: string;

  /** 바운딩박스 내 스케일 방식. 기본값: 'FILL'. */
  scaleMode?: ImageScaleMode;

  /** 접근성 대체 텍스트. Figma에는 없지만 필수. */
  alt?: string;

  /** 이미지 원본 너비 (px). 종횡비 계산용. */
  naturalWidth?: number;

  /** 이미지 원본 높이 (px). */
  naturalHeight?: number;

  /** 모서리 둥글기. */
  cornerRadius?: number;

  /** 오브젝트별 스케일 팩터. NNType 전용. */
  scale?: number;

  /** 채널/메타데이터 시스템. */
  _metadata?: NodeMetadata;
}

// ============================================================
// VIDEO NODE
// ============================================================

/**
 * 비디오 소스 유형 (임베드 전략 결정용).
 */
export type VideoSourceType = 'url' | 'youtube' | 'vimeo' | 'embed';

/**
 * 비디오 노드 -- 캔버스 위의 임베드 비디오.
 *
 * Figma에 직접 대응하는 노드 없음.
 * Export 시 RectangleNode + poster 이미지 fill + pluginData로 변환.
 *
 * Figma 매핑: RectangleNode + pluginData (비디오 메타데이터)
 */
export interface VideoNode extends BaseNodeMixin, LayoutMixin, BlendMixin {
  type: 'video';

  /** 비디오 소스 URL (직접 URL, YouTube, Vimeo, 임베드 URL). */
  src: string;

  /** 비디오 소스 유형. 기본값: 'url'. */
  sourceType?: VideoSourceType;

  /** 포스터/썸네일 이미지 URL (재생 전 표시). */
  poster?: string;

  /** 자동 재생 여부. 기본값: false. */
  autoplay?: boolean;

  /** 반복 재생 여부. 기본값: false. */
  loop?: boolean;

  /** 음소거 여부. 기본값: true (브라우저 자동재생 정책). */
  muted?: boolean;

  /** 플레이어 컨트롤 표시. 기본값: true. */
  controls?: boolean;

  /** 종횡비 (width/height, 예: 16/9 = 1.778). */
  aspectRatio?: number;

  /** 모서리 둥글기. */
  cornerRadius?: number;

  /** 오브젝트별 스케일 팩터. NNType 전용. */
  scale?: number;

  /** Fill 페인트 (비디오 뒤 배경/테두리). */
  fills?: Paint[];

  /** 시각 효과. */
  effects?: Effect[];

  /** 채널/메타데이터 시스템. */
  _metadata?: NodeMetadata;
}

// ============================================================
// GUIDE NODE (기존 GuideObject 확장)
// ============================================================

/**
 * 가이드 포맷 프리셋.
 */
export type GuideFormat =
  | 'a4'
  | 'a3'
  | 'letter'
  | 'legal'
  | 'screen'
  | 'iphone'
  | 'ipad'
  | 'custom';

/**
 * 가이드 노드 -- 페이지/화면 가이드 오버레이.
 *
 * 기존 GuideObject 확장. Figma 호환 시각 속성 추가.
 * width, height는 가이드에 필수이므로 LayoutMixin을 직접 사용하지 않고 선언.
 *
 * Figma 매핑: RectangleNode (점선 stroke, fill 없음)
 */
export interface GuideNode extends BaseNodeMixin, BlendMixin {
  type: 'guide';

  /** X 위치 (월드 좌표). */
  x: number;
  /** Y 위치 (월드 좌표). */
  y: number;
  /** 너비 (월드 단위). 가이드에 필수. */
  width: number;
  /** 높이 (월드 단위). 가이드에 필수. */
  height: number;
  /** 회전 각도. */
  rotation?: number;

  /** 가이드 포맷 프리셋. 기본값: 'a4'. */
  guideType?: GuideFormat;

  /** 가이드 위에 표시할 라벨. 기본값: guideType에서 파생. */
  label?: string;

  /** Fill 페인트. 기본값: 없음 (투명). */
  fills?: Paint[];

  /** Stroke 페인트. 기본값: 파란 점선. */
  strokes?: Paint[];

  /** Stroke 두께. 기본값: 2. */
  strokeWeight?: number;

  /** Stroke 대시 패턴 [dash, gap]. 기본값: [10, 5]. */
  strokeDashPattern?: number[];

  /** 시각 효과. */
  effects?: Effect[];

  /** 채널/메타데이터 시스템. */
  _metadata?: NodeMetadata;
}

// ============================================================
// LINK NODE (기존 LinkObject 확장)
// ============================================================

/**
 * 링크 시각 스타일.
 */
export type LinkStyle = 'arrow' | 'line' | 'dashed';

/**
 * 링크 끝점 사양 (향후 확장용).
 */
export interface LinkEndpoint {
  /** 연결된 노드 ID. */
  nodeId: NodeId;
  /** 노드 가장자리의 부착 위치. */
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center' | 'auto';
}

/**
 * 링크 노드 -- 두 캔버스 노드 간의 연결.
 *
 * 기존 LinkObject 확장. Figma ConnectorNode 컨셉 반영.
 *
 * Figma 매핑: ConnectorNode (FigJam) / LineNode (Figma Design)
 */
export interface LinkNode extends BaseNodeMixin, BlendMixin {
  type: 'link';

  /** 소스 노드 ID. */
  from: NodeId;

  /** 타겟 노드 ID. */
  to: NodeId;

  /** 링크 시각 스타일. 기본값: 'arrow'. */
  style: LinkStyle;

  /**
   * 링크 색상 (CSS 문자열). Figma 호환을 위해 strokes 사용 권장.
   * @deprecated strokes에 SolidPaint를 사용하세요.
   */
  color: string;

  /** Stroke 페인트. 설정 시 color보다 우선. */
  strokes?: Paint[];

  /** Stroke 두께. 기본값: 2. */
  strokeWeight?: number;

  /** 시작 끝점 상세 (향후 확장). */
  startEndpoint?: LinkEndpoint;

  /** 종료 끝점 상세 (향후 확장). */
  endEndpoint?: LinkEndpoint;

  /** 시각 효과. */
  effects?: Effect[];

  /** 채널/메타데이터 시스템. */
  _metadata?: NodeMetadata;
}

// ============================================================
// CANVAS NODE UNION
// ============================================================

/**
 * 모든 캔버스 노드 타입의 유니온.
 * `type` 필드로 판별.
 *
 * Image, Video 포함. 기존 3타입 유니온은 migration.ts의 CanvasObject 별칭 사용.
 */
export type CanvasNode =
  | TextNode
  | ImageNode
  | VideoNode
  | GuideNode
  | LinkNode;

/**
 * 가능한 노드 타입 판별값.
 */
export type CanvasNodeType = CanvasNode['type'];
