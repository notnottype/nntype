# nntype API Documentation

## Core Types & Interfaces

### TextObjectType
Represents a text object on the infinite canvas.

```typescript
interface TextObjectType {
  id: number;                    // Unique identifier
  type: 'text';                  // Object type discriminator
  content: string;               // Text content
  x: number;                     // World X coordinate (mm)
  y: number;                     // World Y coordinate (mm)
  scale: number;                 // Object scale factor
  fontSize: number;              // Font size in world units (mm)
  isAIResponse?: boolean;        // Flag for AI-generated content
  color?: string;                // Text color (CSS format)
}
```

### A4GuideObjectType
Represents an A4 page guide for writing reference.

```typescript
interface A4GuideObjectType {
  id: number;                    // Unique identifier
  type: 'a4guide';              // Object type discriminator
  x: number;                     // Top-left world X coordinate (mm)
  y: number;                     // Top-left world Y coordinate (mm)
  width: number;                 // Width in world units (mm)
  height: number;                // Height in world units (mm)
}
```

### CanvasState
Main application state interface.

```typescript
interface CanvasState {
  canvasObjects: CanvasObjectType[];    // All canvas objects
  currentTypingText: string;            // Current input text
  isComposing: boolean;                 // IME composition state
  isDragging: boolean;                  // Canvas pan state
  isDraggingText: boolean;              // Text object drag state
  dragStart: { x: number; y: number };  // Drag origin point
  scale: number;                        // Canvas zoom level
  isTyping: boolean;                    // Typewriter active state
  selectedObject: CanvasObjectType | null; // Currently selected object
  canvasOffset: { x: number; y: number };  // Pan offset
  theme: Theme;                         // UI theme ('light' | 'dark')
  baseFontSize: number;                 // Base font size (px)
  fontLoaded: boolean;                  // Font loading state
  pxPerMm: number;                      // Pixel density conversion
}
```

## Core Components

### InfiniteTypewriterCanvas
Main canvas component that orchestrates the entire application.

**Props**: None (root component)

**Key Features**:
- Infinite zoomable canvas
- Korean/English text input
- Multi-format export (PNG, SVG, JSON)
- Theme switching
- A4 guide system

### TypewriterInput
Text input component with Korean IME support.

**Props**:
```typescript
interface TypewriterInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onEscape: () => void;
  isVisible: boolean;
  position: { x: number; y: number };
  fontSize: number;
  fontLoaded: boolean;
  maxCharsPerLine: number;
  theme: Theme;
  isComposing: boolean;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
}
```

### Header
Application header with controls and menus.

**Props**:
```typescript
interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onToggleGrid: () => void;
  onToggleInfo: () => void;
  onToggleShortcuts: () => void;
  onToggleTheme: () => void;
  showGrid: boolean;
  showInfo: boolean;
  showShortcuts: boolean;
  theme: Theme;
}
```

## Utility Functions

### Coordinate Transformation

#### worldToScreen(worldX, worldY, scale, offset)
Converts world coordinates to screen coordinates.

```typescript
function worldToScreen(
  worldX: number,
  worldY: number,
  scale: number,
  offset: { x: number; y: number }
): { x: number; y: number }
```

#### screenToWorld(screenX, screenY, scale, offset)
Converts screen coordinates to world coordinates.

```typescript
function screenToWorld(
  screenX: number,
  screenY: number,
  scale: number,
  offset: { x: number; y: number }
): { x: number; y: number }
```

### Canvas Utilities

#### measureTextWidth(text, fontSize, canvas, fontLoaded)
Measures text width in pixels.

```typescript
function measureTextWidth(
  text: string,
  fontSize: number,
  canvas: HTMLCanvasElement | null,
  fontLoaded: boolean
): number
```

#### isPointInObject(obj, screenX, screenY, scale, worldToScreen, measureText)
Tests if a screen point intersects with a canvas object.

