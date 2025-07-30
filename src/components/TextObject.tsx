import React, { useEffect, useRef } from 'react';
import { TextObjectType, Theme } from '../types';

interface TextObjectProps {
  textObject: TextObjectType;
  scale: number;
  theme: Theme;
  isSelected: boolean;
  isHovered: boolean;
  isMultiSelected?: boolean;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

export const TextObject: React.FC<TextObjectProps> = ({
  textObject,
  scale,
  theme,
  isSelected,
  isHovered,
  isMultiSelected = false,
  onSizeChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fontSize = textObject.fontSize * scale;
  
  // 테마별 색상 설정
  const textColor = textObject.color || (theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)');
  
  // 멀티셀렉트된 경우: 배경색은 호버와 동일, 보더는 더 얇게
  const backgroundColor = isMultiSelected 
    ? (theme === 'dark' ? 'rgba(135, 206, 235, 0.1)' : 'rgba(135, 206, 235, 0.05)')
    : isSelected 
    ? (theme === 'dark' ? 'rgba(135, 206, 235, 0.15)' : 'rgba(135, 206, 235, 0.1)')
    : isHovered 
    ? (theme === 'dark' ? 'rgba(135, 206, 235, 0.1)' : 'rgba(135, 206, 235, 0.05)')
    : 'transparent';
    
  const borderColor = (isSelected || isHovered || isMultiSelected) 
    ? (theme === 'dark' ? 'rgba(135, 206, 235, 0.8)' : 'rgba(135, 206, 235, 0.7)')
    : 'transparent';
    
  const borderWidth = isMultiSelected ? '0.5px' : '1px';

  // 크기 변경 감지
  useEffect(() => {
    if (containerRef.current && onSizeChange) {
      const rect = containerRef.current.getBoundingClientRect();
      onSizeChange({
        width: rect.width,
        height: rect.height
      });
    }
  }, [textObject.content, fontSize, onSizeChange]);

  return (
    <div
      ref={containerRef}
      className="relative pointer-events-auto select-none"
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        color: textColor,
        backgroundColor,
        border: `${borderWidth} solid ${borderColor}`,
        whiteSpace: 'pre',
        overflow: 'visible',  
        fontWeight: 400,
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        display: 'block',
        width: 'fit-content',
      }}
    >
{textObject.content}
    </div>
  );
};
