# excalitype Project Roadmap

## Project Overview

excalitype is an Infinite Canvas Typewriter that reimagines the writing experience by combining the limitless freedom of infinite canvas with intuitive text creation. This roadmap tracks development progress from the current implementation to a feature-rich creative writing tool.

## Current Status

- **Phase**: Early Implementation with Core Features Working
- **Technology Stack**: React 18, TypeScript, Vite, TailwindCSS, Canvas API

## Known Issues & Improvements Needed for Implemented Features

### Core Canvas Features (Requiring Updates)
- **A4 Guide System** - Scaling accuracy needs improvement at different zoom levels
- **Zoom Controls** - Performance optimization needed for high zoom levels
- **Font Size Controls** - Better integration with text scaling system needed

### User Interface Features (Requiring Updates)  
- **Keyboard Shortcuts** - Space key conflicts when typewriter is focused
- **Information Overlay** - More detailed canvas metrics and object information
- **Theme System** - Contrast improvements and custom theme options

### Export & File Management (Requiring Updates)
- **PNG Export** - Higher resolution export options needed
- **SVG Export** - Text positioning accuracy improvements needed
- **JSON Import** - Error handling and validation improvements needed

### Text System (Requiring Updates)
- **Text Selection** - Better visual feedback and selection state management
- **Korean Font Support** - Additional Korean fonts and character spacing optimization

## Feature Implementation Progress

### Core Canvas Features
- [x] **Infinite Canvas System** - Pan and zoom functionality
- [x] **Typewriter Interface** - Real-time text input on canvas
- [x] **A4 Guide System** - Visual page guides with proper scaling
- [x] **Grid Display** - Toggleable background grid
- [x] **Zoom Controls** - Multiple zoom levels (0.1x to 5x)
- [x] **Font Size Controls** - Variable font sizes (8pt to 64pt)

### User Interface Features
- [x] **Dark/Light Theme Toggle** - Complete theme system
- [x] **Keyboard Shortcuts** - Comprehensive shortcut system
- [x] **Information Overlay** - Canvas status and coordinates display
- [x] **Shortcuts Overlay** - Toggleable help display
- [x] **Text Box Toggle** - Show/hide typewriter input area

### Export & File Management
- [x] **PNG Export** - High-quality image export
- [x] **SVG Export** - Vector graphics export
- [x] **JSON Export** - Scene data export
- [x] **JSON Import** - Load and reconstruct saved scenes
- [ ] **PDF Export** - Export canvas as PDF document
- [ ] **PDF Import** - Import and convert PDF text content
- [ ] **Session Storage System** - Auto-save and persistence

### Text System
- [x] **Text Object Creation** - Place text anywhere on canvas
- [x] **Korean Font Support** - Monospaced Korean typography
- [x] **Text Selection** - Click to select text objects
- [x] **Text Deletion** - Remove selected text objects
- [ ] **Text Editing** - Inline text modification
- [ ] **Text Drag & Drop** - Reposition text objects
- [ ] **Multi-text Selection** - Select multiple objects with Ctrl/Cmd+click
- [ ] **Selection Box** - Drag to select multiple objects
- [ ] **Object Grouping** - Group selected objects together
- [ ] **Object Merging** - Combine multiple text objects into one
- [ ] **Object Linking** - Create connections between text objects
- [ ] **Object Alignment** - Align multiple selected objects
- [ ] **Bulk Operations** - Apply changes to multiple selected objects

### Clipboard & Text Formatting
- [ ] **Clipboard Paste** - Paste text from clipboard with formatting preservation
- [ ] **Clipboard Copy** - Copy selected text objects to clipboard
- [ ] **Rich Text Paste** - Handle formatted text from external sources
- [ ] **Plain Text Mode** - Strip formatting when pasting
- [ ] **Markdown Support** - Live markdown rendering and editing
- [ ] **Markdown Export** - Export text objects as markdown
- [ ] **Text Styling** - Bold, italic, underline, strikethrough
- [ ] **Font Customization** - Custom fonts, sizes, colors
- [ ] **Text Formatting Toolbar** - Visual formatting controls

### Layout & Alignment
- [ ] **Text Alignment** - Left, center, right, justify alignment within text objects
- [ ] **Object Alignment** - Align multiple objects (left, center, right, top, middle, bottom)
- [ ] **Smart Guides** - Show alignment guides when moving objects
- [ ] **Snap to Grid** - Snap objects to grid points for precise positioning
- [ ] **Snap to Objects** - Snap to other objects' edges and centers
- [ ] **Auto Layout** - Automatic spacing and arrangement of objects
- [ ] **Distribution Tools** - Evenly distribute objects horizontally/vertically
- [ ] **Margin & Padding** - Set consistent spacing around text objects
- [ ] **Layout Templates** - Pre-defined layout arrangements
- [ ] **Responsive Layout** - Auto-adjust layout based on canvas size

### Accessibility & Responsiveness
- [ ] **Mobile Touch Support** - Touch event handling
- [ ] **Mobile Keyboard** - Mobile input optimization
- [ ] **Responsive Design** - Multi-screen support
- [ ] **Pinch Zoom** - Touch zoom gestures

### Advanced Features
- [ ] **URL Scene Sharing** - Share scenes via URL parameters
- [ ] **Excalidraw Export** - Export scenes to Excalidraw format
- [ ] **Excalidraw Component Integration** - Embed drawing elements using Excalidraw components
- [ ] **Hybrid Canvas Mode** - Text and drawing elements in unified workspace
- [ ] **Real-time Collaboration** - Multi-user editing

## 🚀 Development Priorities
*Based on July 18, 2025*

### Immediate (August 2025)
- [ ] Fix space key event conflicts when typewriter is focused
- [ ] Implement session storage and auto-save
- [ ] Add text editing capability for existing text objects
- [ ] Improve A4 guide scaling accuracy

### Short Term (September - October 2025)
- [ ] Add text drag & drop positioning
- [ ] Multi-text selection (Ctrl+click and selection box)
- [ ] Basic object alignment (left, center, right, top, middle, bottom)
- [ ] Text alignment within objects (left, center, right)
- [ ] Basic clipboard copy/paste functionality
- [ ] Snap to grid functionality
- [ ] Basic mobile touch support
- [ ] PDF export functionality

### Medium Term (November 2025 - January 2026)
- [ ] Object merging and linking system
- [ ] Bulk operations for multiple objects
- [ ] Smart guides and snap to objects
- [ ] Auto layout and distribution tools
- [ ] Advanced alignment features (margin, padding)
- [ ] Rich text formatting and markdown support
- [ ] PDF import and text extraction
- [ ] Advanced clipboard handling (rich text, formatting)
- [ ] Full responsive design implementation
- [ ] URL parameter scene reconstruction
- [ ] Excalidraw component integration for drawing elements
- [ ] Hybrid canvas mode (text + drawing)

### Long Term (February 2026+)
- [ ] Layout templates and presets
- [ ] Responsive auto-layout system
- [ ] Real-time collaboration system
- [ ] Plugin architecture
- [ ] Advanced export formats
- [ ] Team workspace features

## 🔧 Technical Debt & Quality

### Code Quality
- [ ] Add comprehensive unit tests
- [ ] Implement integration tests
- [ ] Performance optimization
- [ ] Code documentation improvement
- [ ] TypeScript strict mode compliance

### Development Tools
- [ ] ESLint configuration
- [ ] Prettier code formatting
- [ ] Husky pre-commit hooks
- [ ] CI/CD pipeline setup
- [ ] Automated testing workflow

---

*Last Updated: July 18, 2025*
*Next Review: August 1, 2025*임
