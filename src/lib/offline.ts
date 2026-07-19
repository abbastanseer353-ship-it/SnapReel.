import type { Video } from './types'

export interface OfflineVideo {
  id: string
  user_id: string
  username: string
  caption: string | null
  thumbnail_url: string | null
  blob: Blob
  savedAt: number
}

const DB_NAME = 'hunar-media'
const STORE = 'offline_videos'
const MAX_CACHED = 15

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

function getAllRaw(): Promise<OfflineVideo[]> {
  return openDb().then(
    (db) =>
      new Promise<OfflineVideo[]>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).getAll()
        req.onsuccess = () => {
          db.close()
          resolve(req.result as OfflineVideo[])
        }
        req.onerror = () => {
          db.close()
          reject(req.error ?? new Error('List offline videos failed'))
        }
      })
  )
}

export async function listOfflineVideos(): Promise<OfflineVideo[]> {
  const all = await getAllRaw()
  return all.sort((a, b) => b.savedAt - a.savedAt)
}

export async function getCachedIds(): Promise<Set<string>> {
  const all = await getAllRaw()
  return new Set(all.map((v) => v.id))
}

export async function deleteOfflineVideo(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Delete offline video failed'))
  })
  db.close()
}

function put(item: OfflineVideo): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(item)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error ?? new Error('Save offline video failed'))
        }
      })
  )
}

/**
 * Downloads a watched video and stores it for offline replay. No-op if already
 * cached. Keeps only the most recent MAX_CACHED videos to bound storage.
 */
export async function cacheVideoForOffline(video: Video): Promise<boolean> {
  if (!navigator.onLine) return false
  const existing = await getCachedIds()
  if (existing.has(video.id)) return false

  let blob: Blob
  try {
    const res = await fetch(video.video_url)
    if (!res.ok) return false
    blob = await res.blob()
  } catch {
    return false
  }

  await put({
    id: video.id,
    user_id: video.user_id,
    username: video.profile?.username ?? 'user',
    caption: video.caption ?? null,
    thumbnail_url: video.thumbnail_url ?? null,
    blob,
    savedAt: Date.now(),
  })

  const all = await listOfflineVideos()
  if (all.length > MAX_CACHED) {
    for (const old of all.slice(MAX_CACHED)) {
      await deleteOfflineVideo(old.id)
    }
  }
  return true
}
