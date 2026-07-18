import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { SkillPost } from '../lib/types'

type Filter = 'all' | 'offer' | 'request'

export default function Earning() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<SkillPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('skill_posts')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('post_type', filter)
    const { data } = await query
    setPosts((data as SkillPost[]) ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <div className="topbar">
        <h1>💼 Earning</h1>
        <button
          className="btn"
          style={{ padding: '8px 14px', borderRadius: 8 }}
          onClick={() => setShowForm(true)}
        >
          + Post
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
        {(['all', 'offer', 'request'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="chip"
            style={{
              background: filter === f ? 'var(--accent)' : 'var(--surface-2)',
              color: filter === f ? '#fff' : 'var(--text-dim)',
              borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'All' : f === 'offer' ? 'Skills offered' : 'Work requests'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="center-fill">
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div className="center-fill">
          <h3>No posts yet</h3>
          <p className="muted">Post a skill you offer, or a job you need done.</p>
        </div>
      ) : (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  className="chip"
                  style={{
                    background: p.post_type === 'offer' ? 'rgba(37,244,238,0.12)' : 'rgba(254,44,85,0.12)',
                    borderColor: p.post_type === 'offer' ? 'var(--accent-2)' : 'var(--accent)',
                    color: p.post_type === 'offer' ? 'var(--accent-2)' : '#ffb3c1',
                  }}
                >
                  {p.post_type === 'offer' ? 'Offering' : 'Requesting'}
                </span>
                {p.budget != null && (
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>Rs {p.budget}</span>
                )}
              </div>
              <h3 style={{ marginTop: 8 }}>{p.title}</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                {p.description}
              </p>
              {p.category && (
                <span className="chip" style={{ marginTop: 8 }}>
                  {p.category}
                </span>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                }}
              >
                <span className="muted" style={{ fontSize: 13 }}>
                  by @{p.profile?.username ?? 'user'}
                </span>
                {p.user_id !== user?.id && (
                  <button
                    className="btn"
                    style={{ padding: '8px 14px', borderRadius: 8 }}
                    onClick={() => navigate(`/chat/${p.user_id}`)}
                  >
                    Chat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SkillPostForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            load()
          }}
        />
      )}
    </>
  )
}

function SkillPostForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('')
  const [postType, setPostType] = useState<'offer' | 'request'>('offer')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('skill_posts').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || null,
      budget: budget ? Number(budget) : null,
      post_type: postType,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onCreated()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: 'var(--surface)',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          width: '100%',
          maxWidth: 'var(--max-width)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ marginBottom: 14 }}>New post</h2>
        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['offer', 'request'] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setPostType(t)}
              className="btn"
              style={{
                flex: 1,
                background: postType === t ? 'var(--accent)' : 'var(--surface-2)',
                color: postType === t ? '#fff' : 'var(--text-dim)',
              }}
            >
              {t === 'offer' ? 'I offer a skill' : 'I need work done'}
            </button>
          ))}
        </div>

        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <input
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Design, Editing, Writing"
          />
        </div>
        <div className="field">
          <label>Budget / Rate (Rs, optional)</label>
          <input
            className="input"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <button className="btn" style={{ width: '100%' }} disabled={saving}>
          {saving ? 'Posting…' : 'Post'}
        </button>
      </form>
    </div>
  )
}
