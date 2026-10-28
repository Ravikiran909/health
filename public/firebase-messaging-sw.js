// Firebase Cloud Messaging (FCM) Background Service Worker
// Scripts imported for Firebase Compat library in service worker context
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyFakeKeyForPreviewConfigHealthConnect01",
  authDomain: "healthconnect-ai.firebaseapp.com",
  projectId: "healthconnect-ai",
  storageBucket: "healthconnect-ai.appspot.com",
  messagingSenderId: "439130657356",
  appId: "1:439130657356:web:ce714965d8ce472a"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background FCM message:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'HealthConnect Alert';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'New healthcare notification',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      data: payload.data || {},
      tag: payload.data?.type || 'healthconnect-push',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[firebase-messaging-sw.js] Standard push listener fallback active');
}

// Fallback native push event listener
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || data.notification?.title || 'HealthConnect Notification';
      const options = {
        body: data.body || data.notification?.body || 'You have an update.',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        data: data.data || data,
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch {
      event.waitUntil(
        self.registration.showNotification('HealthConnect Alert', {
          body: event.data.text(),
          icon: '/icon-192.svg',
        })
      );
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
