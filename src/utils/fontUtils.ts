export const loadGoogleFonts = (): Promise<void> => {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    const checkFont = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          const testCanvas = document.createElement('canvas');
          const testCtx = testCanvas.getContext('2d');
          if (testCtx) {
            testCtx.font = '12px "JetBrains Mono", monospace';
            testCtx.fillText('Test', 0, 0);
          }
          setTimeout(() => resolve(), 100);
        });
      } else {
        setTimeout(() => resolve(), 1500);
      }
    };
    checkFont();
  });
};

export const getCurrentLineHeight = (
  selectedObject: any,
  baseFontSize: number,
  scale: number
): number => {
  if (selectedObject && selectedObject.type === 'text') {
    return selectedObject.fontSize * scale * 1.8;
  }
  return baseFontSize * 1.8;
};

export const findFontSizeLevel = (
  currentSize: number,
  fontSizeLevels: number[]
): number => {
  return fontSizeLevels.findIndex(level => Math.abs(level - currentSize) < 0.01);
};

export const findZoomLevel = (
  currentScale: number,
  zoomLevels: number[]
): number => {
  let currentIndex = zoomLevels.findIndex(level => Math.abs(level - currentScale) < 0.01);
  if (currentIndex === -1) {
    currentIndex = zoomLevels.reduce((prev, curr, index) => {
      return (Math.abs(curr - currentScale) < Math.abs(zoomLevels[prev] - currentScale)) ? index : prev;
    }, 0);
  }
  return currentIndex;
};