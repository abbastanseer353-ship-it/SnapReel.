import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Comment } from '../lib/types'

interface Props {
  videoId: string
  onClose: () => void
  onCountChange?: (count: number) => void
}

export default function CommentsSheet({ videoId, onClose, onCountChange }: Props) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles(*)')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true })
    setComments((data as Comment[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user) return
    setSending(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ video_id: videoId, user_id: user.id, text: text.trim() })
      .select('*, profile:profiles(*)')
      .single()
    if (!error && data) {
      const next = [...comments, data as Comment]
      setComments(next)
      onCountChange?.(next.length)
      setText('')
    }
    setSending(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          {comments.length} comments
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="muted" style={{ textAlign: 'center' }}>
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div className="avatar" style={{ width: 34, height: 34 }}>
                  {c.profile?.avatar_url ? (
                    <img
                      src={c.profile.avatar_url}
                      alt=""
                      className="avatar"
                      style={{ width: 34, height: 34 }}
                    />
                  ) : (
                    (c.profile?.username ?? '?')[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {c.profile?.username ?? 'user'}
                  </div>
                  <div style={{ fontSize: 14 }}>{c.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={submit}
          style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--border)' }}
        >
          <input
            className="input"
            placeholder={profile ? 'Add a comment…' : 'Log in to comment'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn" disabled={sending || !text.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
