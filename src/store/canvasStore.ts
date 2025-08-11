import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  TextObject, 
  GuideObject, 
  LinkObject,
  CanvasObject,
  CanvasMode,
  Theme,
  PinPosition,
  SelectionState,
  LinkState,
  SelectionRectangle
} from '../types';

interface CanvasStore {
  // === Canvas Objects ===
  canvasObjects: CanvasObject[];
  selectedObjectIds: Set<number | string>;
  selectedObjects: CanvasObject[];
  links: LinkObject[];
  
  // === Viewport & Transform ===
  canvasOffset: { x: number; y: number };
  scale: number;
  pxPerMm: number;
  
  // === Typewriter Position ===
  typewriterX: number;
  typewriterY: number;
  getTextBoxWidth: (() => number) | null;
  
  // === Mode System ===
  currentMode: CanvasMode;
  previousMode: CanvasMode | null;
  
  // === UI State ===
  theme: Theme;
  showGrid: boolean;
  showInfo: boolean;
  showShortcuts: boolean;
  showTextBox: boolean;
  isDarkMode: boolean;
  
  // === Typography State ===
  currentTypingText: string;
  isComposing: boolean;
  isTyping: boolean;
  baseFontSize: number;
  fontLoaded: boolean;
  pinPosition: PinPosition;
  maxCharsPerLine: number;
  baseFontSizePt: number;
  
  // === Interaction State ===
  isDragging: boolean;
  isDraggingText: boolean;
  dragStart: { x: number; y: number };
  isSpacePressed: boolean;
  
  // === Selection State ===
  isSelecting: boolean;
  selectionRect: SelectionRectangle | null;
  selectionState: SelectionState;
  
  // === Link State ===
  linkState: LinkState;
  
  // === Canvas Dimensions ===
  canvasWidth: number;
  canvasHeight: number;
  
  // === Export State ===
  isExportMenuOpen: boolean;
  
  // === Hover & Focus State ===
  hoveredObject: CanvasObject | null;
  hoveredLink: LinkObject | null;
  pinHoveredObject: CanvasObject | null;
  selectedLinks: Set<string>;
  
  // === Undo/Redo State ===
  undoStack: any[];
  redoStack: any[];
  
  // === Actions ===
  // Canvas Object Actions
  addTextObject: (obj: TextObject) => void;
  addGuideObject: (obj: GuideObject) => void;
  updateCanvasObject: (id: number | string, updates: Partial<CanvasObject>) => void;
  deleteCanvasObject: (id: number | string) => void;
  setCanvasObjects: (objects: CanvasObject[]) => void;
  
  // Selection Actions
  selectObject: (id: number | string) => void;
  deselectObject: (id: number | string) => void;
  selectMultipleObjects: (ids: (number | string)[]) => void;
  clearSelection: () => void;
  setSelectedObjects: (objects: CanvasObject[]) => void;
  
  // Viewport Actions
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setScale: (scale: number) => void;
  setPxPerMm: (pxPerMm: number) => void;
  updateViewport: (offset: { x: number; y: number }, scale: number) => void;
  
  // Typewriter Actions
  setTypewriterPosition: (x: number, y: number) => void;
  setGetTextBoxWidth: (fn: (() => number) | null) => void;
  
  // Mode Actions
  setCurrentMode: (mode: CanvasMode) => void;
  switchMode: (mode: CanvasMode) => void;
  
  // UI Actions
  toggleTheme: () => void;
  toggleGrid: () => void;
  toggleInfo: () => void;
  toggleShortcuts: () => void;
  toggleTextBox: () => void;
  setShowTextBox: (show: boolean) => void;
  
