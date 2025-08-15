import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { removeNotification } from '../store/uiSlice';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const NotificationContainer: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.ui);

  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.type !== 'error') {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div key={notification.id} className={`notification ${notification.type}`}>
          <div className="notification-icon">
            {getIcon(notification.type)}
          </div>
          <div className="notification-content">
            <div className="notification-message">{notification.message}</div>
          </div>
          <button
            onClick={() => dispatch(removeNotification(notification.id))}
            className="notification-close"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
