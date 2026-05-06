import { CuttingRecord, InventoryRecord, User, Notification, MaintenanceLog, ToolRecord, MultiCutPlannerRecord, CalibrationMeasurement, WireCutListItem } from '../../types/database';

export class EECOLIndexedDB {
  static instance: EECOLIndexedDB | null = null;
  static DATABASE_VERSION = 8;
  dbVersion = EECOLIndexedDB.DATABASE_VERSION;
  dbName = 'EECOLTools_v2';
  dbInitialized: Promise<void>;
  db: IDBDatabase | null = null;

  static getInstance(): EECOLIndexedDB {
    if (!EECOLIndexedDB.instance) {
      EECOLIndexedDB.instance = new EECOLIndexedDB();
    }
    return EECOLIndexedDB.instance;
  }

  constructor() {
    if (EECOLIndexedDB.instance) {
      throw new Error("Use EECOLIndexedDB.getInstance() instead of new EECOLIndexedDB()");
    }
    this.dbInitialized = this.initialize();
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        this.createObjectStores(db, transaction);
      };
    });
  }

  private createObjectStores(db: IDBDatabase, transaction: IDBTransaction) {
    const stores = {
      cuttingRecords: { keyPath: 'id', indexes: ['timestamp', 'cutterName', 'wireId', 'orderNumber', 'customerName'] },
      inventoryRecords: { keyPath: 'id', indexes: ['wireType', 'personName', 'productCode', 'lineCode', 'actualLength', 'updatedAt', 'timestamp'] },
      users: { keyPath: 'id', indexes: ['role', 'active', 'lastLogin', 'createdAt'] },
      notifications: { keyPath: 'id', indexes: ['type', 'priority', 'recipients', 'timestamp', 'read'] },
      maintenanceLogs: { keyPath: 'id', indexes: ['equipment', 'technician', 'dueDate', 'completed', 'timestamp'] },
      markConverter: { keyPath: 'id', indexes: ['timestamp', 'tool'] },
      stopmarkConverter: { keyPath: 'id', indexes: ['timestamp', 'tool'] },
      reelcapacityEstimator: { keyPath: 'id', indexes: ['timestamp', 'tool'] },
      reelsizeEstimator: { keyPath: 'id', indexes: ['timestamp', 'tool'] },
      multicutPlanner: { keyPath: 'id', indexes: ['timestamp', 'payloadCableType', 'isComplete', 'totalPayloadLength'] },
      settings: { keyPath: 'name', indexes: ['lastModified'] },
      sessions: { keyPath: 'sessionId', indexes: ['userId', 'createdAt', 'expiresAt', 'active'] },
      calibrationMeasurements: { keyPath: 'id', indexes: [{ name: 'machine_timestamp', keyPath: ['machineName', 'timestamp'] }] },
      wireCutList: { keyPath: 'id', indexes: ['timestamp', 'orderNumber', 'status', 'position'] }
    };

    for (const [storeName, config] of Object.entries(stores)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, {
          keyPath: config.keyPath,
          autoIncrement: config.keyPath === 'id' && storeName !== 'settings'
        });
        config.indexes.forEach(idx => {
          if (typeof idx === 'string') {
            store.createIndex(idx, idx, { unique: false });
          } else {
            store.createIndex(idx.name, idx.keyPath, { unique: false });
          }
        });
      }
    }
  }

  async isReady(): Promise<boolean> {
    await this.dbInitialized;
    return !!this.db;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.isReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string | number): Promise<T | undefined> {
    await this.isReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add<T>(storeName: string, data: T): Promise<string | number> {
    await this.isReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite', { durability: 'relaxed' });
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result as string | number);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, data: T): Promise<string | number> {
    await this.isReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite', { durability: 'relaxed' });
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result as string | number);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<string | number> {
    return this.update(storeName, data);
  }

  async delete(storeName: string, key: string | number): Promise<void> {
    await this.isReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite', { durability: 'relaxed' });
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.isReady();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite', { durability: 'relaxed' });
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
