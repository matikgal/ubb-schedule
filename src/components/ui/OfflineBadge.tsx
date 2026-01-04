import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineBadgeProps {
  isVisible: boolean;
}

/**
 * Badge component that displays when the app is offline
 */
const OfflineBadge: React.FC<OfflineBadgeProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-surface border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
        <WifiOff size={16} className="text-muted" />
        <span className="text-xs font-medium text-muted">Tryb offline</span>
      </div>
    </div>
  );
};

export default OfflineBadge;
