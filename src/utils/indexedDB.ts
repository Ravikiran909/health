// IndexedDB utility for HealthConnect AI offline PWA support (Step 8)

const DB_NAME = 'healthconnect_offline_db';
const DB_VERSION = 1;

interface OfflineQueue {
  appointments: any[];
  patients: any[];
  referrals: any[];
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_appointments')) {
        db.createObjectStore('pending_appointments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_patients')) {
        db.createObjectStore('pending_patients', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_referrals')) {
        db.createObjectStore('pending_referrals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached_facilities')) {
        db.createObjectStore('cached_facilities', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addOfflineAppointment(appointment: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_appointments', 'readwrite');
    const store = tx.objectStore('pending_appointments');
    store.put(appointment);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function addOfflinePatient(patient: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_patients', 'readwrite');
    const store = tx.objectStore('pending_patients');
    store.put(patient);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function addOfflineReferral(referral: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending_referrals', 'readwrite');
    const store = tx.objectStore('pending_referrals');
    store.put(referral);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineQueue(): Promise<OfflineQueue> {
  try {
    const db = await openDB();
    const getAll = (storeName: string): Promise<any[]> => {
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    };

    const [appointments, patients, referrals] = await Promise.all([
      getAll('pending_appointments'),
      getAll('pending_patients'),
      getAll('pending_referrals'),
    ]);

    return { appointments, patients, referrals };
  } catch {
    return { appointments: [], patients: [], referrals: [] };
  }
}

export async function clearOfflineQueue(): Promise<void> {
  const db = await openDB();
  const clearStore = (storeName: string): Promise<void> => {
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  };

  await Promise.all([
    clearStore('pending_appointments'),
    clearStore('pending_patients'),
    clearStore('pending_referrals'),
  ]);
}

export async function cacheFacilities(facilities: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cached_facilities', 'readwrite');
    const store = tx.objectStore('cached_facilities');
    facilities.forEach((f) => store.put(f));
  } catch (e) {
    console.warn('Failed to cache facilities into IndexedDB:', e);
  }
}

export async function getCachedFacilities(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('cached_facilities', 'readonly');
      const store = tx.objectStore('cached_facilities');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}