```typescript
function isPointInObject(
  obj: CanvasObjectType,
  screenX: number,
  screenY: number,
  scale: number,
  worldToScreen: (x: number, y: number) => { x: number; y: number },
  measureText: (text: string, fontSize: number) => number
): boolean
```

### Export Functions

#### createPNGExporter(canvas, objects, state)
Creates PNG export functionality.

```typescript
function createPNGExporter(
  canvas: HTMLCanvasElement,
  objects: CanvasObjectType[],
  state: CanvasState
): () => void
```

#### createSVGExporter(objects, state)
Creates SVG export functionality.

```typescript
function createSVGExporter(
  objects: CanvasObjectType[],
  state: CanvasState
): () => void
```

#### createJSONExporter(objects, state)
Creates JSON export functionality.

```typescript
function createJSONExporter(
  objects: CanvasObjectType[],
  state: CanvasState
): () => void
```

## Custom Hooks

### useCanvas
Main canvas hook managing state and interactions.

```typescript
function useCanvas(): {
  // State
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  scale: number;
  canvasOffset: { x: number; y: number };
  
  // Methods
  setCanvasObjects: (objects: CanvasObjectType[]) => void;
  addTextObject: (text: string, x: number, y: number) => void;
  deleteObject: (id: number) => void;
  zoomToLevel: (level: number) => void;
  resetCanvas: () => void;
}
```

### useCanvasRenderer
Canvas rendering hook.

```typescript
function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement>,
  state: CanvasState
): void
```

### useKeyboardEvents
Keyboard event handling hook.

```typescript
function useKeyboardEvents(props: UseKeyboardEventsProps): void
```

## Constants

### Zoom Levels
```typescript
const CANVAS_ZOOM_LEVELS = [
  0.1, 0.15, 0.2, 0.25, 0.33, 0.4, 0.5, 0.6, 0.75, 0.85, 
  1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10
];
```

### Font Size Levels
```typescript
const UI_FONT_SIZE_LEVELS_PX = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
  22, 24, 26, 28, 32, 36, 42, 48, 56, 64
];
```

### A4 Dimensions
```typescript
const A4_WIDTH_MM = 210;   // A4 width in millimeters
const A4_HEIGHT_MM = 297;  // A4 height in millimeters
const TEXT_BOX_WIDTH_MM = 160;  // Default text box width
```

## Theme System

### Theme Colors
```typescript
interface ThemeColors {
  background: string;    // Canvas background
  text: string;          // Text color
  grid: string;          // Grid line color
  selection: string;     // Selection highlight
  a4Guide: string;       // A4 guide color
  inputBg: string;       // Input background
  inputBorder: string;   // Input border
}
```

## AI Integration

### AIService
Service for GPT integration.

```typescript
class AIService {
  async askGPT(question: string, apiKey: string): Promise<string>;
  private formatQuestion(question: string): string;
  private parseResponse(response: any): string;
}
```

## Session Management

### Session Storage
```typescript
interface SessionData {
  canvasObjects: CanvasObjectType[];
  currentTypingText: string;
  scale: number;
  canvasOffset: { x: number; y: number };
  theme: Theme;
  showGrid: boolean;
  baseFontSize: number;
}

function saveSession(data: SessionData): void;
function loadSession(): SessionData | null;
function clearSession(): void;
```

## Event Handling

### Keyboard Shortcuts
- `Ctrl/Cmd + +/-`: Zoom in/out
- `Ctrl/Cmd + 0`: Reset zoom to 100%
- `Alt + +/-`: Increase/decrease UI font size
- `Shift + Arrow Keys`: Pan canvas
- `Delete`: Delete selected object
- `Escape`: Close menus/deselect
- `Space`: Pan mode (hold)

### Mouse/Touch Events
- **Click**: Select object
- **Double-click**: Edit text object
- **Drag**: Pan canvas or move objects
- **Scroll**: Zoom in/out
- **Right-click**: Context menu (future feature)
