import React from 'react'
import { Trash2 } from 'lucide-react'
import { TextObject } from '../types'

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
      
    </>
  )
}