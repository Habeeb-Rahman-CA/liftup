/**
 * LiftUp IndexedDB Database Layer
 * Provides persistent offline storage for Exercise Library, Food Library, Workout Schedules,
 * Active Session state, and an Offline Mutation Sync Queue.
 */

const DB_NAME = 'liftup_offline_db';
const DB_VERSION = 1;

export interface SyncQueueItem {
  id?: number;
  actionType:
    | 'CREATE_SET'
    | 'UPDATE_SET'
    | 'DELETE_SET'
    | 'ADD_EXERCISE'
    | 'REMOVE_EXERCISE'
    | 'UPDATE_SESSION'
    | 'COMPLETE_WORKOUT'
    | 'TOGGLE_MEAL';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: any;
  timestamp: number;
  retryCount: number;
}

class OfflineDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Exercise Library Store
        if (!db.objectStoreNames.contains('exercises')) {
          db.createObjectStore('exercises', { keyPath: 'id' });
        }

        // 2. Food / Meals Library Store
        if (!db.objectStoreNames.contains('foods')) {
          db.createObjectStore('foods', { keyPath: 'id' });
        }

        // 3. Workout Schedule & Routines Store
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }

        // 4. Active Workout Session Store (Single Active Session key = 'active_session')
        if (!db.objectStoreNames.contains('active_workout')) {
          db.createObjectStore('active_workout', { keyPath: 'key' });
        }

        // 5. Offline Sync Queue Store (Auto-incrementing ID)
        if (!db.objectStoreNames.contains('sync_queue')) {
          const queueStore = db.createObjectStore('sync_queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Generic Put Item into Store
  async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Put Multiple Items in a single transaction
  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach(item => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Get Item by Key
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get All Items from Store
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as T[]) || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete Item by Key
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear Store
  async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // Specialized Methods for LiftUp Offline App
  // ==========================================

  // 1. Exercises
  async cacheExercises(exercises: any[]): Promise<void> {
    if (!exercises || exercises.length === 0) return;
    await this.putMany('exercises', exercises);
  }

  async getCachedExercises(): Promise<any[]> {
    try {
      return await this.getAll('exercises');
    } catch {
      return [];
    }
  }

  // 2. Foods
  async cacheFoods(foods: any[]): Promise<void> {
    if (!foods || foods.length === 0) return;
    await this.putMany('foods', foods);
  }

  async getCachedFoods(): Promise<any[]> {
    try {
      return await this.getAll('foods');
    } catch {
      return [];
    }
  }

  // 3. Active Workout Session
  async saveActiveSession(session: any): Promise<void> {
    if (!session) {
      await this.delete('active_workout', 'current');
      return;
    }
    await this.put('active_workout', { key: 'current', data: session, updatedAt: Date.now() });
  }

  async getActiveSession(): Promise<any | null> {
    try {
      const record = await this.get<{ key: string; data: any; updatedAt: number }>(
        'active_workout',
        'current',
      );
      return record ? record.data : null;
    } catch {
      return null;
    }
  }

  async clearActiveSession(): Promise<void> {
    try {
      await this.delete('active_workout', 'current');
    } catch (e) {
      console.warn('[OfflineDB] Failed to clear active session:', e);
    }
  }

  // 4. Sync Queue Operations
  async enqueueSyncItem(
    item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>,
  ): Promise<number> {
    const queueItem: SyncQueueItem = {
      ...item,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.add(queueItem);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      return await this.getAll<SyncQueueItem>('sync_queue');
    } catch {
      return [];
    }
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    await this.delete('sync_queue', id);
  }

  async getQueueCount(): Promise<number> {
    const items = await this.getSyncQueue();
    return items.length;
  }
}

export const offlineDB = new OfflineDB();
