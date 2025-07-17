import React from 'react';
import { 
  RotateCcw, 
  Upload, 
  Download, 
  Grid3X3, 
  FileType, 
  Info, 
  HelpCircle, 
  Keyboard, 
  Type, 
  Trash2, 
  FileText, 
  Image, 
  Code, 
  Sun, 
  Moon, 
  EyeOff 
} from 'lucide-react';
import { Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  showGrid: boolean;
  showInfo: boolean;
  showShortcuts: boolean;
  showTextBox: boolean;
  isExportMenuOpen: boolean;
  onResetCanvas: () => void;
  onClearAll: () => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleExportMenu: () => void;
  onExportJSON: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onToggleGrid: () => void;
  onAddA4Guide: () => void;
  onToggleInfo: () => void;
  onToggleShortcuts: () => void;
  onToggleTextBox: () => void;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  showGrid,
  showInfo,
  showShortcuts,
  showTextBox,
  isExportMenuOpen,
  onResetCanvas,
  onClearAll,
  onImportFile,
  onToggleExportMenu,
  onExportJSON,
  onExportPNG,
  onExportSVG,
  onToggleGrid,
  onAddA4Guide,
  onToggleInfo,
  onToggleShortcuts,
  onToggleTextBox,
  onToggleTheme,
}) => {
  return (
    <div className={`${
      theme === 'dark' 
        ? 'bg-black/90 border-gray-800' 
        : 'bg-white/90 border-gray-200'
    } backdrop-blur-sm border-b p-4 flex items-center justify-between relative z-50`}>
      <div className="flex items-center gap-6">
        <h1 className={`text-lg font-medium flex items-center gap-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Type className="w-5 h-5" />
          Infinite Canvas
        </h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onResetCanvas}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="캔버스 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClearAll}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="전체 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className={`flex items-center gap-2 border-l pl-6 ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <label className={`p-2 rounded-lg transition-colors cursor-pointer ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
                 title="파일 불러오기">
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept=".json"
              onChange={onImportFile}
              className="hidden"
            />
          </label>
          
          <div className="relative export-dropdown z-[10000]">
            <button 
              onClick={onToggleExportMenu}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="파일 내보내기"
            >
              <Download className="w-4 h-4" />
            </button>
            {isExportMenuOpen && (
              <div className={`absolute top-full left-0 mt-2 rounded-lg shadow-2xl z-[10001] overflow-hidden border-2 ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-white border-gray-300'
              }`}>
                <button
                  onClick={onExportJSON}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={onExportPNG}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Image className="w-4 h-4" />
                  PNG
                </button>
                <button
                  onClick={onExportSVG}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors text-sm ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  SVG
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-2 border-l pl-6 ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded-lg transition-colors ${
              showGrid 
                ? 'text-blue-500 bg-blue-500/10' 
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="그리드 표시/숨기기"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={onAddA4Guide}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="A4 가이드 추가"
          >
            <FileType className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleInfo}
            className={`p-2 rounded-lg transition-colors ${
              showInfo 
                ? 'text-blue-500 bg-blue-500/10' 
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="정보 표시/숨기기"
          >
            {showInfo ? <Info className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleShortcuts}
            className={`p-2 rounded-lg transition-colors ${
              showShortcuts 
                ? 'text-blue-500 bg-blue-500/10' 
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="단축키 도움말"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleTextBox}
            className={`p-2 rounded-lg transition-colors ${
              showTextBox 
                ? 'text-blue-500 bg-blue-500/10' 
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="텍스트 입력창 표시/숨기기"
          >
            {showTextBox ? <Type className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="다크/라이트 테마 전환"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
