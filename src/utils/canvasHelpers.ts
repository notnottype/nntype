/**
 * Canvas Helper Functions for Rich Text Integration
 * Provides safe migration utilities for rendering
 */

import { TextObjectType } from '../types';
import { RichTextContent } from '../types/richText';
import { legacyStringToRichText, isRichTextContent } from './richTextUtils';

/**
 * Safely get plain text from TextObjectType content
 */
export const getPlainTextFromContent = (content: RichTextContent): string => {
  return content.plainText;
};

/**
 * Safely get lines from TextObjectType content for backward compatibility
 */
export const getLinesFromTextObject = (textObj: TextObjectType): string[] => {
  const plainText = getPlainTextFromContent(textObj.content);
  return plainText.split('\n');
};

/**
 * Ensure content is RichTextContent
 */
export const ensureRichTextContent = (content: RichTextContent): RichTextContent => {
  return content; // Now all content should be RichTextContent
};

/**
 * Calculate text dimensions with rich text support
 */
export const calculateTextDimensions = (
  textObj: TextObjectType,
  scale: number,
  measureTextWidth: (text: string, fontSize: number) => number
): { width: number; height: number; lines: string[] } => {
  const lines = getLinesFromTextObject(textObj);
  const fontSize = textObj.fontSize * scale;
  const lineHeight = fontSize * 1.6;
  
  let maxWidth = 0;
  lines.forEach(line => {
    const lineWidth = measureTextWidth(line, fontSize);
    maxWidth = Math.max(maxWidth, lineWidth);
  });
  
  const totalHeight = lines.length > 1 
    ? (lines.length - 1) * lineHeight + fontSize 
    : fontSize;
  
  return { width: maxWidth, height: totalHeight, lines };
};