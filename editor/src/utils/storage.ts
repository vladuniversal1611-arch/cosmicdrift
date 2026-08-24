// IndexedDB-backed persistence for projects and media blobs.

import { MediaFile, Project } from '../types';

const DB_NAME = 'cosmicdrift-studio';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const MEDIA_STORE = 'media';
const MEDIA_BLOBS_STORE = 'mediaBlobs';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDIA_BLOBS_STORE)) {
        db.createObjectStore(MEDIA_BLOBS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  await withStore(PROJECTS_STORE, 'readwrite', (store) =>
    store.put({ ...project, updatedAt: Date.now() })
  );
}

export async function loadProject(id: string): Promise<Project | undefined> {
  return withStore<Project>(PROJECTS_STORE, 'readonly', (store) => store.get(id));
}

export async function listProjects(): Promise<Project[]> {
  return withStore<Project[]>(PROJECTS_STORE, 'readonly', (store) => store.getAll());
}

export async function deleteProject(id: string): Promise<void> {
  await withStore(PROJECTS_STORE, 'readwrite', (store) => store.delete(id));
}

export async function saveMediaFile(media: MediaFile): Promise<void> {
  const { file, ...meta } = media;
  await withStore(MEDIA_STORE, 'readwrite', (store) => store.put(meta));
  if (file) {
    await withStore(MEDIA_BLOBS_STORE, 'readwrite', (store) =>
      store.put({ id: media.id, blob: file })
    );
  }
}

export async function loadAllMedia(): Promise<MediaFile[]> {
  const metas = await withStore<MediaFile[]>(MEDIA_STORE, 'readonly', (store) =>
    store.getAll()
  );
  const withBlobs: MediaFile[] = [];
  for (const meta of metas) {
    const rec = await withStore<{ id: string; blob: Blob } | undefined>(
      MEDIA_BLOBS_STORE,
      'readonly',
      (store) => store.get(meta.id)
    );
    if (rec?.blob) {
      const blobUrl = URL.createObjectURL(rec.blob);
      withBlobs.push({ ...meta, blobUrl });
    } else {
      withBlobs.push(meta);
    }
  }
  return withBlobs;
}

export async function deleteMediaFile(id: string): Promise<void> {
  await withStore(MEDIA_STORE, 'readwrite', (store) => store.delete(id));
  await withStore(MEDIA_BLOBS_STORE, 'readwrite', (store) => store.delete(id));
}

const AUTOSAVE_KEY_PREFIX = 'cosmicdrift-autosave-';

export function startAutosave(getProject: () => Project | null, intervalMs = 30000) {
  const timer = setInterval(async () => {
    const project = getProject();
    if (project) {
      try {
        await saveProject(project);
        localStorage.setItem(
          AUTOSAVE_KEY_PREFIX + project.id,
          String(Date.now())
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Autosave failed', e);
      }
    }
  }, intervalMs);
  return () => clearInterval(timer);
}
