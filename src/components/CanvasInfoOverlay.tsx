import React from 'react';
import { CanvasObjectType, Theme } from '../types';
import { Info } from 'lucide-react';

interface CanvasInfoOverlayProps {
  canvasOffset: { x: number; y: number };
  scale: number;
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
  typewriterX: number;
  typewriterY: number;
  baseFontSize: number;
  initialFontSize: number;
  getTextBoxWidth: () => number;
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  theme: Theme;
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
//     } backdrop-blur-sm p-4 rounded-xl shadow-xl text-xs font-mono`}>
//       <div className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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


export const CanvasInfoOverlay = ({ canvasOffset, scale, canvasObjects, selectedObject, hoveredObject, mousePosition, isMouseInTextBox, typewriterX, typewriterY, baseFontSize, initialFontSize, getTextBoxWidth, screenToWorld, theme }: {
  canvasOffset: { x: number; y: number; };
  scale: number;
  canvasObjects: CanvasObjectType[];
  selectedObject: CanvasObjectType | null;
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
      className={`absolute top-4 left-4 ${
        theme === 'dark'
          ? 'bg-black/40 text-white'
          : 'bg-white/50 text-gray-900'
      } backdrop-blur-sm rounded-xl shadow-sm text-[11px] font-mono`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        fontSize: '11px',
        padding: '12px',
        maxHeight: '32vh',
        minWidth: '260px', // minWidth 확장 (중복 제거)
        maxWidth: '400px',
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
        overflowY: 'auto',
      }}
    >
      <div className={`font-semibold mb-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} style={{whiteSpace: 'nowrap'}}>
        <Info className="w-4 h-4 opacity-80" />
        Canvas Info
      </div>
      <div className="border-b border-gray-300/40 mb-2" />
      <div className="space-y-2">
        <div className="font-bold text-xs mt-1 mb-0.5" style={{whiteSpace: 'nowrap'}}>View State</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Offset</span>: <span className="font-mono">({Math.round(-canvasOffset.x)}, {Math.round(-canvasOffset.y)})</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Zoom</span>: <span className="font-mono">{scale.toFixed(2)}x</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">UI Size</span>: <span className="font-mono">{(baseFontSize / initialFontSize).toFixed(2)}x ({baseFontSize}px)</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Objects</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Object Count</span>: <span className="font-mono">{canvasObjects.length}</span></div>
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Typewriter Box</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Origin (Top Left)</span>: <span className="font-mono">({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</span></div>
          {corners.map(c => (
            <div key={c.label} style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">{c.label}</span>: <span className="font-mono">win({Math.round(c.sx)}, {Math.round(c.sy)}) / world({Math.round(c.world.x)}, {Math.round(c.world.y)})</span></div>
          ))}
        </div>
        <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Mouse</div>
        <div className="flex flex-col gap-0.5 pl-2">
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">Screen</span>: <span className="font-mono">({mousePosition.x}, {mousePosition.y})</span></div>
          <div style={{whiteSpace: 'nowrap'}}><span className="inline-block w-32">World</span>: <span className="font-mono">({Math.round(screenToWorld(mousePosition.x, mousePosition.y).x)}, {Math.round(screenToWorld(mousePosition.x, mousePosition.y).y)})</span></div>
        </div>
        {hoveredObject && (
          <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Hovered Object</div>
        )}
        {hoveredObject && (
          <div className="pl-2 text-yellow-700 dark:text-yellow-300" style={{whiteSpace: 'nowrap'}}>
            {hoveredObject.type === 'text' ? `Text: "${hoveredObject.content.substring(0, 15)}${hoveredObject.content.length > 15 ? '...' : ''}"` : 'A4 Guide'}
          </div>
        )}
        {selectedObject && (
          <div className="font-bold text-xs mt-2 mb-0.5" style={{whiteSpace: 'nowrap'}}>Selected Object</div>
        )}
        {selectedObject && (
          <div className="pl-2 text-green-700 dark:text-green-300" style={{whiteSpace: 'nowrap'}}>
            {selectedObject.type === 'text' ? `Text: "${selectedObject.content.substring(0, 20)}${selectedObject.content.length > 20 ? '...' : ''}"` : 'A4 Guide'}
          </div>
        )}
      </div>
    </div>
  );
};
