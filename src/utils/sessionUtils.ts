/**
 * Session management utilities for channels and canvas state
 * Uses IndexedDB for large-capacity storage and better performance
 */

import { Channel, ChannelMessage, CanvasObject, LinkObject } from '../types';
import {
  saveSessionToDB,
  loadSessionFromDB,
  getAllSessionsMetadata,
  deleteSessionFromDB,
  clearAllSessions,
  getCurrentSessionId,
  setCurrentSessionId,
  getStorageInfo,
  exportSessionAsBlob,
  importSessionFromBlob,
  isIndexedDBAvailable,
  cleanupOldSessions,
  DBSession
} from './indexedDBUtils';

// Session metadata interface
export interface SessionMetadata {
  id: string;
  createdAt: string;
  lastUpdated: string;
  version: string;
  title?: string;
  description?: string;
  userAgent?: string;
}

// Complete session data structure
export interface SessionData {
  metadata: SessionMetadata;
  channels: Map<string, Channel>;
  messages: Map<string, ChannelMessage[]>;
  canvasObjects: CanvasObject[];
  links: LinkObject[];
  activeChannelId: string | null;
}

// Session export format (serializable)
export interface SerializableSessionData {
  metadata: SessionMetadata;
  channels: Array<[string, Channel]>;
  messages: Array<[string, ChannelMessage[]]>;
  canvasObjects: CanvasObject[];
  links: LinkObject[];
  activeChannelId: string | null;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create session metadata
 */
export function createSessionMetadata(title?: string, description?: string): SessionMetadata {
  return {
    id: generateSessionId(),
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    version: '1.0',
    title: title || `Session ${new Date().toLocaleDateString()}`,
    description: description || 'NNType session with channels and messages',
    userAgent: navigator.userAgent
  };
}

/**
 * Save session data to IndexedDB
 */
export async function saveSessionToStorage(sessionData: SessionData): Promise<boolean> {
  try {
    if (!isIndexedDBAvailable()) {
      throw new Error('IndexedDB not available');
    }

    const sessionId = await saveSessionToDB(sessionData);
    await setCurrentSessionId(sessionId);
    
    return true;
  } catch (error) {
    console.error('Failed to save session to IndexedDB:', error);
    return false;
  }
}

/**
 * Load session data from IndexedDB
 */
export async function loadSessionFromStorage(): Promise<SessionData | null> {
  try {
    if (!isIndexedDBAvailable()) {
      return null;
    }

    const currentSessionId = await getCurrentSessionId();
    if (!currentSessionId) {
      return null;
    }

    return await loadSessionFromDB(currentSessionId);
  } catch (error) {
    console.error('Failed to load session from IndexedDB:', error);
    return null;
  }
}

/**
 * Check if a session exists in IndexedDB
 */
export async function hasStoredSession(): Promise<boolean> {
  try {
    if (!isIndexedDBAvailable()) {
      return false;
    }

    const currentSessionId = await getCurrentSessionId();
    return currentSessionId !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Clear session data from IndexedDB
 */
export async function clearSessionStorage(): Promise<void> {
  try {
    if (!isIndexedDBAvailable()) {
      return;
    }

    await clearAllSessions();
    await setCurrentSessionId(null);
  } catch (error) {
    console.error('Failed to clear session storage:', error);
  }
}

/**
 * Export session data as downloadable JSON
 */
export function exportSessionData(sessionData: SessionData): string {
  const serializable: SerializableSessionData = {
    metadata: sessionData.metadata,
    channels: Array.from(sessionData.channels.entries()),
    messages: Array.from(sessionData.messages.entries()),
    canvasObjects: sessionData.canvasObjects,
    links: sessionData.links,
    activeChannelId: sessionData.activeChannelId
  };

  return JSON.stringify(serializable, null, 2);
}

/**
 * Import session data from JSON string
 */
export function importSessionData(jsonString: string): SessionData | null {
  try {
    const serializable: SerializableSessionData = JSON.parse(jsonString);
    
    // Validate the structure
    if (!serializable.metadata || !serializable.metadata.id) {
      throw new Error('Invalid session data format');
    }

    return {
      metadata: serializable.metadata,
      channels: new Map(serializable.channels || []),
      messages: new Map(serializable.messages || []),
      canvasObjects: serializable.canvasObjects || [],
      links: serializable.links || [],
      activeChannelId: serializable.activeChannelId || null
    };
  } catch (error) {
    console.error('Failed to import session data:', error);
    return null;
  }
}

/**
 * Generate shareable session link
 */
export function generateShareableLink(sessionData: SessionData): string {
  try {
    const compressed = exportSessionData(sessionData);
    const encoded = encodeURIComponent(compressed);
    const baseUrl = window.location.origin + window.location.pathname;
    
    // For large sessions, we might need to use a different approach
    // For now, using URL parameters (limited by browser URL length)
    if (encoded.length > 8000) { // Conservative limit for URL length
      console.warn('Session data too large for URL sharing');
      return '';
    }
    
    return `${baseUrl}?session=${encoded}`;
  } catch (error) {
    console.error('Failed to generate shareable link:', error);
    return '';
  }
}

/**
 * Parse session data from URL parameters
 */
export function parseSessionFromUrl(): SessionData | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    
    if (!sessionParam) {
      return null;
    }
    
    const decodedData = decodeURIComponent(sessionParam);
    return importSessionData(decodedData);
  } catch (error) {
    console.error('Failed to parse session from URL:', error);
    return null;
  }
}

/**
 * Create an auto-save mechanism
 */
export function createAutoSave(
  getSessionData: () => SessionData,
  intervalMs: number = 30000 // 30 seconds
): () => void {
  let intervalId: NodeJS.Timeout;

  const startAutoSave = () => {
    intervalId = setInterval(() => {
      const sessionData = getSessionData();
      if (sessionData) {
        saveSessionToStorage(sessionData);
      }
    }, intervalMs);
  };

  const stopAutoSave = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };

