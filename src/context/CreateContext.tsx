import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { TextOverlay } from '../lib/render'

export interface EditState {
  filterId: string
  trimStart: number
  trimEnd: number
  speed: number
  volume: number
  muteOriginal: boolean
  musicId: string | null
  musicVolume: number
  texts: TextOverlay[]
  coverTime: number
}

export interface PostState {
  caption: string
  link: string
  location: string
  visibility: 'public' | 'followers'
  allowComments: boolean
}

export const defaultEdit: EditState = {
  filterId: 'none',
  trimStart: 0,
  trimEnd: 0,
  speed: 1,
  volume: 1,
  muteOriginal: false,
  musicId: null,
  musicVolume: 0.6,
  texts: [],
  coverTime: 0,
}

export const defaultPost: PostState = {
  caption: '',
  link: '',
  location: '',
  visibility: 'public',
  allowComments: true,
}

interface CreateContextValue {
  sourceBlob: Blob | null
  sourceUrl: string | null
  setSource: (blob: Blob) => void
  edit: EditState
  setEdit: (update: Partial<EditState>) => void
  post: PostState
  setPost: (update: Partial<PostState>) => void
  reset: () => void
}

const CreateContext = createContext<CreateContextValue | undefined>(undefined)

export function CreateProvider({ children }: { children: ReactNode }) {
  const [sourceBlob, setSourceBlob] = useState<Blob | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [edit, setEditState] = useState<EditState>(defaultEdit)
  const [post, setPostState] = useState<PostState>(defaultPost)

  const value = useMemo<CreateContextValue>(
    () => ({
      sourceBlob,
      sourceUrl,
      setSource: (blob: Blob) => {
        setSourceUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(blob)
        })
        setSourceBlob(blob)
        setEditState(defaultEdit)
        setPostState(defaultPost)
      },
      edit,
      setEdit: (update) => setEditState((prev) => ({ ...prev, ...update })),
      post,
      setPost: (update) => setPostState((prev) => ({ ...prev, ...update })),
      reset: () => {
        setSourceUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        setSourceBlob(null)
        setEditState(defaultEdit)
        setPostState(defaultPost)
      },
    }),
    [sourceBlob, sourceUrl, edit, post]
  )

  return <CreateContext.Provider value={value}>{children}</CreateContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCreate(): CreateContextValue {
  const ctx = useContext(CreateContext)
  if (!ctx) throw new Error('useCreate must be used within CreateProvider')
  return ctx
}
