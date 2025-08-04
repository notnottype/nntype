# NNType Documentation Index

## 📚 Documentation Overview

Welcome to the NNType documentation hub. This index provides quick access to all project documentation, organized by topic and audience.

## 🚀 Quick Start

### For Users
- [README](../README.md) - Getting started guide
- [README (Korean)](../README.ko.md) - 한국어 시작 가이드
- [Demo](../public/nntype-demo.gif) - Visual walkthrough

### For Developers
- [Claude Code Guidance](../CLAUDE.md) - AI development assistant setup
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow and standards
- [Project Structure](./PROJECT_STRUCTURE.md) - Architecture deep dive
- [API Documentation](./API.md) - Component and function reference

## 📖 Documentation Categories

### Architecture & Design
| Document | Purpose | Audience |
|----------|---------|----------|
| [Project Structure](./PROJECT_STRUCTURE.md) | Complete architecture overview | Developers |
| [API Documentation](./API.md) | Components, hooks, and utilities | Developers |
| [Claude Code Guidance](../CLAUDE.md) | AI assistant integration | AI/Claude |

### Development
| Document | Purpose | Audience |
|----------|---------|----------|
| [Contributing Guide](./CONTRIBUTING.md) | Development workflow | Contributors |
| [Package Configuration](../package.json) | Dependencies and scripts | Developers |
| [TypeScript Config](../tsconfig.json) | Type checking setup | Developers |
| [Vite Config](../vite.config.ts) | Build configuration | Developers |

### User Guides
| Document | Purpose | Audience |
|----------|---------|----------|
| [README](../README.md) | User guide and features | End Users |
| [README (Korean)](../README.ko.md) | Korean user guide | Korean Users |
| [License](../LICENSE) | Legal information | All |

## 🏗️ Project Structure Quick Reference

```
nntype-1/
├── 📁 src/                    # Source code
│   ├── 🎯 main.tsx           # App entry point
│   ├── 📁 components/        # React components (13 files)
│   ├── 📁 hooks/             # Custom hooks (3 files)
│   ├── 📁 utils/             # Utilities (9 files)
│   ├── 📁 types/             # TypeScript types
│   ├── 📁 constants/         # App constants
│   └── 📁 services/          # External services (AI)
├── 📁 docs/                  # Documentation hub
├── 📁 public/                # Static assets
├── 🔧 package.json           # Project config
├── 🔧 tsconfig.json          # TypeScript config
└── 📄 README.md              # Main documentation
```

## 🔧 API Quick Reference

### Core Types
- `TextObjectType` - Text objects on canvas
- `A4GuideObjectType` - Page guide objects
- `CanvasState` - Main application state
- `Theme` - UI theme system

### Main Components
- `InfiniteTypewriterCanvas` - Root canvas component
- `TypewriterInput` - Text input with Korean IME
- `Header` - Application header and controls
- `CanvasContainer` - Canvas wrapper

### Key Hooks
- `useCanvas` - Canvas state management
- `useCanvasRenderer` - Drawing and rendering
- `useKeyboardEvents` - Keyboard shortcuts

### Utilities
- `coordinateUtils` - World ↔ Screen coordinate transforms
- `exportHandlers` - PNG, SVG, JSON export
- `sessionStorage` - State persistence

## ⌨️ Keyboard Shortcuts Quick Reference

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + +/-` | Zoom in/out |
| `Ctrl/Cmd + 0` | Reset zoom |
| `Alt + +/-` | UI font size |
| `Shift + Arrows` | Pan canvas |
| `Delete` | Delete selected |
| `Space` | Pan mode (hold) |
| `Escape` | Close menus |

## 🎨 Features Overview

### Core Features
- ✅ Infinite zoomable canvas
- ✅ Korean/English text input with IME support
- ✅ Multi-format export (PNG, SVG, JSON)
- ✅ A4 guide system for writing
- ✅ Dark/light theme switching
- ✅ Session persistence
- ✅ AI integration (GPT)

### Technical Features
- ✅ HiDPI display support
- ✅ Coordinate transformation system
- ✅ Google Fonts integration
- ✅ Responsive design
- ✅ TypeScript strict mode
- ✅ Modern React patterns

## 📊 Project Metrics

### Codebase
- **Total Files**: 32 TypeScript/React files
- **Total Lines**: 5,138 lines of code
- **Main Component**: 1,793 lines
- **Bundle Size**: 350KB JS + 21KB CSS

### Dependencies
- **React**: 18.2.0 (Core framework)
- **TypeScript**: 5.0.0 (Type safety)
- **Vite**: 4.0.0 (Build tool)
- **TailwindCSS**: 3.3.0 (Styling)

### Performance
- **Build Time**: ~1.8 seconds
- **Dev Server**: ~150ms startup
- **Bundle (gzipped)**: 114KB JS + 4.4KB CSS

## 🔍 Search & Navigation

### Find by Topic
- **Canvas**: [API.md#canvas-utilities](./API.md#canvas-utilities)
- **Export**: [API.md#export-functions](./API.md#export-functions)
- **Types**: [API.md#core-types--interfaces](./API.md#core-types--interfaces)
- **Hooks**: [API.md#custom-hooks](./API.md#custom-hooks)
- **Components**: [API.md#core-components](./API.md#core-components)

### Find by File Type
- **Components**: `src/components/*.tsx`
- **Hooks**: `src/hooks/*.ts`
- **Utils**: `src/utils/*.ts`
- **Types**: `src/types/*.ts`
- **Configs**: `*.config.{js,ts,json}`

## 🚦 Development Status

### Current Version
- **Version**: 25.7.24.4
- **License**: GPL-3.0
- **Node**: v22.12.0 required
- **Status**: Active development

### Recent Changes
- ✅ Code cleanup and optimization
- ✅ TypeScript strict mode enabled
- ✅ Documentation system created
- ✅ Build performance improved
- ✅ Security vulnerabilities identified

### Known Issues
- ⚠️ 2 moderate security vulnerabilities (esbuild, vite)
- ⚠️ A4 guide scaling accuracy at different zoom levels
- ⚠️ Large component file (1,793 lines)
- ⚠️ No formal testing framework

## 🎯 Next Steps

### Immediate (High Priority)
1. Fix security vulnerabilities
2. Add ESLint configuration
3. Implement formal testing

### Short Term (Medium Priority)
1. Break down large components
2. Add unit tests for utilities
3. Implement multi-select feature

### Long Term (Low Priority)
1. Performance optimization
2. Mobile optimization
3. Collaboration features

## 📞 Support & Contact

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/kimhxsong/nntype/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kimhxsong/nntype/discussions)
- **Email**: kimhxsong@gmail.com

### Contributing
- Read [Contributing Guide](./CONTRIBUTING.md)
- Check [GitHub Issues](https://github.com/kimhxsong/nntype/issues) for tasks
- Follow [Development Workflow](./CONTRIBUTING.md#development-workflow)

---

**Last Updated**: July 26, 2025  
**Documentation Version**: 1.0.0  
**Project Version**: 25.7.24.4