  // Start auto-save immediately
  startAutoSave();

  // Return cleanup function
  return stopAutoSave;
}

/**
 * Merge two session data objects
 * Useful for handling conflicts when multiple sessions exist
 */
export function mergeSessionData(
  session1: SessionData,
  session2: SessionData,
  strategy: 'latest' | 'merge' = 'latest'
): SessionData {
  if (strategy === 'latest') {
    // Use the session with the latest update time
    const latest = new Date(session1.metadata.lastUpdated) > new Date(session2.metadata.lastUpdated)
      ? session1
      : session2;
    return latest;
  }

  // Merge strategy (more complex)
  const mergedChannels = new Map([
    ...session1.channels.entries(),
    ...session2.channels.entries()
  ]);

  const mergedMessages = new Map();
  // Merge messages by combining arrays and deduplicating
  for (const [channelId, messages1] of session1.messages.entries()) {
    const messages2 = session2.messages.get(channelId) || [];
    const combined = [...messages1, ...messages2];
    const deduplicated = combined.reduce((acc, msg) => {
      if (!acc.find(existing => existing.id === msg.id)) {
        acc.push(msg);
      }
      return acc;
    }, [] as ChannelMessage[]);
    mergedMessages.set(channelId, deduplicated);
  }

  // Add any channels from session2 that aren't in session1
  for (const [channelId, messages] of session2.messages.entries()) {
    if (!mergedMessages.has(channelId)) {
      mergedMessages.set(channelId, messages);
    }
  }

  // Merge canvas objects and links (simple concatenation with deduplication)
  const mergedCanvasObjects = [...session1.canvasObjects, ...session2.canvasObjects]
    .reduce((acc, obj) => {
      if (!acc.find(existing => existing.id === obj.id)) {
        acc.push(obj);
      }
      return acc;
    }, [] as CanvasObject[]);

  const mergedLinks = [...session1.links, ...session2.links]
    .reduce((acc, link) => {
      if (!acc.find(existing => existing.id === link.id)) {
        acc.push(link);
      }
      return acc;
    }, [] as LinkObject[]);

  return {
    metadata: {
      ...session1.metadata,
      lastUpdated: new Date().toISOString(),
      description: `Merged session: ${session1.metadata.title} + ${session2.metadata.title}`
    },
    channels: mergedChannels,
    messages: mergedMessages,
    canvasObjects: mergedCanvasObjects,
    links: mergedLinks,
    activeChannelId: session1.activeChannelId || session2.activeChannelId
  };
}