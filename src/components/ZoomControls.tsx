import React from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'

interface ZoomControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  theme: 'light' | 'dark'
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  theme
}) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onZoomOut}
        className={`p-1 transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Zoom Out"
      >
        <ZoomOut className="w-3 h-3" />
      </button>
      <span className={`text-xs font-mono w-12 text-center ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {(scale * 100).toFixed(0)}%
      </span>
      <button
        onClick={onZoomIn}
        className={`p-1 transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Zoom In"
      >
        <ZoomIn className="w-3 h-3" />
      </button>
    </div>
  )
}