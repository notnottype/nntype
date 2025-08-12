/**
 * ActiveChannelIndicator 컴포넌트
 * 입력박스 위쪽에 현재 활성화된 채널들을 표시
 */

import React from 'react';
import { getChannelColor } from '../utils/channelUtils';

// 스크롤바 숨김을 위한 CSS
const scrollableStyle = document.createElement('style');
if (!document.head.querySelector('#channel-scrollbar-hide')) {
  scrollableStyle.id = 'channel-scrollbar-hide';
  scrollableStyle.textContent = `
    .channel-scroll-container::-webkit-scrollbar {
      display: none;
    }
    .channel-scroll-container {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  document.head.appendChild(scrollableStyle);
}

interface ActiveChannelIndicatorProps {
  activeChannels: string[];
  onRemoveChannel?: (channelId: string) => void;
  className?: string;
}

export function ActiveChannelIndicator({ 
  activeChannels, 
  onRemoveChannel,
  className = ""
}: ActiveChannelIndicatorProps) {
  if (activeChannels.length === 0) {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-1 overflow-x-auto channel-scroll-container ${className}`} 
      style={{ 
        maxWidth: '200px'
      }}
    >
      {activeChannels.map((channelId) => (
        <div
          key={channelId}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm flex-shrink-0"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            fontSize: '9px',
            lineHeight: '1',
            fontFamily: '"Inter", system-ui, sans-serif',
            fontWeight: '500',
            color: '#f9fafb',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: getChannelColor(channelId) }}
          />
          <span>{channelId}</span>
          {onRemoveChannel && (
            <button
              onClick={() => onRemoveChannel(channelId)}
              className="ml-1 hover:bg-white hover:bg-opacity-10 rounded-sm w-3 h-3 flex items-center justify-center transition-colors duration-150"
              style={{ fontSize: '9px', color: '#d1d5db' }}
              title={`${channelId} 채널 제거`}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}