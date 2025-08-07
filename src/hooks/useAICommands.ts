import { useCallback } from 'react';
import { aiService } from '../services/aiService';
import { AICommand } from '../types';
import useCanvasStore from '../store/canvasStore';

const parseCommand = (text: string): AICommand | null => {
  const trimmedText = text.trim();
  if (trimmedText.startsWith('/gpt ')) {
    const question = trimmedText.substring(5).trim();
    if (question) {
      return { type: 'gpt', question };
    }
  }
  return null;
};

export const useAICommands = () => {
  const {
    currentTypingText,
    setCurrentTypingText,
    canvasObjects,
    setCanvasObjects,
    baseFontSize,
    typewriterX,
    typewriterY,
    setSelectedObjects
  } = useCanvasStore();

  const executeAICommand = useCallback(async (text: string): Promise<boolean> => {
    const command = parseCommand(text);
    if (!command) return false;

    try {
      if (command.type === 'gpt') {
        // Show loading state
        const loadingText = 'AI is thinking...';
        setCurrentTypingText(loadingText);

        // Call AI service (placeholder - aiService.ask method needs to be implemented)
        // const response = await aiService.ask(command.question);
        const response = `AI Response: ${command.question}`; // Placeholder response
        
        if (response) {
          // Create text object with AI response - calculate world position
          const worldX = typewriterX;
          const worldY = typewriterY;
          const newTextObject = {
            id: Date.now(),
            type: 'text' as const,
            x: worldX,
            y: worldY,
            content: response,
            fontSize: baseFontSize,
            scale: 1.0 // Add required scale property
          };

          setCanvasObjects([...canvasObjects, newTextObject]);
          setSelectedObjects([newTextObject]);
          setCurrentTypingText('');
          
          return true;
        } else {
          // Show error message
          setCurrentTypingText('AI service unavailable');
          setTimeout(() => setCurrentTypingText(''), 2000);
          return false;
        }
      }
    } catch (error) {
      console.error('AI command error:', error);
      setCurrentTypingText('AI error occurred');
      setTimeout(() => setCurrentTypingText(''), 2000);
      return false;
    }

    return false;
  }, [
    currentTypingText,
    setCurrentTypingText,
    canvasObjects,
    setCanvasObjects,
    typewriterX,
    typewriterY,
    baseFontSize,
    setSelectedObjects
  ]);

  const isAICommand = useCallback((text: string): boolean => {
    return parseCommand(text) !== null;
  }, []);

  return {
    executeAICommand,
    isAICommand,
    parseCommand
  };
};