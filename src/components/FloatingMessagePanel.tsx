import React from 'react';
import { Clock, MessageSquare, X } from 'lucide-react';
import { Channel, ChannelMessage, Theme } from '../types';

interface FloatingMessagePanelProps {
  isOpen: boolean;
  channel: Channel | null;
  messages: ChannelMessage[];
  onClose: () => void;
  onMessageClick: (message: ChannelMessage) => void;
  onMessageHover?: (message: ChannelMessage) => void;
  onMessageLeave?: () => void;
  theme: Theme;
}

export function FloatingMessagePanel({
  isOpen,
  channel,
  messages,
  onClose,
  onMessageClick,
  onMessageHover,
  onMessageLeave,
  theme
}: FloatingMessagePanelProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return '방금';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !channel) return null;

  return (
    <div 
      className={`
        fixed top-16 right-4 z-50 w-80 max-h-96 flex flex-col
        backdrop-blur-sm border rounded-lg shadow-lg
        transition-all duration-300 ease-in-out
        ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
        ${theme === 'dark' 
          ? 'bg-black/20 border-gray-700/30' 
          : 'bg-white/40 border-gray-200/30'
        }
      `}
    >
      {/* 헤더 */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'
      }`}>
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: channel.color }}
          />
          <h3 className={`text-sm font-medium ${
            theme === 'dark' ? 'text-white/90' : 'text-gray-900'
          }`}>
            #{channel.name}
          </h3>
          {messages.length > 0 && (
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {messages.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
              : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              메시지가 없습니다
            </p>
            <p className={`text-xs mt-1 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              +#태그로 추가하세요
            </p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              onClick={() => onMessageClick(message)}
              onMouseEnter={() => onMessageHover?.(message)}
              onMouseLeave={() => onMessageLeave?.()}
              className={`group cursor-pointer p-2 rounded transition-colors text-xs ${
                theme === 'dark'
                  ? 'hover:bg-white/5 border border-transparent hover:border-white/10'
                  : 'hover:bg-black/3 border border-transparent hover:border-black/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-xs truncate ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </span>
                <Clock className={`w-3 h-3 flex-shrink-0 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`} />
              </div>
              
              <div>
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-white/80' : 'text-gray-800'
                }`}>
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}