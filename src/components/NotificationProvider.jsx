import React, { createContext, useState } from 'react';

export const NotificationContext = createContext();

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notifications-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function Notification({ message, type }) {
  const colors = {
    success: '#1a1a1a',
    info: '#666666',
    warning: '#ff6b6b',
    error: '#ff6b6b'
  };
  
  return (
    <div 
      className="notification"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: colors[type] || colors.info,
        color: 'white',
        padding: '12px 18px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      {message}
    </div>
  );
}

export default NotificationProvider;
