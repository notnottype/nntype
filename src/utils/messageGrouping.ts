import { ChannelMessage } from '../types';

export interface MessageGroup {
  id: string;
  date: string;
  messages: MessageCluster[];
}

export interface MessageCluster {
  id: string;
  primaryChannel: string;
  timestamp: string;
  messages: ChannelMessage[];
  timeGap: number; // minutes since previous cluster
}

/**
 * Group messages by date and cluster them by time proximity
 */
export function groupMessagesByDate(
  messages: ChannelMessage[], 
  clusterThresholdMinutes: number = 5,
  sortNewestFirst: boolean = false
): MessageGroup[] {
  if (messages.length === 0) return [];

  // Sort messages by timestamp based on preference
  const sortedMessages = [...messages].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortNewestFirst ? timeB - timeA : timeA - timeB;
  });

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;
  let currentCluster: MessageCluster | null = null;

  sortedMessages.forEach((message, index) => {
    const messageDate = new Date(message.timestamp);
    const dateString = formatDateForGrouping(messageDate);
    
    // Check if we need a new date group
    if (!currentGroup || currentGroup.date !== dateString) {
      currentGroup = {
        id: `group_${dateString}`,
        date: dateString,
        messages: []
      };
      groups.push(currentGroup);
      currentCluster = null; // Reset cluster for new date
    }

    // Check if we need a new cluster
    const shouldCreateNewCluster = !currentCluster || 
      shouldStartNewCluster(currentCluster, message, clusterThresholdMinutes);

    if (shouldCreateNewCluster) {
      const timeGap = currentCluster ? 
        Math.floor((messageDate.getTime() - new Date(currentCluster.timestamp).getTime()) / (1000 * 60)) : 0;
      
      currentCluster = {
        id: `cluster_${message.id}`,
        primaryChannel: message.channelIds[0] || 'inbox',
        timestamp: message.timestamp,
        messages: [message],
        timeGap
      };
      currentGroup.messages.push(currentCluster);
    } else {
      // Add to existing cluster
      currentCluster.messages.push(message);
    }
  });

  // If sorting newest first, reverse the groups order and the clusters within each group
  if (sortNewestFirst) {
    return groups.reverse().map(group => ({
      ...group,
      messages: group.messages.reverse()
    }));
  }
  
  return groups;
}

/**
 * Format date for grouping (e.g., "Today", "Yesterday", "Jan 15")
 */
export function formatDateForGrouping(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Determine if we should start a new cluster
 */
function shouldStartNewCluster(
  currentCluster: MessageCluster, 
  newMessage: ChannelMessage, 
  thresholdMinutes: number
): boolean {
  const lastMessage = currentCluster.messages[currentCluster.messages.length - 1];
  const timeDiff = new Date(newMessage.timestamp).getTime() - new Date(lastMessage.timestamp).getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  
  // Different primary channel
  const newPrimaryChannel = newMessage.channelIds[0] || 'inbox';
  if (currentCluster.primaryChannel !== newPrimaryChannel) {
    return true;
  }
  
  // Time gap exceeds threshold
  return minutesDiff > thresholdMinutes;
}

/**
 * Format time for display in clusters
 */
export function formatClusterTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });
}