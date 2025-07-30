import React, { useEffect, useRef } from 'react';
import { A4GuideObjectType, Theme } from '../types';

interface A4GuideObjectProps {
  a4Object: A4GuideObjectType;
  scale: number;
  theme: Theme;
  isSelected: boolean;
  isHovered: boolean;
  isMultiSelected?: boolean;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

export const A4GuideObject: React.FC<A4GuideObjectProps> = ({
  a4Object,
  scale,
  theme,
  isSelected,
  isHovered,
  isMultiSelected = false,
  onSizeChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = a4Object.width * scale;
  const height = a4Object.height * scale;
  
  // 테마별 색상 설정
  const borderColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)';
  const backgroundColor = isMultiSelected 
    ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)')
    : isSelected 
    ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)')
    : 'transparent';
  const labelColor = borderColor;
  const borderWidth = isMultiSelected ? '1px' : '2px';

  // 크기 변경 감지
  useEffect(() => {
    if (containerRef.current && onSizeChange) {
      onSizeChange({
        width: width,
        height: height
      });
    }
  }, [width, height, onSizeChange]);

  return (
    <div
      ref={containerRef}
      className="relative pointer-events-auto"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: `${borderWidth} dashed ${borderColor}`,
        backgroundColor,
        borderStyle: isSelected ? 'solid' : 'dashed',
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="absolute top-2 left-2"
        style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: `${14 * scale}px`,
          color: labelColor,
          fontWeight: 500,
          margin: 0,
          padding: 0,
        }}
      >
        A4
      </div>
    </div>
  );
};