// Lightweight IndexedDB helper for storing image blobs
const DB_NAME = 'synergy_ai_image_db';
const STORE_NAME = 'images';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImageBlob(id: string, dataUrl: string): Promise<Blob> {
  // Convert DataURL to Blob via fetch for simplicity
  const blob = await fetch(dataUrl).then(r => r.blob());
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return blob;
}

export async function loadImageBlobUrl(id: string): Promise<string | null> {
  const db = await openDB();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function pruneImages(keepIds: string[]): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result as IDBValidKey[];
      for (const key of keys) {
        const id = String(key);
        if (!keepIds.includes(id)) {
          store.delete(key);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// Check storage usage and cleanup if needed
export async function checkAndCleanupStorage(): Promise<void> {
  try {
    // Check localStorage usage
    const localStorageSize = new Blob(Object.values(localStorage)).size;
    const maxLocalStorage = 5 * 1024 * 1024; // 5MB threshold
    
    if (localStorageSize > maxLocalStorage) {
      // Cleanup localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp_') || key.startsWith('video_') || key.startsWith('image_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Check IndexedDB usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      
      // If using more than 80% of quota, cleanup old images
      if (usage > quota * 0.8) {
        await cleanupOldImages();
      }
    }
  } catch (error) {
    console.warn('Storage cleanup failed:', error);
  }
}

// Cleanup old images from IndexedDB (keep only recent ones)
export async function cleanupOldImages(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const keysReq = store.getAllKeys();
      
      keysReq.onsuccess = () => {
        const keys = keysReq.result as IDBValidKey[];
        // Keep only the 20 most recent entries (simple cleanup)
        if (keys.length > 20) {
          const keysToDelete = keys.slice(0, keys.length - 20);
          keysToDelete.forEach(key => store.delete(key));
        }
      };
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) {
    console.warn('IndexedDB cleanup failed:', error);
  }
}

// Auto cleanup function to be called before image operations
export async function prepareStorageForUpload(): Promise<void> {
  try {
    await checkAndCleanupStorage();
    
    // Test if we can still write to localStorage
    const testKey = 'storage_test_' + Date.now();
    const testData = 'x'.repeat(100); // Small test data
    
    try {
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
    } catch (error) {
      // Force cleanup if can't write
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('savedVideos') && !key.includes('auth')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (error) {
    console.warn('Storage preparation failed:', error);
  }
}