  // Typography Actions
  setCurrentTypingText: (text: string) => void;
  setIsComposing: (composing: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  setFontLoaded: (loaded: boolean) => void;
  setPinPosition: (position: PinPosition) => void;
  setMaxCharsPerLine: (chars: number) => void;
  setBaseFontSize: (size: number) => void;
  setBaseFontSizePt: (size: number) => void;
  
  // Interaction Actions
  setIsDragging: (dragging: boolean) => void;
  setIsDraggingText: (dragging: boolean) => void;
  setDragStart: (point: { x: number; y: number }) => void;
  setIsSpacePressed: (pressed: boolean) => void;
  
  // Selection Actions
  setIsSelecting: (selecting: boolean) => void;
  setSelectionRect: (rect: SelectionRectangle | null) => void;
  setSelectionState: (state: Partial<SelectionState>) => void;
  
  // Link Actions
  setLinkState: (state: Partial<LinkState>) => void;
  addLink: (link: LinkObject) => void;
  deleteLink: (id: string) => void;
  
  // Canvas Actions
  setCanvasSize: (width: number, height: number) => void;
  
  // Export Actions
  setIsExportMenuOpen: (open: boolean) => void;
  
  // Hover & Focus Actions
  setHoveredObject: (object: CanvasObject | null) => void;
  setHoveredLink: (link: LinkObject | null) => void;
  setPinHoveredObject: (object: CanvasObject | null) => void;
  setSelectedLinks: (links: Set<string>) => void;
  
  // Undo/Redo Actions
  pushToUndoStack: (snapshot: any) => void;
  pushToRedoStack: (snapshot: any) => void;
  clearUndoStack: () => void;
  clearRedoStack: () => void;
  
  // Utility Actions
  resetCanvas: () => void;
  loadFromJSON: (data: any) => void;
}

const useCanvasStore = create<CanvasStore>()(
  devtools(
    (set, get) => ({
      // === Initial State ===
      canvasObjects: [],
      selectedObjectIds: new Set(),
      selectedObjects: [],
      links: [],
      
      canvasOffset: { x: 0, y: 0 },
      scale: 1,
      pxPerMm: 3.7795275591,
      
      typewriterX: 0,
      typewriterY: 0,
      getTextBoxWidth: null,
      
      currentMode: CanvasMode.TYPOGRAPHY,
      previousMode: null,
      
      theme: 'light' as Theme,
      showGrid: true,
      showInfo: true,
      showShortcuts: false,
      showTextBox: true,
      isDarkMode: false,
      
      currentTypingText: '',
      isComposing: false,
      isTyping: false,
      baseFontSize: 16,
      fontLoaded: false,
      pinPosition: { x: 0, y: 0, worldX: 0, worldY: 0 },
      maxCharsPerLine: 60,
      baseFontSizePt: 12,
      
      isDragging: false,
      isDraggingText: false,
      dragStart: { x: 0, y: 0 },
      isSpacePressed: false,
      
      isSelecting: false,
      selectionRect: null,
      selectionState: {
        selectedObjects: new Set(),
        dragArea: null
      },
      
      linkState: {
        sourceObjectId: null,
        targetObjectId: null,
        isCreating: false,
        previewPath: null
      },
      
      canvasWidth: 0,
      canvasHeight: 0,
      
      isExportMenuOpen: false,
      
      // Hover & Focus State
      hoveredObject: null,
      hoveredLink: null,
      pinHoveredObject: null,
      selectedLinks: new Set<string>(),
      
      // Undo/Redo State
      undoStack: [],
      redoStack: [],
      
      // === Actions Implementation ===
      
      // Canvas Object Actions
      addTextObject: (obj) => set((state) => ({
        canvasObjects: [...state.canvasObjects, obj]
      })),
      
      addGuideObject: (obj) => set((state) => ({
        canvasObjects: [...state.canvasObjects, obj]
      })),
      
      updateCanvasObject: (id, updates) => set((state) => ({
        canvasObjects: state.canvasObjects.map(obj =>
          obj.id === id ? { ...obj, ...updates } : obj
        )
      })),
      
      deleteCanvasObject: (id) => set((state) => ({
        canvasObjects: state.canvasObjects.filter(obj => obj.id !== id),
        selectedObjectIds: new Set([...state.selectedObjectIds].filter(objId => objId !== id)),
        selectedObjects: state.selectedObjects.filter(obj => obj.id !== id)
      })),
      
      setCanvasObjects: (objects) => set({ canvasObjects: objects }),
      
      // Selection Actions
      selectObject: (id) => set((state) => {
        const newIds = new Set(state.selectedObjectIds);
        newIds.add(id);
        const selectedObjects = state.canvasObjects.filter(obj => newIds.has(obj.id));
        return { selectedObjectIds: newIds, selectedObjects };
      }),
      
      deselectObject: (id) => set((state) => {
        const newIds = new Set(state.selectedObjectIds);
        newIds.delete(id);
        const selectedObjects = state.canvasObjects.filter(obj => newIds.has(obj.id));
        return { selectedObjectIds: newIds, selectedObjects };
      }),
      
      selectMultipleObjects: (ids) => set((state) => {
        const newIds = new Set(ids);
        const selectedObjects = state.canvasObjects.filter(obj => newIds.has(obj.id));
        return { selectedObjectIds: newIds, selectedObjects };
      }),
      
      clearSelection: () => set({
        selectedObjectIds: new Set(),
        selectedObjects: []
      }),
      
      setSelectedObjects: (objects) => set({
        selectedObjects: objects,
        selectedObjectIds: new Set(objects.map(obj => obj.id))
      }),
      
      // Viewport Actions
      setCanvasOffset: (offset) => set({ canvasOffset: offset }),
      setScale: (scale) => set({ scale }),
      setPxPerMm: (pxPerMm) => set({ pxPerMm }),
      updateViewport: (offset, scale) => set({ canvasOffset: offset, scale }),
      
      // Typewriter Actions
      setTypewriterPosition: (x, y) => set({ typewriterX: x, typewriterY: y }),
      setGetTextBoxWidth: (fn) => set({ getTextBoxWidth: fn }),
      
      // Mode Actions
      setCurrentMode: (mode) => set({ currentMode: mode }),
      switchMode: (mode) => set((state) => ({
        currentMode: mode,
        previousMode: state.currentMode
      })),
      
      // UI Actions
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
        isDarkMode: !state.isDarkMode
      })),
      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
      toggleInfo: () => set((state) => ({ showInfo: !state.showInfo })),
      toggleShortcuts: () => set((state) => ({ showShortcuts: !state.showShortcuts })),
      toggleTextBox: () => set((state) => ({ showTextBox: !state.showTextBox })),
      setShowTextBox: (show) => set({ showTextBox: show }),
      
      // Typography Actions
      setCurrentTypingText: (text) => set({ currentTypingText: text }),
      setIsComposing: (composing) => set({ isComposing: composing }),
      setIsTyping: (typing) => set({ isTyping: typing }),
      setFontLoaded: (loaded) => set({ fontLoaded: loaded }),
      setPinPosition: (position) => set({ pinPosition: position }),
      setMaxCharsPerLine: (chars) => set({ maxCharsPerLine: chars }),
      setBaseFontSize: (size) => set({ baseFontSize: size }),
      setBaseFontSizePt: (size) => set({ baseFontSizePt: size }),
      
      // Interaction Actions
      setIsDragging: (dragging) => set({ isDragging: dragging }),
      setIsDraggingText: (dragging) => set({ isDraggingText: dragging }),
      setDragStart: (point) => set({ dragStart: point }),
      setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),
      
