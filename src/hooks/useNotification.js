import { useContext } from 'react';
import { NotificationContext } from '../components/NotificationProvider';

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};


