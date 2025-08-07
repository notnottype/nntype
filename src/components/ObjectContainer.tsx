import React, { useState, useRef } from 'react';
import { CanvasObjectType, Theme } from '../types';
import { SnapPreview } from './SnapPreview';

interface ObjectContainerProps {
  object: CanvasObjectType;
  scale: number;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  isSelected: boolean;
  isHovered: boolean;
  isMultiSelected?: boolean;
  isLinkingMode?: boolean;
  showGrid?: boolean;
  gridSize?: number;
  theme: Theme;
  onDelete: () => void;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  onDrag?: (deltaX: number, deltaY: number) => void;
  onDragEnd?: (finalX: number, finalY: number) => void;
  children: React.ReactNode;
}

export const ObjectContainer: React.FC<ObjectContainerProps> = ({
  object,
  scale,
  worldToScreen,
  screenToWorld,
  isSelected,
  isHovered,
  isMultiSelected = false,
  isLinkingMode = false,
  showGrid = false,
  gridSize = 10,
  theme,
  onDelete,
  onClick,
  onHover,
  onDrag,
  onDragEnd,
  children
}) => {
  const [objectSize, setObjectSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [snapPreview, setSnapPreview] = useState({ show: false, x: 0, y: 0, width: 0, height: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const totalDragRef = useRef({ x: 0, y: 0 });
  
  const screenPos = worldToScreen(
    object.type === 'text' ? object.x : object.type === 'guide' ? object.x : 0,
    object.type === 'text' ? object.y : object.type === 'guide' ? object.y : 0
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    // X 버튼 클릭인지 확인 (X 버튼은 드래그를 시작하지 않음)
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    // 링킹 모드일 때는 이벤트를 캔버스로 전파하여 링킹 로직이 처리되도록 함
    if (isLinkingMode) {
      return; // 이벤트를 막지 않고 캔버스로 전파
    }
    
    // 선택되지 않은 객체의 경우: 호버 상태라면 바로 드래그 시작, 아니라면 멀티셀렉트를 위해 전파
    if (!isSelected) {
      if (isHovered && onDrag) {
        // 호버된 객체는 클릭 시 바로 선택되고 드래그 시작
        onClick?.(); // 먼저 선택
      } else {
        return; // 이벤트를 막지 않고 캔버스로 전파 (멀티셀렉트용)
      }
    }
    
    // 드래그 가능한 객체만 진행
    if (!onDrag) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    totalDragRef.current = { x: 0, y: 0 }; // 총 드래그 거리 초기화
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // 스크린 좌표 델타를 월드 좌표 델타로 변환
      const worldStart = screenToWorld(dragStartRef.current.x, dragStartRef.current.y);
      const worldEnd = screenToWorld(moveEvent.clientX, moveEvent.clientY);
      const worldDeltaX = worldEnd.x - worldStart.x;
      const worldDeltaY = worldEnd.y - worldStart.y;
      
      // 총 드래그 거리 누적
      totalDragRef.current.x += worldDeltaX;
      totalDragRef.current.y += worldDeltaY;
      
      // 스냅 프리뷰 표시 (그리드가 활성화된 경우)
      if (showGrid && gridSize > 0) {
        const currentX = object.type === 'text' ? object.x : object.type === 'guide' ? object.x : 0;
        const currentY = object.type === 'text' ? object.y : object.type === 'guide' ? object.y : 0;
        const predictedX = currentX + totalDragRef.current.x;
        const predictedY = currentY + totalDragRef.current.y;
        
        // 스냅될 위치 계산
        const snappedX = Math.round(predictedX / gridSize) * gridSize;
        const snappedY = Math.round(predictedY / gridSize) * gridSize;
        
        // 스냅 프리뷰 위치를 스크린 좌표로 변환
        const snapScreenPos = worldToScreen(snappedX, snappedY);
        
        setSnapPreview({
          show: true,
          x: snapScreenPos.x,
          y: snapScreenPos.y - (object.type === 'text' ? (object as any).fontSize * scale : 0),
          width: objectSize.width,
          height: objectSize.height
        });
      }
      
      // 실시간으로 자유롭게 이동 (스냅 없음)
      onDrag(worldDeltaX, worldDeltaY);
      dragStartRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setSnapPreview({ show: false, x: 0, y: 0, width: 0, height: 0 }); // 스냅 프리뷰 숨기기
      
      // 드래그 완료 시에만 스냅 적용
      if (onDragEnd && (Math.abs(totalDragRef.current.x) > 0.1 || Math.abs(totalDragRef.current.y) > 0.1)) {
        const currentX = object.type === 'text' ? object.x : object.type === 'guide' ? object.x : 0;
        const currentY = object.type === 'text' ? object.y : object.type === 'guide' ? object.y : 0;
        const finalX = currentX + totalDragRef.current.x;
        const finalY = currentY + totalDragRef.current.y;
        onDragEnd(finalX, finalY);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* 스냅 프리뷰 */}
      <SnapPreview
        isVisible={snapPreview.show}
        x={snapPreview.x}
        y={snapPreview.y}
        width={snapPreview.width}
        height={snapPreview.height}
        theme={theme}
      />
      
      {/* 객체 컨텐츠 */}
      <div
        className="absolute"
        style={{
          left: screenPos.x,
          top: screenPos.y,
          transform: `translate(0, -${object.type === 'text' ? (object as any).fontSize * scale : 0}px)`, // 정확한 baseline 조정
          cursor: isSelected ? 'move' : 'pointer',
          margin: 0,
          padding: 0,
        }}
      >
        <div 
          className="relative pointer-events-auto"
          style={{
            margin: 0,
            padding: 0,
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
          onClick={(e) => {
            // 드래그 중이 아닐 때만 클릭 이벤트 처리
            if (!isDragging) {
              // 링킹 모드가 아닐 때만 이벤트 전파를 막음
              if (!isLinkingMode) {
                e.stopPropagation();
                onClick?.();
              }
              // 링킹 모드일 때는 이벤트가 캔버스로 전파되도록 함
            }
          }}
        >
          {React.cloneElement(children as React.ReactElement, {
            onSizeChange: setObjectSize,
            isHovered: isHovered,
            isMultiSelected: isMultiSelected
          })}
        </div>
      </div>

      {/* 삭제 버튼 - 선택된 객체에만 표시, 별도로 분리하여 하이라이트 박스에 영향 없음 */}
      {isSelected && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: screenPos.x,
            top: screenPos.y,
            transform: `translate(0, -${object.type === 'text' ? (object as any).fontSize * scale : 0}px)`, // 객체와 동일한 위치 기준
            margin: 0,
            padding: 0,
          }}
        >
          <button
            className="absolute pointer-events-auto
                       w-5 h-5 
                       flex items-center justify-center
                       hover:bg-gray-500/10
                       transition-all duration-150
                       rounded-full"
            style={{
              // 객체의 우측 상단 내부에 위치 (하이라이트 박스 안에)
              left: objectSize.width + 2,
              top: 0,
              transform: `scale(${Math.max(0.8, Math.min(1.2, scale))})`, // 스케일에 따른 크기 조정
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-gray-500 hover:text-gray-700"
            >
              <path
                d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};
