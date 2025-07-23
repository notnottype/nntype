export const calculateZoomOffset = (
  newScale: number,
  currentScale: number,
  currentOffset: { x: number; y: number },
  anchorScreenX: number,
  anchorScreenY: number
) => {
  // 앵커 포인트의 월드 좌표 계산
  const anchorWorldX = (anchorScreenX - currentOffset.x) / currentScale;
  const anchorWorldY = (anchorScreenY - currentOffset.y) / currentScale;
  
  // 새로운 스케일에서 같은 월드 좌표가 같은 화면 위치에 오도록 오프셋 계산
  const newOffsetX = anchorScreenX - anchorWorldX * newScale;
  const newOffsetY = anchorScreenY - anchorWorldY * newScale;
  
  return { x: newOffsetX, y: newOffsetY };
};

export const calculateTextBoxOffset = (
  newScale: number,
  currentScale: number,
  currentOffset: { x: number; y: number },
  typewriterX: number,
  typewriterY: number,
  currentTextBoxWidth: number,
  newTextBoxWidth: number,
  baseFontSize: number
) => {
  // 현재 입력창 LT의 월드 좌표 구하기
  const currentLTScreen = {
    x: typewriterX - currentTextBoxWidth / 2,
    y: typewriterY - baseFontSize / 2
  };
  const currentLTWorld = {
    x: (currentLTScreen.x - currentOffset.x) / currentScale,
    y: (currentLTScreen.y - currentOffset.y) / currentScale
  };

  // 새 scale에서 입력창 LT가 같은 화면 위치에 오도록 offset 계산
  const newLTScreen = {
    x: typewriterX - newTextBoxWidth / 2,
    y: typewriterY - baseFontSize / 2
  };
  
  return {
    x: newLTScreen.x - currentLTWorld.x * newScale,
    y: newLTScreen.y - currentLTWorld.y * newScale
  };
};

export const calculateA4GuidePosition = (
  textBoxWorldCenter: { x: number; y: number },
  textBoxWorldTopLeft: { x: number; y: number },
  actualTextBoxWidth: number,
  TEXT_BOX_WIDTH_MM: number,
  A4_MARGIN_LR_MM: number,
  A4_MARGIN_TOP_MM: number,
  A4_WIDTH_MM: number,
  A4_HEIGHT_MM: number
) => {
  const mmPerPixel = TEXT_BOX_WIDTH_MM / actualTextBoxWidth;
  const a4MarginLRPixels = A4_MARGIN_LR_MM / mmPerPixel;
  const a4WidthWorld = actualTextBoxWidth + (a4MarginLRPixels * 2);
  const a4HeightWorld = a4WidthWorld * (A4_HEIGHT_MM / A4_WIDTH_MM);
  const a4MarginTopPixels = A4_MARGIN_TOP_MM / mmPerPixel;
  
  return {
    x: textBoxWorldCenter.x - a4WidthWorld / 2,
    y: textBoxWorldTopLeft.y - a4MarginTopPixels,
    width: a4WidthWorld,
    height: a4HeightWorld
  };
};

export const calculateDPIPixelsPerMM = (): number => {
  const ruler = document.createElement('div');
  ruler.style.width = '100mm';
  ruler.style.position = 'absolute';
  ruler.style.visibility = 'hidden';
  document.body.appendChild(ruler);
  const measuredPxPerMm = ruler.getBoundingClientRect().width / 100;
  document.body.removeChild(ruler);
  
  return measuredPxPerMm && !Number.isNaN(measuredPxPerMm) ? measuredPxPerMm : 96 / 25.4;
};