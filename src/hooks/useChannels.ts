import { useState, useCallback, useEffect } from 'react';
import { Channel, ChannelMessage } from '../types';
import { 
  createDefaultChannels, 
  getChannelDisplayName, 
  getChannelColor,
  isValidChannelId
} from '../utils/channelUtils';

/**
 * 채널 시스템 상태 관리 훅
 */
export function useChannels() {
  // 채널들
  const [channels, setChannels] = useState<Map<string, Channel>>(new Map());
  
  // 채널별 메시지들
  const [channelMessages, setChannelMessages] = useState<Map<string, ChannelMessage[]>>(new Map());
  
  // 현재 활성 채널 (기본값을 'all'로 변경)
  const [activeChannelId, setActiveChannelId] = useState<string | null>('all');
  
  // 패널 열림 상태 (기본적으로 열려있음)
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // 읽지 않은 메시지 개수
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  // 초기화: 기본 채널들 설정 (이제 빈 채널 맵으로 시작)
  useEffect(() => {
    const channelsMap = new Map<string, Channel>();
    const messagesMap = new Map<string, ChannelMessage[]>();
    
    // 내부적으로 'default' 채널을 위한 메시지 맵 추가 (화면에는 보이지 않음)
    messagesMap.set('default', []);
    
    setChannels(channelsMap);
    setChannelMessages(messagesMap);
  }, []);

  /**
   * 새 채널을 생성하거나 기존 채널을 반환합니다
   * 'default' 채널은 화면에 보이지 않는 내부 채널입니다
   */
  const createOrGetChannel = useCallback((channelId: string): Channel => {
    // 'default' 채널은 특별 처리 - 화면에 보이지 않음
    if (channelId === 'default') {
      return {
        id: 'default',
        name: 'Default',
        messageCount: 0,
        lastActivity: new Date().toISOString(),
        type: 'default',
        color: '#6b7280'
      };
    }
    
    if (!isValidChannelId(channelId)) {
      throw new Error(`Invalid channel ID: ${channelId}`);
    }
    
    const existing = channels.get(channelId);
    if (existing) {
      return existing;
    }
    
    // 새 채널 생성
    const newChannel: Channel = {
      id: channelId,
      name: getChannelDisplayName(channelId),
      messageCount: 0,
      lastActivity: new Date().toISOString(),
      type: 'personal',
      color: getChannelColor(channelId)
    };
    
    setChannels(prev => new Map(prev).set(channelId, newChannel));
    setChannelMessages(prev => new Map(prev).set(channelId, []));
    
    return newChannel;
  }, [channels]);

  /**
   * 채널에 메시지를 추가합니다
   */
  const addMessage = useCallback((
    textObjectId: number,
    content: string,
    channelIds: string[]
  ): ChannelMessage => {
    const timestamp = new Date().toISOString();
    const messageId = `msg_${textObjectId}_${Date.now()}`;
    
    const message: ChannelMessage = {
      id: messageId,
      textObjectId,
      channelIds,
      content,
      timestamp,
      isFromCanvas: true
    };
    
    // 각 채널에 메시지 추가
    channelIds.forEach(channelId => {
      // 채널이 없으면 생성
      createOrGetChannel(channelId);
      
      // 메시지 추가
      setChannelMessages(prev => {
        const newMap = new Map(prev);
        const messages = newMap.get(channelId) || [];
        newMap.set(channelId, [...messages, message]);
        return newMap;
      });
      
      // 채널 정보 업데이트
      setChannels(prev => {
        const newMap = new Map(prev);
        const channel = newMap.get(channelId);
        if (channel) {
          newMap.set(channelId, {
            ...channel,
            messageCount: channel.messageCount + 1,
            lastActivity: timestamp
          });
        }
        return newMap;
      });
    });
    
    return message;
  }, [createOrGetChannel]);

  /**
   * 채널에서 메시지를 제거합니다
   */
  const removeMessageFromChannels = useCallback((
    messageId: string, 
    channelIds: string[]
  ) => {
    channelIds.forEach(channelId => {
      setChannelMessages(prev => {
        const newMap = new Map(prev);
        const messages = newMap.get(channelId) || [];
        const filtered = messages.filter(msg => msg.id !== messageId);
        newMap.set(channelId, filtered);
        return newMap;
      });
      
      // 채널 메시지 개수 업데이트
      setChannels(prev => {
        const newMap = new Map(prev);
        const channel = newMap.get(channelId);
        if (channel) {
          newMap.set(channelId, {
            ...channel,
            messageCount: Math.max(0, channel.messageCount - 1),
            lastActivity: new Date().toISOString()
          });
        }
        return newMap;
      });
    });
  }, []);

  /**
   * 특정 텍스트 객체의 메시지를 업데이트합니다
   */
  const updateTextObjectMessage = useCallback((
    textObjectId: number,
    newContent: string,
    newChannelIds: string[],
    oldChannelIds: string[] = []
  ) => {
    // 기존 메시지들 찾기
    const existingMessages: ChannelMessage[] = [];
    channelMessages.forEach((messages, channelId) => {
      messages.forEach(msg => {
        if (msg.textObjectId === textObjectId) {
          existingMessages.push(msg);
        }
      });
    });
    
    // 기존 메시지들 제거
    existingMessages.forEach(msg => {
      removeMessageFromChannels(msg.id, msg.channelIds);
    });
    
    // 새 메시지 추가 (내용이 있는 경우만)
    if (newContent.trim() && newChannelIds.length > 0) {
      addMessage(textObjectId, newContent, newChannelIds);
    }
  }, [channelMessages, removeMessageFromChannels, addMessage]);

  /**
   * 모든 메시지들 (시간순)
   * 중복 제거: 같은 textObjectId를 가진 메시지는 하나만 표시
   */
  const allMessages = Array.from(channelMessages.values())
    .flat()
    .reduce((unique, message) => {
      // textObjectId가 같은 메시지가 이미 있는지 확인
      const exists = unique.some(m => m.textObjectId === message.textObjectId);
      if (!exists) {
        unique.push(message);
      }
      return unique;
    }, [] as ChannelMessage[])
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  /**
   * 기존 텍스트 객체에 나중에 채널 태그를 추가/제거합니다
   * (자동태깅이나 수동 태깅에 사용)
   */
  const addChannelsToTextObject = useCallback((
    textObjectId: number,
    content: string,
    channelIdsToAdd: string[]
  ) => {
    if (channelIdsToAdd.length === 0) return;

    // 기존 메시지 찾기
    const currentAllMessages = Array.from(channelMessages.values()).flat();
    const existingMessage = currentAllMessages.find(msg => msg.textObjectId === textObjectId);
    
    if (existingMessage) {
      // 기존 채널 + 새 채널들
      const combinedChannelIds = Array.from(new Set([
        ...existingMessage.channelIds,
        ...channelIdsToAdd
      ]));
      
      updateTextObjectMessage(textObjectId, content, combinedChannelIds);
    } else {
      // 새 메시지로 추가
      addMessage(textObjectId, content, channelIdsToAdd);
    }
  }, [channelMessages, updateTextObjectMessage, addMessage]);

  /**
   * 텍스트 객체에서 특정 채널들을 제거합니다
   */
  const removeChannelsFromTextObject = useCallback((
    textObjectId: number,
    content: string,
    channelIdsToRemove: string[]
  ) => {
    if (channelIdsToRemove.length === 0) return;

    const currentAllMessages = Array.from(channelMessages.values()).flat();
    const existingMessage = currentAllMessages.find(msg => msg.textObjectId === textObjectId);
    
    if (existingMessage) {
      const remainingChannelIds = existingMessage.channelIds.filter(
        channelId => !channelIdsToRemove.includes(channelId)
      );
      
      if (remainingChannelIds.length === 0) {
        // 모든 채널에서 제거 - 메시지 완전 삭제
        removeMessageFromChannels(existingMessage.id, existingMessage.channelIds);
      } else {
        // 일부 채널만 제거
        updateTextObjectMessage(textObjectId, content, remainingChannelIds);
      }
    }
  }, [channelMessages, updateTextObjectMessage, removeMessageFromChannels]);

  /**
   * 활성 채널 변경
   */
  const setActiveChannel = useCallback((channelId: string | null) => {
    setActiveChannelId(channelId);
    
    // 해당 채널의 읽지 않은 메시지 개수 초기화
    if (channelId) {
      setUnreadCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(channelId, 0);
        return newMap;
      });
    }
  }, []);

  /**
   * 패널 토글
   */
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);


  /**
   * 채널 목록 (활동 시간순 정렬)
   */
  const channelList = Array.from(channels.values()).sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  /**
   * 현재 활성 채널의 메시지들
   */
  const activeChannelMessages = activeChannelId 
    ? (channelMessages.get(activeChannelId) || [])
    : [];


  /**
   * Load session data into the channels system
   */
  const loadSessionData = useCallback((sessionChannels: Map<string, any>, sessionMessages: Map<string, any[]>, sessionActiveChannelId: string | null) => {
    setChannels(sessionChannels);
    setChannelMessages(sessionMessages);
    if (sessionActiveChannelId) {
      setActiveChannelId(sessionActiveChannelId);
    }
  }, []);

  /**
   * Clear all channels and messages (for reset functionality)
   */
  const clearAllChannelsAndMessages = useCallback(() => {
    setChannels(new Map());
    setChannelMessages(new Map());
    setActiveChannelId('all');
    setUnreadCounts(new Map());
  }, []);

  return {
    // 상태
    channels: channelList,
    activeChannelId,
    activeChannelMessages,
    allMessages,
    isPanelOpen,
    unreadCounts,
    channelMessages, // Add this so session can access it
    
    // 액션
    createOrGetChannel,
    addMessage,
    removeMessageFromChannels,
    updateTextObjectMessage,
    addChannelsToTextObject,      // 나중에 태그 추가
    removeChannelsFromTextObject, // 나중에 태그 제거  
    setActiveChannel,
    togglePanel,
    loadSessionData,              // Add session loading method
    clearAllChannelsAndMessages,  // Add reset method
    
    // 헬퍼
    getChannelById: (id: string) => channels.get(id),
    getMessagesForChannel: (channelId: string) => channelMessages.get(channelId) || [],
    getTextObjectChannels: (textObjectId: number) => {
      const currentAllMessages = Array.from(channelMessages.values()).flat();
      const message = currentAllMessages.find(msg => msg.textObjectId === textObjectId);
      return message ? message.channelIds : [];
    }
  };
}