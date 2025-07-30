import React from 'react';
import { Theme } from '../types';

interface SnapPreviewProps {
  isVisible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  theme: Theme;
}

export const SnapPreview: React.FC<SnapPreviewProps> = ({
  isVisible,
  x,
  y,
  width,
  height,
  theme
}) => {
  if (!isVisible) return null;

  const borderColor = theme === 'dark' 
    ? 'rgba(135, 206, 235, 0.6)' 
    : 'rgba(135, 206, 235, 0.8)';

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width: `${width}px`,
        height: `${height}px`,
        border: `2px dashed ${borderColor}`,
        backgroundColor: 'transparent',
        borderRadius: '2px',
        animation: 'pulse 1s ease-in-out infinite alternate',
        zIndex: 1000,
      }}
    />
  );
};