import React, { useMemo, useState } from 'react';
import { Hash, Clock, MessageSquare, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Channel, ChannelMessage, Theme } from '../types';
import { useResizable } from '../hooks/useResizable';
import { groupMessagesByDate, formatClusterTime } from '../utils/messageGrouping';

interface ChannelPanelProps {
  isOpen: boolean;
  channels: Channel[];
  activeChannelId: string | null;
  activeChannelMessages: ChannelMessage[];
  unreadCounts: Map<string, number>;
  onChannelSelect: (channelId: string) => void;
  onClose: () => void;
  onMessageClick: (message: ChannelMessage) => void;
  onMessageHover?: (message: ChannelMessage) => void;
  onMessageLeave?: () => void;
  theme: Theme;
  onWidthChange?: (width: number) => void;
  onLogoClick?: () => void;
}

export function ChannelPanel({
  isOpen,
  channels,
  activeChannelId,
  activeChannelMessages,
  unreadCounts,
  onChannelSelect,
  onClose,
  onMessageClick,
  onMessageHover,
  onMessageLeave,
  theme,
  onWidthChange,
  onLogoClick
}: ChannelPanelProps) {
  const { width, handleMouseDown, isResizing } = useResizable({
    initialWidth: 280,
    minWidth: 240,
    maxWidth: 400,
    onWidthChange
  });

  // Sort order state (true = newest first, false = oldest first)
  const [sortNewestFirst, setSortNewestFirst] = useState(false);

  // Sort and group messages by date and cluster them
  const messageGroups = useMemo(() => {
    // Don't sort here - let groupMessagesByDate handle the sorting based on our preference
    const groups = groupMessagesByDate(activeChannelMessages, 3, sortNewestFirst); // 3 minute threshold, pass sort preference
    
    return groups;
  }, [activeChannelMessages, sortNewestFirst]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`
        fixed inset-y-0 left-0 z-40 flex transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* 패널 콘텐츠 - 미니멀한 스타일 */}
      <div 
        className={`flex flex-col backdrop-blur-sm border-r relative ${
          theme === 'dark' 
            ? 'bg-black/20 border-gray-700/30' 
            : 'bg-white/40 border-gray-200/30'
        }`}
        style={{ width: `${width}px` }}
      >

        {/* 헤더 - 미니멀 스타일 */}
        <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
          theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'
        }`}>
          <div className="flex items-center gap-2">
            <Hash className={`w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <h2 className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white/90' : 'text-gray-900'
            }`}>Channels</h2>
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
        
        {/* 채널 목록 - 미니멀 스타일 */}
        <div className={`flex-none border-b ${
          theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'
        }`}>
          <div className="px-2 py-1">
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {/* View All button */}
              <button
                onClick={() => onChannelSelect('all')}
                className={`
                  w-full flex items-center gap-2 px-2 py-0.5 rounded text-left transition-colors text-sm
                  ${activeChannelId === 'all' 
                    ? theme === 'dark'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-black/5 text-gray-900 border border-black/20'
                    : theme === 'dark'
                      ? 'hover:bg-white/5 text-gray-300 hover:text-white'
                      : 'hover:bg-black/5 text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-500" />
                <span className="font-medium flex-1 min-w-0 truncate">
                  All
                </span>
              </button>
              
              {channels.map(channel => {
                const unreadCount = unreadCounts.get(channel.id) || 0;
                const isActive = channel.id === activeChannelId;
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => onChannelSelect(channel.id)}
                    className={`
                      w-full flex items-center gap-2 px-2 py-0.5 rounded text-left transition-colors text-sm
                      ${isActive 
                        ? theme === 'dark'
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'bg-black/5 text-gray-900 border border-black/20'
                        : theme === 'dark'
                          ? 'hover:bg-white/5 text-gray-300 hover:text-white'
                          : 'hover:bg-black/5 text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: channel.color }}
                    />
                    <span className="font-medium flex-1 min-w-0 truncate">
                      #{channel.name}
                    </span>
                    {channel.messageCount > 0 && (
                      <span className={`text-xs flex-shrink-0 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {channel.messageCount}
                      </span>
                    )}
                    {unreadCount > 0 && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Messages Timeline - Minimal Style */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`px-3 py-1.5 border-b ${
            theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-3.5 h-3.5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <h3 className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white/90' : 'text-gray-900'
                }`}>
                  {activeChannelId === 'all' ? 'All' : activeChannelId ? `#${channels.find(c => c.id === activeChannelId)?.name}` : 'All'}
                </h3>
                {activeChannelMessages.length > 0 && (
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {activeChannelMessages.length}
                  </span>
                )}
              </div>
              
              {/* Sort toggle button */}
              {activeChannelMessages.length > 1 && (
                <button
                  onClick={() => setSortNewestFirst(!sortNewestFirst)}
                  className={`p-1 rounded transition-colors ${
                    theme === 'dark' 
                      ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                      : 'hover:bg-black/5 text-gray-500 hover:text-gray-700'
                  }`}
                  title={sortNewestFirst ? 'Sort oldest first' : 'Sort newest first'}
                >
                  {sortNewestFirst ? 
                    <ArrowDown className="w-3 h-3" /> : 
                    <ArrowUp className="w-3 h-3" />
                  }
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {messageGroups.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
                }`} />
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No messages yet
                </p>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Use +#tags to add
                </p>
              </div>
            ) : (
              messageGroups.map((group, groupIndex) => (
                <div key={group.id} className={groupIndex > 0 ? 'mt-2' : ''}>
                  {/* Date separator */}
                  <div className="flex items-center gap-2 my-1">
                    <div className={`flex-1 h-px ${
                      theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-200/30'
                    }`} />
                    <span className={`text-xs font-medium px-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {group.date}
                    </span>
                    <div className={`flex-1 h-px ${
                      theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-200/30'
                    }`} />
                  </div>

                  {/* Message clusters */}
                  {group.messages.map((cluster, clusterIndex) => {
                    const primaryChannel = channels.find(c => c.id === cluster.primaryChannel);
                    const isAllView = activeChannelId === 'all';
                    
                    return (
                      <div key={cluster.id} className={`${clusterIndex > 0 ? 'mt-1' : ''}`}>
                        {/* Cluster header - show only in individual channel views if time gap > 5 minutes (default 채널 제외) */}
                        {!isAllView && cluster.timeGap > 5 && cluster.primaryChannel !== 'default' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: primaryChannel?.color || '#6b7280' }}
                            />
                            <span className={`text-xs font-medium ${
                              theme === 'dark' ? 'text-white/70' : 'text-gray-700'
                            }`}>
                              #{cluster.primaryChannel}
                            </span>
                            <span className={`text-xs opacity-50 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {formatClusterTime(cluster.timestamp)}
                            </span>
                          </div>
                        )}

                        {/* Messages in cluster */}
                        <div className="space-y-px">
                          {cluster.messages.map((message, messageIndex) => {
                            const isFirstInCluster = messageIndex === 0;
                            const otherChannels = message.channelIds.slice(1);
                            const isAllView = activeChannelId === 'all';
                            
                            // All 뷰에서는 'default' 채널을 제외한 채널들만 표시
                            const displayChannels = isAllView 
                              ? message.channelIds.filter(id => id !== 'default')
                              : message.channelIds;
                            
                            return (
                              <div
                                key={message.id}
                                onClick={() => onMessageClick(message)}
                                onMouseEnter={() => onMessageHover?.(message)}
                                onMouseLeave={() => onMessageLeave?.()}
                                className={`group cursor-pointer px-2 py-1 rounded transition-all duration-150 ${
                                  theme === 'dark'
                                    ? 'hover:bg-white/5 active:bg-white/10'
                                    : 'hover:bg-black/3 active:bg-black/5'
                                }`}
                              >
                                {/* All 뷰: 각 메시지마다 채널과 시간 표시 */}
                                {isAllView && (
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      {displayChannels.length > 0 ? (
                                        <>
                                          <div 
                                            className="w-1 h-1 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: channels.find(c => c.id === displayChannels[0])?.color || '#6b7280' }}
                                          />
                                          <span className={`text-xs truncate ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                          }`}>
                                            #{displayChannels[0]}
                                            {displayChannels.length > 1 && ` +${displayChannels.length - 1}`}
                                          </span>
                                        </>
                                      ) : (
                                        <span className={`text-xs ${
                                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                          •
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-xs flex-shrink-0 opacity-60 ${
                                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    }`}>
                                      {formatClusterTime(message.timestamp)}
                                    </span>
                                  </div>
                                )}

                                {/* 개별 채널 뷰: 기존 클러스터 헤더 표시 (default 채널 제외) */}
                                {!isAllView && isFirstInCluster && cluster.timeGap <= 5 && cluster.primaryChannel !== 'default' && (
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <div 
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: primaryChannel?.color || '#6b7280' }}
                                      />
                                      <span className={`text-xs font-medium truncate ${
                                        theme === 'dark' ? 'text-white/70' : 'text-gray-700'
                                      }`}>
                                        #{cluster.primaryChannel}
                                      </span>
                                      {otherChannels.filter(id => id !== 'default').length > 0 && (
                                        <span className={`text-xs ${
                                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                          +{otherChannels.filter(id => id !== 'default').length}
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-xs flex-shrink-0 opacity-60 ${
                                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    }`}>
                                      {formatClusterTime(message.timestamp)}
                                    </span>
                                  </div>
                                )}

                                {/* Message content */}
                                <div className={`flex items-center justify-between gap-2 ${
                                  isAllView ? 'pl-1' : (isFirstInCluster && cluster.timeGap <= 5 ? 'pl-3' : 'pl-1')
                                }`}>
                                  <p className={`text-sm leading-relaxed flex-1 ${
                                    theme === 'dark' ? 'text-white/90' : 'text-gray-900'
                                  }`}>
                                    {message.content}
                                  </p>
                                  {!isAllView && (
                                    <span className={`text-xs opacity-60 flex-shrink-0 ${
                                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    }`}>
                                      {formatClusterTime(message.timestamp)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 리사이즈 핸들 */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize group ${
            isResizing ? 'bg-blue-500/50' : 'hover:bg-gray-400/50'
          } transition-colors`}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 right-0.5 transform -translate-y-1/2 w-0.5 h-8 bg-gray-400/30 group-hover:bg-gray-600/50 transition-colors" />
        </div>
      </div>
    </div>
  );
}