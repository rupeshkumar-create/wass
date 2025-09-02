/**
 * Data synchronization utilities for real-time updates between admin panel and homepage
 */

// Event types for data synchronization
export type DataSyncEvent = 
  | 'nomination-updated'
  | 'vote-cast'
  | 'stats-updated'
  | 'admin-action';

// Global event emitter for data sync
class DataSyncManager {
  private listeners: Map<DataSyncEvent, Set<() => void>> = new Map();

  // Subscribe to data sync events
  subscribe(event: DataSyncEvent, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Emit data sync event
  emit(event: DataSyncEvent) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in data sync callback:', error);
        }
      });
    }
  }

  // Emit multiple events at once
  emitMultiple(events: DataSyncEvent[]) {
    events.forEach(event => this.emit(event));
  }
}

// Global instance
export const dataSyncManager = new DataSyncManager();

// Convenience functions
export function subscribeToDataSync(event: DataSyncEvent, callback: () => void) {
  return dataSyncManager.subscribe(event, callback);
}

export function emitDataSync(event: DataSyncEvent) {
  dataSyncManager.emit(event);
}

export function emitMultipleDataSync(events: DataSyncEvent[]) {
  dataSyncManager.emitMultiple(events);
}

// Auto-refresh data when admin actions occur
export function triggerAdminDataRefresh() {
  emitMultipleDataSync([
    'nomination-updated',
    'stats-updated',
    'admin-action'
  ]);
}

// Auto-refresh data when votes are cast
export function triggerVoteDataRefresh() {
  emitMultipleDataSync([
    'vote-cast',
    'stats-updated'
  ]);
}

// Cache busting utility for API calls
export function getCacheBustingUrl(baseUrl: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}_t=${Date.now()}&_r=${Math.random()}`;
}

// Fetch with cache busting
export async function fetchWithCacheBusting(url: string, options?: RequestInit): Promise<Response> {
  const cacheBustedUrl = getCacheBustingUrl(url);
  return fetch(cacheBustedUrl, {
    ...options,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options?.headers
    }
  });
}