interface CacheEntry {
  documentHash: string;
  phase: 'chunks' | 'analyses' | 'sections';
  data: any;
  timestamp: number;
}

export class RAGCache {
  private dbName = 'rag-cache';
  private storeName = 'documents';
  
  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'documentHash' });
        }
      };
    });
  }
  
  async save(documentHash: string, phase: string, data: any): Promise<void> {
    try {
      const db = await this.init();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      
      await store.put({
        documentHash,
        phase,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Cache save failed:', error);
    }
  }
  
  async load(documentHash: string, phase: string): Promise<any | null> {
    try {
      const db = await this.init();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      
      const request = store.get(documentHash);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined;
          if (entry && entry.phase === phase) {
            // Cache válido por 24h
            if (Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) {
              resolve(entry.data);
            }
          }
          resolve(null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Cache load failed:', error);
      return null;
    }
  }
  
  generateHash(content: string): string {
    // Hash simples baseado em tamanho e primeiros 1000 chars
    const sample = content.slice(0, 1000);
    return `${content.length}-${btoa(sample).slice(0, 50)}`;
  }
}
