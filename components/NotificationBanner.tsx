
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationBannerProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto close after 5 seconds
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-slate-900 border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.1)]',
          icon: <CheckCircle size={20} className="text-emerald-400" />,
          text: 'text-emerald-50'
        };
      case 'error':
        return {
          container: 'bg-slate-900 border-red-500/30 shadow-[0_8px_30px_rgb(239,68,68,0.1)]',
          icon: <AlertCircle size={20} className="text-red-400" />,
          text: 'text-red-50'
        };
      default:
        return {
          container: 'bg-slate-900 border-blue-500/30 shadow-[0_8px_30px_rgb(59,130,246,0.1)]',
          icon: <Info size={20} className="text-blue-400" />,
          text: 'text-blue-50'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3.5 rounded-xl border animate-in slide-in-from-top-4 fade-in duration-300 max-w-[90vw] md:max-w-md backdrop-blur-md ${styles.container}`}>
       <div className="shrink-0">{styles.icon}</div>
       <div className={`text-sm font-medium ${styles.text}`}>{message}</div>
       <button 
         onClick={onClose} 
         className="ml-2 pl-2 border-l border-white/10 text-slate-500 hover:text-white transition-colors"
       >
         <X size={16} />
       </button>
    </div>
  );
};
