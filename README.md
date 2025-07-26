<p align="center">
  <img src="public/excalitype.png" alt="excalitype Logo" width="220"/>
</p>

<p align="center">
  <img src="public/excalitype-demo.gif" alt="Infinite Canvas Typewriter Demo" width="800"/>
</p>

# ExcaliType - Infinite Canvas Typewriter

> For Korean instructions, see [README.ko.md](./README.ko.md)

excalitype is a modern infinite typewriter canvas supporting Korean/English monospaced fonts, vector/image/JSON export, and infinite zoom & pan.

- Based on React
- Main component: `src/components/InfiniteTypewriterCanvas.tsx`
- Entry point: `src/main.tsx`
- Uses Tailwind CSS, Lucide icons

## How to Run

```bash
npm install
npm run dev
```

## Folder Structure

```
excalitype/
├── src/
│   ├── main.tsx                # App entry
│   ├── components/
│   │   └── InfiniteTypewriterCanvas.tsx  # Main canvas component
│   ├── index.css
│   └── ...
├── public/
│   └── excalitype.png
├── README.md
└── ...
```

## Key Features
- Korean/English monospaced typewriter
- Infinite canvas, grid, A4 guide
- Export/import PNG, SVG, JSON
- Shortcuts overlay, dark mode, UI/zoom/scale control

## How to Use
- Type in the input box and press Enter
- Change width: click 40-60-80 buttons below input
- Zoom: Option/Alt + +/-, UI size: Ctrl/Cmd + +/-
- Export/import: use header menu

## Documentation

For comprehensive documentation, see the [Documentation Index](docs/INDEX.md):

- 📚 [Documentation Index](docs/INDEX.md) - Complete documentation hub
- 🏗️ [Project Structure](docs/PROJECT_STRUCTURE.md) - Architecture deep dive
- 🔧 [API Documentation](docs/API.md) - Components and utilities reference

## License
This project is licensed under the GNU General Public License v3.0. For details, see the [LICENSE](LICENSE) file.

- © 2025 Hyeonsong Kim (kimhxsong@gmail.com)
- GitHub: https://github.com/kimhxsong
