import React from 'react'
import { FileDown } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/DropdownMenu'

interface ExportMenuProps {
  onExportPNG: () => void
  onExportSVG: () => void
  onExportJSON: () => void
  theme: 'light' | 'dark'
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExportPNG,
  onExportSVG,
  onExportJSON,
  theme
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Export"
        >
          <FileDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportPNG}>
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportSVG}>
          Export as SVG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportJSON}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}