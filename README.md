<p align="center">
  <img src="public/excalitype.png" alt="Excalitype Logo" width="220"/>
</p>

# ExcaliType

A modern, infinite typewriter canvas built with React. Supports Korean monospaced fonts, vector/image/JSON export, and infinite zoom & pan.

---

## Features
- Typewriter-style text input on an infinite canvas
- Supports Korean monospaced fonts (Nanum Gothic Coding, Noto Sans Mono, JetBrains Mono)
- Drag, select, and delete text objects
- Pan the canvas and zoom in/out with mouse or keyboard shortcuts
- **Grid snap functionality** - Objects and canvas movement snap to 36px grid units
- **UI Size adjustment** - Scale UI elements while maintaining logical point sizes
- Export to JSON, PNG, SVG and import from JSON
- Responsive UI with TailwindCSS
- Dark/Light mode support
- A4 guide and grid overlay
- **Enhanced text positioning** - Precise alignment between input box and canvas rendering

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Pan canvas | `Space + Drag` |
| Move view | `Shift + ↑↓←→` |
| Zoom | `Ctrl/Cmd + Scroll` |
| Zoom in/out | `Ctrl/Cmd + / -` |
| **UI Size adjustment** | `Alt + / -` |
| Reset zoom | `Ctrl/Cmd + 0` |
| Reset view | `Cmd + R` |
| Delete selected text | `Del` |
| Commit text input | `Enter` |
| Cancel text input | `Esc` |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

## Folder Structure
- `InfiniteTypewriterCanvas.tsx`: Main component
- `src/`: Entry point (main.tsx), styles (index.css)

## License
MIT

---

# ExcaliType (한국어)

한글 모노스페이스 폰트 지원, 벡터/이미지/JSON 내보내기, 무한 확대/이동이 가능한 React 기반 타이프라이터 캔버스입니다.

## 주요 기능
- 무한 캔버스에서 타이프라이터 방식으로 텍스트 입력
- 한글 모노스페이스 폰트(Nanum Gothic Coding, Noto Sans Mono, JetBrains Mono) 지원
- 텍스트 객체 드래그 이동 및 선택/삭제
- 캔버스 드래그 이동, 휠/단축키로 확대/축소
- **그리드 스냅 기능** - 객체와 캔버스 이동이 36px 단위로 스냅됩니다
- **UI 크기 조절** - 논리적 pt는 유지하면서 UI 요소 크기를 조절합니다
- JSON, PNG, SVG 내보내기 및 JSON 불러오기
- TailwindCSS 기반 반응형 UI
- 다크/라이트 모드 지원
- A4 가이드, 그리드 표시
- **향상된 텍스트 정렬** - 입력 박스와 캔버스 렌더링 간 정확한 정렬

## 키보드 단축키

| 기능 | 단축키 |
|------|--------|
| 캔버스 이동 | `Space + 드래그` |
| 뷰 이동 | `Shift + ↑↓←→` |
| 확대/축소 | `Ctrl/Cmd + 스크롤` |
| 확대/축소 | `Ctrl/Cmd + / -` |
| **UI 크기 조절** | `Alt + / -` |
| 확대 초기화 | `Ctrl/Cmd + 0` |
| 뷰 초기화 | `Cmd + R` |
| 선택된 텍스트 삭제 | `Del` |
| 텍스트 입력 확정 | `Enter` |
| 텍스트 입력 취소 | `Esc` |

## 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 으로 접속하세요.

## 빌드

```bash
npm run build
```

## 폴더 구조
- `InfiniteTypewriterCanvas.tsx`: 메인 컴포넌트
- `src/`: 진입점(main.tsx), 스타일(index.css)

## 라이선스
MIT 
