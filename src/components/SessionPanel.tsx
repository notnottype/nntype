import React, { useState, useRef } from 'react';
import { 
  Save, 
  Upload, 
  Download, 
  Share, 
  Trash2, 
  Plus, 
  Clock, 
  Settings,
  Link,
  AlertCircle,
  CheckCircle,
  Loader,
  Copy
} from 'lucide-react';
import { SessionState } from '../types';

interface SessionPanelProps {
  sessionState: SessionState;
  onSaveSession: (title?: string, description?: string) => Promise<boolean>;
  onLoadSession: () => Promise<boolean>;
  onCreateNewSession: (title?: string, description?: string) => Promise<boolean>;
  onClearSession: () => void;
  onExportSession: () => string;
  onImportSession: (jsonString: string) => Promise<boolean>;
  onGenerateShareLink: () => string;
  onToggleAutoSave: (enabled?: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({
  sessionState,
  onSaveSession,
  onLoadSession,
  onCreateNewSession,
  onClearSession,
  onExportSession,
  onImportSession,
  onGenerateShareLink,
  onToggleAutoSave,
  isOpen,
  onClose
}) => {
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [showMessage, setShowMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showTemporaryMessage = (type: 'success' | 'error', text: string) => {
    setShowMessage({ type, text });
    setTimeout(() => setShowMessage(null), 3000);
  };

  const handleSave = async () => {
    const success = await onSaveSession();
    showTemporaryMessage(
      success ? 'success' : 'error',
      success ? 'Session saved successfully!' : 'Failed to save session'
    );
  };

  const handleLoad = async () => {
    const success = await onLoadSession();
    showTemporaryMessage(
      success ? 'success' : 'error',
      success ? 'Session loaded successfully!' : 'Failed to load session'
    );
  };

  const handleCreateNew = async () => {
    const success = await onCreateNewSession(newSessionTitle || undefined, newSessionDescription || undefined);
    if (success) {
      setShowNewSessionDialog(false);
      setNewSessionTitle('');
      setNewSessionDescription('');
      showTemporaryMessage('success', 'New session created!');
    } else {
      showTemporaryMessage('error', 'Failed to create new session');
    }
  };

  const handleExport = () => {
    try {
      const data = onExportSession();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nntype-session-${sessionState.metadata?.title || 'untitled'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showTemporaryMessage('success', 'Session exported successfully!');
    } catch (error) {
      showTemporaryMessage('error', 'Failed to export session');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const success = await onImportSession(content);
        showTemporaryMessage(
          success ? 'success' : 'error',
          success ? 'Session imported successfully!' : 'Failed to import session'
        );
      } catch (error) {
        showTemporaryMessage('error', 'Invalid session file');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateShareLink = () => {
    try {
      const link = onGenerateShareLink();
      if (link) {
        setShareLink(link);
        setShowShareDialog(true);
      } else {
        showTemporaryMessage('error', 'Session too large to share via URL');
      }
    } catch (error) {
      showTemporaryMessage('error', 'Failed to generate share link');
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      showTemporaryMessage('success', 'Link copied to clipboard!');
    } catch (error) {
      showTemporaryMessage('error', 'Failed to copy link');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Session Management</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {/* Session Status */}
        <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {sessionState.isLoaded ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="font-medium">
              {sessionState.isLoaded ? 'Session Active' : 'No Active Session'}
            </span>
          </div>
          
          {sessionState.metadata && (
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <div>Title: {sessionState.metadata.title}</div>
              <div>Last saved: {sessionState.lastSaved?.toLocaleString() || 'Never'}</div>
              {sessionState.hasUnsavedChanges && (
                <div className="text-orange-600">Unsaved changes</div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onToggleAutoSave()}
              className={`text-xs px-2 py-1 rounded ${
                sessionState.autoSaveEnabled
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
              }`}
            >
              Auto-save: {sessionState.autoSaveEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={sessionState.isLoading}
            className="w-full flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {sessionState.isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Current Session
          </button>

          <button
            onClick={handleLoad}
            disabled={sessionState.isLoading}
            className="w-full flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {sessionState.isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Load Saved Session
          </button>

          <button
            onClick={() => setShowNewSessionDialog(true)}
            className="w-full flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            <Plus className="w-4 h-4" />
            Create New Session
          </button>

          <div className="border-t pt-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mb-2"
            >
              <Download className="w-4 h-4" />
              Export Session File
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mb-2"
            >
              <Upload className="w-4 h-4" />
              Import Session File
            </button>

            <button
              onClick={handleGenerateShareLink}
              className="w-full flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 mb-2"
            >
              <Share className="w-4 h-4" />
              Generate Share Link
            </button>
          </div>

          <div className="border-t pt-3">
            <button
              onClick={onClearSession}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Clear Session
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />

        {/* Messages */}
        {showMessage && (
          <div className={`mt-4 p-3 rounded-lg ${
            showMessage.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
          }`}>
            {showMessage.text}
          </div>
        )}
      </div>

      {/* New Session Dialog */}
      {showNewSessionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Create New Session</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="My Session"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  onClick={handleCreateNew}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewSessionDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Share Session</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Anyone with this link can view and edit your session:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded bg-gray-50 dark:bg-gray-700 text-sm"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};