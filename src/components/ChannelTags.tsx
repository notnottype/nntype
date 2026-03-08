import React from 'react';
import { X } from 'lucide-react';
import { Channel } from '../types';

interface ChannelTagsProps {
  channelIds: string[];
  channels: Channel[];
  onRemoveChannel?: (channelId: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showRemove?: boolean;
}

/**
 * 채널 태그들을 표시하는 컴포넌트
 * 타이프라이터 주변이나 텍스트 객체 근처에 모던 미니멀하게 표시
 */
export function ChannelTags({ 
  channelIds, 
  channels,
  onRemoveChannel,
  className = '',
  size = 'sm',
  showRemove = false
}: ChannelTagsProps) {
  if (channelIds.length === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3', 
    lg: 'w-3.5 h-3.5'
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {channelIds.map(channelId => {
        const channel = channels.find(c => c.id === channelId);
        const channelColor = channel?.color || '#6b7280';
        const channelName = channel?.name || channelId;
        
        return (
          <div
            key={channelId}
            className={`
              inline-flex items-center gap-1 rounded-full
              bg-white dark:bg-gray-800 
              border border-gray-200 dark:border-gray-600
              shadow-sm
              ${sizeClasses[size]}
              transition-all duration-200 hover:shadow-md
            `}
            style={{
              borderLeftColor: channelColor,
              borderLeftWidth: '3px'
            }}
          >
            {/* 채널 색상 도트 */}
            <div 
              className="rounded-full flex-shrink-0"
              style={{ 
                backgroundColor: channelColor,
                width: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
                height: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px'
              }}
            />
            
            {/* 채널 이름 */}
            <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-20">
              #{channelName}
            </span>
            
            {/* 제거 버튼 (옵션) */}
            {showRemove && onRemoveChannel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveChannel(channelId);
                }}
                className={`
                  flex-shrink-0 rounded-full
                  hover:bg-gray-100 dark:hover:bg-gray-700 
                  text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                  transition-colors p-0.5
                `}
              >
                <X className={iconSizes[size]} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 타이프라이터 입력 중 실시간으로 채널 태그 미리보기를 표시하는 컴포넌트
 */
interface LiveChannelPreviewProps {
  text: string;
  channels: Channel[];
  position: { x: number; y: number };
  className?: string;
}

export function LiveChannelPreview({ 
  text, 
  channels, 
  position, 
  className = '' 
}: LiveChannelPreviewProps) {
  // 실시간으로 태그 파싱 (미리보기용)
  const addChannelRegex = /\+#([a-zA-Z0-9-_가-힣]+)/g;
  const removeChannelRegex = /-#([a-zA-Z0-9-_가-힣]+)/g;
  
  const addChannels: string[] = [];
  const removeChannels: string[] = [];
  
  let match;
  
  while ((match = addChannelRegex.exec(text)) !== null) {
    const channelName = match[1].toLowerCase();
    if (!addChannels.includes(channelName)) {
      addChannels.push(channelName);
    }
  }
  
  while ((match = removeChannelRegex.exec(text)) !== null) {
    const channelName = match[1].toLowerCase();
    if (!removeChannels.includes(channelName)) {
      removeChannels.push(channelName);
    }
  }
  
  if (addChannels.length === 0 && removeChannels.length === 0) return null;

  return (
    <div 
      className={`
        absolute z-50 pointer-events-none
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-600
        rounded-lg shadow-lg p-2
        ${className}
      `}
      style={{
        left: position.x,
        top: position.y - 60, // 타이프라이터 위에 표시
      }}
    >
      {/* 추가될 채널들 */}
      {addChannels.length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium">
            + 추가
          </div>
          <ChannelTags
            channelIds={addChannels}
            channels={channels}
            size="sm"
          />
        </div>
      )}
      
      {/* 제거될 채널들 */}
      {removeChannels.length > 0 && (
        <div>
          <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">
            - 제거
          </div>
          <ChannelTags
            channelIds={removeChannels}
            channels={channels}
            size="sm"
          />
        </div>
      )}
      
      {/* 화살표 */}
      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200 dark:border-t-gray-600" />
    </div>
  );
}