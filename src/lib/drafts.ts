export interface DraftMeta {
  caption: string
  filterId: string
  musicId: string | null
  link: string
  location: string
  visibility: 'public' | 'followers'
  allowComments: boolean
}

export interface Draft extends DraftMeta {
  id: string
  createdAt: number
  blob: Blob
  thumbnail: string | null
}

const DB_NAME = 'hunar'
const STORE = 'drafts'

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

export async function saveDraft(draft: Draft): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(draft)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Save draft failed'))
  })
  db.close()
}

export async function listDrafts(): Promise<Draft[]> {
  const db = await openDb()
  const drafts = await new Promise<Draft[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as Draft[])
    req.onerror = () => reject(req.error ?? new Error('List drafts failed'))
  })
  db.close()
  return drafts.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Delete draft failed'))
  })
  db.close()
}
