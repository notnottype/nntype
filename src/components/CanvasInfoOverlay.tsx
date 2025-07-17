import React from 'react';
import { CanvasObjectType, Theme } from '../types';

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

export const CanvasInfoOverlay: React.FC<CanvasInfoOverlayProps> = ({
  canvasOffset,
  scale,
  canvasObjects,
  selectedObject,
  typewriterX,
  typewriterY,
  baseFontSize,
  initialFontSize,
  getTextBoxWidth,
  screenToWorld,
  theme,
}) => {
  const textBoxWidth = getTextBoxWidth();
  const textBoxLeft = typewriterX - textBoxWidth / 2;
  const textBoxTop = typewriterY - baseFontSize / 2;
  const textBoxRight = textBoxLeft + textBoxWidth;
  const textBoxBottom = textBoxTop + baseFontSize;

  const corners = [
    { label: 'LT', sx: textBoxLeft, sy: textBoxTop },
    { label: 'RT', sx: textBoxRight, sy: textBoxTop },
    { label: 'LB', sx: textBoxLeft, sy: textBoxBottom },
    { label: 'RB', sx: textBoxRight, sy: textBoxBottom },
  ].map(corner => ({
    ...corner,
    world: screenToWorld(corner.sx, corner.sy)
  }));

  const worldPos = screenToWorld(textBoxLeft, textBoxTop);

  return (
    <div className={`absolute top-4 left-4 ${
      theme === 'dark' 
        ? 'bg-black/80 text-white' 
        : 'bg-white/90 text-gray-900'
    } backdrop-blur-sm p-4 rounded-xl shadow-xl text-xs font-mono`}>
      <div className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        Canvas Info
      </div>
      <div className="space-y-1">
        <div>Offset: ({Math.round(-canvasOffset.x)}, {Math.round(-canvasOffset.y)})</div>
        <div>Scale: {scale.toFixed(2)}x</div>
        <div>UI Size: {(baseFontSize / initialFontSize).toFixed(2)}x ({baseFontSize}px)</div>
        <div>Objects: {canvasObjects.length}</div>
        <div>Origin: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
        {corners.map(c => (
          <div key={c.label} className="mt-1">
            <span className="font-bold">{c.label}</span>:
            <span> win({Math.round(c.sx)}, {Math.round(c.sy)})</span>
            <span> world({Math.round(c.world.x)}, {Math.round(c.world.y)})</span>
          </div>
        ))}
        {selectedObject && (
          <div className={`mt-2 pt-2 border-t ${
            theme === 'dark' ? 'border-gray-600 text-green-400' : 'border-gray-300 text-green-600'
          }`}>
            Selected: {selectedObject.type === 'text' 
              ? `"${selectedObject.content.substring(0, 20)}${selectedObject.content.length > 20 ? '...' : ''}"` 
              : 'A4 Guide'}
          </div>
        )}
      </div>
    </div>
  );
};