import { useCallback, useRef } from 'react';
import { CanvasObject, TextObject, GuideObject, CanvasMode, PinPosition, LinkState, SelectionState, LinkObject, SelectionRectangle } from '../types';
import { 
  snapToGrid,
  isPointInObject,
  createSelectionRectangle,
  getObjectsInSelectionRect,
  debounce,
  throttle
} from '../utils';
import { 
  createLink,
  areObjectsLinked,
  findObjectAtPin,
  updatePinPosition
} from '../utils/modeUtils';
import { findLinkAtPosition } from '../utils/linkUtils';
import useCanvasStore from '../store/canvasStore';

// Helper function to check if object has position properties
const hasPosition = (obj: CanvasObject): obj is TextObject | GuideObject => {
  return obj.type === 'text' || obj.type === 'guide';
};

export const useInfiniteCanvasEvents = () => {
  const {
    canvasObjects,
    setCanvasObjects,
    selectedObjects,
    setSelectedObjects,
    selectObject,
    deselectObject,
    clearSelection,
    links,
    addLink,
    deleteLink,
    isDragging,
    setIsDragging,
    isDraggingText,
    setIsDraggingText,
    dragStart,
    setDragStart,
    scale,
    canvasOffset,
    setCanvasOffset,
    isSelecting,
    setIsSelecting,
    selectionRect,
    setSelectionRect,
    currentMode,
    baseFontSize,
    pinPosition,
    setPinPosition,
    linkState,
    setLinkState,
    selectionState,
    setSelectionState,
    hoveredObject,
    setHoveredObject,
    hoveredLink,
    setHoveredLink,
    pinHoveredObject,
    setPinHoveredObject,
    selectedLinks,
    setSelectedLinks
  } = useCanvasStore();

  // 스로틀링된 콘솔 출력 함수
  const throttledConsoleLog = useRef(
    throttle((data: any) => {
      console.log('🔗 링크 프리뷰 패스 계산:', data);
    }, 100) // 100ms마다 최대 1번만 콘솔 출력
  ).current;

  // 디바운스된 프리뷰 패스 계산 함수
  const debouncedPreviewPathCalculation = useRef(
    debounce((mouseX: number, mouseY: number) => {
      if (currentMode === CanvasMode.LINK && linkState.isCreating && linkState.sourceObjectId) {
        const worldPos = { x: (mouseX - canvasOffset.x) / scale, y: (mouseY - canvasOffset.y) / scale };
        
        // 스로틀링된 콘솔 출력
        throttledConsoleLog({
          sourceObjectId: linkState.sourceObjectId,
          mouseWorldPos: worldPos,
          mouseScreenPos: { x: mouseX, y: mouseY },
          scale,
          canvasOffset,
          timestamp: new Date().toISOString()
        });
        
        // 프리뷰 패스 업데이트
        const newPreviewPath = {
          from: pinPosition,
          to: { x: mouseX, y: mouseY, worldX: worldPos.x, worldY: worldPos.y }
        };
        
        console.log('🔗 프리뷰 패스 업데이트:', newPreviewPath);
        
        setLinkState({
          ...linkState,
          previewPath: newPreviewPath
        });
      }
    }, 16) // 약 60fps에 해당하는 16ms 디바운스
  ).current;

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 핀 호버 링크 초기화
    setPinHoveredObject(null);

    // 핀 위치 업데이트 로직
    if (currentMode === CanvasMode.LINK) {
      const worldPos = { x: (mouseX - canvasOffset.x) / scale, y: (mouseY - canvasOffset.y) / scale };
      const clickedObject = canvasObjects.find(obj => {
        return isPointInObject(obj, mouseX, mouseY, scale, 
          (worldX: number, worldY: number) => ({ x: worldX * scale + canvasOffset.x, y: worldY * scale + canvasOffset.y }), 
          (text: string, fontSize: number) => text.length * fontSize * 0.6
        );
      });

      if (clickedObject) {
        const newPinPosition = updatePinPosition(
          { x: mouseX, y: mouseY, worldX: worldPos.x, worldY: worldPos.y },
          0, // deltaX
          0, // deltaY
          canvasOffset,
          scale
        );
        setPinPosition(newPinPosition);

        // 링크 생성 로직
        if (!linkState.isCreating) {
          // 초기 프리뷰 패스 설정
          const initialPreviewPath = {
            from: newPinPosition,
            to: newPinPosition // 시작할 때는 같은 위치
          };
          
          setLinkState({ 
            sourceObjectId: clickedObject.id.toString(), 
            isCreating: true,
            previewPath: initialPreviewPath 
          });
        } else if (linkState.sourceObjectId !== clickedObject.id.toString()) {
          const sourceObject = canvasObjects.find(obj => obj.id.toString() === linkState.sourceObjectId);
          
          if (sourceObject && !areObjectsLinked(sourceObject.id.toString(), clickedObject.id.toString(), links)) {
            const newLink = createLink(sourceObject.id.toString(), clickedObject.id.toString());
            addLink(newLink);
          }
          
          setLinkState({ sourceObjectId: null, targetObjectId: null, isCreating: false, previewPath: null });
        }
      } else {
        setLinkState({ sourceObjectId: null, targetObjectId: null, isCreating: false, previewPath: null });
      }
      return;
    }

    // 링크 클릭 체크 (SELECT 모드에서만)
    if (currentMode === CanvasMode.SELECT) {
      const worldPos = { x: (mouseX - canvasOffset.x) / scale, y: (mouseY - canvasOffset.y) / scale };
      const clickedLink = findLinkAtPosition(
        worldPos, 
        links, 
        canvasObjects, 
        10,
        (text: string, fontSize: number) => text.length * fontSize * 0.6
      );

      if (clickedLink) {
        const newSelectedLinks = new Set(selectedLinks);
        if (e.ctrlKey || e.metaKey) {
          if (newSelectedLinks.has(clickedLink.id)) {
            newSelectedLinks.delete(clickedLink.id);
          } else {
            newSelectedLinks.add(clickedLink.id);
          }
        } else {
          newSelectedLinks.clear();
          newSelectedLinks.add(clickedLink.id);
        }
        setSelectedLinks(newSelectedLinks);
        clearSelection(); // 텍스트 객체 선택 해제
        return;
      }
    }

    // 일반 객체 클릭 처리
    const clickedObject = canvasObjects.find(obj => 
      isPointInObject(obj, mouseX, mouseY, scale, 
        (worldX: number, worldY: number) => ({ x: worldX * scale + canvasOffset.x, y: worldY * scale + canvasOffset.y }), 
        (text: string, fontSize: number) => text.length * fontSize * 0.6
      )
    );

    if (clickedObject) {
      if (currentMode === CanvasMode.SELECT) {
        if (e.ctrlKey || e.metaKey) {
          // 멀티 선택 모드
          if (selectedObjects.some(obj => obj.id === clickedObject.id)) {
            deselectObject(clickedObject.id);
          } else {
            selectObject(clickedObject.id);
          }
        } else {
          // 단일 선택 모드
          if (!selectedObjects.some(obj => obj.id === clickedObject.id)) {
            clearSelection();
            selectObject(clickedObject.id);
          }
          
          if (hasPosition(clickedObject)) {
            setIsDraggingText(true);
            setDragStart({ x: mouseX, y: mouseY });
          }
        }
      } else if (currentMode === CanvasMode.TYPOGRAPHY) {
        clearSelection();
        selectObject(clickedObject.id);
        
        if (hasPosition(clickedObject)) {
          setIsDraggingText(true);
          setDragStart({ x: mouseX, y: mouseY });
        }
      }
    } else {
      // 빈 공간 클릭
      if (currentMode === CanvasMode.SELECT && !linkState.isCreating) {
        clearSelection();
        setSelectedLinks(new Set());
        
        // 선택 영역 시작
        setIsSelecting(true);
        const initialRect = createSelectionRectangle(mouseX, mouseY, mouseX, mouseY);
        setSelectionRect(initialRect);
      }
      
      setDragStart({ x: mouseX, y: mouseY });
      setIsDragging(true);
    }
  }, [
    canvasObjects, selectedObjects, links, scale, canvasOffset, currentMode, baseFontSize,
    linkState, selectedLinks, pinPosition, selectionRect,
    setCanvasObjects, setSelectedObjects, selectObject, deselectObject, clearSelection,
    addLink, deleteLink, setIsDragging, setIsDraggingText, setDragStart,
    setIsSelecting, setSelectionRect, setPinPosition, setLinkState,
    setSelectedLinks, setPinHoveredObject
  ]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 링크 모드에서 핀 호버 처리 및 프리뷰 패스 계산
    if (currentMode === CanvasMode.LINK && linkState.isCreating) {
      const worldPos = { x: (mouseX - canvasOffset.x) / scale, y: (mouseY - canvasOffset.y) / scale };
      const objectUnderMouse = canvasObjects.find(obj => 
        isPointInObject(obj, mouseX, mouseY, scale, 
          (worldX: number, worldY: number) => ({ x: worldX * scale + canvasOffset.x, y: worldY * scale + canvasOffset.y }), 
          (text: string, fontSize: number) => text.length * fontSize * 0.6
        ) && obj.id.toString() !== linkState.sourceObjectId
      );
      setPinHoveredObject(objectUnderMouse || null);
      
      // 디바운스된 프리뷰 패스 계산 호출
      debouncedPreviewPathCalculation(mouseX, mouseY);
    }

    // 링크 호버 처리 (드래그 중이 아닐 때만)
    if (!isDragging && !isDraggingText) {
      const worldPos = { x: (mouseX - canvasOffset.x) / scale, y: (mouseY - canvasOffset.y) / scale };
      const hoveredLinkAtPosition = findLinkAtPosition(
        worldPos, 
        links, 
        canvasObjects, 
        10 / scale, 
        (text: string, fontSize: number) => text.length * fontSize * 0.6
      );
      setHoveredLink(hoveredLinkAtPosition);
    }

    // 일반 호버 처리
    const objectUnderMouse = canvasObjects.find(obj => 
      isPointInObject(obj, mouseX, mouseY, scale, 
        (worldX: number, worldY: number) => ({ x: worldX * scale + canvasOffset.x, y: worldY * scale + canvasOffset.y }), 
        (text: string, fontSize: number) => text.length * fontSize * 0.6
      )
    );
    setHoveredObject(objectUnderMouse || null);

    // 드래그 처리
    if (isDraggingText && selectedObjects.length > 0) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      const worldDeltaX = deltaX / scale;
      const worldDeltaY = deltaY / scale;

      if (selectedObjects.length > 1) {
        // 멀티 선택 드래그
        const selectedIds = selectedObjects.map(obj => obj.id);
        setCanvasObjects(canvasObjects.map(obj => 
          selectedIds.includes(obj.id) && hasPosition(obj)
            ? { ...obj, x: obj.x + worldDeltaX, y: obj.y + worldDeltaY }
            : obj
        ));
        
        setSelectedObjects(selectedObjects.map(obj => 
          hasPosition(obj) 
            ? { ...obj, x: obj.x + worldDeltaX, y: obj.y + worldDeltaY }
            : obj
        ));
      } else if (selectedObjects.length === 1) {
        // 단일 선택 드래그
        const selectedObj = selectedObjects[0];
        if (hasPosition(selectedObj)) {
          const updatedObj = { ...selectedObj, x: selectedObj.x + worldDeltaX, y: selectedObj.y + worldDeltaY };
          
          setCanvasObjects(canvasObjects.map(obj => 
            obj.id === selectedObj.id ? updatedObj : obj
          ));
          setSelectedObjects([updatedObj]);
        }
      }
      
      setDragStart({ x: mouseX, y: mouseY });
    } else if (isSelecting && selectionRect) {
      // 선택 영역 업데이트
      const updatedRect = createSelectionRectangle(
        dragStart.x, 
        dragStart.y, 
        mouseX, 
        mouseY
      );
      setSelectionRect(updatedRect);
    } else if (isDragging && !isDraggingText) {
      // 캔버스 패닝
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      
      setCanvasOffset({
        x: canvasOffset.x + deltaX,
        y: canvasOffset.y + deltaY
      });
      
      setDragStart({ x: mouseX, y: mouseY });
    }
  }, [
    canvasObjects, selectedObjects, links, scale, canvasOffset, currentMode, linkState,
    isDraggingText, isDragging, isSelecting, dragStart, selectionRect,
    setCanvasObjects, setSelectedObjects, setCanvasOffset, setDragStart,
    setSelectionRect, setHoveredObject, setPinHoveredObject, setHoveredLink,
    debouncedPreviewPathCalculation, throttledConsoleLog
  ]);

  const handleMouseUp = useCallback(() => {
    // 드래그 완료 시 그리드 스냅 적용
    if (isDraggingText) {
      const worldGridSize = baseFontSize / scale;
      
      if (selectedObjects.length > 1) {
        // 멀티 선택 그리드 스냅
        const positionedObjects = selectedObjects.filter(hasPosition);
        if (positionedObjects.length > 0) {
          const referenceObj = positionedObjects[0];
          const snappedWorldX = snapToGrid(referenceObj.x, worldGridSize);
          const snappedWorldY = snapToGrid(referenceObj.y, worldGridSize);
          const snapDeltaX = snappedWorldX - referenceObj.x;
          const snapDeltaY = snappedWorldY - referenceObj.y;
          
          if (snapDeltaX !== 0 || snapDeltaY !== 0) {
            const selectedIds = selectedObjects.map(obj => obj.id);
            setCanvasObjects(canvasObjects.map(obj => 
              selectedIds.includes(obj.id) && hasPosition(obj)
                ? { ...obj, x: obj.x + snapDeltaX, y: obj.y + snapDeltaY }
                : obj
            ));
            
            setSelectedObjects(selectedObjects.map(obj => 
              hasPosition(obj)
                ? { ...obj, x: obj.x + snapDeltaX, y: obj.y + snapDeltaY }
                : obj
            ));
          }
        }
      } else if (selectedObjects.length === 1) {
        // 단일 선택 그리드 스냅
        const selectedObj = selectedObjects[0];
        if (hasPosition(selectedObj)) {
          const snappedWorldX = snapToGrid(selectedObj.x, worldGridSize);
          const snappedWorldY = snapToGrid(selectedObj.y, worldGridSize);
          
          if (snappedWorldX !== selectedObj.x || snappedWorldY !== selectedObj.y) {
            const snappedObj = { ...selectedObj, x: snappedWorldX, y: snappedWorldY };
            
            setCanvasObjects(canvasObjects.map(obj => 
              obj.id === selectedObj.id ? snappedObj : obj
            ));
            setSelectedObjects([snappedObj]);
          }
        }
      }
    } else if (isSelecting && selectionRect) {
      // 선택 영역 내 객체들 선택
      const objectsInSelection = getObjectsInSelectionRect(
        canvasObjects,
        selectionRect,
        scale,
        canvasOffset,
        (text: string, fontSize: number) => text.length * fontSize * 0.6
      );
      
      if (objectsInSelection.length > 0) {
        setSelectedObjects(objectsInSelection);
      } else {
        clearSelection();
      }
      
      setSelectionRect(null);
    }
    
    // 상태 초기화
    setIsDragging(false);
    setIsDraggingText(false);
    setIsSelecting(false);
  }, [
    isDraggingText, isSelecting, selectedObjects, canvasObjects, selectionRect,
    baseFontSize, scale, canvasOffset,
    setCanvasObjects, setSelectedObjects, clearSelection, setSelectionRect,
    setIsDragging, setIsDraggingText, setIsSelecting
  ]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const zoomFactor = 1.1;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 마우스 위치를 앵커로 사용한 줌
    const mouseWorldX = (mouseX - canvasOffset.x) / scale;
    const mouseWorldY = (mouseY - canvasOffset.y) / scale;
    
    const newScale = e.deltaY > 0 ? scale / zoomFactor : scale * zoomFactor;
    const clampedScale = Math.max(0.1, Math.min(5.0, newScale));
    
    if (clampedScale !== scale) {
      const newOffsetX = mouseX - mouseWorldX * clampedScale;
      const newOffsetY = mouseY - mouseWorldY * clampedScale;
      
      // 상태 업데이트를 Zustand를 통해 수행
      useCanvasStore.setState({
        scale: clampedScale,
        canvasOffset: { x: newOffsetX, y: newOffsetY }
      });
    }
  }, [scale, canvasOffset]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel
  };
};
