# nntype Project Structure

## Overview
nntype is a React-based infinite canvas typewriter application with TypeScript, built using Vite for optimal development experience and performance.

## Directory Structure

```
nntype-1/
├── public/                     # Static assets
│   ├── nntype.png         # Logo image
│   ├── nntype-demo.gif    # Demo animation
│   └── favicon.svg            # Site favicon
├── src/                       # Source code
│   ├── main.tsx              # Application entry point
│   ├── index.css             # Global styles
│   ├── components/           # React components
│   │   ├── index.ts          # Component exports
│   │   ├── InfiniteTypewriterCanvas.tsx  # Main canvas component (1,793 lines)
│   │   ├── Header.tsx        # Application header
│   │   ├── TypewriterInput.tsx  # Text input component
│   │   ├── CanvasContainer.tsx  # Canvas wrapper
│   │   ├── CanvasInfoOverlay.tsx  # Info overlay
│   │   ├── ExportMenu.tsx    # Export options menu
│   │   ├── ApiKeyInput.tsx   # AI API key input
│   │   ├── ShortcutsOverlay.tsx  # Keyboard shortcuts help
│   │   ├── StatusMessages.tsx   # Status notifications
│   │   ├── ZoomControls.tsx  # Zoom control buttons
│   │   └── ui/               # Reusable UI components
│   │       ├── Button.tsx    # Custom button component
│   │       └── DropdownMenu.tsx  # Dropdown menu component
│   ├── hooks/                # Custom React hooks
│   │   ├── useCanvas.ts      # Canvas state management (178 lines)
│   │   ├── useCanvasRenderer.ts  # Canvas rendering logic (134 lines)
│   │   └── useKeyboardEvents.ts  # Keyboard event handling (157 lines)
│   ├── utils/                # Utility functions
│   │   ├── index.ts          # Main utilities export (229 lines)
│   │   ├── canvasUtils.ts    # Canvas-specific utilities (155 lines)
│   │   ├── coordinateUtils.ts   # Coordinate transformations (84 lines)
│   │   ├── exportHandlers.ts    # Export functionality (165 lines)
│   │   ├── exportUtils.ts    # Export utilities (123 lines)
│   │   ├── svgUtils.ts       # SVG generation utilities (121 lines)
│   │   ├── fontUtils.ts      # Font management (55 lines)
│   │   ├── sessionStorage.ts    # Session persistence (112 lines)
│   │   └── units.ts          # Unit conversion utilities (51 lines)
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # All type definitions (83 lines)
│   ├── constants/            # Application constants
│   │   └── index.ts          # Constants and configuration (50 lines)
│   ├── services/             # External services
│   │   └── aiService.ts      # AI/GPT integration (136 lines)
│   ├── lib/                  # Third-party utilities
│   │   └── utils.ts          # Utility helpers (5 lines)
│   ├── global.d.ts           # Global type declarations
│   └── vite-env.d.ts         # Vite environment types
├── docs/                     # Documentation (newly created)
│   ├── API.md                # API documentation
│   └── PROJECT_STRUCTURE.md  # This file
├── dist/                     # Build output (generated)
├── node_modules/             # Dependencies
├── CLAUDE.md                 # Claude Code guidance
├── README.md                 # Project README
├── README.ko.md              # Korean README
├── LICENSE                   # GPL-3.0 license
├── package.json              # Project configuration
├── package-lock.json         # Dependency lock file
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── tailwind.config.js        # TailwindCSS configuration
├── postcss.config.js         # PostCSS configuration
└── index.html                # HTML entry point
```

## Core Architecture

### Component Hierarchy
```
App (main.tsx)
└── InfiniteTypewriterCanvas (main component)
    ├── Header
    │   ├── ExportMenu
    │   └── ZoomControls
    ├── CanvasContainer
    │   └── <canvas> (HTML5 Canvas)
    ├── TypewriterInput
    ├── CanvasInfoOverlay
    ├── ShortcutsOverlay
    ├── StatusMessages
    └── ApiKeyInput
```

### Data Flow
```
User Input → TypewriterInput → InfiniteTypewriterCanvas → Canvas Rendering
     ↓              ↓                     ↓                      ↓
Keyboard Events → useKeyboardEvents → State Updates → useCanvasRenderer
     ↓              ↓                     ↓                      ↓
Canvas Events → useCanvas → canvasObjects → Session Storage
```

### State Management
- **Primary State**: `InfiniteTypewriterCanvas.tsx` (root component)
- **Canvas State**: Managed by `useCanvas` hook
- **Rendering**: Handled by `useCanvasRenderer` hook
- **Persistence**: Session storage for state recovery

## Key Files Deep Dive

### InfiniteTypewriterCanvas.tsx (1,793 lines)
**Purpose**: Main orchestrator component
**Responsibilities**:
- Canvas state management
- Event coordination
- Component composition
- Session persistence
- Theme management

**Key Sections**:
- Lines 1-80: Header and imports
- Lines 81-200: State initialization
- Lines 201-500: Effect hooks and event handlers
- Lines 501-1000: Canvas manipulation functions
- Lines 1001-1500: Export/import functionality
- Lines 1501-1793: Render method and JSX

