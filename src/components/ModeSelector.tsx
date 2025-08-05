import React from 'react'
import { Type, MousePointer, ArrowUpRight } from 'lucide-react'
import { CanvasModeType } from '../types'

interface ModeSelectorProps {
  currentMode: CanvasModeType
  onModeChange: (mode: CanvasModeType) => void
  theme: 'light' | 'dark'
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  theme
}) => {
  const modes = [
    { 
      key: 'typography' as CanvasModeType, 
      label: 'Type', 
      icon: Type,
      description: 'Typography Mode'
    },
    { 
      key: 'select' as CanvasModeType, 
      label: 'Select', 
      icon: MousePointer,
      description: 'Selection Mode'
    },
    { 
      key: 'link' as CanvasModeType, 
      label: 'Link', 
      icon: ArrowUpRight,
      description: 'Link Mode'
    }
  ]

  return (
    <div className="flex items-center gap-1">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = currentMode === mode.key
        
        return (
          <button
            key={mode.key}
            onClick={() => onModeChange(mode.key)}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${isActive 
                ? theme === 'dark'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-500 text-white shadow-md'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
            title={mode.description}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}