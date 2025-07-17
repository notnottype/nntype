# Refactor Guide

## Structure

- Main component: `src/components/InfiniteTypewriterCanvas.tsx`
- App entry: `src/main.tsx`
- Styles: `src/index.css`
- Documentation: `README.md` (English), `README.ko.md` (Korean)

## Refactoring Principles

- **Component Separation**: Split UI/logic into components for reusability and readability
- **State Management**: Use React hooks (useState, useEffect, useCallback, etc.)
- **Keyboard/Input Handling**: Handle IME composition, prevent shortcut conflicts (use ref, isComposing, etc.)
- **Canvas/Rendering**: HiDPI (Retina) support, respect devicePixelRatio
- **Folder/File Naming**: Use lowercase, camelCase, and clear role-based names
- **i18n Support**: Separate markdown docs (README.md, README.ko.md), UI text in English by default, Korean comments if needed

## Recent Updates

- Main component moved to `src/components/InfiniteTypewriterCanvas.tsx`
- Entry imports updated (`import InfiniteTypewriterCanvas from './components/InfiniteTypewriterCanvas'`)
- README split into English/Korean
- Header title unified as 'Infinite Canvas Typewriter'
- Width selector, shortcut, IME input, and UX improvements
- Canvas HiDPI support, font weight/clarity improvements

## Refactoring Checklist

- [ ] Split components/hooks/utils with clear roles
- [ ] Remove unnecessary imports/code/comments
- [ ] Ensure UI/UX consistency and accessibility (ARIA, etc.)
- [ ] Keep markdown/docs up-to-date and reflect i18n
- [ ] Add copyright/contact info in code headers

---

Contact: Hyeonsong Kim (kimhxsong@gmail.com)
