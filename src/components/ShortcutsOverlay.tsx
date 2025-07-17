import React from 'react';
import { Theme } from '../types';
import { X, Bug, Copy, RotateCcw, Settings } from 'lucide-react';

interface ShortcutsOverlayProps {
  theme: Theme;
  onClose?: () => void;
  onDebug?: () => void;
  onReset?: () => void;
  onCopyShortcuts?: () => void;
  onSettings?: () => void;
}

export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ theme, onClose, onDebug, onReset, onCopyShortcuts, onSettings }) => {
  return (
    <div className={`absolute top-4 right-4 ${
      theme === 'dark' 
        ? 'bg-black/80 text-white' 
        : 'bg-white/90 text-gray-900'
    } backdrop-blur-sm p-4 rounded-xl shadow-md text-xs font-mono`}>
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {onSettings && (
          <button onClick={onSettings} title="설정" className={`p-1 rounded transition-colors ${
            theme === 'dark' ? 'hover:bg-gray-700 hover:text-gray-300' : 'hover:bg-gray-100 hover:text-gray-600'
          }`}><Settings className="w-4 h-4" /></button>
        )}
        {onCopyShortcuts && (
          <button onClick={onCopyShortcuts} title="단축키 복사" className={`p-1 rounded transition-colors ${
            theme === 'dark' ? 'hover:bg-gray-700 hover:text-gray-300' : 'hover:bg-gray-100 hover:text-gray-600'
          }`}><Copy className="w-4 h-4" /></button>
        )}
        {onReset && (
          <button onClick={onReset} title="캔버스 초기화" className={`p-1 rounded transition-colors ${
            theme === 'dark' ? 'hover:bg-gray-700 hover:text-gray-300' : 'hover:bg-gray-100 hover:text-gray-600'
          }`}><RotateCcw className="w-4 h-4" /></button>
        )}
        {onDebug && (
          <button onClick={onDebug} title="디버그 모드" className={`p-1 rounded transition-colors ${
            theme === 'dark' ? 'hover:bg-gray-700 hover:text-yellow-400' : 'hover:bg-yellow-100 hover:text-yellow-600'
          }`}><Bug className="w-4 h-4" /></button>
        )}
        {onClose && (
          <button onClick={onClose} title="닫기" className={`p-1 rounded transition-colors ${
            theme === 'dark' ? 'hover:bg-gray-700 hover:text-red-400' : 'hover:bg-red-100 hover:text-red-600'
          }`}><X className="w-4 h-4" /></button>
        )}
      </div>
      <div className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>키보드 단축키</div>
      <div className="space-y-1.5">
        <div className="flex justify-between"><span>캔버스 이동:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Space + Drag</kbd></div>
        <div className="flex justify-between"><span>뷰 이동:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Shift + ↑↓←→</kbd></div>
        <div className="flex justify-between"><span>줌:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl + Scroll</kbd></div>
        <div className="flex justify-between"><span>줌 인/아웃:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl + / -</kbd></div>
        <div className="flex justify-between"><span>UI 크기:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt + / -</kbd></div>
        <div className="flex justify-between"><span>줌 리셋:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl + 0</kbd></div>
        <div className="flex justify-between"><span>뷰 리셋:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Cmd + R</kbd></div>
        <div className="flex justify-between"><span>선택 삭제:</span><kbd className={`px-1.5 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>Del</kbd></div>
      </div>
    </div>
  );
};
