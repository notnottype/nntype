import { useState, useCallback, useEffect, useRef } from 'react';
import { CanvasObject, LinkObject } from '../types';
import {
  SessionData,
  SessionMetadata,
  createSessionMetadata,
  saveSessionToStorage,
  loadSessionFromStorage,
  hasStoredSession,
  clearSessionStorage,
  exportSessionData,
  importSessionData,
  generateShareableLink,
  parseSessionFromUrl,
  createAutoSave,
  mergeSessionData
} from '../utils/sessionUtils';

export interface UseSessionProps {
  channels: Map<string, any>;
  messages: Map<string, any[]>;
  canvasObjects: CanvasObject[];
  links: LinkObject[];
  activeChannelId: string | null;
  onSessionLoad?: (sessionData: SessionData) => void;
}

export interface SessionState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  metadata: SessionMetadata | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  lastSaved: Date | null;
}

/**
 * Session management hook for persisting and sharing canvas and channel state
 */
export function useSession({
  channels,
  messages,
  canvasObjects,
  links,
  activeChannelId,
  onSessionLoad
}: UseSessionProps) {
  // Session state
  const [sessionState, setSessionState] = useState<SessionState>({
    isLoaded: false,
    isLoading: false,
    error: null,
    metadata: null,
    hasUnsavedChanges: false,
    autoSaveEnabled: true,
    lastSaved: null
  });

  // Auto-save cleanup function
  const autoSaveCleanup = useRef<(() => void) | null>(null);

  /**
   * Get current session data
   */
  const getCurrentSessionData = useCallback((): SessionData => {
    const metadata = sessionState.metadata || createSessionMetadata();
    
    return {
      metadata,
      channels,
      messages,
      canvasObjects,
      links,
      activeChannelId
    };
  }, [channels, messages, canvasObjects, links, activeChannelId, sessionState.metadata]);

  /**
   * Save current state to storage
   */
  const saveSession = useCallback(async (title?: string, description?: string): Promise<boolean> => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

      let metadata = sessionState.metadata;
      if (!metadata) {
        metadata = createSessionMetadata(title, description);
      } else {
        metadata = {
          ...metadata,
          lastUpdated: new Date().toISOString(),
          title: title || metadata.title,
          description: description || metadata.description
        };
      }

      const sessionData: SessionData = {
        metadata,
        channels,
        messages,
        canvasObjects,
        links,
        activeChannelId
      };

      const success = await saveSessionToStorage(sessionData);
      
      if (success) {
        setSessionState(prev => ({
          ...prev,
          isLoaded: true,
          isLoading: false,
          metadata,
          hasUnsavedChanges: false,
          lastSaved: new Date()
        }));
      } else {
        throw new Error('Failed to save session');
      }

      return success;
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, [sessionState.metadata, channels, messages, canvasObjects, links, activeChannelId]);

  /**
   * Load session from storage
   */
  const loadSession = useCallback(async (): Promise<boolean> => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

      const sessionData = await loadSessionFromStorage();
      
      if (!sessionData) {
        setSessionState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'No stored session found' 
        }));
        return false;
      }

      // Call the callback to update the application state
      if (onSessionLoad) {
        onSessionLoad(sessionData);
      }

      setSessionState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        metadata: sessionData.metadata,
        hasUnsavedChanges: false,
        lastSaved: new Date(sessionData.metadata.lastUpdated)
      }));

      return true;
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, [onSessionLoad]);

  /**
   * Create a new session
   */
  const createNewSession = useCallback(async (title?: string, description?: string): Promise<boolean> => {
    try {
      // Clear existing session
      clearSessionStorage();

      const metadata = createSessionMetadata(title, description);
      
      setSessionState(prev => ({
        ...prev,
        metadata,
        hasUnsavedChanges: true,
        isLoaded: false
      }));

      // Save the new session
      return await saveSession(title, description);
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, [saveSession]);

  /**
   * Export session as JSON string
   */
  const exportSession = useCallback((): string => {
    const sessionData = getCurrentSessionData();
    return exportSessionData(sessionData);
  }, [getCurrentSessionData]);

  /**
   * Import session from JSON string
   */
  const importSession = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

      const sessionData = importSessionData(jsonString);
      
      if (!sessionData) {
        throw new Error('Invalid session data format');
      }

      // Save to storage
      const success = saveSessionToStorage(sessionData);
      
      if (success && onSessionLoad) {
        onSessionLoad(sessionData);
        
        setSessionState(prev => ({
          ...prev,
          isLoaded: true,
          isLoading: false,
          metadata: sessionData.metadata,
          hasUnsavedChanges: false,
          lastSaved: new Date()
        }));
      }

      return success;
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, [onSessionLoad]);

  /**
   * Generate shareable link for current session
   */
  const generateShareLink = useCallback((): string => {
    const sessionData = getCurrentSessionData();
    return generateShareableLink(sessionData);
  }, [getCurrentSessionData]);

  /**
   * Load session from URL if available
   */
  const loadSessionFromUrl = useCallback(async (): Promise<boolean> => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));

      const sessionData = parseSessionFromUrl();
      
      if (!sessionData) {
        setSessionState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      if (onSessionLoad) {
        onSessionLoad(sessionData);
      }

      setSessionState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        metadata: sessionData.metadata,
        hasUnsavedChanges: false,
        lastSaved: new Date(sessionData.metadata.lastUpdated)
      }));

      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('session');
      window.history.replaceState({}, '', url.toString());

      return true;
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, [onSessionLoad]);

  /**
   * Clear current session
   */
  const clearSession = useCallback(async () => {
    await clearSessionStorage();
    setSessionState({
      isLoaded: false,
      isLoading: false,
      error: null,
      metadata: null,
      hasUnsavedChanges: false,
      autoSaveEnabled: true,
      lastSaved: null
    });
  }, []);

  /**
   * Toggle auto-save functionality
   */
  const toggleAutoSave = useCallback((enabled?: boolean) => {
    const newState = enabled !== undefined ? enabled : !sessionState.autoSaveEnabled;
    
    if (newState && !autoSaveCleanup.current) {
      // Start auto-save
      autoSaveCleanup.current = createAutoSave(getCurrentSessionData, 30000);
    } else if (!newState && autoSaveCleanup.current) {
      // Stop auto-save
      autoSaveCleanup.current();
      autoSaveCleanup.current = null;
    }

    setSessionState(prev => ({
      ...prev,
      autoSaveEnabled: newState
    }));
  }, [sessionState.autoSaveEnabled, getCurrentSessionData]);

  /**
   * Check for unsaved changes
   */
  const checkUnsavedChanges = useCallback(() => {
    if (!sessionState.isLoaded) return;

    // Mark as having unsaved changes if data has changed since last save
    setSessionState(prev => ({
      ...prev,
      hasUnsavedChanges: true
    }));
  }, [sessionState.isLoaded]);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      // First try to load from URL
      const loadedFromUrl = await loadSessionFromUrl();
      
      if (!loadedFromUrl && await hasStoredSession()) {
        // Try to load from storage if no URL session
        await loadSession();
      }
    };

    initializeSession();
  }, [loadSessionFromUrl, loadSession]);

  // Set up auto-save
  useEffect(() => {
    if (sessionState.autoSaveEnabled && sessionState.isLoaded) {
      autoSaveCleanup.current = createAutoSave(getCurrentSessionData, 30000);
    }

    return () => {
      if (autoSaveCleanup.current) {
        autoSaveCleanup.current();
      }
    };
  }, [sessionState.autoSaveEnabled, sessionState.isLoaded, getCurrentSessionData]);

  // Track changes for unsaved state
  useEffect(() => {
    if (sessionState.isLoaded) {
      checkUnsavedChanges();
    }
  }, [channels, messages, canvasObjects, links, activeChannelId, checkUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveCleanup.current) {
        autoSaveCleanup.current();
      }
    };
  }, []);

  return {
    // State
    sessionState,
    
    // Actions
    saveSession,
    loadSession,
    createNewSession,
    clearSession,
    exportSession,
    importSession,
    generateShareLink,
    loadSessionFromUrl,
    toggleAutoSave,

    // Utilities
    hasStoredSession,
    getCurrentSessionData
  };
}