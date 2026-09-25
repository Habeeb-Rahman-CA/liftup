/**
 * LiftUp Offline Synchronization Engine
 * Processes the offline mutation queue in FIFO order upon network restoration with
 * strict idempotency (clientOperationId) and automatic temp-ID remapping.
 */

import { offlineDB, SyncQueueItem } from './offline-db';
import { getCookie } from 'cookies-next';
import { TOKEN_COOKIE_KEY } from './api-client';

export type SyncState = 'idle' | 'syncing' | 'offline' | 'synced' | 'error';

export interface SyncStatus {
  state: SyncState;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  error?: string | null;
}

type StatusListener = (status: SyncStatus) => void;

class SyncEngine {
  private status: SyncStatus = {
    state: 'idle',
    isOnline: true,
    pendingCount: 0,
    lastSyncedAt: null,
    error: null,
  };

  private listeners: Set<StatusListener> = new Set();
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.status.isOnline = navigator.onLine;
      this.status.state = navigator.onLine ? 'idle' : 'offline';

      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Initialize pending count
      this.updatePendingCount();
    }
  }

  private handleOnline = () => {
    console.log('[SyncEngine] Network restored (online). Processing idempotent sync queue...');
    this.status.isOnline = true;
    if (this.status.state === 'offline') {
      this.status.state = 'idle';
    }
    this.notify();
    this.processQueue();
  };

  private handleOffline = () => {
    console.log('[SyncEngine] Device went offline.');
    this.status.isOnline = false;
    this.status.state = 'offline';
    this.notify();
  };

  public subscribe(listener: StatusListener): () => void {
    if (typeof navigator !== 'undefined') {
      this.status.isOnline = navigator.onLine;
      if (navigator.onLine && this.status.state === 'offline') {
        this.status.state = 'idle';
      }
    }
    this.listeners.add(listener);
    listener({ ...this.status });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener({ ...this.status }));
  }

  public async updatePendingCount(): Promise<number> {
    const count = await offlineDB.getQueueCount();
    this.status.pendingCount = count;
    if (count === 0 && this.status.state === 'syncing') {
      this.status.state = 'synced';
      this.status.lastSyncedAt = Date.now();
    }
    this.notify();
    return count;
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Process all queued offline mutations sequentially in FIFO order
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.status.state = 'offline';
      this.notify();
      return;
    }

    const queue = await offlineDB.getSyncQueue();
    if (queue.length === 0) {
      this.status.state = 'idle';
      this.status.pendingCount = 0;
      this.notify();
      return;
    }

    this.isProcessing = true;
    this.status.state = 'syncing';
    this.status.pendingCount = queue.length;
    this.status.error = null;
    this.notify();

    try {
      for (const item of queue) {
        if (!item.id) continue;

        try {
          const resData = await this.executeSyncItem(item);

          // If a set was created, remap any subsequent queue items using the tempId
          if (
            item.actionType === 'CREATE_SET' &&
            item.targetEntityId &&
            resData &&
            resData.id &&
            item.targetEntityId !== resData.id
          ) {
            await offlineDB.remapEntityIdInQueue(item.targetEntityId, resData.id);
          }

          // Delete from IndexedDB queue on success
          await offlineDB.removeSyncQueueItem(item.id);
          this.status.pendingCount = Math.max(0, this.status.pendingCount - 1);
          this.notify();
        } catch (err: any) {
          console.error('[SyncEngine] Error syncing item:', item, err);
          // If network failed during sync, pause and wait for next online event
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.status.state = 'offline';
            this.notify();
            break;
          }
          // Increment retry count
          item.retryCount += 1;
          if (item.retryCount > 5) {
            // Drop unrecoverable items after 5 retries
            await offlineDB.removeSyncQueueItem(item.id);
          }
        }
      }

      const remaining = await offlineDB.getQueueCount();
      this.status.pendingCount = remaining;
      this.status.state = remaining === 0 ? 'synced' : 'idle';
      this.status.lastSyncedAt = Date.now();
      this.notify();
    } catch (error: any) {
      this.status.state = 'error';
      this.status.error = error.message || 'Sync failed';
      this.notify();
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeSyncItem(item: SyncQueueItem): Promise<any> {
    const token = getCookie(TOKEN_COOKIE_KEY) as string | undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Operation-Id': item.clientOperationId,
      'X-Idempotency-Key': item.clientOperationId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payloadWithOpId = item.payload
      ? { ...item.payload, clientOperationId: item.clientOperationId }
      : { clientOperationId: item.clientOperationId };

    const response = await fetch(item.endpoint, {
      method: item.method,
      headers,
      body: item.method !== 'DELETE' ? JSON.stringify(payloadWithOpId) : undefined,
    });

    if (!response.ok && response.status !== 404) {
      // 404 is ignored (e.g. if deleting something already deleted)
      const errorText = await response.text().catch(() => '');
      throw new Error(`API Sync Failed (${response.status}): ${errorText}`);
    }

    return response.json().catch(() => ({}));
  }
}

export const syncEngine = new SyncEngine();
