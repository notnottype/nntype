import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Grid, Info, Layers, Key, Sun, Moon, Settings, Heart } from 'lucide-react'
import { Button } from './ui/Button'

interface SettingsDropdownProps {
  theme: 'light' | 'dark'
  showGrid: boolean
  showInfo: boolean
  showShortcuts: boolean
  onThemeToggle: () => void
  onShowGridToggle: () => void
  onShowInfoToggle: () => void
  onShowShortcutsToggle: () => void
  onApiKeyClick: () => void
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  theme,
  showGrid,
  showInfo,
  showShortcuts,
  onThemeToggle,
  onShowGridToggle,
  onShowInfoToggle,
  onShowShortcutsToggle,
  onApiKeyClick
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <Button
        variant="control"
        theme={theme}
        onClick={toggleDropdown}
        className={isOpen ? 'bg-blue-500/10 text-blue-500' : ''}
        title="Settings"
      >
        <Settings className="w-6 h-6" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-52 rounded-lg border shadow-lg z-50 ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                onThemeToggle()
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Divider */}
            <div className={`my-2 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`} />

            {/* Grid Toggle */}
            <button
              onClick={() => {
                onShowGridToggle()
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                showGrid 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Show Grid</span>
              {showGrid && <span className="ml-auto text-xs text-blue-500">●</span>}
            </button>

            {/* Info Toggle */}
            <button
              onClick={() => {
                onShowInfoToggle()
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                showInfo 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Canvas Info</span>
              {showInfo && <span className="ml-auto text-xs text-blue-500">●</span>}
            </button>

            {/* Shortcuts Toggle */}
            <button
              onClick={() => {
                onShowShortcutsToggle()
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                showShortcuts 
                  ? 'text-blue-500 bg-blue-500/10' 
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Shortcuts Guide</span>
              {showShortcuts && <span className="ml-auto text-xs text-blue-500">●</span>}
            </button>

            {/* Divider */}
            <div className={`my-2 border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`} />

            {/* API Key */}
            <button
              onClick={() => {
                onApiKeyClick()
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>OpenAI API Key</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}