import React from 'react'
import { Import, Trash2, Grid, Sun, Moon, Info, Layers, Key } from 'lucide-react'
import { ExportMenu } from './ExportMenu'
import { Button } from './ui/Button'
import { SettingsDropdown } from './SettingsDropdown'
import { ModeSelector } from './ModeSelector'
import { CanvasMode } from '../types'
import useCanvasStore from '../store/canvasStore'

interface HeaderProps {
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void
  onExportPNG: () => void
  onExportSVG: () => void
  onExportJSON: () => void
  onClearAll: () => void
  onApiKeyClick: () => void
  infoPanel?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({
  onImportFile,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onClearAll,
  onApiKeyClick,
  infoPanel
}) => {
  // Get state from Zustand store
  const {
    theme,
    showGrid,
    toggleGrid,
    toggleTheme,
    currentMode,
    switchMode
  } = useCanvasStore();
  return (
    <React.Fragment>
      {/* Top Header Container */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center px-2 py-1 pr-4 pointer-events-none">
        {/* Logo - Left */}
        <div className="pointer-events-auto flex items-center h-10 mt-1">
          <img 
            src="/nntype.svg" 
            alt="nntype" 
            className="w-28 h-14"
            style={{ filter: theme === 'dark' ? 'invert(1)' : 'none' }}
          />
        </div>

        {/* Floating Toolbar - Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none flex items-center h-10 mt-2">
          <div className={`flex items-center gap-1 px-2.5 py-2 rounded-lg shadow-xs backdrop-blur-sm border pointer-events-auto h-10 ${
            theme === 'dark' 
              ? 'bg-black/20 border-gray-700/30' 
              : 'bg-white/40 border-gray-200/30'
          }`}>

        {/* File Operations */}
        <label className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`} title="Import">
          <Import className="w-3.5 h-3.5" />
          <input type="file" accept=".json" onChange={onImportFile} className="hidden" />
        </label>
        
        <ExportMenu
          onExportPNG={onExportPNG}
          onExportSVG={onExportSVG}
          onExportJSON={onExportJSON}
          theme={theme}
        />

        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Mode Selector */}
        <ModeSelector
          currentMode={currentMode}
          onModeChange={switchMode}
          theme={theme}
        />

        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Grid Toggle */}
        <Button
          variant="control"
          theme={theme}
          onClick={toggleGrid}
          className={`p-1.5 rounded-lg ${
            showGrid ? 'text-blue-500 bg-blue-500/10' : ''
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="control"
          theme={theme}
          onClick={toggleTheme}
          className="p-1.5 rounded-lg"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>

        {/* API Key */}
        <Button
          variant="control"
          theme={theme}
          onClick={onApiKeyClick}
          className="p-1.5 rounded-lg"
          title="OpenAI API Key"
        >
          <Key className="w-3.5 h-3.5" />
        </Button>

        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Reset */}
        <Button
          variant="control"
          theme={theme}
          onClick={onClearAll}
          className="p-1.5 rounded-lg"
          title="Reset Canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>

          </div>
        </div>

        {/* Spacer for flex layout */}
        <div className="flex-1"></div>

        {/* Info Panel - Right */}
        <div className="pointer-events-auto flex items-center h-10">
          {infoPanel}
        </div>
      </div>

    </React.Fragment>
  )
}
