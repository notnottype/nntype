<p align="center">
  <img src="public/nntype.png" alt="nntype Logo" width="220"/>
</p>

<p align="center">
  <img src="public/nntype-demo.gif" alt="Infinite Canvas Typewriter Demo" width="800"/>
</p>

# nntype - Infinite Canvas Typewriter

> For Korean instructions, see [README.ko.md](./README.ko.md)

nntype is a modern infinite typewriter canvas supporting Korean/English monospaced fonts, vector/image/JSON export, and infinite zoom & pan.

## ✨ Key Features
- **Korean/English Monospaced Typewriter** - Beautiful typography with Noto Sans Mono KR
- **Infinite Canvas** - Unlimited space with grid and guide system
- **Multi-Mode System** - Typography, Link, and Select modes
- **Export/Import** - PNG, SVG, JSON formats
- **Dark Mode** - Easy on the eyes
- **Keyboard Shortcuts** - Comprehensive shortcut system
- **AI Integration** - GPT-powered text responses
- **Auto-Save** - Session management with localStorage

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
nntype/
├── src/
│   ├── main.tsx                         # App entry
│   ├── components/
│   │   ├── InfiniteTypewriterCanvas.tsx # Main canvas component
│   │   ├── Header.tsx                   # Navigation
│   │   └── ui/                          # UI components
│   ├── hooks/                           # Custom React hooks
│   ├── utils/                           # Utility functions
│   ├── types/                           # TypeScript definitions
│   └── constants/                       # App constants
├── docs/
│   ├── README.md                        # Documentation index
│   ├── planning/                        # Project planning
│   │   └── ROADMAP_v2.0_2025-08.md      # v2.0 implementation plan
│   ├── technical/                       # Technical docs
│   │   ├── data-architecture-analysis.md # ERD & integration analysis
│   │   ├── naming-convention-summary.md  # Naming standards
│   │   └── COORDINATE_SYSTEM_ANALYSIS.md # Canvas coordinate system
│   └── archive/                         # Archived documents
├── CLAUDE.md                            # Claude Code guide
└── README.md                            # This file
```

## 🎮 How to Use

### Basic Usage
- **Type**: Enter text in the input box and press Enter
- **Width Control**: Click 40-60-80 buttons below input
- **Canvas Navigation**: Click and drag to pan
- **Mode Switch**: Use toolbar buttons to switch modes

### Keyboard Shortcuts
- **Zoom Canvas**: `Option/Alt + +/-`
- **UI Scale**: `Ctrl/Cmd + +/-`
- **Toggle Grid**: `G`
- **Toggle Dark Mode**: `D`
- **Clear Canvas**: `Cmd/Ctrl + K`

## 📚 Documentation

- **[Documentation Hub](docs/README.md)** - Complete documentation index
- **[v2.0 Roadmap](docs/planning/ROADMAP_v2.0_2025-08.md)** - Complete implementation plan
- **[Technical Architecture](docs/technical/data-architecture-analysis.md)** - Data models and integration
- **[API Reference](docs/API.md)** - Components and utilities API
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Detailed architecture

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Canvas**: HTML5 Canvas API
- **Icons**: Lucide React
- **Font**: Noto Sans Mono KR

## 🔄 Roadmap

### Current Version (v1.0)
✅ Infinite canvas with text objects  
✅ Multi-mode system (Typography/Link/Select)  
✅ Export/Import (PNG/SVG/JSON)  
✅ Dark mode and session management

### Planned Features (v2.0)
🔄 **Channel System** - Logseq-style tagging and organization  
🔄 **Drawing System** - Apple Pencil support with pressure sensitivity  
🔄 **Guide System** - A4, Letter, Legal, Screen, Mobile formats  
🔄 **Multimedia** - YouTube embeds, Audio, Image objects  
🔄 **Mobile/Touch** - iPad optimized interface with gestures  
🔄 **Command System** - Natural language processing  
🔄 **State Management** - Zustand + IndexedDB storage  
🔄 **Data Architecture** - Unified object system migration

See [ROADMAP_v2.0_2025-08.md](docs/planning/ROADMAP_v2.0_2025-08.md) for the complete v2.0 implementation plan.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

- © 2025 notnottype
- Original Author: Hyeonsong Kim (kimhxsong@gmail.com)
- GitHub: https://github.com/notnottype/nntype
