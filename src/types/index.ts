export interface TextObject {
  id: number;
  type: 'text';
  content: string;
  x: number;
  y: number;
  scale: number;
  fontSize: number; // 월드 단위 폰트 크기
  isAIResponse?: boolean; // AI 답변 여부
  color?: string; // 텍스트 색상
}

export interface GuideObject {
  id: number;
  type: 'guide';
  guideType?: 'a4' | 'letter' | 'legal' | 'a3' | 'screen' | 'iphone' | 'ipad'; // Guide format
  x: number; // 좌상단 월드 좌표
  y: number;
  width: number; // 월드 단위 크기
  height: number;
}

export interface LinkObject {
  id: string;
  type: 'link';
  from: string; // source text object ID
  to: string;   // target text object ID
  style: 'arrow' | 'line' | 'dashed';
  color: string;
}

export type CanvasObject = TextObject | GuideObject | LinkObject;

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

export interface SelectionRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum CanvasMode {
  TYPOGRAPHY = 'typography',
  LINK = 'link',
  SELECT = 'select'
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
  sourceObjectId: string | null;
  targetObjectId: string | null;
  isCreating: boolean;
  previewPath: { from: PinPosition; to: PinPosition } | null;
}

export interface CanvasState {
  canvasObjects: CanvasObject[];
  currentTypingText: string;
  isComposing: boolean;
  isDragging: boolean;
  isDraggingText: boolean;
  dragStart: { x: number; y: number };
  scale: number;
  isTyping: boolean;
  selectedObject: CanvasObject | null;
  selectedObjects: CanvasObject[];
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
  links: LinkObject[];
}

export interface ExportData {
  version: string;
  type: string;
  elements: CanvasObject[];
  appState: {
    canvasOffset: { x: number; y: number };
    scale: number;
    typewriterPosition: { x: number; y: number };
    showGrid: boolean;
    showTextBox: boolean;
    theme: Theme;
  };
}

export interface AIState {
  isProcessing: boolean;
  error: string | null;
  lastResponse: string | null;
}

export interface AICommand {
  type: 'gpt';
  question: string;
}