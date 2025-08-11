import { CanvasObject, TextObject, GuideObject } from '../types';

export const createSVGElement = (
  viewBoxMinX: number,
  viewBoxMinY: number,
  viewBoxWidth: number,
  viewBoxHeight: number,
  outputWidth: number,
  outputHeight: number
): SVGSVGElement => {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  
  svg.setAttribute("width", String(outputWidth));
  svg.setAttribute("height", String(outputHeight));
  svg.setAttribute("viewBox", `${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`);
  
  return svg;
};

export const addSVGBackground = (svg: SVGSVGElement, backgroundColor: string = "#ffffff"): void => {
  const svgNS = "http://www.w3.org/2000/svg";
  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", backgroundColor);
  svg.appendChild(bg);
};

export const addTextObjectToSVG = (
  svg: SVGSVGElement,
  textObj: TextObject,
  fillColor: string = "#000000"
): void => {
  const svgNS = "http://www.w3.org/2000/svg";
  const fontSize = textObj.fontSize;
  
  // Handle multi-line text
  const lines = textObj.content.split('\n');
  const lineHeight = fontSize * 1.6;
  
  lines.forEach((line, index) => {
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", String(textObj.x));
    text.setAttribute("y", String(textObj.y + (index * lineHeight)));
    text.setAttribute("font-family", '"JetBrains Mono", monospace');
    text.setAttribute("font-size", String(fontSize));
    text.setAttribute("dominant-baseline", "alphabetic");
    text.setAttribute("fill", fillColor);
    text.textContent = line;
    
    svg.appendChild(text);
  });
};

export const addA4GuideToSVG = (svg: SVGSVGElement, a4Obj: GuideObject): void => {
  const svgNS = "http://www.w3.org/2000/svg";
  
  const a4Rect = document.createElementNS(svgNS, "rect");
  a4Rect.setAttribute("x", String(a4Obj.x));
  a4Rect.setAttribute("y", String(a4Obj.y));
  a4Rect.setAttribute("width", String(a4Obj.width));
  a4Rect.setAttribute("height", String(a4Obj.height));
  a4Rect.setAttribute("stroke", "#888888");
  a4Rect.setAttribute("stroke-width", "2");
  a4Rect.setAttribute("fill", "none");
  a4Rect.setAttribute("stroke-dasharray", "10,5");
  svg.appendChild(a4Rect);

  const a4Text = document.createElementNS(svgNS, "text");
  a4Text.setAttribute("x", String(a4Obj.x + 10));
  a4Text.setAttribute("y", String(a4Obj.y + 20));
  a4Text.setAttribute("font-family", '"Inter", sans-serif');
  a4Text.setAttribute("font-size", "14");
  a4Text.setAttribute("dominant-baseline", "alphabetic");
  a4Text.setAttribute("fill", "#888888");
  a4Text.textContent = 'A4';
  svg.appendChild(a4Text);
};

export const addCurrentTypingTextToSVG = (
  svg: SVGSVGElement,
  currentTypingText: string,
  worldPos: { x: number; y: number },
  baseFontSize: number,
  fillColor: string = "#000000"
): void => {
  if (!currentTypingText.trim()) return;
  
  const svgNS = "http://www.w3.org/2000/svg";
  
  // Handle multi-line text
  const lines = currentTypingText.split('\n');
  const lineHeight = baseFontSize * 1.6;
  
  lines.forEach((line, index) => {
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", String(worldPos.x));
    text.setAttribute("y", String(worldPos.y + (index * lineHeight)));
    text.setAttribute("font-family", '"JetBrains Mono", monospace');
    text.setAttribute("font-size", String(baseFontSize));
    text.setAttribute("dominant-baseline", "alphabetic");
    text.setAttribute("fill", fillColor);
    text.textContent = line;
    
    svg.appendChild(text);
  });
};

export const calculateSVGOutputSize = (
  contentWidth: number,
  contentHeight: number,
  maxSize: number = 1000
): { width: number; height: number } => {
  let outputWidth = contentWidth;
  let outputHeight = contentHeight;

  if (outputWidth > maxSize || outputHeight > maxSize) {
    const aspectRatio = outputWidth / outputHeight;
    if (aspectRatio > 1) {
      outputWidth = maxSize;
      outputHeight = maxSize / aspectRatio;
    } else {
      outputHeight = maxSize;
      outputWidth = maxSize * aspectRatio;
    }
  }

  return { width: outputWidth, height: outputHeight };
};

export const serializeSVG = (svg: SVGSVGElement): string => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
};