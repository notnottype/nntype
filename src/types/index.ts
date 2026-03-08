// src/types/index.ts
// Barrel re-export: 모든 서브모듈의 타입을 내보냄.
// 기존 `from '../types'` import 경로 유지.

// --- 기본 시스템 ---
export type { NodeId, Vector2D, BlendMode, NodeMetadata } from './base.js';
export { generateNodeId } from './base.js';
export type { BaseNodeMixin, LayoutMixin, BlendMixin, GeometryMixin } from './base.js';

// --- 페인트 시스템 ---
export type {
  RGBA, RGB, ColorStop,
  SolidPaint, LinearGradientPaint, RadialGradientPaint, ImagePaint,
  Paint, GradientPaint,
} from './paint.js';

// --- 이펙트 시스템 ---
export type {
  DropShadowEffect, InnerShadowEffect, LayerBlurEffect, BackgroundBlurEffect,
  Effect,
} from './effects.js';

// --- 노드 타입 ---
export type {
  TextAlignHorizontal, TextAlignVertical, TextAutoResize,
  TextDecoration, FontWeight, LineHeight, LetterSpacing,
  TextNode,
  ImageScaleMode, ImageNode,
  VideoSourceType, VideoNode,
  GuideFormat, GuideNode,
  LinkStyle, LinkEndpoint, LinkNode,
  CanvasNode, CanvasNodeType,
} from './nodes.js';

// --- 캔버스 상태 ---
export type {
  Theme, ThemeColors, SelectionRectangle,
  PinPosition, SelectionState, LinkState, CanvasState,
  ExportData, AIState, AICommand,
  Channel, ChannelMessage, ChannelState,
  SessionMetadata, SessionData, SessionState,
} from './canvas.js';
export { CanvasMode } from './canvas.js';

// --- Figma export ---
export type {
  FigmaColor, FigmaRGBA,
  FigmaSolidPaint, FigmaGradientPaint, FigmaImagePaint, FigmaPaint,
  FigmaDropShadowEffect, FigmaInnerShadowEffect, FigmaBlurEffect, FigmaEffect,
  FigmaBaseNode, FigmaTextNode, FigmaRectangleNode, FigmaConnectorNode,
  FigmaNode, FigmaExportDocument, NodeTypeMapping,
} from './figma-export.js';

// --- 하위 호환 별칭 ---
export type {
  TextObject, GuideObject, A4GuideObjectType, LinkObject, CanvasObject,
  LegacyId, LegacyTextObject, LegacyGuideObject, LegacyLinkObject, LegacyCanvasObject,
} from './migration.js';
export {
  TYPE_SYSTEM_VERSION, LEGACY_TYPE_SYSTEM_VERSION,
  migrateId, isLegacyObject, migrateCanvasObject, migrateCanvasObjects, isLegacySchema,
} from './migration.js';
