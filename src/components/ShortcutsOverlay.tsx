import React from 'react';
import { Theme, CanvasModeType } from '../types';
import { X, Bug, Copy, RotateCcw, Settings, Layers } from 'lucide-react';

interface ShortcutsOverlayProps {
  theme: Theme;
  typewriterY: number;
  baseFontSize: number;
  typewriterX: number;
  getTextBoxWidth: () => number;
  onClose?: () => void;
  onDebug?: () => void;
  onReset?: () => void;
  onCopyShortcuts?: () => void;
  onSettings?: () => void;
}

// export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ theme, onClose, onDebug, onReset, onCopyShortcuts, onSettings }) => {
//   return (
//     <div className={`absolute top-4 right-4 ${
//       theme === 'dark' 
//         ? 'bg-black/80 text-white' 
//         : 'bg-white/90 text-gray-900'
//     } backdrop-blur-sm p-4 rounded-xl shadow-md text-xs font-mono`}>
//       <div className="absolute top-2 right-2 flex gap-1 z-10">
//         {onSettings && (
//           <button onClick={onSettings} title="설정" className={`p-1 rounded transition-colors ${
//             theme === 'dark' ? 'hover:bg-gray-700 hover:text-gray-300' : 'hover:bg-gray-100 hover:text-gray-600'
//           }`}><Settings className="w-4 h-4" /></button>
//         )}
//         {onCopyShortcuts && (
//           <button onClick={onCopyShortcuts} title="단축키 복사" className={`p-1 rounded transition-colors ${
//             theme === 'dark' ? 'hover:bg-gray-700 hover:text-gray-300' : 'hover:bg-gray-100 hover:text-gray-600'
//           }`}><Copy className="w-4 h-4" /></button>
//         )}
//         {onReset && (
//           <button onClick={onReset} title="캔버스 초기화" className={`p-1 rounded transition-colors ${
//             theme === 'dark' ? 'hover:bg-gray-700 hover:text-gray-300' : 'hover:bg-gray-100 hover:text-gray-600'
//           }`}><RotateCcw className="w-4 h-4" /></button>
//         )}
//         {onDebug && (
//           <button onClick={onDebug} title="디버그 모드" className={`p-1 rounded transition-colors ${
//             theme === 'dark' ? 'hover:bg-gray-700 hover:text-yellow-400' : 'hover:bg-yellow-100 hover:text-yellow-600'
//           }`}><Bug className="w-4 h-4" /></button>
//         )}
//         {onClose && (
//           <button onClick={onClose} title="닫기" className={`p-1 rounded transition-colors ${
//             theme === 'dark' ? 'hover:bg-gray-700 hover:text-red-400' : 'hover:bg-red-100 hover:text-red-600'
//           }`}><X className="w-4 h-4" /></button>
//         )}
//       </div>
//       <div className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>키보드 단축키</div>
//       <div className="space-y-1.5">
//         <div className="flex justify-between"><span>캔버스 이동:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Space + Drag</kbd></div>
//         <div className="flex justify-between"><span>뷰 이동:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Shift + ↑↓←→</kbd></div>
//         <div className="flex justify-between"><span>줌:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl + Scroll</kbd></div>
//         <div className="flex justify-between"><span>줌 인/아웃:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl + / -</kbd></div>
//         <div className="flex justify-between"><span>UI 크기:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt + / -</kbd></div>
//         <div className="flex justify-between"><span>줌 리셋:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl + 0</kbd></div>
//         <div className="flex justify-between"><span>뷰 리셋:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Cmd + R</kbd></div>
//         <div className="flex justify-between"><span>선택 삭제:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Del</kbd></div>
//       </div>
//     </div>
//   );
// };

