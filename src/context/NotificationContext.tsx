import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { playChime } from '../utils/speech';
import { requestFcmToken, onForegroundFcmMessage } from '../utils/firebase';

export interface AppNotification {
  id: string;
  recipientRole: 'citizen' | 'asha' | 'doctor' | 'admin' | 'all';
  recipientId?: string;
  title: string;
  kannadaTitle: string;
  body: string;
  kannadaBody: string;
  type: 'APPOINTMENT_REMINDER' | 'NEW_REFERRAL' | 'OVERDUE_FOLLOWUP' | 'EMERGENCY_ALERT' | 'SYNC_STATUS';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  fcmToken: string | null;
  permissionStatus: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  sendPushNotification: (payload: {
    recipientRole: 'citizen' | 'asha' | 'doctor' | 'admin' | 'all';
    recipientId?: string;
    title: string;
    kannadaTitle?: string;
    body: string;
    kannadaBody?: string;
    type?: AppNotification['type'];
    actionUrl?: string;
  }) => Promise<void>;
  sendFcmAppointmentReminder: (params?: {
    patientName?: string;
    facilityName?: string;
    department?: string;
  }) => Promise<void>;
  sendFcmAshaTaskAlert: (params?: {
    patientName?: string;
    taskType?: 'NEW_REFERRAL' | 'OVERDUE_FOLLOWUP';
    details?: string;
  }) => Promise<void>;
  activeToast: AppNotification | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  fcmToken: null,
  permissionStatus: 'default',
  requestPermission: async () => {},
  markAsRead: async () => {},
  sendPushNotification: async () => {},
  sendFcmAppointmentReminder: async () => {},
  sendFcmAshaTaskAlert: async () => {},
  activeToast: null,
  dismissToast: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Check notification support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'granted') {
        initFcmToken();
      }
    } else {
      setPermissionStatus('unsupported');
    }
  }, [currentUser.role, currentUser.id]);

  const initFcmToken = async () => {
    try {
      const token = await requestFcmToken(currentUser.role, currentUser.id);
      if (token) {
        setFcmToken(token);
      }
    } catch (e) {
      console.warn('initFcmToken error:', e);
    }
  };

  // Listen to foreground FCM messages
  useEffect(() => {
    const unsub = onForegroundFcmMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'HealthConnect Alert';
      const body = payload.notification?.body || payload.data?.body || 'New message';

      const fcmNotif: AppNotification = {
        id: `fcm-${Date.now()}`,
        recipientRole: currentUser.role,
        recipientId: currentUser.id,
        title,
        kannadaTitle: title,
        body,
        kannadaBody: body,
        type: (payload.data?.type as any) || 'APPOINTMENT_REMINDER',
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: payload.data?.actionUrl,
      };

      setNotifications((prev) => [fcmNotif, ...prev]);
      setActiveToast(fcmNotif);
      playChime('alert');
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [currentUser.role, currentUser.id]);

  // Request browser push notification permission and register FCM device
  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermissionStatus(res);
        if (res === 'granted') {
          playChime('success');
          const token = await requestFcmToken(currentUser.role, currentUser.id);
          if (token) setFcmToken(token);

          // Dispatch confirmation push
          new Notification(
            language === 'kn' ? 'ಆರೋಗ್ಯ ಸಂಪರ್ಕ AI: FCM ಸಕ್ರಿಯಗೊಂಡಿದೆ' : 'HealthConnect AI: FCM Connected',
            {
              body:
                language === 'kn'
                  ? 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಮತ್ತು ಆಶಾ ಕಾರ್ಯಪಡೆಯ ತುರ್ತು ಸೂಚನೆಗಳು ಇಲ್ಲಿ ಲಭ್ಯವಾಗುತ್ತವೆ.'
                  : 'FCM push notifications active for appointment reminders and ASHA tasks.',
              icon: '/icon-192.svg',
            }
          );
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
  };

  // Fetch notifications for the current user's role
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?role=${currentUser.role}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // Offline fallback
    }
  }, [currentUser.role]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // offline safe
    }
  };

  // Dispatch standard in-app push notification
  const sendPushNotification = async (payload: {
    recipientRole: 'citizen' | 'asha' | 'doctor' | 'admin' | 'all';
    recipientId?: string;
    title: string;
    kannadaTitle?: string;
    body: string;
    kannadaBody?: string;
    type?: AppNotification['type'];
    actionUrl?: string;
  }) => {
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const created: AppNotification = data.notification;
        setNotifications((prev) => [created, ...prev]);

        setActiveToast(created);
        playChime('alert');

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const displayTitle = language === 'kn' ? (created.kannadaTitle || created.title) : created.title;
          const displayBody = language === 'kn' ? (created.kannadaBody || created.body) : created.body;

          new Notification(displayTitle, {
            body: displayBody,
            icon: '/icon-192.svg',
          });
        }
      }
    } catch (err) {
      console.warn('Failed to send push notification:', err);
    }
  };

  // Trigger FCM Appointment Reminder (User targeted)
  const sendFcmAppointmentReminder = async (params?: {
    patientName?: string;
    facilityName?: string;
    department?: string;
  }) => {
    try {
      const res = await fetch('/api/fcm/appointment-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: params?.patientName || currentUser.name.split(' (')[0],
          facilityName: params?.facilityName || 'Bilikere Primary Health Centre',
          department: params?.department || 'Antenatal Care (ANC)',
          userId: currentUser.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const created: AppNotification = data.storedNotification;
        setNotifications((prev) => [created, ...prev]);
        setActiveToast(created);
        playChime('alert');

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(created.title, {
            body: created.body,
            icon: '/icon-192.svg',
          });
        }
      }
    } catch (err) {
      console.warn('FCM Appointment reminder error:', err);
    }
  };

  // Trigger FCM ASHA Task Alert (ASHA worker targeted)
  const sendFcmAshaTaskAlert = async (params?: {
    patientName?: string;
    taskType?: 'NEW_REFERRAL' | 'OVERDUE_FOLLOWUP';
    details?: string;
  }) => {
    try {
      const res = await fetch('/api/fcm/asha-task-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: params?.patientName || 'Kavitha M. Gowda',
          taskType: params?.taskType || 'NEW_REFERRAL',
          details: params?.details,
          ashaId: 'KA-ASHA-042',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const created: AppNotification = data.storedNotification;
        setNotifications((prev) => [created, ...prev]);
        setActiveToast(created);
        playChime('alert');

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(created.title, {
            body: created.body,
            icon: '/icon-192.svg',
          });
        }
      }
    } catch (err) {
      console.warn('FCM ASHA Task alert error:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const dismissToast = () => setActiveToast(null);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fcmToken,
        permissionStatus,
        requestPermission,
        markAsRead,
        sendPushNotification,
        sendFcmAppointmentReminder,
        sendFcmAshaTaskAlert,
        activeToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
