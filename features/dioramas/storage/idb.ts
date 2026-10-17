/**
 * A small promise wrapper over the one IndexedDB database the app keeps:
 * `entries` (what My Dioramas lists) and `scenes` (the scene files), both
 * keyed by the diorama's id.
 */

const DB_NAME = "diorama";
const DB_VERSION = 1;

export const ENTRIES = "entries";
export const SCENES = "scenes";
export type StoreName = typeof ENTRIES | typeof SCENES;

/** Both stores keep their keys outside the value, so a scene file is stored exactly as it is exported. */
export type WriteOp = { store: StoreName; key: string; put: unknown } | { store: StoreName; delete: string };

let database: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is not available"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(ENTRIES)) db.createObjectStore(ENTRIES);
        if (!db.objectStoreNames.contains(SCENES)) db.createObjectStore(SCENES);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB could not be opened"));
      request.onblocked = () => reject(new Error("IndexedDB is blocked by another tab"));
    });
    // A failed open is not cached, so a later call can try again.
    database.catch(() => {
      database = null;
    });
  }
  return database;
}

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function readOne<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return result(db.transaction(store, "readonly").objectStore(store).get(key) as IDBRequest<T | undefined>);
}

export async function readAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return result(db.transaction(store, "readonly").objectStore(store).getAll() as IDBRequest<T[]>);
}

export async function count(store: StoreName): Promise<number> {
  const db = await openDatabase();
  return result(db.transaction(store, "readonly").objectStore(store).count());
}

/**
 * Runs `work` in one read-write transaction over `stores` and resolves
 * when it commits. Requests made inside it (also in their callbacks) are
 * part of the same transaction, so a read-modify-write cannot interleave
 * with another write.
 */
export async function transact(stores: StoreName[], work: (transaction: IDBTransaction) => void): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(stores, "readwrite");
  const done = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB write was aborted"));
  });
  work(transaction);
  return done;
}

/** Applies every write in one transaction: all of them land, or none. */
export function write(ops: WriteOp[]): Promise<void> {
  return transact([...new Set(ops.map((op) => op.store))], (transaction) => {
    for (const op of ops) {
      const store = transaction.objectStore(op.store);
      if ("put" in op) store.put(op.put, op.key);
      else store.delete(op.delete);
    }
  });
}