export const ShortcutsOverlay = ({ theme, typewriterY, baseFontSize, typewriterX, getTextBoxWidth, currentMode }: { 
  theme: Theme; 
  typewriterY: number; 
  baseFontSize: number; 
  typewriterX: number; 
  getTextBoxWidth: () => number;
  currentMode: CanvasModeType;
}) => {
  const textBoxWidth = getTextBoxWidth();
  const textBoxLeft = typewriterX - textBoxWidth / 2;
  const topPosition = typewriterY + baseFontSize + 48; // 타이프라이터 박스 아래 48px 간격 (더 하단)
  
  // Mode-specific shortcuts
  const getModeShortcuts = () => {
    switch (currentMode) {
      case 'select':
        return {
          title: 'Select Mode Shortcuts',
          leftColumn: {
            title: 'Selection & Navigation',
            shortcuts: [
              { label: 'Move Pin', key: 'Shift + ↑↓←→' },
              { label: 'Select Object', key: 'Space' },
              { label: 'Multi-Select', key: 'Shift + Space' },
              { label: 'Drag Selection', key: 'Shift + Drag' },
            ]
          },
          rightColumn: {
            title: 'Mode & Actions',
            shortcuts: [
              { label: 'Next Mode', key: 'Tab' },
              { label: 'Previous Mode', key: 'Shift + Tab' },
              { label: 'Delete Selected', key: 'Del' },
              { label: 'Move Objects', key: 'Ctrl+Shift + ↑↓←→' },
            ]
          }
        };
      case 'link':
        return {
          title: 'Link Mode Shortcuts',
          leftColumn: {
            title: 'Link Creation',
            shortcuts: [
              { label: 'Move Pin', key: 'Shift + ↑↓←→' },
              { label: 'Create Link', key: 'Space' },
              { label: 'Cancel Link', key: 'Esc' },
              { label: 'Select Source', key: 'Enter' },
            ]
          },
          rightColumn: {
            title: 'Mode & Navigation',
            shortcuts: [
              { label: 'Next Mode', key: 'Tab' },
              { label: 'Previous Mode', key: 'Shift + Tab' },
              { label: 'Pan Canvas', key: 'Space + Drag' },
              { label: 'Delete Links', key: 'Del' },
            ]
          }
        };
      default: // typography
        return {
          title: 'Typography Mode Shortcuts',
          leftColumn: {
            title: 'Navigation & View',
            shortcuts: [
              { label: 'Pan Canvas', key: 'Space + Drag' },
              { label: 'Move View', key: 'Shift + ↑↓←→' },
              { label: 'Canvas Zoom', key: 'Shift + Alt + +/-' },
              { label: 'UI Font Size', key: 'Ctrl/Cmd + +/-' },
            ]
          },
          rightColumn: {
            title: 'Editing & History',
            shortcuts: [
              { label: 'Next Mode', key: 'Tab' },
              { label: 'Previous Mode', key: 'Shift + Tab' },
              { label: 'Undo', key: 'Ctrl+Z' },
              { label: 'Redo', key: 'Ctrl+Shift+Z' },
            ]
          }
        };
    }
  };

  const shortcuts = getModeShortcuts();
  
  return (
    <div
      className={`absolute z-60 ${
        theme === 'dark'
          ? 'bg-black/20 text-gray-100 border border-gray-700/30'
          : 'bg-white/40 text-gray-800 border border-gray-200/30'
      } backdrop-blur-sm rounded-lg`}
      style={{
        top: `${topPosition}px`,
        left: `${textBoxLeft}px`,
        width: `${textBoxWidth}px`,
        padding: '16px 18px',
        maxHeight: '42vh',
        overflowY: 'auto',
        fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: '13px',
        fontWeight: '400',
        lineHeight: '1.4',
        borderRadius: '4px',
      }}
    >
      <div className="grid grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-3">
          <div>
            <div className={`font-bold text-xs uppercase tracking-wider mb-2.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              {shortcuts.leftColumn.title}
            </div>
            <div className="space-y-2">
              {shortcuts.leftColumn.shortcuts.map((shortcut, index) => (
                <div key={index} className={`flex justify-between items-center py-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="text-xs">{shortcut.label}</span>
                  <kbd className={`px-1.5 py-0.5 text-xs rounded font-mono ${theme === 'dark' ? 'bg-gray-800/70 text-gray-300' : 'bg-gray-100/70 text-gray-600'}`}>
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div>
            <div className={`font-bold text-xs uppercase tracking-wider mb-2.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              {shortcuts.rightColumn.title}
            </div>
            <div className="space-y-2">
              {shortcuts.rightColumn.shortcuts.map((shortcut, index) => (
                <div key={index} className={`flex justify-between items-center py-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="text-xs">{shortcut.label}</span>
                  <kbd className={`px-1.5 py-0.5 text-xs rounded font-mono ${theme === 'dark' ? 'bg-gray-800/70 text-gray-300' : 'bg-gray-100/70 text-gray-600'}`}>
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
