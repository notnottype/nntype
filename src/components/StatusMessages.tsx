import React from 'react'
import { Trash2 } from 'lucide-react'
import { TextObjectType } from '../types'

interface StatusMessagesProps {
  theme: 'light' | 'dark'
  showTextBox: boolean
  currentTypingText: string
  selectedObject: any
  onDeleteSelected: () => void
}

export const StatusMessages: React.FC<StatusMessagesProps> = ({
  theme,
  showTextBox,
  currentTypingText,
  selectedObject,
  onDeleteSelected
}) => {
  return (
    <>
      {/* Typing Status */}
      {showTextBox && currentTypingText && (
        <div className={`absolute bottom-4 left-4 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-mono pointer-events-none ${
          theme === 'dark'
            ? 'bg-black/80 text-white'
            : 'bg-white/90 text-gray-900'
        }`}>
          Typing: "{currentTypingText}"
        </div>
      )}
      
      {/* Selected Object Status */}
      {selectedObject && (
        <div className={`absolute bottom-4 right-4 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-mono border flex items-center gap-3 pointer-events-auto ${
          theme === 'dark'
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        }`}>
          <span>
            Selected: {selectedObject.type === 'text' 
              ? `"${(selectedObject as TextObjectType).content.substring(0, 30)}${(selectedObject as TextObjectType).content.length > 30 ? '...' : ''}"` 
              : 'A4 Guide'}
          </span>
          <button
            onClick={onDeleteSelected}
            className={`p-1 rounded transition-colors ${
              theme === 'dark'
                ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                : 'hover:bg-red-500/20 text-red-600 hover:text-red-500'
            }`}
            title="Delete selected object"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}