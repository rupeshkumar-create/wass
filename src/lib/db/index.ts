// Main data layer exports
export { dataLayer } from './data-layer';
export type { StorageAdapter } from './data-layer';

// Database utilities
export { initDB, getDB, isIndexedDBAvailable, closeDB, DatabaseError } from './indexeddb';
export { localStorageAdapter, isLocalStorageAvailable } from './localstorage';

// Migration utilities
export { dataMigration, DataMigration } from './migration';

// Development utilities
export { devUtils, DevUtils } from './dev-utils';

// Re-export data types for convenience
export * from '../data-types';
export * from '../categories';