      // Selection Actions
      setIsSelecting: (selecting) => set({ isSelecting: selecting }),
      setSelectionRect: (rect) => set({ selectionRect: rect }),
      setSelectionState: (state) => set((prev) => ({
        selectionState: { ...prev.selectionState, ...state }
      })),
      
      // Link Actions
      setLinkState: (state) => set((prev) => ({
        linkState: { ...prev.linkState, ...state }
      })),
      addLink: (link) => set((state) => ({
        links: [...state.links, link]
      })),
      deleteLink: (id) => set((state) => ({
        links: state.links.filter(link => link.id !== id)
      })),
      
      // Canvas Actions
      setCanvasSize: (width, height) => set({
        canvasWidth: width,
        canvasHeight: height
      }),
      
      // Export Actions
      setIsExportMenuOpen: (open) => set({ isExportMenuOpen: open }),
      
      // Hover & Focus Actions
      setHoveredObject: (object) => set({ hoveredObject: object }),
      setHoveredLink: (link) => set({ hoveredLink: link }),
      setPinHoveredObject: (object) => set({ pinHoveredObject: object }),
      setSelectedLinks: (links) => set({ selectedLinks: links }),
      
      // Undo/Redo Actions
      pushToUndoStack: (snapshot) => set((state) => ({
        undoStack: [...state.undoStack, snapshot]
      })),
      pushToRedoStack: (snapshot) => set((state) => ({
        redoStack: [...state.redoStack, snapshot]
      })),
      clearUndoStack: () => set({ undoStack: [] }),
      clearRedoStack: () => set({ redoStack: [] }),
      
      // Utility Actions
      resetCanvas: () => set({
        canvasObjects: [],
        selectedObjectIds: new Set(),
        selectedObjects: [],
        links: [],
        canvasOffset: { x: 0, y: 0 },
        scale: 1,
        currentTypingText: '',
        isTyping: false
      }),
      
      loadFromJSON: (data) => {
        // Parse and load canvas state from JSON
        if (data.elements) {
          set({
            canvasObjects: data.elements,
            canvasOffset: data.appState?.canvasOffset || { x: 0, y: 0 },
            scale: data.appState?.scale || 1,
            showGrid: data.appState?.showGrid ?? true,
            showTextBox: data.appState?.showTextBox ?? true,
            theme: data.appState?.theme || 'light'
          });
        }
      }
    }),
    {
      name: 'canvas-store'
    }
  )
);

export default useCanvasStore;
