// src/types/canvas.ts
// 캔버스 애플리케이션 상태 타입.
// 기존 types/index.ts의 모든 인터페이스를 보존.

import type { NodeId } from './base.js';
import type { CanvasNode, LinkNode } from './nodes.js';

// --- 테마 ---

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  text: string;
  grid: string;
  selection: string;
  selectionBorder: string;
  hover: string;
  hoverBorder: string;
  a4Guide: string;
  inputBg: string;
  inputBorder: string;
}

// --- 선택 및 상호작용 ---

export interface SelectionRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum CanvasMode {
  TYPOGRAPHY = 'typography',
  LINK = 'link',
  SELECT = 'select',
}

export interface PinPosition {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
}

export interface SelectionState {
  selectedObjects: Set<string>;
  dragArea: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;
}

export interface LinkState {
  sourceObjectId: NodeId | null;
  targetObjectId: NodeId | null;
  isCreating: boolean;
  previewPath: { from: PinPosition; to: PinPosition } | null;
}

// --- 캔버스 상태 ---

export interface CanvasState {
  canvasObjects: CanvasNode[];
  currentTypingText: string;
  isComposing: boolean;
  isDragging: boolean;
  isDraggingText: boolean;
  dragStart: { x: number; y: number };
  scale: number;
  isTyping: boolean;
  selectedObject: CanvasNode | null;
  selectedObjects: CanvasNode[];
  isSelecting: boolean;
  selectionRect: SelectionRectangle | null;
  isExportMenuOpen: boolean;
  canvasWidth: number;
  canvasHeight: number;
  canvasOffset: { x: number; y: number };
  isSpacePressed: boolean;
  showGrid: boolean;
  showInfo: boolean;
  showShortcuts: boolean;
  showTextBox: boolean;
  theme: Theme;
  baseFontSize: number;
  fontLoaded: boolean;
  pxPerMm: number;
  // Multi-mode system
  currentMode: CanvasMode;
  previousMode: CanvasMode | null;
  pinPosition: PinPosition;
  selectionState: SelectionState;
  linkState: LinkState;
  links: LinkNode[];
}

// --- 내보내기 ---

export interface ExportData {
  /** 스키마 버전. 새 타입 시스템은 '2.0'. */
  version: string;
  type: string;
  elements: CanvasNode[];
  appState: {
    canvasOffset: { x: number; y: number };
    scale: number;
    typewriterPosition: { x: number; y: number };
    showGrid: boolean;
    showTextBox: boolean;
    theme: Theme;
  };
}

// --- AI ---

export interface AIState {
  isProcessing: boolean;
  error: string | null;
  lastResponse: string | null;
}

export interface AICommand {
  type: 'gpt';
  question: string;
}

// --- 채널 시스템 ---

export interface Channel {
  id: string;
  name: string;
  messageCount: number;
  lastActivity: string;
  type: 'default' | 'personal';
  color?: string;
}

export interface ChannelMessage {
  id: string;
  textObjectId: NodeId;
  channelIds: string[];
  content: string;
  timestamp: string;
  isFromCanvas: boolean;
}

export interface ChannelState {
  channels: Map<string, Channel>;
  activeChannelId: string | null;
  channelMessages: Map<string, ChannelMessage[]>;
  unreadCounts: Map<string, number>;
  isPanelOpen: boolean;
}

// --- 세션 관리 ---

export interface SessionMetadata {
  id: string;
  createdAt: string;
  lastUpdated: string;
  version: string;
  title?: string;
  description?: string;
  userAgent?: string;
}

export interface SessionData {
  metadata: SessionMetadata;
  channels: Map<string, Channel>;
  messages: Map<string, ChannelMessage[]>;
  canvasObjects: CanvasNode[];
  links: LinkNode[];
  activeChannelId: string | null;
}

export interface SessionState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  metadata: SessionMetadata | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  lastSaved: Date | null;
}
