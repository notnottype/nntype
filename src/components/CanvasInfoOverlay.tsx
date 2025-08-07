import React, { useState } from 'react';
import { CanvasObjectType, Theme } from '../types';
import { Bug, ChevronRight, ChevronLeft, PanelRightOpen, PanelRightClose } from 'lucide-react';

interface CanvasInfoOverlayProps {
  canvasOffset: { x: number; y: number };
  scale: number;
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  selectedObjects?: CanvasObjectType[];
  typewriterX: number;
  typewriterY: number;
  baseFontSize: number;
  initialFontSize: number;
  getTextBoxWidth: () => number;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  theme: Theme;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// export const CanvasInfoOverlay: React.FC<CanvasInfoOverlayProps> = ({
//   canvasOffset,
//   scale,
//   canvasObjects,
//   selectedObject,
//   typewriterX,
//   typewriterY,
//   baseFontSize,
//   initialFontSize,
//   getTextBoxWidth,
//   screenToWorld,
//   theme,
// }) => {
//   const textBoxWidth = getTextBoxWidth();
//   const textBoxLeft = typewriterX - textBoxWidth / 2;
//   const textBoxTop = typewriterY - baseFontSize / 2;
//   const textBoxRight = textBoxLeft + textBoxWidth;
//   const textBoxBottom = textBoxTop + baseFontSize;

//   const corners = [
//     { label: 'LT', sx: textBoxLeft, sy: textBoxTop },
//     { label: 'RT', sx: textBoxRight, sy: textBoxTop },
//     { label: 'LB', sx: textBoxLeft, sy: textBoxBottom },
//     { label: 'RB', sx: textBoxRight, sy: textBoxBottom },
//   ].map(corner => ({
//     ...corner,
//     world: screenToWorld(corner.sx, corner.sy)
//   }));

//   const worldPos = screenToWorld(textBoxLeft, textBoxTop);

//   return (
//     <div className={`absolute top-4 left-4 ${
//       theme === 'dark' 
//         ? 'bg-black/80 text-white' 
//         : 'bg-white/90 text-gray-900'
//     } backdrop-blur-sm p-4 rounded-xl shadow-xl text-[11px] font-mono`}>
//       <div className={`font-semibold mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
//         Canvas Info
//       </div>
//       <div className="space-y-1">
//         <div>Offset: ({Math.round(-canvasOffset.x)}, {Math.round(-canvasOffset.y)})</div>
//         <div>Scale: {scale.toFixed(2)}x</div>
//         <div>UI Size: {(baseFontSize / initialFontSize).toFixed(2)}x ({baseFontSize}px)</div>
//         <div>Objects: {canvasObjects.length}</div>
//         <div>Origin: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
//         {corners.map(c => (
//           <div key={c.label} className="mt-1">
//             <span className="font-bold">{c.label}</span>:
//             <span> win({Math.round(c.sx)}, {Math.round(c.sy)})</span>
//             <span> world({Math.round(c.world.x)}, {Math.round(c.world.y)})</span>
//           </div>
//         ))}
//         {selectedObject && (
//           <div className={`mt-2 pt-2 border-t ${
//             theme === 'dark' ? 'border-gray-600 text-green-400' : 'border-gray-300 text-green-600'
//           }`}>
//             Selected: {selectedObject.type === 'text' 
//               ? `"${selectedObject.content.substring(0, 20)}${selectedObject.content.length > 20 ? '...' : ''}"` 
//               : 'A4 Guide'}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };


export const CanvasInfoOverlay = ({ canvasOffset, scale, canvasObjects, selectedObject, selectedObjects, hoveredObject, mousePosition, isMouseInTextBox, typewriterX, typewriterY, baseFontSize, initialFontSize, getTextBoxWidth, screenToWorld, theme }: {
  canvasOffset: { x: number; y: number; };
  scale: number;
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  selectedObjects?: CanvasObjectType[];
  hoveredObject: CanvasObjectType | null;
  mousePosition: { x: number; y: number };
  isMouseInTextBox: boolean;
  typewriterX: number;
  typewriterY: number;
  baseFontSize: number;
  initialFontSize: number;
  getTextBoxWidth: () => number;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number; };
  theme: Theme;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const textBoxWidth = getTextBoxWidth();
  const textBoxLeft = typewriterX - textBoxWidth / 2;
  const textBoxTop = typewriterY - baseFontSize / 2;
  const textBoxRight = textBoxLeft + textBoxWidth;
  const textBoxBottom = textBoxTop + baseFontSize;

  // 4 corners (window/world)
  const corners = [
    { label: 'Top Left', sx: textBoxLeft, sy: textBoxTop },
    { label: 'Top Right', sx: textBoxRight, sy: textBoxTop },
    { label: 'Bottom Left', sx: textBoxLeft, sy: textBoxBottom },
    { label: 'Bottom Right', sx: textBoxRight, sy: textBoxBottom },
  ].map(corner => ({
    ...corner,
    world: screenToWorld(corner.sx, corner.sy)
  }));

  const worldPos = screenToWorld(textBoxLeft, textBoxTop);

  return (
    <div
      className={`fixed z-60 transition-[width] duration-200 ease-out ${
        isCollapsed ? 'top-3 right-4 w-10 h-10 rounded-lg' : 'top-0 right-0 w-72 h-screen'
      } ${
        theme === 'dark'
          ? 'bg-black/20 text-gray-100 border border-gray-700/30'
          : 'bg-white/40 text-gray-800 border border-gray-200/30'
      } backdrop-blur-sm shadow-xs`}
      style={{
        height: isCollapsed ? '40px' : '100vh',
        padding: isCollapsed ? '4px' : '16px 14px',
        paddingTop: isCollapsed ? '4px' : '16px',
        overflowY: 'auto',
        fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        fontSize: '12px',
        lineHeight: '1.1',
      }}
    >
      {/* Toggle Button - Positioned absolutely in center when collapsed */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`${
          isCollapsed 
            ? 'absolute inset-0 w-full h-full rounded-lg flex items-center justify-center' 
            : 'absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center'
        } hover:bg-gray-500/20 transition-colors ${
          theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
        }`}
        title={isCollapsed ? "Expand Info" : "Collapse Info"}
      >
        {isCollapsed ? (
          <Bug className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Header - Only show when expanded */}
      {!isCollapsed && (
        <div className={`mb-4 pb-3 border-b ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className={`font-semibold text-sm flex items-center gap-2 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            <Bug className="w-4 h-4" />
            <span>Debug Info</span>
          </div>
        </div>
      )}
      
      {/* Content - Hidden when collapsed */}
      {!isCollapsed && (
      <div className="space-y-5">
        <div>
          <div className={`font-bold text-[11px] uppercase tracking-wide mb-1.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Canvas View</div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Pan Position</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                {Math.round(-canvasOffset.x)}, {Math.round(-canvasOffset.y)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Zoom Level</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                {scale.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">UI Scale</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                {(baseFontSize / initialFontSize).toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
        
        <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
        
        <div>
          <div className={`font-bold text-[11px] uppercase tracking-wide mb-1.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Content</div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Total Items</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                {canvasObjects.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">AI Generated</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                {canvasObjects.filter(obj => obj.type === 'text' && obj.isAIResponse).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Selected</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`}>
                {selectedObjects?.length || (selectedObject ? 1 : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">User Text</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`}>
                {canvasObjects.filter(obj => obj.type === 'text' && !obj.isAIResponse).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Links</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-200' : 'bg-indigo-100 text-indigo-800'}`}>
                {canvasObjects.filter(obj => obj.type === 'link').length}
              </span>
            </div>
          </div>
        </div>
        
        <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
        
        <div>
          <div className={`font-bold text-[11px] uppercase tracking-wide mb-1.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Input Box</div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Position</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-orange-900/50 text-orange-200' : 'bg-orange-100 text-orange-800'}`}>
                {Math.round(worldPos.x)}, {Math.round(worldPos.y)}
              </span>
            </div>
            {corners.map(c => (
              <div key={c.label} className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500">{c.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono ${theme === 'dark' ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100/50 text-gray-600'}`}>
                  {Math.round(c.world.x)}, {Math.round(c.world.y)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
        
        <div>
          <div className={`font-bold text-[11px] uppercase tracking-wide mb-1.5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Cursor</div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Screen Pos</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-teal-900/50 text-teal-200' : 'bg-teal-100 text-teal-800'}`}>
                {mousePosition.x}, {mousePosition.y}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-medium text-gray-500">Canvas Pos</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-medium ${theme === 'dark' ? 'bg-cyan-900/50 text-cyan-200' : 'bg-cyan-100 text-cyan-800'}`}>
                {Math.round(screenToWorld(mousePosition.x, mousePosition.y).x)}, {Math.round(screenToWorld(mousePosition.x, mousePosition.y).y)}
              </span>
            </div>
          </div>
        </div>
        {hoveredObject && (
          <>
            <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
            <div>
              <div className={`font-bold text-[11px] uppercase tracking-wide mb-1.5 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>Hovered Object</div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium text-gray-500">Type</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-medium ${theme === 'dark' ? 'bg-yellow-900/50 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                  {hoveredObject.isAIResponse ? 'AI Response' : hoveredObject.type === 'text' ? 'Text' : 'A4 Guide'}
                </span>
              </div>
              {hoveredObject.type === 'text' && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-gray-500">Content</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono max-w-32 truncate ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
                    "{hoveredObject.content.substring(0, 12)}{hoveredObject.content.length > 12 ? '...' : ''}"
                  </span>
                </div>
              )}
            </div>
            </div>
          </>
        )}
        
        {/* Show selected objects in a dedicated section */}
        {(selectedObjects?.length > 0 || selectedObject) && (
          <>
            <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}></div>
            <div>
              <div className={`font-bold text-[11px] uppercase tracking-wide mb-1.5 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
                Selection ({selectedObjects?.length || (selectedObject ? 1 : 0)})
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(selectedObjects?.length > 0 ? selectedObjects : (selectedObject ? [selectedObject] : [])).map((obj: any, idx: number) => (
                  <div key={obj.id || idx} className={`px-1.5 py-0.5 rounded text-[10px] ${theme === 'dark' ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {idx + 1}. {obj.type === 'text' ? 'Text' : obj.type === 'guide' ? 'A4 Guide' : obj.type}
                      </span>
                      {obj.type === 'text' && (
                        <span className="text-[9px] opacity-70">
                          {obj.isAIResponse ? 'AI' : 'User'}
                        </span>
                      )}
                    </div>
                    {obj.type === 'text' && (
                      <div className="text-[9px] mt-0.5 opacity-80 truncate">
                        "{obj.content.substring(0, 30)}{obj.content.length > 30 ? '...' : ''}"
                      </div>
                    )}
                    {obj.type !== 'link' && (
                      <div className="text-[9px] mt-0.5 opacity-60">
                        Pos: ({Math.round(obj.x)}, {Math.round(obj.y)})
                      </div>
                    )}
                  </div>
                ))}
            </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
};
