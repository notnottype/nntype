// src/types/migration.ts
// 하위 호환 별칭 및 마이그레이션 유틸리티.
// 기존 코드의 import 경로를 깨뜨리지 않고 새 타입 시스템으로 전환.

import type { TextNode, GuideNode, LinkNode, CanvasNode } from './nodes.js';
import type { NodeId } from './base.js';

// ============================================================
// 버전 상수
// ============================================================

/** 현재 타입 시스템 스키마 버전. */
export const TYPE_SYSTEM_VERSION = '2.0.0';

/** 이전 타입 시스템 스키마 버전 (마이그레이션 감지용). */
export const LEGACY_TYPE_SYSTEM_VERSION = '1.0.0';

// ============================================================
// 레거시 타입 별칭
// ============================================================

/**
 * @deprecated TextNode을 사용하세요. 하위 호환용 별칭.
 * 유일한 breaking change: id 타입이 number에서 string으로 변경.
 */
export type TextObject = TextNode;

/**
 * @deprecated GuideNode을 사용하세요. 하위 호환용 별칭.
 */
export type GuideObject = GuideNode;

/**
 * 기존 A4GuideObjectType 별칭.
 * @deprecated GuideNode을 사용하세요.
 */
export type A4GuideObjectType = GuideNode;

/**
 * @deprecated LinkNode을 사용하세요. 하위 호환용 별칭.
 */
export type LinkObject = LinkNode;

/**
 * @deprecated CanvasNode을 사용하세요.
 * 기존 3타입 유니온 보존. CanvasNode은 ImageNode, VideoNode도 포함.
 */
export type CanvasObject = TextNode | GuideNode | LinkNode;

// ============================================================
// 레거시 ID 처리
// ============================================================

/**
 * 마이그레이션 기간 동안 양 형식을 수용하는 유니온 타입.
 */
export type LegacyId = number | string;

/**
 * 레거시 숫자 ID를 새 문자열 형식으로 변환.
 */
export function migrateId(id: LegacyId): NodeId {
  return String(id);
}

// ============================================================
// 레거시 데이터 구조 (역직렬화용)
// ============================================================

/**
 * 숫자 ID를 가진 원본 TextObject.
 * 마이그레이션 함수에서 저장된 데이터 파싱에 사용.
 */
export interface LegacyTextObject {
  id: number;
  type: 'text';
  content: string;
  x: number;
  y: number;
  scale: number;
  fontSize: number;
  isAIResponse?: boolean;
  color?: string;
  _metadata?: {
    createdAt: string;
    updatedAt: string;
    channelIds: string[];
  };
}

/**
 * 숫자 ID를 가진 원본 GuideObject.
 */
export interface LegacyGuideObject {
  id: number;
  type: 'guide';
  guideType?: 'a4' | 'letter' | 'legal' | 'a3' | 'screen' | 'iphone' | 'ipad';
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 원본 LinkObject (이미 string ID 사용).
 */
export interface LegacyLinkObject {
  id: string;
  type: 'link';
  from: string;
  to: string;
  style: 'arrow' | 'line' | 'dashed';
  color: string;
}

/** 모든 레거시 캔버스 오브젝트 유니온. */
export type LegacyCanvasObject = LegacyTextObject | LegacyGuideObject | LegacyLinkObject;

// ============================================================
// 마이그레이션 함수
// ============================================================

/**
 * 타입 가드: 레거시 숫자 ID를 가진 오브젝트인지 확인.
 */
export function isLegacyObject(obj: unknown): obj is { id: number; type: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as Record<string, unknown>).id === 'number'
  );
}

/**
 * 단일 레거시 캔버스 오브젝트를 새 포맷으로 마이그레이션.
 * 숫자 ID를 문자열로 변환, 나머지 속성 보존.
 */
export function migrateCanvasObject(legacy: LegacyCanvasObject): CanvasNode {
  if (legacy.type === 'text') {
    return { ...legacy, id: String(legacy.id) } as TextNode;
  }
  if (legacy.type === 'guide') {
    return { ...legacy, id: String(legacy.id) } as GuideNode;
  }
  // LinkObject는 이미 string ID
  return legacy as unknown as CanvasNode;
}

/**
 * 레거시 캔버스 오브젝트 배열 마이그레이션.
 */
export function migrateCanvasObjects(legacyObjects: LegacyCanvasObject[]): CanvasNode[] {
  return legacyObjects.map(migrateCanvasObject);
}

/**
 * 직렬화된 데이터가 레거시 스키마를 사용하는지 감지.
 */
export function isLegacySchema(data: { elements?: unknown[] }): boolean {
  if (!data.elements || data.elements.length === 0) return false;
  return data.elements.some(
    (el) => typeof el === 'object' && el !== null && 'id' in el && typeof (el as Record<string, unknown>).id === 'number'
  );
}
