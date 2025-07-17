---
name: Excalidraw Component Usage Discussion
about: Discuss using Excalidraw components in ExcaliType
title: "[FEATURE] Excalidraw Component Integration"
labels: enhancement, discussion
assignees: ''

---

## Summary
Discussing the integration of Excalidraw components into ExcaliType to enhance the infinite canvas experience.

## Current Implementation
ExcaliType currently features:
- **Infinite Typewriter Canvas** (`src/components/InfiniteTypewriterCanvas.tsx`)
- **Text Box Management** - Dynamic text objects with positioning and styling
- **Canvas Interactions** - Pan, zoom, and grid snap functionality
- **Export Capabilities** - Vector (SVG), raster (PNG), and JSON export
- **Korean Font Support** - Monospaced Korean fonts (D2Coding)
- **Theme Support** - Dark/Light mode switching

## Proposed Excalidraw Integration

### Benefits
- [ ] Enhanced drawing capabilities alongside text
- [ ] Better shape and diagram support
- [ ] Improved collaboration features
- [ ] Rich annotation tools
- [ ] Seamless integration with existing canvas

### Technical Considerations
- [ ] Component compatibility with current React architecture
- [ ] Canvas coordinate system alignment
- [ ] Export format standardization
- [ ] Performance impact on infinite canvas
- [ ] Korean text input compatibility

### Implementation Areas
1. **Canvas Layer Integration**
   - Overlay Excalidraw canvas with existing text canvas
   - Coordinate system synchronization
   - Event handling priority

2. **Export System Enhancement**
   - Combined SVG/PNG export with text and drawings
   - JSON format extension for mixed content
   - Maintain existing export functionality

3. **UI/UX Integration**
   - Unified toolbar for text and drawing tools
   - Mode switching (text/draw)
   - Consistent keyboard shortcuts

### Current Canvas Architecture
```
InfiniteTypewriterCanvas
├── Canvas context and state management
├── Text box rendering and manipulation
├── Grid system and snap functionality
├── Pan/zoom transformations
├── Export functionality
└── Keyboard/mouse event handling
```

## Questions for Discussion
1. Should Excalidraw be integrated as a separate layer or unified canvas?
2. How to handle text input priority when both systems are active?
3. Export format preferences for mixed content?
4. Performance considerations for large documents?

## Related Files
- `src/components/InfiniteTypewriterCanvas.tsx` - Main canvas component
- `src/hooks/useCanvas.ts` - Canvas state management
- `src/utils/export.ts` - Export functionality
- `src/types/canvas.ts` - Canvas type definitions

## Acceptance Criteria
- [ ] Excalidraw components successfully integrated
- [ ] Existing text functionality preserved
- [ ] Export system supports mixed content
- [ ] Performance remains acceptable
- [ ] Korean text input unaffected
- [ ] Documentation updated