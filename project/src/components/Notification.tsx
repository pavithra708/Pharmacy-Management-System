import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
    }
  };

  const getBorderColor = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      case 'warning':
        return 'border-yellow-400';
      case 'info':
        return 'border-blue-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg border ${getBackgroundColor(
            notification.type
          )} ${getBorderColor(notification.type)} min-w-[300px] max-w-md animate-slide-in`}
        >
          <div className="flex items-center space-x-3">
            {getIcon(notification.type)}
            <p className="text-gray-700">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer; 