### useCanvas.ts (178 lines)
**Purpose**: Canvas state and interaction management
**Key Functions**:
- `handleMouseDown/Move/Up`: Mouse event handling
- `addTextObject`: Add new text to canvas
- `deleteObject`: Remove objects from canvas
- `zoomToLevel`: Handle zoom operations

### useCanvasRenderer.ts (134 lines)
**Purpose**: Canvas drawing and rendering
**Key Functions**:
- `drawGrid`: Draw background grid
- `drawCanvasObjects`: Render all canvas objects
- `drawHoverHighlight`: Object selection feedback
- `setupCanvasHiDPI`: High-DPI display support

### utils/index.ts (229 lines)
**Purpose**: Core utility functions
**Key Functions**:
- `measureTextWidth`: Text dimension calculation
- `isPointInObject`: Hit detection
- `wrapTextToLines`: Text wrapping logic
- `calculateContentBoundingBox`: Viewport calculation

## Dependencies Analysis

### Production Dependencies
```json
{
  "@radix-ui/react-dialog": "^1.1.14",     // Modal dialogs
  "@radix-ui/react-dropdown-menu": "^2.1.15", // Dropdown menus
  "@radix-ui/react-tooltip": "^1.2.7",     // Tooltips
  "@vercel/analytics": "^1.5.0",           // Analytics
  "@vercel/speed-insights": "^1.2.0",      // Performance monitoring
  "axios": "^1.11.0",                      // HTTP client (AI API)
  "js-cookie": "^3.0.5",                   // Cookie management
  "lucide-react": "^0.525.0",              // Icon library
  "react": "^18.2.0",                      // Core framework
  "react-dom": "^18.2.0",                  // DOM rendering
  "clsx": "^2.1.1",                        // Conditional classes
  "class-variance-authority": "^0.7.1",    // Component variants
  "tailwind-merge": "^3.3.1"               // Tailwind utility merging
}
```

### Development Dependencies
```json
{
  "@types/react": "^18.2.0",               // React type definitions
  "@types/react-dom": "^18.2.0",           // React DOM types
  "@vitejs/plugin-react": "^4.6.0",        // Vite React plugin
  "autoprefixer": "^10.4.0",               // CSS vendor prefixes
  "postcss": "^8.4.0",                     // CSS processing
  "tailwindcss": "^3.3.0",                 // Utility-first CSS
  "typescript": "^5.0.0",                  // TypeScript compiler
  "vite": "^4.0.0"                         // Build tool
}
```

## Build Configuration

### Vite Configuration
- React plugin enabled
- Auto-open browser in development
- HMR (Hot Module Replacement) support
- Optimized production builds

### TypeScript Configuration
- Strict mode enabled
- ESNext target
- React JSX transform
- Module resolution: Node

### TailwindCSS Configuration
- Scans all HTML and React files
- Includes custom utility classes
- Responsive design utilities

## Performance Considerations

### Bundle Analysis
- **Main Bundle**: 350KB (113KB gzipped)
- **CSS Bundle**: 21KB (4.4KB gzipped)
- **Total Size**: ~371KB optimized

### Optimization Strategies
1. **Code Splitting**: Single main bundle (room for improvement)
2. **Tree Shaking**: Enabled via Vite
3. **Minification**: Production builds minified
4. **Font Loading**: Google Fonts with display=swap
5. **Canvas Optimization**: HiDPI rendering, efficient redraws

### Performance Bottlenecks
1. **Large Components**: `InfiniteTypewriterCanvas.tsx` is 1,793 lines
2. **Canvas Redraws**: Full redraw on state changes
3. **Text Measurement**: Canvas context operations in loops
4. **No Virtualization**: All objects rendered regardless of viewport

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Production build
npm run preview     # Preview production build
```

### Code Quality
- TypeScript strict mode enabled
- No formal linting configuration
- Manual code review process
- Build-time type checking

### Testing Strategy
- No formal testing framework
- Manual testing in browsers
- Build validation
- Type checking as safety net

## Deployment

### Build Process
1. TypeScript compilation
2. Vite bundling and optimization
3. Asset processing and copying
4. HTML generation with asset references

### Output Structure
```
dist/
├── index.html           # Entry HTML file
├── assets/
│   ├── index-*.js       # Main application bundle
│   └── index-*.css      # Styles bundle
├── nntype.png       # Logo
├── nntype-demo.gif  # Demo
└── favicon.svg          # Favicon
```

## Future Considerations

### Scalability Improvements
1. **Component Splitting**: Break down large components
2. **State Management**: Consider Redux/Zustand for complex state
3. **Testing**: Add Jest/Vitest + React Testing Library
4. **Code Quality**: Add ESLint + Prettier
5. **Performance**: Implement canvas virtualization

### Architecture Evolution
1. **Micro-frontends**: Potential for feature-based splitting
2. **Service Workers**: Offline support and caching
3. **WebWorkers**: Heavy computations off main thread
4. **Canvas Optimization**: WebGL for complex rendering

### Feature Extensions
1. **Collaboration**: Real-time multi-user editing
2. **Plugins**: Extension system for custom functionality
3. **Mobile**: Touch-optimized interface
4. **Desktop**: Electron wrapper for native app
