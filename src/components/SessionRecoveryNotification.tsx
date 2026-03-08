import React, { useState, useEffect } from 'react';
import { Download, X, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface SessionRecoveryNotificationProps {
  isVisible: boolean;
  sessionTitle?: string;
  sessionDescription?: string;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
  theme?: 'light' | 'dark';
  autoHideTimeout?: number; // milliseconds, 0 means no auto-hide
}

export const SessionRecoveryNotification: React.FC<SessionRecoveryNotificationProps> = ({
  isVisible,
  sessionTitle = 'Shared Session',
  sessionDescription,
  onAccept,
  onDecline,
  onDismiss,
  theme = 'light',
  autoHideTimeout = 10000 // 10 seconds default
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(autoHideTimeout / 1000);

  // Auto-hide countdown
  useEffect(() => {
    if (!isVisible || autoHideTimeout === 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, autoHideTimeout]);

  // Reset countdown when visibility changes
  useEffect(() => {
    if (isVisible && autoHideTimeout > 0) {
      setTimeRemaining(autoHideTimeout / 1000);
    }
  }, [isVisible, autoHideTimeout]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss();
      setIsClosing(false);
    }, 300); // Animation duration
  };

  const handleAccept = () => {
    onAccept();
    handleDismiss();
  };

  const handleDecline = () => {
    onDecline();
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isClosing ? 'bg-opacity-0' : 'bg-opacity-30'
        }`}
        onClick={handleDismiss}
      />
      
      {/* Notification */}
      <div 
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4 z-50 transition-all duration-300 ${
          isClosing 
            ? 'opacity-0 scale-95 -translate-y-4' 
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        <div className={`rounded-lg shadow-lg border p-4 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-600 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-full ${
              theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <Download className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Load Shared Session</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Someone shared a canvas session with you
              </p>
            </div>
            
            <button
              onClick={handleDismiss}
              className={`p-1 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Session Info */}
          <div className={`p-3 rounded-lg mb-4 ${
            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{sessionTitle}</span>
            </div>
            {sessionDescription && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {sessionDescription}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${
            theme === 'dark'
              ? 'bg-amber-900/20 border border-amber-800/30'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-800 dark:text-amber-200 font-medium">
                This will replace your current session
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Make sure to save your current work before proceeding.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Load Session
            </button>
            
            <button
              onClick={handleDecline}
              className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              Keep Current
            </button>
          </div>

          {/* Auto-dismiss countdown */}
          {autoHideTimeout > 0 && timeRemaining > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Auto-dismissing in {Math.ceil(timeRemaining)}s
              </p>
              <div className={`h-1 rounded-full mt-1 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeRemaining / (autoHideTimeout / 1000)) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};