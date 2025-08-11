/**
 * IndexedDB utilities for NNType session management
 * Provides robust, large-capacity storage for canvas sessions
 */

import { SessionData, SessionMetadata } from '../types';

const DB_NAME = 'NNTypeDB';
const DB_VERSION = 1;
const SESSION_STORE = 'sessions';
const METADATA_STORE = 'metadata';

// IndexedDB wrapper interface
export interface DBSession {
  id: string;
  metadata: SessionMetadata;
  data: SessionData;
  createdAt: number;
  updatedAt: number;
  size: number; // approximate size in bytes
}

/**
 * Initialize IndexedDB database
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sessions store
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        const sessionStore = db.createObjectStore(SESSION_STORE, { keyPath: 'id' });
        sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create metadata store for app-level data
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Calculate approximate size of session data
 */
function calculateSessionSize(sessionData: SessionData): number {
  try {
    return new Blob([JSON.stringify(sessionData)]).size;
  } catch (error) {
    // Fallback estimation
    const jsonString = JSON.stringify(sessionData);
    return new TextEncoder().encode(jsonString).length;
  }
}

/**
 * Save session to IndexedDB
 */
export async function saveSessionToDB(sessionData: SessionData): Promise<string> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSION_STORE], 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);
    
    const now = Date.now();
    const sessionId = sessionData.metadata.id;
    
    const dbSession: DBSession = {
      id: sessionId,
      metadata: {
        ...sessionData.metadata,
        lastUpdated: new Date().toISOString()
      },
      data: sessionData,
      createdAt: sessionData.metadata.createdAt ? new Date(sessionData.metadata.createdAt).getTime() : now,
      updatedAt: now,
      size: calculateSessionSize(sessionData)
    };

    const request = store.put(dbSession);

    request.onsuccess = () => {
      resolve(sessionId);
    };

    request.onerror = () => {
      reject(new Error('Failed to save session to IndexedDB'));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      reject(new Error('Transaction failed while saving session'));
    };
  });
}

/**
 * Load session from IndexedDB by ID
 */
export async function loadSessionFromDB(sessionId: string): Promise<SessionData | null> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSION_STORE], 'readonly');
    const store = transaction.objectStore(SESSION_STORE);
    const request = store.get(sessionId);

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as DBSession;
      resolve(result ? result.data : null);
    };

    request.onerror = () => {
      reject(new Error('Failed to load session from IndexedDB'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get all sessions metadata (for session list)
 */
export async function getAllSessionsMetadata(): Promise<DBSession[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSION_STORE], 'readonly');
    const store = transaction.objectStore(SESSION_STORE);
    const index = store.index('updatedAt');
    const request = index.getAll();

    request.onsuccess = (event) => {
      const sessions = (event.target as IDBRequest).result as DBSession[];
      // Sort by most recently updated
      sessions.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(sessions);
    };

    request.onerror = () => {
      reject(new Error('Failed to get sessions from IndexedDB'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Delete session from IndexedDB
 */
export async function deleteSessionFromDB(sessionId: string): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSION_STORE], 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);
    const request = store.delete(sessionId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to delete session from IndexedDB'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Clear all sessions
 */
export async function clearAllSessions(): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSION_STORE], 'readwrite');
    const store = transaction.objectStore(SESSION_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to clear sessions from IndexedDB'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get current active session ID from metadata
 */
export async function getCurrentSessionId(): Promise<string | null> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.get('currentSessionId');

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      resolve(result ? result.value : null);
    };

    request.onerror = () => {
      reject(new Error('Failed to get current session ID'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Set current active session ID
 */
export async function setCurrentSessionId(sessionId: string | null): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);
    
    const data = {
      key: 'currentSessionId',
      value: sessionId,
      updatedAt: Date.now()
    };

    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Failed to set current session ID'));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Get database storage info
 */
export async function getStorageInfo(): Promise<{
  usage: number;
  quota: number;
  sessionsCount: number;
  totalSize: number;
}> {
  try {
    // Get storage quota (if available)
    const storageEstimate = await navigator.storage?.estimate?.() || { usage: 0, quota: 0 };
    
    // Get sessions info
    const sessions = await getAllSessionsMetadata();
    const totalSize = sessions.reduce((sum, session) => sum + session.size, 0);

    return {
      usage: storageEstimate.usage || 0,
      quota: storageEstimate.quota || 0,
      sessionsCount: sessions.length,
      totalSize
    };
  } catch (error) {
    return {
      usage: 0,
      quota: 0,
      sessionsCount: 0,
      totalSize: 0
    };
  }
}

/**
 * Export session as JSON blob
 */
export async function exportSessionAsBlob(sessionId: string): Promise<Blob> {
  const sessionData = await loadSessionFromDB(sessionId);
  if (!sessionData) {
    throw new Error('Session not found');
  }

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    sessionData
  };

  return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
}

/**
 * Import session from JSON blob
 */
export async function importSessionFromBlob(blob: Blob): Promise<string> {
  const text = await blob.text();
  const importData = JSON.parse(text);
  
  if (!importData.sessionData) {
    throw new Error('Invalid session file format');
  }

  const sessionData: SessionData = importData.sessionData;
  
  // Generate new ID to avoid conflicts
  sessionData.metadata.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionData.metadata.lastUpdated = new Date().toISOString();

  return await saveSessionToDB(sessionData);
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch (error) {
    return false;
  }
}

/**
 * Cleanup old sessions (keep only latest N sessions)
 */
export async function cleanupOldSessions(keepCount: number = 10): Promise<number> {
  const sessions = await getAllSessionsMetadata();
  
  if (sessions.length <= keepCount) {
    return 0;
  }

  const sessionsToDelete = sessions.slice(keepCount);
  let deletedCount = 0;

  for (const session of sessionsToDelete) {
    try {
      await deleteSessionFromDB(session.id);
      deletedCount++;
    } catch (error) {
      console.warn(`Failed to delete session ${session.id}:`, error);
    }
  }

  return deletedCount;
}