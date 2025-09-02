import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { NominationRecord, VoteRecord } from '../data-types';

// Database schema
interface WSADatabase extends DBSchema {
  nominations: {
    key: string;
    value: NominationRecord;
    indexes: {
      'by-category': string;
      'by-status': string;
      'by-type': string;
      'by-created': Date;
      'by-unique-key': string;
    };
  };
  votes: {
    key: string;
    value: VoteRecord;
    indexes: {
      'by-nominee': string;
      'by-category': string;
      'by-voter-email': string;
      'by-created': Date;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: Date;
    };
  };
}

const DB_NAME = 'world-staffing-awards';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<WSADatabase> | null = null;

export async function initDB(): Promise<IDBPDatabase<WSADatabase>> {
  if (dbInstance) {
    return dbInstance;
  }

  // Check if IndexedDB is available
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('IndexedDB not available');
  }

  try {
    dbInstance = await openDB<WSADatabase>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Create nominations store
        if (!db.objectStoreNames.contains('nominations')) {
          const nominationsStore = db.createObjectStore('nominations', {
            keyPath: 'id',
          });

          // Create indexes
          nominationsStore.createIndex('by-category', 'category');
          nominationsStore.createIndex('by-status', 'status');
          nominationsStore.createIndex('by-type', 'type');
          nominationsStore.createIndex('by-created', 'createdAt');
          nominationsStore.createIndex('by-unique-key', 'uniqueKey', { unique: true });
        }

        // Create votes store
        if (!db.objectStoreNames.contains('votes')) {
          const votesStore = db.createObjectStore('votes', {
            keyPath: 'id',
          });

          // Create indexes
          votesStore.createIndex('by-nominee', 'nomineeId');
          votesStore.createIndex('by-category', 'category');
          votesStore.createIndex('by-voter-email', 'voter.email');
          votesStore.createIndex('by-created', 'createdAt');
        }

        // Create metadata store for app settings
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', {
            keyPath: 'key',
          });
        }
      },
      blocked() {
        console.warn('Database upgrade blocked by another tab');
      },
      blocking() {
        console.warn('Database blocking another tab from upgrading');
      },
    });

    console.log('IndexedDB initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

export async function getDB(): Promise<IDBPDatabase<WSADatabase>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB;
}

// Utility function to close the database connection
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Error handling for database operations
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Transaction helper
export async function withTransaction<T>(
  stores: (keyof WSADatabase)[],
  mode: IDBTransactionMode,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const db = await getDB();
  const tx = db.transaction(stores, mode);
  
  try {
    const result = await callback(tx);
    await tx.done;
    return result;
  } catch (error) {
    tx.abort();
    throw new DatabaseError('Transaction failed', error as Error);
  }
}