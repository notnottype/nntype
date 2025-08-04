/**
 * Text Input Processor for Rich Text Integration
 * Handles markdown and HTML detection/conversion in typewriter input
 */

import { 
  RichTextContent, 
  createRichTextContent, 
  applyMarkdownShortcuts,
  isRichTextContent
} from './richTextUtils';

/**
 * Detect if text contains markdown formatting
 */
export const containsMarkdown = (text: string): boolean => {
  const markdownPatterns = [
    /\*\*.*?\*\*/g,     // **bold**
    /\*.*?\*/g,         // *italic*
    /__.*?__/g,         // __underline__
    /~~.*?~~/g,         // ~~strikethrough~~
    /#+\s/g,            // # headers
    /^\s*[\*\-\+]\s/gm, // * list items
    /^\s*\d+\.\s/gm,    // 1. numbered lists
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
};

/**
 * Detect if text contains HTML tags
 */
export const containsHTML = (text: string): boolean => {
  const htmlPatterns = [
    /<\/?[a-z][\s\S]*>/i,        // HTML tags
    /<strong>.*?<\/strong>/gi,   // <strong>
    /<em>.*?<\/em>/gi,           // <em>
    /<u>.*?<\/u>/gi,             // <u>
    /<s>.*?<\/s>/gi,             // <s>
    /<b>.*?<\/b>/gi,             // <b>
    /<i>.*?<\/i>/gi,             // <i>
  ];

  return htmlPatterns.some(pattern => pattern.test(text));
};

/**
 * Convert HTML to RichTextContent
 */
export const htmlToRichText = (html: string): RichTextContent => {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let plainText = '';
  const spans: Array<{
    text: string;
    start: number;
    end: number;
    style: any;
  }> = [];

  const processNode = (node: Node, currentStyle: any = {}) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const start = plainText.length;
      plainText += text;
      const end = plainText.length;
      
      if (text) {
        spans.push({
          text,
          start,
          end,
          style: { ...currentStyle }
        });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const newStyle = { ...currentStyle };

      // Apply styles based on tag
      switch (element.tagName.toLowerCase()) {
        case 'strong':
        case 'b':
          newStyle.bold = true;
          break;
        case 'em':
        case 'i':
          newStyle.italic = true;
          break;
        case 'u':
          newStyle.underline = true;
          break;
        case 's':
        case 'strike':
        case 'del':
          newStyle.strikethrough = true;
          break;
      }

      // Process inline styles
      if (element.hasAttribute('style')) {
        const style = element.getAttribute('style')!;
        if (style.includes('color:')) {
          const colorMatch = style.match(/color:\s*([^;]+)/);
          if (colorMatch) newStyle.color = colorMatch[1].trim();
        }
        if (style.includes('background-color:')) {
          const bgMatch = style.match(/background-color:\s*([^;]+)/);
          if (bgMatch) newStyle.backgroundColor = bgMatch[1].trim();
        }
        if (style.includes('font-size:')) {
          const sizeMatch = style.match(/font-size:\s*(\d+)px/);
          if (sizeMatch) newStyle.fontSize = parseInt(sizeMatch[1]);
        }
      }

      // Process child nodes
      for (const child of Array.from(element.childNodes)) {
        processNode(child, newStyle);
      }
    }
  };

  // Process all child nodes
  for (const child of Array.from(tempDiv.childNodes)) {
    processNode(child);
  }

  return {
    plainText,
    spans,
    version: 1
  };
};

/**
 * Process text input and convert to RichTextContent
 */
export const processTextInput = (input: string): RichTextContent => {
  // First check for HTML
  if (containsHTML(input)) {
    return htmlToRichText(input);
  }
  
  // Then check for markdown
  if (containsMarkdown(input)) {
    let content = createRichTextContent(input);
    content = applyMarkdownShortcuts(content);
    return content;
  }
  
  // Default: create plain rich text content
  return createRichTextContent(input);
};

/**
 * Check if text input should trigger rich text processing
 */
export const shouldProcessAsRichText = (input: string): boolean => {
  return containsMarkdown(input) || containsHTML(input);
};

/**
 * Legacy compatibility: convert old string content to RichTextContent
 */
export const legacyStringToRichText = (content: string | RichTextContent): RichTextContent => {
  if (isRichTextContent(content)) {
    return content;
  }
  return createRichTextContent(content);
};