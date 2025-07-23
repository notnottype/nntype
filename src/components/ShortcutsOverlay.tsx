import React from 'react';
import { Theme } from '../types';
import { X, Bug, Copy, RotateCcw, Settings, Layers } from 'lucide-react';

interface ShortcutsOverlayProps {
  theme: Theme;
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

export const ShortcutsOverlay = ({ theme }: { theme: Theme }) => {
  return (
    <div
      className={`absolute top-4 right-4 ${
        theme === 'dark'
          ? 'bg-black/40 text-white'
          : 'bg-white/50 text-gray-900'
      } backdrop-blur-sm rounded-xl shadow-sm text-[11px] font-mono`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontSize: '11px',
        padding: '12px',
        maxHeight: '45vh',
        minWidth: '260px', // minWidth 확장 (중복 제거)
        maxWidth: '340px',
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
        overflowY: 'auto',
      }}
    >
      <div className={`font-semibold mb-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} style={{whiteSpace: 'nowrap'}}>
        <Layers className="w-4 h-4 opacity-80" />
        Keyboard Shortcuts
      </div>
      <div className="border-b border-gray-300/40 mb-2" />
      <div className="space-y-2">
        <div className="font-bold text-xs mt-1 mb-0.5" style={{whiteSpace: 'nowrap'}}>Undo/Redo</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Undo</span>: <span className="font-mono">Ctrl+Z</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Redo</span>: <span className="font-mono">Ctrl+Shift+Z</span>, <span className="font-mono">Ctrl+Y</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>View & Navigation</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Pan Canvas</span>: <span className="font-mono">Space + Drag</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Move View</span>: <span className="font-mono">Shift + Arrow Keys</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Scale In/Out</span>: <span className="font-mono">Alt/Option + +/-</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Reset Zoom</span>: <span className="font-mono">Ctrl + 0</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Reset View</span>: <span className="font-mono">Cmd + R</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Editing</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">UI Size</span>: <span className="font-mono">Ctrl/Cmd + +/-</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-28">Delete Selected</span>: <span className="font-mono">Del</span></div>
        </div>
      </div>
    </div>
  );
};
