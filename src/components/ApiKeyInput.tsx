import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { aiService } from '../services/aiService';
import { Theme } from '../types';

interface ApiKeyInputProps {
  theme: Theme;
  onClose: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ theme, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const currentKey = aiService.getApiKey();
    if (currentKey) {
      setApiKey(currentKey);
      setIsValid(true);
    }
  }, []);

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setIsValid(null);
      return;
    }

    setIsValidating(true);
    try {
      // 간단한 API 호출로 키 유효성 검사
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      
      setIsValid(response.ok);
    } catch (error) {
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      aiService.setApiKey(apiKey.trim());
    } else {
      aiService.setApiKey('');
    }
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setIsValid(null);
    aiService.setApiKey('');
  };

  return (
    <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
      <div
        className={`${
          theme === 'dark'
            ? 'bg-black/90 text-white'
            : 'bg-white text-gray-900'
        } rounded-lg p-6 w-80 shadow-lg border ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}
      >
        <h3 className="text-lg font-normal mb-4">OpenAI API Key</h3>

        <div className="relative mb-4">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setIsValid(null);
            }}
            onBlur={() => validateApiKey(apiKey)}
            placeholder="sk-..."
            className={`w-full px-3 py-2 pr-16 border rounded font-mono text-sm ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:border-gray-400`}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isValidating && (
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
            {!isValidating && isValid !== null && (
              <div className={`w-3 h-3 ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                {isValid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
            )}
            <button
              onClick={() => setShowKey(!showKey)}
              className={`p-1 ${
                theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {isValid === false && (
          <p className="text-red-500 text-xs mb-4">Invalid key</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className={`flex-1 px-3 py-2 text-sm rounded ${
              theme === 'dark'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Save
          </button>
          
          <button
            onClick={handleClear}
            className={`px-3 py-2 text-sm rounded ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Clear
          </button>
          
          <button
            onClick={onClose}
            className={`px-3 py-2 text-sm rounded ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Cancel
          </button>
        </div>

        <p className={`mt-4 text-xs ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        }`}>
          Uses GPT-4o-mini. Your key stays in your browser.{' '}
          <a 
            href="https://platform.openai.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline"
          >
            Get one here
          </a>
        </p>
      </div>
    </div>
  );
};
