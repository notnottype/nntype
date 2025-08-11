import React from 'react';

interface DebugPanelProps {
  channels: any[];
  allMessages: any[];
  activeChannelId: string | null;
  links: any[];
  theme?: 'light' | 'dark';
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  channels,
  allMessages,
  activeChannelId,
  links,
  theme = 'light'
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 z-50"
        title="Show Debug Panel"
      >
        DEBUG
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 w-80 max-h-96 overflow-auto rounded-lg shadow-lg p-4 z-50 ${
      theme === 'dark' ? 'bg-gray-800 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <h4 className="font-semibold">Channels ({channels.length})</h4>
          <div className="pl-2">
            <div>Active: {activeChannelId || 'none'}</div>
            {channels.map((channel, i) => (
              <div key={i} className="text-gray-600 dark:text-gray-400">
                {channel.id}: {channel.name} ({channel.messageCount})
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Messages ({allMessages.length})</h4>
          <div className="pl-2">
            {allMessages.slice(0, 3).map((msg, i) => (
              <div key={i} className="text-gray-600 dark:text-gray-400 truncate">
                {msg.id}: {msg.content.slice(0, 30)}...
              </div>
            ))}
            {allMessages.length > 3 && (
              <div className="text-gray-500">... and {allMessages.length - 3} more</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Links ({links.length})</h4>
          <div className="pl-2">
            {links.slice(0, 3).map((link, i) => (
              <div key={i} className="text-gray-600 dark:text-gray-400">
                {link.id}: {link.from} → {link.to}
              </div>
            ))}
            {links.length > 3 && (
              <div className="text-gray-500">... and {links.length - 3} more</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold">IndexedDB Status</h4>
          <div className="pl-2 text-gray-600 dark:text-gray-400">
            Available: {typeof indexedDB !== 'undefined' ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  );
};