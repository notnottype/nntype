import React, { useState, useCallback } from 'react';
import { Share, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ShareLinkButtonProps {
  onGenerateLink: () => string;
  theme?: 'light' | 'dark';
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const ShareLinkButton: React.FC<ShareLinkButtonProps> = ({
  onGenerateLink,
  theme = 'light',
  className = '',
  showLabel = false,
  compact = false
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [shareLink, setShareLink] = useState('');

  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);
    setShareStatus('copying');

    try {
      const link = onGenerateLink();
      
      if (!link) {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 3000);
        return;
      }

      setShareLink(link);

      // Try to use native share API first (mobile devices)
      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: 'NNType Session',
            text: 'Check out this NNType canvas session',
            url: link
          });
          setShareStatus('success');
        } catch (shareError) {
          // User cancelled or error - fall back to clipboard
          await handleCopyToClipboard(link);
        }
      } else {
        // Desktop - copy to clipboard
        await handleCopyToClipboard(link);
      }
    } catch (error) {
      console.error('Share error:', error);
      setShareStatus('error');
    } finally {
      setIsSharing(false);
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  }, [isSharing, onGenerateLink]);

  const handleCopyToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus('success');
    } catch (error) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setShareStatus('success');
      } catch (err) {
        setShareStatus('error');
      }
      
      document.body.removeChild(textArea);
    }
  };

  const handleOpenLink = useCallback(() => {
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  }, [shareLink]);

  const getStatusIcon = () => {
    switch (shareStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'copying':
        return <Copy className="w-4 h-4 animate-pulse" />;
      default:
        return <Share className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (shareStatus) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'copying':
        return 'text-blue-500';
      default:
        return theme === 'dark' 
          ? 'text-gray-400 hover:text-white' 
          : 'text-gray-600 hover:text-gray-900';
    }
  };

  const getButtonClass = () => {
    const baseClass = `p-2 rounded-lg transition-colors ${className}`;
    const statusColor = getStatusColor();
    const hoverClass = shareStatus === 'idle' 
      ? (theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100')
      : '';
    
    return `${baseClass} ${statusColor} ${hoverClass}`;
  };

  const getTooltipText = () => {
    switch (shareStatus) {
      case 'success':
        return 'Link copied to clipboard!';
      case 'error':
        return 'Failed to generate share link';
      case 'copying':
        return 'Generating link...';
      default:
        return 'Share session link';
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={getButtonClass()}
        title={getTooltipText()}
      >
        {getStatusIcon()}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`flex items-center gap-2 ${getButtonClass()}`}
        title={getTooltipText()}
      >
        {getStatusIcon()}
        {showLabel && (
          <span className="text-sm">
            {shareStatus === 'success' ? 'Copied!' : 
             shareStatus === 'error' ? 'Error' :
             shareStatus === 'copying' ? 'Sharing...' : 'Share'}
          </span>
        )}
      </button>

      {/* Success popup with link actions */}
      {shareStatus === 'success' && shareLink && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-64">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Link ready to share!</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopyToClipboard(shareLink)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              <Copy className="w-3 h-3" />
              Copy Again
            </button>
            <button
              onClick={handleOpenLink}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {shareStatus === 'error' && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-800 dark:text-red-200">
              Session too large for URL sharing
            </span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            Try exporting as a file instead
          </p>
        </div>
      )}
    </div>
  );
};