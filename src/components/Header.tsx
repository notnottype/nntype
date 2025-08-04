import React from 'react'
import { Type, Import, Grid, NotepadTextDashed, Trash2, Sun, Moon, Info, Layers, Key } from 'lucide-react'
import { ExportMenu } from './ExportMenu'
import { Button } from './ui/Button'

interface HeaderProps {
  theme: 'light' | 'dark'
  showGrid: boolean
  showInfo: boolean
  showShortcuts: boolean
  maxCharsPerLine: number
  onThemeToggle: () => void
  onShowGridToggle: () => void
  onShowInfoToggle: () => void
  onShowShortcutsToggle: () => void
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void
  onExportPNG: () => void
  onExportSVG: () => void
  onExportJSON: () => void
  onAddA4Guide: () => void
  onClearAll: () => void
  onApiKeyClick: () => void
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  showGrid,
  showInfo,
  showShortcuts,
  maxCharsPerLine,
  onThemeToggle,
  onShowGridToggle,
  onShowInfoToggle,
  onShowShortcutsToggle,
  onImportFile,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onAddA4Guide,
  onClearAll,
  onApiKeyClick
}) => {
  return (
    <div className={`${
      theme === 'dark' 
        ? 'bg-black/90 border-gray-800' 
        : 'bg-white/90 border-gray-200'
    } backdrop-blur-sm border-b p-4 flex items-center justify-between relative z-50`}>
      {/* Left: Title */}
      <div className="flex items-center gap-6 min-w-[180px]">
        <h1 className={`text-lg font-medium flex items-center gap-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Type className="w-5 h-5" />
          NNType
        </h1>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-2 justify-center flex-1 relative">
        {/* File Operations */}
        <label className={`p-2 rounded-lg transition-colors cursor-pointer ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`} title="Import">
          <Import className="w-4 h-4" />
          <input type="file" accept=".json" onChange={onImportFile} className="hidden" />
        </label>
        
        <ExportMenu
          onExportPNG={onExportPNG}
          onExportSVG={onExportSVG}
          onExportJSON={onExportJSON}
          theme={theme}
        />

        <span className="mx-2 text-gray-400 select-none">|</span>

        {/* Tools */}
        <Button
          variant="control"
          theme={theme}
          onClick={onShowGridToggle}
          className={showGrid ? 'text-blue-500 bg-blue-500/10' : ''}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </Button>

        <Button
          variant="control"
          theme={theme}
          onClick={onAddA4Guide}
          disabled={maxCharsPerLine !== 80}
          className={maxCharsPerLine !== 80 ? 'opacity-50 cursor-not-allowed' : ''}
          title="Add A4 Guide"
        >
          <NotepadTextDashed className="w-4 h-4" />
        </Button>

        <span className="mx-2 text-gray-400 select-none">|</span>

        {/* Reset */}
        <Button
          variant="control"
          theme={theme}
          onClick={onClearAll}
          title="Reset"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: Settings */}
      <div className="flex items-center gap-2 min-w-[180px] justify-end">
        <Button
          variant="control"
          theme={theme}
          onClick={onApiKeyClick}
          title="OpenAI API Key 설정"
        >
          <Key className="w-4 h-4" />
        </Button>

        <Button
          variant="control"
          theme={theme}
          onClick={onThemeToggle}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          variant="control"
          theme={theme}
          onClick={onShowInfoToggle}
          className={showInfo ? 'text-blue-500 bg-blue-500/10' : ''}
          title="캔버스 정보 토글"
        >
          <Info className="w-4 h-4" />
        </Button>

        <Button
          variant="control"
          theme={theme}
          onClick={onShowShortcutsToggle}
          className={showShortcuts ? 'text-blue-500 bg-blue-500/10' : ''}
          title="단축키 안내 토글"
        >
          <Layers className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}